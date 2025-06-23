// mobile/src/hooks/useCap.ts
import { useState, useEffect, useCallback } from "react";
import { api } from "../api/client";

interface CapResponse {
  hasCapped: boolean;
  count: number;
}

export default function useCap(secretId: string) {
  const [hasCapped, setHasCapped] = useState(false);
  const [count, setCount] = useState(0);

  // load count
  useEffect(() => {
    api
      .get<{ count: number }>(`/secrets/${secretId}/cap`)
      .then((res) => setCount(res.count))
      .catch(console.error);
  }, [secretId]);

  // load my cap
  useEffect(() => {
    api
      .get<{ hasCapped: boolean }>(`/secrets/${secretId}/cap/me`)
      .then((res) => setHasCapped(res.hasCapped))
      .catch(console.error);
  }, [secretId]);

  const toggle = useCallback(async () => {
    try {
      const res = await api.post<CapResponse>(`/secrets/${secretId}/cap`);
      setHasCapped(res.hasCapped);
      setCount(res.count);
    } catch (err) {
      console.error("Failed to toggle cap:", err);
    }
  }, [secretId]);

  return { hasCapped, count, toggle };
}
