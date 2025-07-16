// mobile/src/hooks/useReplies.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import useSocket from "./useSocket";

export interface Reply {
  id: string;
  text: string;
  createdAt: string;
  author: { id: string; handle: string; avatarUrl?: string };
}

interface RepliesResponse {
  items: Reply[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Hook for paginated, real-time replies under a secret
 */
export function useReplies(secretId: string, pageSize = 20) {
  const [replies, setReplies] = useState<Reply[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const mounted = useRef(true);
  const loadingRef = useRef(false);

  const loadPage = useCallback(
    async (pageToLoad = 1, replace = false) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setLoading(true);
      try {
        const res = await api.get<RepliesResponse>(
          `/secrets/${secretId}/replies`,
          { page: pageToLoad, limit: pageSize }
        );
        if (!mounted.current) return;
        setTotal(res.total);
        setPage(res.page);
        setHasMore(
          replace
            ? res.items.length < res.total
            : replies.length + res.items.length < res.total
        );
        setReplies((prev) => (replace ? res.items : [...prev, ...res.items]));
      } catch (err) {
        console.error("useReplies loadPage error", err);
      } finally {
        if (mounted.current) {
          setLoading(false);
          loadingRef.current = false;
        }
      }
    },
    [secretId, pageSize]
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await loadPage(1, true);
    if (mounted.current) setRefreshing(false);
  }, [loadPage]);

  const loadMore = useCallback(() => {
    if (hasMore && !loadingRef.current) {
      loadPage(page + 1);
    }
  }, [hasMore, loadPage, page]);

  const add = useCallback(
    async (text: string) => {
      const tempId = `temp-${Date.now()}`;
      const temp: Reply = {
        id: tempId,
        text,
        createdAt: new Date().toISOString(),
        author: { id: "", handle: "", avatarUrl: "" },
      };
      setReplies((prev) => [temp, ...prev]);
      try {
        const saved = await api.post<Reply>(`/secrets/${secretId}/replies`, {
          text,
        });
        setReplies((prev) => prev.map((r) => (r.id === tempId ? saved : r)));
      } catch (err) {
        console.error("useReplies add error", err);
        setReplies((prev) => prev.filter((r) => r.id !== tempId));
        throw err;
      }
    },
    [secretId]
  );

  // Real-time listener
  useSocket(`replyCreated:${secretId}`, (reply: Reply) => {
    setReplies((prev) => [reply, ...prev]);
    setTotal((t) => t + 1);
  });

  useEffect(() => {
    mounted.current = true;
    loadPage(1, true);
    return () => {
      mounted.current = false;
    };
  }, [loadPage]);

  return {
    replies,
    loading,
    refreshing,
    hasMore,
    loadMore,
    refresh,
    add,
    total,
    page,
    pageSize,
  };
}
