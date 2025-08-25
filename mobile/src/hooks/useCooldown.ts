// mobile/src/hooks/useCooldown.ts
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";

type CooldownInfo = {
  start: string; // ISO string from server
  duration: number; // seconds
  remaining: number; // seconds at fetch time
};

/**
 * useCooldown
 * - One network fetch via React Query
 * - Local 1s ticker computes remaining time without refetching
 * - Auto-resync when remaining hits 0 (or call refresh())
 */
export default function useCooldown(pollMs = 1000) {
  // Local ticking state
  const [remaining, setRemaining] = useState(0);
  const [duration, setDuration] = useState(0);

  // Snapshot of server result at t0, so we can tick without rerequests
  const baseRemainingRef = useRef(0);
  const baseTsRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch once; let React Query cache it. We’ll tick locally.
  const query = useQuery({
    queryKey: ["cooldown"],
    queryFn: () => api.get<CooldownInfo>("/secrets/cooldown"),
    staleTime: 10_000, // ok to reuse for short bursts
    refetchOnWindowFocus: false,
  });

  // When server data arrives, reset local ticker baseline
  useEffect(() => {
    if (!query.data) return;
    const { duration: dur, remaining: rem } = query.data;
    setDuration(dur);
    setRemaining(rem);
    baseRemainingRef.current = rem;
    baseTsRef.current = Date.now();
  }, [query.data]);

  // 1s ticker: compute remaining = baseRemaining - elapsed
  useEffect(() => {
    // Start interval
    timerRef.current = setInterval(() => {
      if (baseTsRef.current == null) return;
      const elapsedSec = Math.floor((Date.now() - baseTsRef.current) / 1000);
      const next = Math.max(0, baseRemainingRef.current - elapsedSec);
      setRemaining((prev) => (prev !== next ? next : prev));
    }, pollMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [pollMs]);

  // Auto-resync once when we hit 0 to ensure we’re in sync with the server
  useEffect(() => {
    if (remaining === 0 && !query.isFetching) {
      // Tiny guard: if duration is 0, just skip
      if (duration > 0) {
        // Re-fetch latest state; server may start a new cooldown or confirm free state
        query.refetch();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, duration]);

  // Manual refresh (e.g., after a successful post or when you come back to the screen)
  const refresh = useCallback(() => {
    return query.refetch();
  }, [query]);

  const isCoolingDown = remaining > 0;
  const canPost = remaining <= 0;
  const progress = useMemo(
    () =>
      duration > 0
        ? Math.min(1, Math.max(0, (duration - remaining) / duration))
        : 1,
    [duration, remaining]
  );

  return {
    // Data
    remaining, // seconds
    duration, // seconds
    progress, // 0..1
    // Status
    isCoolingDown,
    canPost,
    loading: query.isLoading,
    refreshing: query.isRefetching,
    // Actions
    refresh,
    // raw query if needed
    query,
  };
}
