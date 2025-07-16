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
