// mobile/src/hooks/useCooldown.ts
import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../api/client";

interface CooldownInfo {
  start: string;
  duration: number;
  remaining: number;
}

export default function useCooldown(pollInterval = 1000) {
  const [remaining, setRemaining] = useState(0);
  const [duration, setDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const loadInfo = useCallback(async () => {
    try {
      const info = await api.get<CooldownInfo>("/secrets/cooldown");
      setDuration(info.duration);
      setRemaining(info.remaining);
    } catch (err) {
      console.error("Failed to load cooldown info", err);
    }
  }, []);

  // tick every second
  useEffect(() => {
    // load initial
    loadInfo();

    // start ticker
    timerRef.current = setInterval(() => {
      setRemaining((r) => (r > 1 ? r - 1 : 0));
    }, pollInterval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loadInfo, pollInterval]);

  // manual refresh
  const refresh = useCallback(() => {
    loadInfo();
  }, [loadInfo]);

  return { remaining, duration, refresh };
}
