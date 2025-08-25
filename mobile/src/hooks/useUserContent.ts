import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { api } from "../api/client";
import { useEntities } from "../store/entities";
import type { SecretItemProps } from "../components/SecretItem";

export type ContentType = "secrets" | "bookmarks" | "reactions" | "caps";

interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

function pathFor(type: ContentType): string {
  switch (type) {
    case "secrets":
      return "/secrets/secretslist/me";
    case "bookmarks":
      return "/bookmarks";
    case "reactions":
      // if you have a dedicated endpoint, swap it here
      return "/secrets/secretslist/me";
    case "caps":
      // if you have a dedicated endpoint, swap it here
      return "/secrets/secretslist/me";
  }
}

/** Server fetcher */
async function fetchUserContent(
  type: ContentType,
  page = 1,
  limit = 20
): Promise<Paginated<SecretItemProps>> {
  return api.get<Paginated<SecretItemProps>>(pathFor(type), { page, limit });
}

/**
 * useUserContent(type, pageSize)
 * - Infinite pagination + normalization into entity store
 * - Returns a simple, flat `items` array and helpers
 */
export function useUserContent(type: ContentType, pageSize = 20) {
  const upsertUsers = useEntities((s) => s.upsertUsers);
  const upsertSecrets = useEntities((s) => s.upsertSecrets);

  const query = useInfiniteQuery<Paginated<SecretItemProps>>({
    queryKey: ["userContent", type, pageSize],
    queryFn: async ({ pageParam = 1 }: any) => {
      const res = await fetchUserContent(type, pageParam, pageSize);
      // normalize authors + items for reuse across the app
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
    // data
    items,
    total,
    page,
    limit: pageSize,
    // status
    loading: query.isLoading || (query.isFetching && !query.isFetchingNextPage),
    refreshing: query.isRefetching,
    fetchingMore: query.isFetchingNextPage,
    hasMore: !!query.hasNextPage,
    // actions
    refresh: () => query.refetch(),
    loadMore: () => query.fetchNextPage(),
    // raw query if needed
    query,
  };
}

/**
 * useRecentSecrets(limit)
 * - Thin convenience wrapper for the “Recent Activity” carousel
 */
export function useRecentSecrets(limit = 10) {
  return useUserContent("secrets", limit);
}
