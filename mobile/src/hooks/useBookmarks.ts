// mobile/src/hooks/useBookmark.ts
import { useState, useEffect, useCallback } from "react";
import { api } from "../api/client";

interface ToggleResponse {
  added?: boolean;
  removed?: boolean;
  count: number;
}

interface CountResponse {
  secretId: string;
  count: number;
}

interface BookmarkListItem {
  id: string;
  secret: {
    id: string;
  };
  createdAt: string;
}

interface ListResponse {
  items: BookmarkListItem[];
  total: number;
  page: number;
  limit: number;
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

  /** Fetch current bookmark count and whether this user has bookmarked it */
  const refresh = useCallback(async () => {
    try {
      // 1) get total count for this secret
      const countRes = await api.get<CountResponse>(
        `/bookmarks/secret/${secretId}/count`
      );
      setCount(countRes.count);

      // 2) check if current user has bookmarked it
      // Fetch first page of bookmarks for user (could be optimized)
      const listRes = await api.get<ListResponse>("/bookmarks", {
        page: 1,
        limit: 1000,
      });
      setBookmarked(listRes.items.some((item) => item.secret.id === secretId));
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
      console.log("Bookmark toggle response:", res);
      // update count
      setCount(res.count);
      // update bookmarked flag
      if (res.added !== undefined) {
        setBookmarked(res.added);
      } else if (res.removed !== undefined) {
        setBookmarked(!res.removed ? bookmarked : false);
        // removed true means it's unbookmarked
        if (res.removed) setBookmarked(false);
      } else {
        // fallback: flip boolean
        setBookmarked((b) => !b);
      }
    } catch (err) {
      console.error("useBookmark.toggle error", err);
    } finally {
      setLoading(false);
    }
  }, [secretId, bookmarked]);

  return { count, bookmarked, loading, toggle, refresh };
}
