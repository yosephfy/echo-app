import { create } from "zustand";
import { api } from "../api/client";

export type ComposerMode = "create" | "edit";

type ComposerState = {
  visible: boolean;
  mode: ComposerMode;
  secretId?: string;
  text: string;
  moods: string[]; // multi-mood selection
  moodPickerVisible: boolean;
  loading: boolean;
  openCreate: () => void;
  openEdit: (args: {
    id: string;
    text: string;
    moods?: { code: string }[];
  }) => void;
  fetchAndOpenEdit: (id: string) => Promise<void>;
  close: () => void;
  setText: (t: string) => void;
  toggleMood: (code: string) => void;
  clearMoods: () => void;
  showMoodPicker: () => void;
  hideMoodPicker: () => void;
};

export const useComposer = create<ComposerState>((set) => ({
  visible: false,
  mode: "create",
  secretId: undefined,
  text: "",
  moods: [],
  moodPickerVisible: false,
  loading: false,
  openCreate: () =>
    set({
      visible: true,
      mode: "create",
      secretId: undefined,
      text: "",
      moods: [],
    }),
  openEdit: ({ id, text, moods }) =>
    set({
      visible: true,
      mode: "edit",
      secretId: id,
      text,
      moods: (moods || []).map((m) => m.code),
    }),
  fetchAndOpenEdit: async (id) => {
    try {
      set({ loading: true });
      const secret = (await api.get(`/secrets/find/${id}`)) as {
        id: string;
        text: string;
        moods?: { code: string; label?: string }[];
      };
      set({
        visible: true,
        mode: "edit",
        secretId: id,
        text: secret.text || "",
        moods: (secret.moods || []).map((m) => m.code),
        loading: false,
      });
    } catch (error) {
      console.error("Failed to fetch secret for editing:", error);
      set({ loading: false });
    }
  },
  close: () => set({ visible: false, moodPickerVisible: false }),
  setText: (t) => set({ text: t }),
  toggleMood: (code) =>
    set((s) => {
      const exists = s.moods.includes(code);
      let next = exists
        ? s.moods.filter((c) => c !== code)
        : [...s.moods, code];
      return { moods: next };
    }),
  clearMoods: () => set({ moods: [] }),
  showMoodPicker: () => set({ moodPickerVisible: true }),
  hideMoodPicker: () => set({ moodPickerVisible: false }),
}));
