// src/store/authStore.ts
import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { api, setUnauthorizedHandler } from "../api/client";

type User = {
  id?: string;
  email?: string;
  handle?: string;
  avatarUrl?: string;
  onboarded?: boolean;
};

interface AuthState {
  token: string | null;
  user: User | null;
  loading: boolean;
  onboarded: boolean;

  // actions
  setToken: (token: string | null, onboarded?: boolean) => Promise<void>;
  restoreToken: () => Promise<void>;
  refreshSession: () => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (u: User | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => {
  // Hook api 401s to sign out automatically
  setUnauthorizedHandler(async () => {
    // Avoid racing multiple signouts
    const { token } = get();
    if (!token) return;
    await SecureStore.deleteItemAsync("jwt");
    await SecureStore.deleteItemAsync("signup_preview").catch(() => {});
    set({ token: null, user: null, onboarded: false, loading: false });
  });

  async function inferOnboardedFromLocal(): Promise<boolean> {
    const preview = await SecureStore.getItemAsync("signup_preview");
    // If preview exists, user is mid-onboarding
    return !preview;
  }

  return {
    token: null,
    user: null,
    loading: true,
    onboarded: false,

    setUser: (u) => set({ user: u }),

    setToken: async (token, onboardedParam = false) => {
      // Persist or clear token
      if (token) {
        await SecureStore.setItemAsync("jwt", token);
      } else {
        await SecureStore.deleteItemAsync("jwt");
      }

      // If we got a token, try to refresh session (pull user + real onboarded)
      if (token) {
        set({ token, loading: true });
        try {
          const me = await api.get<User>("/users/me");
          // Prefer server's onboarded if provided; otherwise infer
          const inferred = me.onboarded ?? (await inferOnboardedFromLocal());
          set({ user: me, token, onboarded: inferred, loading: false });
        } catch {
          // token bad -> clear
          await SecureStore.deleteItemAsync("jwt");
          set({ token: null, user: null, onboarded: false, loading: false });
        }
      } else {
        set({ token: null, user: null, onboarded: false, loading: false });
      }
    },

    restoreToken: async () => {
      set({ loading: true });
      try {
        const token = await SecureStore.getItemAsync("jwt");
        if (!token) {
          set({ token: null, user: null, onboarded: false, loading: false });
          return;
        }
        // Validate token by hitting /users/me
        const me = await api.get<User>("/users/me");
        const inferred = me.onboarded ?? (await inferOnboardedFromLocal());
        set({ token, user: me, onboarded: inferred, loading: false });
      } catch {
        // invalid/expired token
        await SecureStore.deleteItemAsync("jwt");
        set({ token: null, user: null, onboarded: false, loading: false });
      }
    },

    refreshSession: async () => {
      const { token } = get();
      if (!token) return;
      set({ loading: true });
      try {
        const me = await api.get<User>("/users/me");
        const inferred = me.onboarded ?? (await inferOnboardedFromLocal());
        set({ user: me, onboarded: inferred, loading: false });
      } catch {
        // token is no longer valid
        await SecureStore.deleteItemAsync("jwt");
        set({ token: null, user: null, onboarded: false, loading: false });
      }
    },

    signOut: async () => {
      await SecureStore.deleteItemAsync("jwt");
      await SecureStore.deleteItemAsync("signup_preview").catch(() => {});
      set({ token: null, user: null, onboarded: false, loading: false });
    },
  };
});
