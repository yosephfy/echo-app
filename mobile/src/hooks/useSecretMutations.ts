import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { useEntities } from "../store/entities";

function patchSecretInPaginatedCache(
  qc: ReturnType<typeof useQueryClient>,
  keyPrefix: any[],
  secretId: string,
  patch: (s: any) => any
) {
  qc.setQueryData([...keyPrefix], (old: any) => {
    if (!old?.pages) return old;
    const pages = old.pages.map((p: any) => ({
      ...p,
      items: p.items.map((it: any) => (it.id === secretId ? patch(it) : it)),
    }));
    return { ...old, pages };
  });
}

function removeSecretFromPaginatedCache(
  qc: ReturnType<typeof useQueryClient>,
  keyPrefix: any[],
  secretId: string
) {
  qc.setQueryData([...keyPrefix], (old: any) => {
    if (!old?.pages) return old;
    const pages = old.pages.map((p: any) => ({
      ...p,
      items: p.items.filter((it: any) => it.id !== secretId),
      total: Math.max(0, (p.total ?? 0) - 1),
    }));
    return { ...old, pages };
  });
}

export function useSecretMutations() {
  const qc = useQueryClient();
  const upsertSecrets = useEntities((s) => s.upsertSecrets);

  const edit = useMutation({
    mutationFn: ({
      id,
      text,
      moods,
    }: {
      id: string;
      text?: string;
      moods?: string[];
    }) => api.patch(`/secrets/${id}`, { text, moods }),
    onSuccess: (saved: any) => {
      // update entity store
      upsertSecrets([saved]);
      // patch feed caches of any page size
      qc.getQueryCache()
        .findAll({ queryKey: ["feed"] })
        .forEach((q) => {
          const key = q.queryKey as any[];
          patchSecretInPaginatedCache(qc, key, saved.id, () => saved);
        });
      qc.getQueryCache()
        .findAll({ queryKey: ["userContent"] })
        .forEach((q) => {
          const key = q.queryKey as any[];
          patchSecretInPaginatedCache(qc, key, saved.id, () => saved);
        });
    },
  });

  const remove = useMutation({
    mutationFn: ({ id }: { id: string }) => api.del(`/secrets/${id}`),
    onSuccess: (_res, vars) => {
      // Remove from any feed caches
      qc.getQueryCache()
        .findAll({ queryKey: ["feed"] })
        .forEach((q) => {
          const key = q.queryKey as any[];
          removeSecretFromPaginatedCache(qc, key, vars.id);
        });
      qc.getQueryCache()
        .findAll({ queryKey: ["userContent"] })
        .forEach((q) => {
          const key = q.queryKey as any[];
          removeSecretFromPaginatedCache(qc, key, vars.id);
        });
    },
  });

  return {
    editSecret: edit.mutateAsync,
    deleting: remove.isPending,
    editing: edit.isPending,
    deleteSecret: remove.mutateAsync,
  };
}
