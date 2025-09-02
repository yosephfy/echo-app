import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";

function patchReplyInRepliesCache(
  qc: ReturnType<typeof useQueryClient>,
  secretId: string,
  replyId: string,
  patch: (reply: any) => any
) {
  const matches = qc.getQueryCache().findAll({ queryKey: ["replies", secretId] });
  for (const q of matches) {
    const key = q.queryKey as any[];
    qc.setQueryData(key, (old: any) => {
      if (!old?.pages) return old;
      const pages = old.pages.map((p: any) => {
        const items = p.items.map((r: any) => (r.id === replyId ? patch(r) : r));
        return { ...p, items };
      });
      return { ...old, pages };
    });
  }
}

function removeReplyFromRepliesCache(
  qc: ReturnType<typeof useQueryClient>,
  secretId: string,
  replyId: string
) {
  const matches = qc.getQueryCache().findAll({ queryKey: ["replies", secretId] });
  for (const q of matches) {
    const key = q.queryKey as any[];
    qc.setQueryData(key, (old: any) => {
      if (!old?.pages) return old;
      const pages = old.pages.map((p: any) => ({
        ...p,
        items: p.items.filter((r: any) => r.id !== replyId),
        total: Math.max(0, (p.total ?? 0) - 1),
      }));
      return { ...old, pages };
    });
  }
}

export function useReplyMutations(secretId: string) {
  const qc = useQueryClient();

  const edit = useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) =>
      api.patch(`/secrets/${secretId}/replies/${id}`, { text }),
    onMutate: async (vars) => {
      if (__DEV__) console.log("[useReplyMutations] onMutate(edit)", { secretId, vars });
    },
    onSuccess: (saved: any) => {
      if (__DEV__) console.log("[useReplyMutations] onSuccess(edit)", saved);
      patchReplyInRepliesCache(qc, secretId, saved.id, () => saved);
      // Ensure any other consumers refresh as needed
      qc.invalidateQueries({ queryKey: ["replies", secretId] });
    },
    onError: (err: any) => {
      console.log("[useReplyMutations] onError(edit)", err?.message || err);
    },
  });

  const remove = useMutation({
    mutationFn: ({ id }: { id: string }) =>
      api.del(`/secrets/${secretId}/replies/${id}`),
    onMutate: (vars) => {
      if (__DEV__) console.log("[useReplyMutations] onMutate(remove)", { secretId, vars });
    },
    onSuccess: (_res, vars) => {
      if (__DEV__) console.log("[useReplyMutations] onSuccess(remove)", vars);
      removeReplyFromRepliesCache(qc, secretId, vars.id);
    },
    onError: (err: any) => {
      console.log("[useReplyMutations] onError(remove)", err?.message || err);
    },
  });

  return {
    editReply: edit.mutateAsync,
    deleteReply: remove.mutateAsync,
    editing: edit.isPending,
    deleting: remove.isPending,
  };
}
