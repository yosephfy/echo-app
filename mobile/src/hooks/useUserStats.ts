import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";

export interface UserStats {
  postsCount: number;
  bookmarksCount: number;
  currentStreak: number;
  reactionsGiven: number;
  reactionsReceived: number;
  capsGiven: number;
  capsReceived: number;
  repliesReceived: number;
  avgReactionsPerPost: number;
}

export function useUserStats() {
  const query = useQuery({
    queryKey: ["me", "stats"],
    queryFn: () => api.get<UserStats>("/users/me/stats"),
    staleTime: 60_000,
  });

  // Stash the "me" identity bits in the entity store if present
  const stats = query.data ?? null;

  return {
    stats,
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refresh: () => query.refetch(),
    query,
  };
}
