// mobile/src/hooks/useReactions.tsx
import { useState, useEffect, useCallback } from "react";
import { api } from "../api/client";
export enum ReactionType {
  Like = "like",
  Love = "love",
  Haha = "haha",
  Wow = "wow",
  Sad = "sad",
}
interface ReactionResponse {
  currentType: ReactionType | null;
  counts: Record<ReactionType, number>;
}

export default function useReactions(secretId: string) {
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
      .get<Record<ReactionType, number>>(`/secrets/${secretId}/reactions`)
      .then(setCounts)
      .catch(console.error);
  }, [secretId]);

  // 2) Load my reaction
  useEffect(() => {
    api
      .get<{ type: ReactionType | null }>(`/secrets/${secretId}/reactions/me`)
      .then((res) => setCurrentType(res.type))
      .catch(console.error);
  }, [secretId]);

  // 3) Toggle or switch reaction
  const react = useCallback(
    async (type: ReactionType) => {
      try {
        const res = await api.post<ReactionResponse>(
          `/secrets/${secretId}/reactions`,
          { type }
        );
        setCurrentType(res.currentType);
        setCounts(res.counts);
      } catch (err) {
        console.error("Failed to react:", err);
      }
    },
    [secretId]
  );

  return {
    currentType,
    counts,
    react,
  };
}
