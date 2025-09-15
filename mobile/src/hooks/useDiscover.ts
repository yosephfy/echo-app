import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { api } from "../api/client";
import type { SecretItemProps } from "../components/SecretItem";
import { useEntities } from "../store/entities";

export type TrendingTag = {
  tag: string;
  count: number;
  slug: string;
  raw?: string;
};

type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

// server fetchers
async function fetchTrendingSecrets(page = 1, limit = 10, hours = 24) {
  return api.get<Paginated<SecretItemProps>>("/secrets/trending", {
    page,
    limit,
    hours,
  });
}

async function fetchTrendingTags(limit = 20, hours = 24) {
  return api.get<TrendingTag[]>("/tags/trending", { limit, hours });
}

async function fetchTagFeed(
  page = 1,
  limit = 20,
  params: { tags?: string[]; moods?: string[]; search?: string }
) {
  const query: Record<string, any> = { page, limit };
  if (params.tags?.length) query.tags = params.tags.join(",");
  if (params.moods?.length) query.moods = params.moods.join(",");
  if (params.search?.trim()) query.search = params.search.trim();
  return api.get<Paginated<SecretItemProps>>("/secrets/feed", query);
}

/** Infinite trending secrets with normalization */
export function useTrendingSecrets(limit = 10, hours = 24) {
  const upsertUsers = useEntities((s) => s.upsertUsers);
  const upsertSecrets = useEntities((s) => s.upsertSecrets);

  const query = useInfiniteQuery<Paginated<SecretItemProps>>({
    queryKey: ["discover", "trending", { limit, hours }],
    queryFn: async ({ pageParam = 1 }: any) => {
      const res = await fetchTrendingSecrets(pageParam, limit, hours);
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
    hours,
    loading: query.isLoading || (query.isFetching && !query.isFetchingNextPage),
    refreshing: query.isRefetching,
    fetchingMore: query.isFetchingNextPage,
    hasMore: !!query.hasNextPage,
    refresh: () => query.refetch(),
    loadMore: () => query.fetchNextPage(),
    query,
  };
}

/** Trending tags list */
export function useTrendingTags(limit = 20, hours = 24) {
  const query = useQuery<TrendingTag[]>({
    queryKey: ["discover", "tags", { limit, hours }],
    queryFn: () => fetchTrendingTags(limit, hours),
    staleTime: 30_000,
  });

  return {
    tags: query.data ?? [],
    loading: query.isLoading || query.isRefetching,
    refresh: () => query.refetch(),
    query,
  };
}

/** Infinite feed filtered by selected tags/moods/search */
export function useTagFeed(
  params: { tags?: string[]; moods?: string[]; search?: string },
  limit = 20
) {
  const upsertUsers = useEntities((s) => s.upsertUsers);
  const upsertSecrets = useEntities((s) => s.upsertSecrets);
  const enabled = (params.tags?.length ?? 0) > 0;

  const query = useInfiniteQuery<Paginated<SecretItemProps>>({
    queryKey: [
      "discover",
      "tagFeed",
      { tags: params.tags, moods: params.moods, search: params.search, limit },
    ],
    queryFn: async ({ pageParam = 1 }: any) => {
      const res = await fetchTagFeed(pageParam, limit, params);
      upsertUsers(res.items.map((i: any) => i.author).filter(Boolean));
      upsertSecrets(res.items);
      return res;
    },
    getNextPageParam: (last, all) => {
      const loaded = all.flatMap((p) => p.items).length;
      return loaded < last.total ? (last.page ?? 1) + 1 : undefined;
    },
    staleTime: 15_000,
    enabled,
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

/** Infinite search for Explore tab (text + moods) */
export function useExploreSearch(
  params: { q?: string; moods?: string[]; sort?: 'newest' | 'relevant' },
  limit = 20
) {
  const upsertUsers = useEntities((s) => s.upsertUsers);
  const upsertSecrets = useEntities((s) => s.upsertSecrets);

  const enabled = (params.q?.trim()?.length ?? 0) > 0 || (params.moods?.length ?? 0) > 0;

  const query = useInfiniteQuery<Paginated<SecretItemProps>>({
    queryKey: ["discover", "explore", { q: params.q, moods: params.moods, sort: params.sort, limit }],
    queryFn: async ({ pageParam = 1 }: any) => {
      const p: Record<string, string | number> = { page: pageParam, limit };
      const q = params.q?.trim();
      if (q) p.q = q;
      if (params.moods && params.moods.length) p.moods = params.moods.join(",");
      if (params.sort) p.sort = params.sort;
      const res = await api.get<Paginated<SecretItemProps>>("/secrets/search", p);
      upsertUsers(res.items.map((i: any) => i.author).filter(Boolean));
      upsertSecrets(res.items);
      return res;
    },
    getNextPageParam: (last, all) => {
      const loaded = all.flatMap((p) => p.items).length;
      return loaded < last.total ? (last.page ?? 1) + 1 : undefined;
    },
    staleTime: 15_000,
    enabled,
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
