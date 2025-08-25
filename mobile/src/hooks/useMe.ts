// mobile/src/hooks/useMe.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { api } from "../api/client";
import { useAuthStore } from "../store/authStore";
import { useEntities, type UserEntity } from "../store/entities";

/**
 * Shape returned by the server for /users/me
 * Add fields as your backend actually returns them.
 */
export type Me = {
  id: string;
  handle: string;
  email?: string;
  avatarUrl?: string | null;
  bio?: string | null;
  // any other profile fields...
};

export default function useMe() {
  const token = useAuthStore((s) => s.token);
  const upsertUsers = useEntities((s) => s.upsertUsers);
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["me"],
    queryFn: async (): Promise<Me> => {
      return api.get<Me>("/users/me");
    },
    enabled: Boolean(token), // only fetch when logged in
    staleTime: 60_000, // 1 minute
    retry: 1,
  });

  // Move onSuccess logic to useEffect
  useEffect(() => {
    if (query.data) {
      upsertUsers([query.data as Partial<UserEntity>]);
      qc.setQueryData(["user", query.data.id], query.data);
    }
  }, [query.data, upsertUsers, qc]);

  const updateMutation = useMutation({
    mutationFn: (patch: Partial<Me>) =>
      api.patch<Me>("/users/me/profile", patch),
    onMutate: async (patch) => {
      // optimistic update: snapshot previous value and apply patch locally
      await qc.cancelQueries({ queryKey: ["me"] });
      const previous = qc.getQueryData<Me>(["me"]);
      if (previous) {
        const optimistic = { ...previous, ...patch };
        qc.setQueryData(["me"], optimistic);
        upsertUsers([optimistic as Partial<UserEntity>]);
        qc.setQueryData(["user", optimistic.id], optimistic);
      }
      return { previous };
    },
    onSuccess: (data) => {
      // reconcile with server truth
      qc.setQueryData(["me"], data);
      upsertUsers([data as Partial<UserEntity>]);
      qc.setQueryData(["user", data.id], data);
      // optionally update any queries that should reflect profile change
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["user", data.id] });
    },
    onError: (_err, _vars, context: any) => {
      // rollback
      if (context?.previous) {
        qc.setQueryData(["me"], context.previous);
        upsertUsers([context.previous as Partial<UserEntity>]);
      }
    },
  });

  return {
    // data + status
    user: query.data,
    loading: query.isLoading,
    refreshing: query.isRefetching,
    error: query.error ? (query.error as Error).message : null,
    isLoggedIn: Boolean(token),

    // actions
    refresh: () => query.refetch(),
    updateProfile: (patch: Partial<Me>) => updateMutation.mutateAsync(patch),
    // mutation state if UI wants to show saving indicators
    updating: updateMutation.isPending,

    // raw query & mutation if caller needs them
    query,
    updateMutation,
  };
}
