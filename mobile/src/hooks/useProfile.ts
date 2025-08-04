// mobile/src/hooks/useUserStats.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import { SecretItemProps } from "../components/SecretItem";
import usePaginatedData from "./usePaginatedData";

export interface UserStats {
  postsCount: number;
  bookmarksCount: number;
  currentStreak: number;
  totalReactions: number;
  totalCaps: number;
  handle: string;
  avatarUrl: string;
}

export function useUserStats() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<UserStats>("/users/me/stats")
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { stats, loading, error };
}

// mobile/src/hooks/useRecentSecrets.ts

export function useRecentSecrets(limit: number = 10) {
  /*   const [items, setItems] = useState<SecretItemProps[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get<{ items: SecretItemProps[] }>(`/secrets/secretslist/me`, { limit })
      .then((res) => setItems(res.items))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [limit]);

  useEffect(() => {
    load();
  }, [load]); */

  const { data, loadFirstPage, loadNextPage, loading, page, total, isAtEnd } =
    usePaginatedData<SecretItemProps>("/secrets/secretslist/me", { limit });
  useEffect(() => {
    loadFirstPage();
  }, [limit]);
  return { items: data, loading, refresh: loadFirstPage };
}

// mobile/src/hooks/useUserContent.ts

export type ContentType = "secrets" | "bookmarks" | "reactions" | "caps";

interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export function useUserContent(type: ContentType, pageSize = 20) {
  const [items, setItems] = useState<SecretItemProps[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const loadingRef = useRef(false);

  const buildUrl = (pageNum: number) => {
    switch (type) {
      case "secrets":
        return `/secrets/secretslist/me`;
      case "bookmarks":
        return `/bookmarks`;
      case "reactions":
        return `/secrets/secretslist/me`;
      case "caps":
        return `/secrets/secretslist/me`;
    }
  };

  const loadPage = useCallback(
    async (pageNum: number, replace = false) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setLoading(true);
      try {
        const res = await api.get<Paginated<SecretItemProps>>(
          buildUrl(pageNum),
          { limit: pageSize, page: pageNum }
        );
        setTotal(res.total);
        setPage(res.page);
        setItems((prev) => (replace ? res.items : [...prev, ...res.items]));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    },
    [type, pageSize]
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await loadPage(1, true);
    setRefreshing(false);
  }, [loadPage]);

  const loadMore = useCallback(() => {
    if (!loadingRef.current && items.length < total) {
      loadPage(page + 1);
    }
  }, [items, total, page, loadPage]);

  useEffect(() => {
    loadPage(1, true);
  }, [type]);

  return { items, loading, refreshing, loadMore, refresh };
}
