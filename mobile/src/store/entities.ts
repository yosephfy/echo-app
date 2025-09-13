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
  // legacy mood removed; using multi-moods + tags now
  moods?: { code: string; label?: string }[];
  tags?: string[]; // normalized slugs from backend
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
        if (x.author?.id) {
          const a = x.author as UserEntity;
          nextUsers[a.id] = { ...(nextUsers[a.id] || {}), ...a };
        }
        const authorId = x.author?.id ?? (x as any).authorId;
        // sanitize moods/tags shape (ensure arrays)
        const moods = Array.isArray((x as any).moods)
          ? (x as any).moods.map((m: any) => ({ code: m.code, label: m.label }))
          : undefined;
        const tags = Array.isArray((x as any).tags)
          ? (x as any).tags.filter((t: any) => typeof t === "string")
          : undefined;
        nextSecrets[x.id] = {
          ...(nextSecrets[x.id] || {}),
          ...x,
          moods,
          tags,
          authorId,
        } as SecretEntity;
      }
      return { secrets: nextSecrets, users: nextUsers };
    }),

  getUser: (id) => get().users[id],
  getSecret: (id) => get().secrets[id],

  clear: () => set({ users: {}, secrets: {} }),
}));
