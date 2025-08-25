import { create } from "zustand";

export type UserEntity = {
  id: string;
  handle: string;
  bio?: string | null;
  email?: string;
  avatarUrl?: string | null;
  // add more as needed
};

export type SecretEntity = {
  id: string;
  text: string;
  mood?: string | null;
  status: string;
  createdAt: string | Date;
  authorId: string; // normalized pointer
  // counters etc.
};

type EntitiesState = {
  users: Record<string, UserEntity>;
  secrets: Record<string, SecretEntity>;
  upsertUsers: (arr: Partial<UserEntity>[]) => void;
  upsertSecrets: (
    arr: (Partial<SecretEntity> & { author?: UserEntity })[]
  ) => void;
  getUser: (id: string) => UserEntity | undefined;
  getSecret: (id: string) => SecretEntity | undefined;
  clear: () => void;
};

export const useEntities = create<EntitiesState>((set, get) => ({
  users: {},
  secrets: {},

  upsertUsers: (arr) =>
    set((s) => {
      const next = { ...s.users };
      for (const u of arr) {
        if (!u?.id) continue;
        next[u.id] = { ...(next[u.id] || {}), ...u } as UserEntity;
      }
      return { users: next };
    }),

  upsertSecrets: (arr) =>
    set((s) => {
      const nextSecrets = { ...s.secrets };
      const nextUsers = { ...s.users };
      for (const x of arr) {
        if (!x?.id) continue;
        // normalize author if present
        if (x.author?.id) {
          const a = x.author as UserEntity;
          nextUsers[a.id] = { ...(nextUsers[a.id] || {}), ...a };
        }
        const authorId = x.author?.id ?? (x as any).authorId;
        nextSecrets[x.id] = {
          ...(nextSecrets[x.id] || {}),
          ...x,
          authorId,
        } as SecretEntity;
      }
      return { secrets: nextSecrets, users: nextUsers };
    }),

  getUser: (id) => get().users[id],
  getSecret: (id) => get().secrets[id],

  clear: () => set({ users: {}, secrets: {} }),
}));
