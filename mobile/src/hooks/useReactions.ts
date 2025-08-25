// mobile/src/hooks/useReactions.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { useEntities } from "../store/entities";

export enum ReactionType {
  Like = "like",
  Love = "love",
  Haha = "haha",
  Wow = "wow",
  Sad = "sad",
}

/** ---- Server shapes ---- */
type CountsResponse = Record<ReactionType, number>;
type MeResponse = { type: ReactionType | null };
type ReactResponse = {
  currentType: ReactionType | null;
  counts: CountsResponse;
};

/** Combine counts + my reaction with a single queryFn */
async function fetchReactions(secretId: string): Promise<{
  currentType: ReactionType | null;
  counts: CountsResponse;
}> {
  const [counts, me] = await Promise.all([
    api.get<CountsResponse>(`/secrets/${secretId}/reactions`),
    api.get<MeResponse>(`/secrets/${secretId}/reactions/me`),
  ]);
  return { currentType: me.type, counts };
}

/** Optimistically adjust counts for switching/clearing a reaction */
function adjustCounts(
  counts: CountsResponse,
  prevType: ReactionType | null,
  nextType: ReactionType | null
): CountsResponse {
  const next = { ...counts };
  if (prevType && next[prevType] > 0) next[prevType] -= 1; // remove previous
  if (nextType) next[nextType] = (next[nextType] ?? 0) + 1; // add new
  return next;
}

/**
 * useReactions(secretId)
 * - returns { currentType, counts, loading, react, refetch }
 * - optimistic react() with cache + normalized entity sync
 */
export default function useReactions(secretId: string) {
  const qc = useQueryClient();
  const upsertSecrets = useEntities((s) => s.upsertSecrets);

  const query = useQuery({
    queryKey: ["reactions", secretId],
    queryFn: () => fetchReactions(secretId),
    enabled: Boolean(secretId),
    staleTime: 60_000,
  });

  const reactMutation = useMutation({
    mutationFn: (type: ReactionType) =>
      api.post<ReactResponse>(`/secrets/${secretId}/reactions`, { type }),
    onMutate: async (type: ReactionType) => {
      await qc.cancelQueries({ queryKey: ["reactions", secretId] });
      const prev = qc.getQueryData<{
        currentType: ReactionType | null;
        counts: CountsResponse;
      }>(["reactions", secretId]);

      if (prev) {
        // Determine next reaction: clicking same type clears it (toggle behavior)
        const nextType = prev.currentType === type ? null : type;
        const nextCounts = adjustCounts(
          prev.counts,
          prev.currentType,
          nextType
        );

        // Update reactions cache
        qc.setQueryData(["reactions", secretId], {
          currentType: nextType,
          counts: nextCounts,
        });

        // Reflect in normalized secret (if you track these fields)
        upsertSecrets([
          {
            id: secretId,
            myReaction: nextType,
            reactionCounts: nextCounts,
          } as any,
        ]);
      }

      return { prev };
    },
    onSuccess: (res) => {
      // Reconcile with server truth
      qc.setQueryData(["reactions", secretId], {
        currentType: res.currentType,
        counts: res.counts,
      });
      upsertSecrets([
        {
          id: secretId,
          myReaction: res.currentType,
          reactionCounts: res.counts,
        } as any,
      ]);

      // If you also cache the secret detail page, update it too
      qc.setQueryData(["secret", secretId], (old: any) =>
        old
          ? {
              ...old,
              myReaction: res.currentType,
              reactionCounts: res.counts,
            }
          : old
      );
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(["reactions", secretId], ctx.prev);
        upsertSecrets([
          {
            id: secretId,
            myReaction: ctx.prev.currentType,
            reactionCounts: ctx.prev.counts,
          } as any,
        ]);
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
    react: reactMutation.mutateAsync,
    refetch: query.refetch,
  };
}
