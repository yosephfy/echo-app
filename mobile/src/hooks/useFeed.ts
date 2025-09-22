import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { api } from "../api/client";
import type { SecretItemProps } from "../components/Secret/SecretItem";
import { useEntities } from "../store/entities";

type FeedPage = {
  items: SecretItemProps[];
  total: number;
  page: number;
  limit: number;
};

// server call (kept separate for easy testing)
async function fetchFeed(
  page: number = 1,
  limit: number = 20
): Promise<FeedPage> {
  return api.get<FeedPage>("/secrets/feed", { page, limit });
}

/**
 * React Query + Infinite pagination + normalization.
 * - Caches pages by (limit) and dedupes requests
 * - Normalizes authors & secrets into entity store
 * - Exposes flat items + helpers
 */
export function useFeed(limit = 20) {
  const upsertUsers = useEntities((s) => s.upsertUsers);
  const upsertSecrets = useEntities((s) => s.upsertSecrets);

  const query = useInfiniteQuery<FeedPage>({
    queryKey: ["feed", limit],
    queryFn: async ({ pageParam = 1 }: any) => {
      const res = await fetchFeed(pageParam, limit);
      // normalize into entity store (authors + items)
      upsertUsers(res.items.map((i: any) => i.author).filter(Boolean));
      upsertSecrets(res.items);
      return res;
    },
    // tell RQ how to find the next page
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.flatMap((p) => p.items).length;
      return loaded < lastPage.total ? (lastPage.page ?? 1) + 1 : undefined;
    },
    staleTime: 30_000,
    initialPageParam: 1,
  });

  // flatten items across pages for easy consumption
  const items = useMemo(
    () => (query.data ? query.data.pages.flatMap((p) => p.items) : []),
    [query.data]
  );

  const total = query.data?.pages.at(-1)?.total ?? 0;
  const page = query.data?.pages.at(-1)?.page ?? 1;

  return {
    // data
    items,
    total,
    page,
    limit,

    // status
    loading: query.isLoading || (query.isFetching && !query.isFetchingNextPage),
    refreshing: query.isRefetching,
    fetchingMore: query.isFetchingNextPage,
    hasMore: !!query.hasNextPage,

    // actions
    refresh: () => query.refetch(), // pulls from page 1 internally
    loadMore: () => query.fetchNextPage(), // fetch next if hasNextPage
    // expose raw query if needed
    query,
  };
}
