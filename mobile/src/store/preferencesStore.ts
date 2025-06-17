import { create } from "zustand";
import { api } from "../api/client";

interface PreferencesState {
  prefs: {
    darkMode?: boolean;
    notifyCooldown?: boolean;
    notifyUnderReview?: boolean;
    language?: string;
  };
  loading: boolean;
  load: () => Promise<void>;
  set: (key: string, value: any) => Promise<void>;
}

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  prefs: {},
  loading: true,

  load: async () => {
    const prefs: any = await api.get("/preferences");
    set({ prefs, loading: false });
  },

  set: async (key, value) => {
    await api.patch("/preferences", { [key]: value });
    set({ prefs: { ...get().prefs, [key]: value } });
  },
}));
