import { useState, useEffect, useCallback } from "react";
import { api } from "../api/client";
import { PaginatedHooksResponse } from "./useBookmarks";
import { SecretItemProps } from "../components/SecretItem";

/**
 * Shape of a feed item returned by /secrets/feed
 */

/**
 * Hook to fetch paginated feed of secrets.
 *
 * @param pageSize number of items per page
 */
export function useFeed(
  pageSize: number = 20,
  token: string | null
): PaginatedHooksResponse<SecretItemProps> {
  const [items, setItems] = useState<SecretItemProps[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  /**
   * Load a specific page of feed items. If replace is false, appends to existing items.
   */
  const loadPage = useCallback(
    async (pageNumber: number = 1, replace: boolean = false) => {
      if (pageNumber === 1) setRefreshing(true);
      else setLoading(true);
      try {
        const res = await api.get<{ items: SecretItemProps[]; total: number }>(
          "/secrets/feed",
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
        console.error("useFeed.loadPage error", err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [pageSize]
  );

  /** Refreshes the feed by reloading the first page */
  const refresh = useCallback(() => loadPage(1, true), [loadPage]);

  /** Loads the next page if available */
  const loadMore = useCallback(() => {
    if (!loading && items.length !== 0) {
      loadPage(page + 1);
    }
  }, [loading, items.length, total, page, loadPage]);

  // Initial load
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
    hasMore: items.length < total,
    loadPage,
    refresh,
    loadMore,
  };
}
