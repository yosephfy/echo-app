// mobile/src/hooks/useBookmark.ts
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useMemo } from "react";
import { api } from "../api/client";
import { useEntities } from "../store/entities";
import type { SecretItemProps } from "../components/Secret/SecretItem";
import { FeedPage } from "./types";

/** ---------------------------
 * Types (server responses)
 * --------------------------- */

type BookmarkStatusResponse = { bookmarked: boolean };
type BookmarkCountResponse = { secretId: string; count: number };
type ToggleResponse = { added?: boolean; removed?: boolean; count: number };

type BookmarksPage = {
  items: SecretItemProps[];
  total: number;
  page: number;
  limit: number;
};

/** ---------------------------
 * Queries
 * --------------------------- */

/**
 * Combined status/count fetch for a specific secret bookmark.
 * Uses a single queryFn to execute both endpoints in parallel.
 */
function fetchBookmarkStatusAndCount(secretId: string) {
  return Promise.all([
    api.get<BookmarkStatusResponse>(`/bookmarks/${secretId}/me`),
    api.get<BookmarkCountResponse>(`/bookmarks/secret/${secretId}/count`),
  ]).then(([me, count]) => ({
    bookmarked: me.bookmarked,
    count: count.count,
  }));
}

/**
 * Hook: bookmark status + count for a secret.
 * Provides `toggle()` mutation that updates the cache optimistically.
 */
export function useBookmark(secretId: string) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["bookmark", "status", secretId],
    queryFn: () => fetchBookmarkStatusAndCount(secretId),
    staleTime: 60_000,
    enabled: Boolean(secretId),
  });

  const toggleMutation = useMutation({
    mutationFn: async () => api.post<ToggleResponse>(`/bookmarks/${secretId}`),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["bookmark", "status", secretId] });
      const prev = qc.getQueryData<{ bookmarked: boolean; count: number }>([
        "bookmark",
        "status",
        secretId,
      ]);
      if (prev) {
        // naive optimistic flip (server returns final count; we’ll reconcile on success)
        const next = {
          bookmarked: !prev.bookmarked,
          count: prev.bookmarked ? Math.max(0, prev.count - 1) : prev.count + 1,
        };
        qc.setQueryData(["bookmark", "status", secretId], next);
      }
      return { prev };
    },
    onSuccess: (res) => {
      // Reconcile with server truth
      const final = {
        bookmarked: Boolean(res.added)
          ? true
          : Boolean(res.removed)
            ? false
            : undefined,
        count: res.count,
      };
      qc.setQueryData(["bookmark", "status", secretId], (old: any) => ({
        bookmarked: final.bookmarked ?? old?.bookmarked ?? false,
        count: final.count,
      }));

      // Lightly invalidate bookmarks list because its membership may have changed
      qc.invalidateQueries({ queryKey: ["bookmarks"] });
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(["bookmark", "status", secretId], ctx.prev);
      }
    },
  });

  return {
    count: query.data?.count ?? 0,
    bookmarked: query.data?.bookmarked ?? false,
    loading: query.isLoading,
    refreshing: query.isRefetching,
    toggle: toggleMutation.mutateAsync,
    refetch: query.refetch,
  };
}

/**
 * Fetch a page of bookmarks.
 */
async function fetchBookmarks(page = 1, limit = 20): Promise<BookmarksPage> {
  return api.get<BookmarksPage>("/bookmarks", { page, limit });
}

/**
 * Hook: paginated list of the user's bookmarked secrets.
 * - Infinite, cached pages
 * - Normalizes authors + secrets into the entity store
 */
export function useBookmarks(limit = 20) {
  const upsertUsers = useEntities((s) => s.upsertUsers);
  const upsertSecrets = useEntities((s) => s.upsertSecrets);

  const query = useInfiniteQuery<FeedPage>({
    queryKey: ["bookmarks", limit],
    queryFn: async ({ pageParam = 1 }: any) => {
      const res = await fetchBookmarks(pageParam, limit);
      // normalize entities
      upsertUsers(res.items.map((i: any) => i.author).filter(Boolean));
      upsertSecrets(res.items);
      return res;
    },
    getNextPageParam: (last, all) => {
      const loaded = all.flatMap((p) => p.items).length;
      return loaded < last.total ? (last.page ?? 1) + 1 : undefined;
    },
    staleTime: 30_000,
    initialPageParam: 1,
  });

  const items = useMemo(
    () => (query.data ? query.data.pages.flatMap((p) => p.items) : []),
    [query.data]
  );

  const total = query.data?.pages.at(-1)?.total ?? 0;
  const page = query.data?.pages.at(-1)?.page ?? 1;

  return {
    items,
    total,
    page,
    limit,
    loading: query.isLoading || (query.isFetching && !query.isFetchingNextPage),
    refreshing: query.isRefetching,
    fetchingMore: query.isFetchingNextPage,
    hasMore: !!query.hasNextPage,
    refresh: () => query.refetch(),
    loadMore: () => query.fetchNextPage(),
    query,
  };
}
