import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

interface AuthState {
  token: string | null;
  loading: boolean;
  setToken: (token: string | null) => void;
  restoreToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  loading: true,
  setToken: (token) => set({ token, loading: false }),
  restoreToken: async () => {
    const token = await SecureStore.getItemAsync("jwt");
    set({ token, loading: false });
  },
}));
