// mobile/src/hooks/useBookmark.ts
import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import { SecretItemProps } from "../components/SecretItem";

export interface PaginatedHooksResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  loading: boolean;
  refreshing: boolean;
  hasMore: boolean;
  loadPage: (page?: number, replace?: boolean) => Promise<void>;
  refresh: () => Promise<void> | void;
  loadMore: () => void;
}

interface ToggleResponse {
  added?: boolean;
  removed?: boolean;
  count: number;
}

interface CountResponse {
  secretId: string;
  count: number;
}

interface MeResponse {
  bookmarked: boolean;
}

/**
 * Hook to manage bookmarking a single secret.
 *
 * @param secretId the id of the secret to bookmark/unbookmark
 */
export default function useBookmark(secretId: string) {
  const [count, setCount] = useState<number>(0);
  const [bookmarked, setBookmarked] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch count and bookmarked status
  const refresh = useCallback(async () => {
    try {
      const [{ count }, { bookmarked }] = await Promise.all([
        api.get<CountResponse>(`/bookmarks/secret/${secretId}/count`),
        api.get<MeResponse>(`/bookmarks/${secretId}/me`),
      ]);
      setCount(count);
      setBookmarked(bookmarked);
    } catch (err) {
      console.error("useBookmark.refresh error", err);
    }
  }, [secretId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Toggle the bookmark state */
  const toggle = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.post<ToggleResponse>(`/bookmarks/${secretId}`);
      // update count directly
      setCount(res.count);
      // set bookmarked based on added/removed flags
      if (res.added !== undefined) {
        setBookmarked(true);
      } else if (res.removed !== undefined) {
        setBookmarked(false);
      }
    } catch (err) {
      console.error("useBookmark.toggle error", err);
    } finally {
      setLoading(false);
    }
  }, [secretId]);

  return { count, bookmarked, loading, toggle, refresh };
}

/**
 * Hook to fetch paginated list of user's bookmarked secrets.
 *
 * @param pageSize number of items per page
 */
export function useBookmarks(
  pageSize: number = 20
): PaginatedHooksResponse<SecretItemProps> {
  const [items, setItems] = useState<SecretItemProps[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadPage = useCallback(
    async (pageNumber: number = 1, replace: boolean = false) => {
      if (pageNumber === 1) setRefreshing(true);
      else setLoading(true);
      try {
        const res = await api.get<{ items: SecretItemProps[]; total: number }>(
          "/bookmarks",
          {
            page: pageNumber,
            limit: pageSize,
          }
        );
        setItems((prev) =>
          replace || pageNumber === 1 ? res.items : [...prev, ...res.items]
        );
        setTotal(res.total);
        setPage(pageNumber);
      } catch (err) {
        console.error("useBookmarks.loadPage error", err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [pageSize]
  );

  const refresh = useCallback(() => loadPage(1, true), [loadPage]);
  const loadMore = useCallback(() => {
    if (!loading && items.length !== 0) {
      loadPage(page + 1);
    }
  }, [loading, items.length, total, page, loadPage]);

  useEffect(() => {
    loadPage(1, true);
  }, [loadPage]);

  return {
    items,
    total,
    page,
    limit: pageSize,
    loading,
    refreshing,
    hasMore: items.length !== 0,
    loadPage,
    refresh,
    loadMore,
  };
}
