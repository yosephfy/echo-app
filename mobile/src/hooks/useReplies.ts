// mobile/src/hooks/useReplies.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import { PaginatedHooksResponse } from "./types";
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

type ReplyHooksResponse = PaginatedHooksResponse<Reply> & {
  add: (text: string) => Promise<void>;
};

/**
 * Hook for paginated, real-time replies under a secret
 */
export function useReplies(secretId: string, limit = 20): ReplyHooksResponse {
  const [replies, setReplies] = useState<Reply[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const mounted = useRef(true);
  const loadingRef = useRef(false);

  const loadPage = useCallback(
    async (pageNumber: number = 1, replace: boolean = false) => {
      if (pageNumber === 1) setRefreshing(true);
      else setLoading(true);
      try {
        const res = await api.get<RepliesResponse>(
          `/secrets/${secretId}/replies`,
          {
            page: pageNumber,
            limit: limit,
          }
        );
        setReplies((prev) =>
          replace || pageNumber === 1 ? res.items : [...prev, ...res.items]
        );
        setTotal(res.total);
        setPage(pageNumber);
      } catch (err) {
        console.error("useReplies.loadPage error", err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [limit, secretId]
  );

  const refresh = useCallback(() => loadPage(1, true), [loadPage]);

  const loadMore = useCallback(() => {
    if (!loading && replies.length !== 0) {
      loadPage(page + 1);
    }
  }, [loading, replies.length, total, page, loadPage]);

  const add = useCallback(
    async (text: string) => {
      setLoading(true);
      try {
        const saved = await api.post<Reply>(`/secrets/${secretId}/replies`, {
          text,
        });
        // prepend the newly created reply
        setReplies((prev) => [saved, ...prev]);
        setTotal((t) => t + 1);
      } catch (err) {
        console.error("useReplies add error", err);
        throw err;
      } finally {
        if (mounted.current) setLoading(false);
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
    loadPage(1, true);
  }, [loadPage]);

  return {
    items: replies,
    loading,
    refreshing,
    hasMore: replies.length !== 0,
    loadMore,
    refresh,
    add,
    total,
    page,
    limit,
    loadPage,
  };
}
