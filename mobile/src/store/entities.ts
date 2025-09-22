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
      let changed = false;
      const next = { ...s.users } as Record<string, UserEntity>;
      for (const u of arr) {
        if (!u?.id) continue;
        const existing = next[u.id];
        const merged = { ...(existing || {}), ...u } as UserEntity;
        // shallow compare keys to detect changes
        if (
          !existing ||
          Object.keys(merged).some(
            (k) => (merged as any)[k] !== (existing as any)[k]
          )
        ) {
          next[u.id] = merged;
          changed = true;
        }
      }
      return changed ? { users: next } : s;
    }),

  upsertSecrets: (arr) =>
    set((s) => {
      let secretsChanged = false;
      let usersChanged = false;
      const nextSecrets = { ...s.secrets } as Record<string, SecretEntity>;
      const nextUsers = { ...s.users } as Record<string, UserEntity>;
      for (const x of arr) {
        if (!x?.id) continue;
        if (x.author?.id) {
          const a = x.author as UserEntity;
          const existingUser = nextUsers[a.id];
          const mergedUser = { ...(existingUser || {}), ...a } as UserEntity;
          if (
            !existingUser ||
            Object.keys(mergedUser).some(
              (k) => (mergedUser as any)[k] !== (existingUser as any)[k]
            )
          ) {
            nextUsers[a.id] = mergedUser;
            usersChanged = true;
          }
        }
        const authorId = x.author?.id ?? (x as any).authorId;
        // sanitize moods/tags shape (ensure arrays)
        const moods = Array.isArray((x as any).moods)
          ? (x as any).moods.map((m: any) => ({ code: m.code, label: m.label }))
          : undefined;
        const tags = Array.isArray((x as any).tags)
          ? (x as any).tags.filter((t: any) => typeof t === "string")
          : undefined;
        const existingSecret = nextSecrets[x.id];
        const mergedSecret = {
          ...(existingSecret || {}),
          ...x,
          moods,
          tags,
          authorId,
        } as SecretEntity;
        if (
          !existingSecret ||
          Object.keys(mergedSecret).some(
            (k) => (mergedSecret as any)[k] !== (existingSecret as any)[k]
          )
        ) {
          nextSecrets[x.id] = mergedSecret;
          secretsChanged = true;
        }
      }
      if (!secretsChanged && !usersChanged) return s;
      return { secrets: nextSecrets, users: nextUsers };
    }),

  getUser: (id) => get().users[id],
  getSecret: (id) => get().secrets[id],

  clear: () => set({ users: {}, secrets: {} }),
}));
