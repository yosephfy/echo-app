import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

interface AuthState {
  token: string | null;
  loading: boolean;
  onboarded: boolean;
  setToken: (token: string | null, onboarded?: boolean) => void;
  restoreToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  loading: true,
  onboarded: false,
  setToken: (token, onboarded = false) =>
    set({ token, loading: false, onboarded }),
  restoreToken: async () => {
    const token = await SecureStore.getItemAsync("jwt");
    set({ token, loading: false, onboarded: false });
  },
}));
