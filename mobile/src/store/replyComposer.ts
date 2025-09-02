import { create } from "zustand";

type ReplyComposerState = {
  editing: boolean;
  replyId?: string;
  text: string;
  openEdit: (args: { id: string; text: string }) => void;
  cancel: () => void;
  setText: (t: string) => void;
};

export const useReplyComposer = create<ReplyComposerState>((set) => ({
  editing: false,
  replyId: undefined,
  text: "",
  openEdit: ({ id, text }) => set({ editing: true, replyId: id, text }),
  cancel: () => set({ editing: false, replyId: undefined, text: "" }),
  setText: (t: string) => set({ text: t }),
}));

