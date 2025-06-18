import { useState, useEffect } from "react";
import { api } from "../api/client";

export function useReplies(secretId: string) {
  const [replies, setReplies] = useState<any[]>([]);

  async function fetch(page = 1) {
    const res: any = await api.get(`/secrets/${secretId}/replies`, { page });
    setReplies(res.data as any[]);
  }

  async function add(text: string) {
    const r = await api.post(`/secrets/${secretId}/replies`, { text });
    setReplies((prev) => [...prev, r]);
  }

  return { replies, fetch, add };
}
