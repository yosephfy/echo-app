import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { useEntities } from "../store/entities";

/** Create Secret */
export function useCreateSecret() {
  const qc = useQueryClient();
  const upsertSecrets = useEntities((s) => s.upsertSecrets);

  return useMutation({
    mutationFn: (body: { text: string; moods?: string[]; panic?: boolean }) =>
      api.post<any>("/secrets", body),
    onSuccess: (newSecret) => {
      // normalize into entity store
      upsertSecrets([newSecret]);
      // update detail cache
      qc.setQueryData(["secret", newSecret.id], newSecret);
      // prepend to first feed page if present
      qc.setQueryData(["feed", 1, 20], (old: any) =>
        old
          ? {
              ...old,
              items: [newSecret, ...old.items],
              total: (old.total ?? 0) + 1,
            }
          : old
      );
    },
  });
}

/** Toggle Bookmark */
export function useToggleBookmark(secretId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (on: boolean) => {
      if (on) {
        await api.post("/bookmarks", { secretId });
        return { on: true };
      } else {
        await api.del("/bookmarks", { secretId });
        return { on: false };
      }
    },
    onSuccess: () => {
      // Invalidate or lightly update affected queries
      qc.invalidateQueries({ queryKey: ["bookmarks"] });
      qc.invalidateQueries({ queryKey: ["secret", secretId] });
    },
  });
}

/** Update profile (handle/avatarUrl etc.) */
export function useUpdateProfile() {
  const qc = useQueryClient();
  const upsertUsers = useEntities((s) => s.upsertUsers);

  return useMutation({
    mutationFn: (patch: Partial<{ handle: string; avatarUrl: string }>) =>
      api.patch<any>("/users/me", patch),
    onSuccess: (me) => {
      upsertUsers([me]);
      // Update any queries keyed by current user
      qc.setQueryData(["user", me.id], me);
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

/** Add Reply (keeps caches fresh without refetch) */
export function useCreateReply(secretId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { text: string }) =>
      api.post<any>(`/secrets/${secretId}/replies`, body),
    onSuccess: (reply) => {
      // Update replies list page 1 if you cache it
      qc.setQueryData(["replies", secretId, 1, 20], (old: any) =>
        old
          ? {
              ...old,
              items: [reply, ...(old.items || [])],
              total: (old.total ?? 0) + 1,
            }
          : old
      );
      // Optionally bump replyCount in secret detail
      qc.setQueryData(["secret", secretId], (old: any) =>
        old ? { ...old, replyCount: (old.replyCount ?? 0) + 1 } : old
      );
    },
  });
}
