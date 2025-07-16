// mobile/src/hooks/useReplyReactions.ts
import { useState, useEffect, useCallback } from "react";
import { api } from "../api/client";
import { ReactionType } from "./useReactions";

interface ReactionResponse {
  currentType: ReactionType | null;
  counts: Record<ReactionType, number>;
}

/**
 * Hook to manage reactions on a single reply, modeled after useReactions.
 * @param replyId the ID of the reply
 */
export default function useReplyReactions(replyId: string) {
  const [currentType, setCurrentType] = useState<ReactionType | null>(null);
  const [counts, setCounts] = useState<Record<ReactionType, number>>({
    [ReactionType.Like]: 0,
    [ReactionType.Love]: 0,
    [ReactionType.Haha]: 0,
    [ReactionType.Wow]: 0,
    [ReactionType.Sad]: 0,
  });

  // 1) Load counts
  useEffect(() => {
    api
      .get<Record<ReactionType, number>>(`/replies/${replyId}/reactions`)
      .then(setCounts)
      .catch(console.error);
  }, [replyId]);

  // 2) Load current user's reaction
  useEffect(() => {
    api
      .get<{ currentType: ReactionType | null }>(
        `/replies/${replyId}/reactions/me`
      )
      .then((res) => setCurrentType(res.currentType))
      .catch(console.error);
  }, [replyId]);

  // 3) Toggle or switch reaction
  const toggle = useCallback(
    async (type: ReactionType) => {
      try {
        const res = await api.post<ReactionResponse>(
          `/replies/${replyId}/reactions`,
          { type }
        );
        setCurrentType(res.currentType);
        setCounts(res.counts);
      } catch (err) {
        console.error("Failed to react to reply:", err);
      }
    },
    [replyId]
  );

  return { currentType, counts, toggle };
}
