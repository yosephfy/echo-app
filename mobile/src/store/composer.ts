import { create } from "zustand";

export type ComposerMode = "create" | "edit";

type ComposerState = {
  visible: boolean;
  mode: ComposerMode;
  secretId?: string;
  text: string;
  mood?: string;
  openCreate: () => void;
  openEdit: (args: { id: string; text: string; mood?: string }) => void;
  close: () => void;
  setText: (t: string) => void;
  setMood: (m?: string) => void;
};

export const useComposer = create<ComposerState>((set) => ({
  visible: false,
  mode: "create",
  secretId: undefined,
  text: "",
  mood: undefined,
  openCreate: () =>
    set({ visible: true, mode: "create", secretId: undefined, text: "", mood: undefined }),
  openEdit: ({ id, text, mood }) =>
    set({ visible: true, mode: "edit", secretId: id, text, mood }),
  close: () => set({ visible: false }),
  setText: (t) => set({ text: t }),
  setMood: (m) => set({ mood: m }),
}));

