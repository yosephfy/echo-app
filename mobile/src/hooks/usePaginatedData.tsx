import { useState, useCallback } from "react";
import { api } from "../api/client";

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export default function usePaginatedData<T>(
  path: string,
  requestParams: { limit?: number } = {}
) {
  const { limit = 20 } = requestParams;

  const [data, setData] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadPage = useCallback(
    async (nextPage = 1, replace = false) => {
      if (loading) return;
      setLoading(true);
      try {
        const res = await api.get<PaginatedResponse<T>>(path, {
          page: nextPage,
          limit,
        });
        setTotal(res.total);
        setPage(res.page);
        setData((prev) =>
          replace || nextPage === 1 ? res.items : [...prev, ...res.items]
        );
      } catch (err) {
        console.error(`Failed to load ${path}`, err);
      } finally {
        setLoading(false);
      }
    },
    [path, limit, loading]
  );

  const loadFirstPage = useCallback(
    (onUpdate?: (prev: T[]) => T[]) => {
      // allows caller to inject new items (e.g. via real-time)
      loadPage(1, true);
      if (onUpdate) {
        setData((prev) => onUpdate(prev));
      }
    },
    [loadPage]
  );

  const loadNextPage = useCallback(() => {
    if (data.length < total) {
      loadPage(page + 1);
    }
  }, [data.length, total, page, loadPage]);

  const isAtEnd = data.length >= total;

  return {
    data,
    loading,
    page,
    total,
    isAtEnd,
    loadFirstPage,
    loadNextPage,
  };
}
