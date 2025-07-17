// mobile/src/hooks/useOnboard.ts
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
  const setToken = useAuthStore((s) => s.setToken);
  const { preview, setPreview, clearPreview } = useOnboardStore();

  const register = async (email: string, password: string) => {
    const res = await api.post<{ user: Preview; access_token: string }>(
      "/auth/register",
      { email: sanitizeEmail(email), password }
    );
    const { user, access_token } = res;
    await SecureStore.setItemAsync("jwt", access_token);
    setPreview(user);
    setToken(access_token, false);
  };

  const login = async (email: string, password: string) => {
    const res = await api.post<{ access_token: string }>("/auth/login", {
      email: sanitizeEmail(email),
      password,
    });
    await SecureStore.setItemAsync("jwt", res.access_token);
    setToken(res.access_token, true);
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
    const token = await SecureStore.getItemAsync("jwt");
    if (!token) throw new Error("Missing token");
    setToken(token, true);
    clearPreview();
    await SecureStore.deleteItemAsync("signup_preview");
  };

  // New functions:
  const logout = async () => {
    // clear auth state and persisted JWT
    setToken(null);
    await SecureStore.deleteItemAsync("jwt");
    clearPreview();
  };

  const signOut = async (confirm: boolean) => {
    if (confirm) {
      await logout();
    }
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
