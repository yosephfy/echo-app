import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { api } from "../api/client";
import useSocket from "./useSocket";
import { useEntities } from "../store/entities";

/** ----- API Types ----- */
export interface Reply {
  id: string; // UUID from server
  secretId: string;
  text: string;
  createdAt: string;
  author: { id: string; handle: string; avatarUrl?: string };
}
interface RepliesPage {
  items: Reply[];
  total: number;
  page: number;
  limit: number;
}

/** ----- UI Types (discriminated) ----- */
export type UIReply =
  | {
      kind: "pending";
      clientKey: string;
      reply: Omit<Reply, "id">; // no id yet
    }
  | { kind: "server"; reply: Reply };

function fetchReplies(secretId: string, page = 1, limit = 20) {
  return api.get<RepliesPage>(`/secrets/${secretId}/replies`, { page, limit });
}

function uniqueById(items: Reply[]): Reply[] {
  const seen = new Set<string>();
  const out: Reply[] = [];
  for (const r of items)
    if (!seen.has(r.id)) {
      seen.add(r.id);
      out.push(r);
    }
  return out;
}

export function useReplies(secretId: string, limit = 10) {
  const qc = useQueryClient();
  const upsertUsers = useEntities((s) => s.upsertUsers);

  // purely local placeholders (never sent to server, never mixed into cache)
  const [pending, setPending] = useState<UIReply[]>([]);

  const query = useInfiniteQuery<RepliesPage>({
    queryKey: ["replies", secretId, limit],
    enabled: !!secretId,
    staleTime: 30_000,
    queryFn: async ({ pageParam = 1 }: any) => {
      const res = await fetchReplies(secretId, pageParam, limit);
      upsertUsers(res.items.map((r) => r.author));
      return res;
    },
    getNextPageParam: (last, all) => {
      const loaded = all.flatMap((p) => p.items).length;
      return loaded < last.total ? (last.page ?? 1) + 1 : undefined;
    },
    initialPageParam: 1,
  });

  const serverItems = useMemo(
    () =>
      query.data ? uniqueById(query.data.pages.flatMap((p) => p.items)) : [],
    [query.data]
  );

  // Final list to render: pending (top) + server (below), BUT pending are tagged and have no id
  const items: UIReply[] = useMemo(
    () => [
      ...pending,
      ...serverItems.map<UIReply>((r) => ({ kind: "server", reply: r })),
    ],
    [pending, serverItems]
  );

  const total = query.data?.pages.at(-1)?.total ?? 0;
  const page = query.data?.pages.at(-1)?.page ?? 1;

  // Create reply: add local pending; on success remove by clientKey and prepend real reply into cache
  const addMutation = useMutation({
    mutationFn: (text: string) =>
      api.post<Reply>(`/secrets/${secretId}/replies`, { text }),
    onMutate: async (text: string) => {
      const clientKey = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const placeholder: UIReply = {
        kind: "pending",
        clientKey,
        reply: {
          text,
          createdAt: new Date().toISOString(),
          secretId,
          author: { id: "me", handle: "me" }, // swap with your "me" store if available
        },
      };
      setPending((prev) => [placeholder, ...prev]);
      await qc.cancelQueries({ queryKey: ["replies", secretId, limit] });
      return { clientKey };
    },
    onSuccess: (saved, _vars, ctx) => {
      // remove the placeholder
      setPending((prev) =>
        prev.filter(
          (p) => p.kind !== "pending" || p.clientKey !== ctx?.clientKey
        )
      );
      // normalize and prepend actual reply to page 1 in cache
      upsertUsers([saved.author]);
      qc.setQueryData(["replies", secretId, limit], (old: any) => {
        if (!old) return old;
        const first = old.pages?.[0];
        if (!first) return old;
        const newFirst = {
          ...first,
          items: uniqueById([saved, ...first.items]),
          total: (first.total ?? 0) + 1,
        };
        return { ...old, pages: [newFirst, ...old.pages.slice(1)] };
      });
      // optionally bump secret detail counter
      qc.setQueryData(["secret", secretId], (old: any) =>
        old ? { ...old, replyCount: (old.replyCount ?? 0) + 1 } : old
      );
    },
    onError: (_e, _vars, ctx) => {
      // remove the placeholder (failure)
      setPending((prev) =>
        prev.filter(
          (p) => p.kind !== "pending" || p.clientKey !== ctx?.clientKey
        )
      );
      // show toast if desired
    },
  });

  // Real-time: only prepend **server replies** to cache (no pending involved)
  useSocket(`replyCreated:${secretId}`, (reply: Reply) => {
    upsertUsers([reply.author]);
    qc.setQueryData(["replies", secretId, limit], (old: any) => {
      if (!old) return old;
      const first = old.pages?.[0];
      if (!first) return old;
      const newFirst = {
        ...first,
        items: uniqueById([reply, ...first.items]),
        total: (first.total ?? 0) + 1,
      };
      return { ...old, pages: [newFirst, ...old.pages.slice(1)] };
    });
    qc.setQueryData(["secret", secretId], (old: any) =>
      old ? { ...old, replyCount: (old.replyCount ?? 0) + 1 } : old
    );
  });

  return {
    items, // discriminated: pending/server
    total,
    page,
    limit,
    loading: query.isLoading || (query.isFetching && !query.isFetchingNextPage),
    refreshing: query.isRefetching,
    fetchingMore: query.isFetchingNextPage,
    hasMore: !!query.hasNextPage,
    refresh: () => query.refetch(),
    loadMore: () => query.fetchNextPage(),
    add: (text: string) => addMutation.mutateAsync(text),
  };
}
