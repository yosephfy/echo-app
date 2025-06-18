import { useState, useEffect } from "react";
import { api } from "../api/client";

export function useBookmarks() {
  const [items, setItems] = useState<any[]>([]);

  async function fetch() {
    const res: any = await api.get("/bookmarks");
    setItems(res);
  }

  async function toggle(secretId: string) {
    await api.post(`/bookmarks/${secretId}`);
    fetch();
  }

  return { items, fetch, toggle };
}
