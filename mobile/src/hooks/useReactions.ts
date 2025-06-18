import { useState, useEffect } from "react";
import { api } from "../api/client";

export function useReactions(secretId: string) {
  const [count, setCount] = useState(0);

  async function fetchCount() {
    // call GET /secrets/feed will include counts, or create a new endpoint
  }

  async function toggle() {
    const res = await api.post<{ count: number }>(
      `/secrets/${secretId}/reactions`
    );
    setCount(res.count);
  }

  return { count, toggle };
}
