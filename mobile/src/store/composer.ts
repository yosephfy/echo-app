import { create } from "zustand";

export type ComposerMode = "create" | "edit";

type ComposerState = {
  visible: boolean;
  mode: ComposerMode;
  secretId?: string;
  text: string;
  moods: string[]; // multi-mood selection
  moodPickerVisible: boolean;
  openCreate: () => void;
  openEdit: (args: {
    id: string;
    text: string;
    moods?: { code: string }[];
  }) => void;
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
