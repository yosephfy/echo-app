// mobile/src/store/onboardStore.ts
import { create } from "zustand";

interface Preview {
  handle: string;
  avatarUrl: string;
}
interface OnboardState {
  preview?: Preview;
  setPreview: (p: Preview) => void;
  clearPreview: () => void;
}

export const useOnboardStore = create<OnboardState>((set) => ({
  preview: undefined,
  setPreview: (preview) => set({ preview }),
  clearPreview: () => set({ preview: undefined }),
}));
