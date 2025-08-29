import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { api } from "../api/client";
import { useEntities } from "../store/entities";

export type LiteUser = {
  id: string;
  handle: string;
  avatarUrl?: string | null;
  createdAt?: string;
};

type Page = {
  items: LiteUser[];
  total: number;
  page: number;
  limit: number;
};

export type UserSort = "handle_asc" | "handle_desc" | "recent";

export function useUserSearch(
  query: string,
  sort: UserSort = "handle_asc",
  limit = 20
) {
  const upsertUsers = useEntities((s) => s.upsertUsers);

  const q = useInfiniteQuery<Page>({
    queryKey: ["userSearch", query.trim(), sort, limit],
    queryFn: async ({ pageParam = 1 }: any) => {
      // Adjust this endpoint to match your backend. Example server params:
      // GET /users/search?query=...&sort=handle_asc&limit=20&page=1
      const res = await api.get<Page>("/users/search", {
        query: query.trim() || "",
        sort,
        limit,
        page: pageParam,
      });
      upsertUsers(res.items);
      return res;
    },
    getNextPageParam: (last, all) => {
      const loaded = all.flatMap((p) => p.items).length;
      return loaded < last.total ? (last.page ?? 1) + 1 : undefined;
    },
    staleTime: 15_000,
    initialPageParam: 1,
  });

  const items = useMemo(
    () => q.data?.pages.flatMap((p) => p.items) ?? [],
    [q.data]
  );

  return {
    items,
    loading: q.isLoading,
    refreshing: q.isRefetching,
    hasMore: !!q.hasNextPage,
    loadMore: () => q.fetchNextPage(),
    refresh: () => q.refetch(),
  };
}
