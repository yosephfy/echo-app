// mobile/src/hooks/useCap.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { useEntities } from "../store/entities";

/** ---- server shapes ---- */
type CapCountResponse = { count: number };
type CapMeResponse = { hasCapped: boolean };
type CapToggleResponse = { hasCapped: boolean; count: number };

/** Fetch both "count" and "my status" together */
async function fetchCap(
  secretId: string
): Promise<{ hasCapped: boolean; count: number }> {
  const [me, cnt] = await Promise.all([
    api.get<CapMeResponse>(`/secrets/${secretId}/cap/me`),
    api.get<CapCountResponse>(`/secrets/${secretId}/cap`),
  ]);
  return { hasCapped: me.hasCapped, count: cnt.count };
}

/**
 * useCap(secretId)
 * - returns { hasCapped, count, loading, toggle, refetch }
 * - optimistic toggle and cache reconciliation
 * - lightly syncs any cached secret entity (capCount / cappedByMe if you store them)
 */
export default function useCap(secretId: string) {
  const qc = useQueryClient();
  const upsertSecrets = useEntities((s) => s.upsertSecrets);

  const query = useQuery({
    queryKey: ["cap", secretId],
    queryFn: () => fetchCap(secretId),
    enabled: Boolean(secretId),
    staleTime: 60_000,
  });

  const toggleMutation = useMutation({
    mutationFn: async () =>
      api.post<CapToggleResponse>(`/secrets/${secretId}/cap`),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["cap", secretId] });
      const prev = qc.getQueryData<{ hasCapped: boolean; count: number }>([
        "cap",
        secretId,
      ]);

      if (prev) {
        // optimistic flip
        const next = {
          hasCapped: !prev.hasCapped,
          count: prev.hasCapped ? Math.max(0, prev.count - 1) : prev.count + 1,
        };
        qc.setQueryData(["cap", secretId], next);

        // also reflect in any cached secret entity (if you track these fields)
        // we don't assume typings; store what you use, e.g., capCount / cappedByMe
        upsertSecrets([
          {
            id: secretId,
            capCount: next.count,
            cappedByMe: next.hasCapped,
          } as any,
        ]);
      }

      return { prev };
    },
    onSuccess: (res) => {
      // reconcile with server truth
      const final = { hasCapped: res.hasCapped, count: res.count };
      qc.setQueryData(["cap", secretId], final);
      upsertSecrets([
        {
          id: secretId,
          capCount: final.count,
          cappedByMe: final.hasCapped,
        } as any,
      ]);

      // If you cache the secret detail, you can also update it directly:
      qc.setQueryData(["secret", secretId], (old: any) =>
        old
          ? { ...old, capCount: final.count, cappedByMe: final.hasCapped }
          : old
      );
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(["cap", secretId], ctx.prev);
        upsertSecrets([
          {
            id: secretId,
            capCount: ctx.prev.count,
            cappedByMe: ctx.prev.hasCapped,
          } as any,
        ]);
      }
    },
  });

  return {
    hasCapped: query.data?.hasCapped ?? false,
    count: query.data?.count ?? 0,
    loading: query.isLoading,
    refreshing: query.isRefetching,
    toggle: toggleMutation.mutateAsync,
    refetch: query.refetch,
  };
}
