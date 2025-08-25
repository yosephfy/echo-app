// mobile/src/hooks/useReplyReactions.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { ReactionType } from "./useReactions";

/** ---- Server shapes ---- */
type CountsResponse = Record<ReactionType, number>;
type MeResponse = { type: ReactionType | null };
type ReactResponse = {
  currentType: ReactionType | null;
  counts: CountsResponse;
};

export type UseReplyReactionsOptions = {
  /** The page size used in your replies list hook (defaults to 20 so keys match) */
  limit?: number;
};

/** Combine counts + my reaction as a single queryFn */
async function fetchReplyReactions(replyId: string) {
  const [counts, me] = await Promise.all([
    api.get<CountsResponse>(`/replies/${replyId}/reactions`),
    api.get<MeResponse>(`/replies/${replyId}/reactions/me`),
  ]);
  return { currentType: me.type, counts };
}

/** Adjust counts for switching/clearing a reaction (optimistic) */
function adjustCounts(
  counts: CountsResponse,
  prevType: ReactionType | null,
  nextType: ReactionType | null
): CountsResponse {
  const next = { ...counts };
  if (prevType && next[prevType] > 0) next[prevType] -= 1;
  if (nextType) next[nextType] = (next[nextType] ?? 0) + 1;
  return next;
}

/** Update a reply row inside the replies cache if we know secretId */
function patchReplyInRepliesCache(
  qc: ReturnType<typeof useQueryClient>,
  secretId: string,
  limit: number,
  replyId: string,
  patch: (reply: any) => any
) {
  qc.setQueryData(["replies", secretId, limit], (old: any) => {
    if (!old?.pages) return old;
    const pages = old.pages.map((p: any) => {
      const items = p.items.map((r: any) => (r.id === replyId ? patch(r) : r));
      return { ...p, items };
    });
    return { ...old, pages };
  });
}

/**
 * useReplyReactions(replyId, { secretId?, limit? })
 * - returns { currentType, counts, loading, react, refetch }
 * - optimistic updates; reconciles with server on success
 * - optionally patches the replies list cache when secretId is provided
 */
export default function useReplyReactions(
  replyId: string,
  secretId?: string,
  opts: UseReplyReactionsOptions = {}
) {
  const qc = useQueryClient();
  const limit = opts.limit ?? 20;

  const query = useQuery({
    queryKey: ["replyReactions", replyId],
    queryFn: () => fetchReplyReactions(replyId),
    enabled: Boolean(replyId),
    staleTime: 60_000,
  });

  const mutation = useMutation({
    mutationFn: (type: ReactionType) =>
      api.post<ReactResponse>(`/replies/${replyId}/reactions`, { type }),
    onMutate: async (type: ReactionType) => {
      await qc.cancelQueries({ queryKey: ["replyReactions", replyId] });

      const prev = qc.getQueryData<{
        currentType: ReactionType | null;
        counts: CountsResponse;
      }>(["replyReactions", replyId]);

      if (prev) {
        // Toggle behavior: tapping the same type clears it
        const nextType = prev.currentType === type ? null : type;
        const nextCounts = adjustCounts(
          prev.counts,
          prev.currentType,
          nextType
        );

        // Update per-reply reaction cache
        qc.setQueryData(["replyReactions", replyId], {
          currentType: nextType,
          counts: nextCounts,
        });

        // If we know which replies list this row lives in, patch it too
        if (secretId) {
          patchReplyInRepliesCache(qc, secretId, limit, replyId, (r) => ({
            ...r,
            myReaction: nextType,
            reactionCounts: nextCounts,
          }));
        }
      }
      return { prev };
    },
    onSuccess: (res) => {
      // Reconcile with server truth
      qc.setQueryData(["replyReactions", replyId], {
        currentType: res.currentType,
        counts: res.counts,
      });

      if (secretId) {
        patchReplyInRepliesCache(qc, secretId, limit, replyId, (r) => ({
          ...r,
          myReaction: res.currentType,
          reactionCounts: res.counts,
        }));
      }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(["replyReactions", replyId], ctx.prev);
        if (secretId) {
          patchReplyInRepliesCache(qc, secretId, limit, replyId, (r) => ({
            ...r,
            myReaction: ctx?.prev?.currentType,
            reactionCounts: ctx?.prev?.counts,
          }));
        }
      }
    },
  });

  return {
    currentType: query.data?.currentType ?? null,
    counts: query.data?.counts ?? {
      [ReactionType.Like]: 0,
      [ReactionType.Love]: 0,
      [ReactionType.Haha]: 0,
      [ReactionType.Wow]: 0,
      [ReactionType.Sad]: 0,
    },
    loading: query.isLoading,
    refreshing: query.isRefetching,
    react: mutation.mutateAsync,
    refetch: query.refetch,
  };
}
