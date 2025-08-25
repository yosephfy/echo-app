// mobile/src/hooks/useOnboard.ts
import { useQueryClient } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import { api } from "../api/client";
import { useAuthStore } from "../store/authStore";
import { useOnboardStore } from "../store/onboardStore";
import { sanitizeEmail } from "../utils/sanitize";

interface Preview {
  handle: string;
  avatarUrl: string;
}

export default function useOnboard() {
  const qc = useQueryClient();
  const setToken = useAuthStore((s) => s.setToken);
  const { preview, setPreview, clearPreview } = useOnboardStore();

  const invalidateAfterLogin = async () => {
    // These are examples—adjust to your app’s keys
    await Promise.allSettled([
      qc.invalidateQueries({ queryKey: ["me"] }),
      qc.invalidateQueries({ queryKey: ["feed"] }),
      qc.invalidateQueries({ queryKey: ["userContent"] }),
    ]);
  };

  const register = async (email: string, password: string) => {
    const res = await api.post<{ user: Preview; access_token: string }>(
      "/auth/register",
      { email: sanitizeEmail(email), password }
    );
    const { user, access_token } = res;

    // DO NOT write jwt here; setToken persists it
    setPreview(user);
    await setToken(access_token, false);
    await invalidateAfterLogin();
  };

  const login = async (email: string, password: string) => {
    const res = await api.post<{ access_token: string }>("/auth/login", {
      email: sanitizeEmail(email),
      password,
    });

    // DO NOT write jwt here; setToken persists it
    await setToken(res.access_token, true);
    await invalidateAfterLogin();
  };

  const loadPreview = () => {
    if (!preview) throw new Error("No signup preview in memory");
    return preview;
  };

  const refreshProfile = async (opts: {
    handle?: boolean;
    avatar?: boolean;
  }) => {
    if (!preview) throw new Error("No preview available");
    const res = await api.post<Partial<Preview>>(
      "/users/refresh-profile",
      opts
    );
    const updated = { ...preview, ...res };
    setPreview(updated as Preview);
    return updated;
  };

  const finish = async () => {
    // read whatever setToken persisted
    const token = await SecureStore.getItemAsync("jwt");
    if (!token) throw new Error("Missing token");

    // mark as onboarded in store (setToken fetches /users/me and infers onboarded)
    await setToken(token, true);

    // cleanup local onboarding artifacts
    clearPreview();
    await SecureStore.deleteItemAsync("signup_preview").catch(() => {});

    // refresh queries that depend on onboarded state/profile
    await invalidateAfterLogin();
  };

  const logout = async () => {
    // clear auth state & caches
    await useAuthStore.getState().signOut();

    // wipe queries that must not leak between users
    await Promise.allSettled([
      qc.resetQueries({ queryKey: ["me"] }),
      qc.resetQueries({ queryKey: ["feed"] }),
      qc.resetQueries({ queryKey: ["stats"] }),
      qc.resetQueries({ queryKey: ["userContent"] }),
      qc.clear(), // optional: nuke everything if your app is small
    ]);

    clearPreview();
  };

  const signOut = async (confirm: boolean) => {
    if (confirm) await logout();
  };

  return {
    register,
    login,
    loadPreview,
    refreshProfile,
    finish,
    logout,
    signOut,
  };
}
