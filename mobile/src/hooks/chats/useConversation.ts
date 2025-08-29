// mobile/src/hooks/chat/useConversations.ts
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";
import { useEntities } from "../../store/entities";
import useChatSocket, { getChatSocket } from "./useChatSocket";
import { useEffect, useMemo } from "react";
import { ChatConversation, qk } from "./types";

type Page = {
  items: ChatConversation[];
  total: number;
  page: number;
  limit: number;
};

const fetchConversations = async (page: number, limit: number) => {
  return api.get<Page>("/chats", { page, limit });
};

function sortByRecency(a?: ChatConversation, b?: ChatConversation) {
  const ad = a?.lastMessage?.createdAt
    ? new Date(a.lastMessage.createdAt).getTime()
    : 0;
  const bd = b?.lastMessage?.createdAt
    ? new Date(b.lastMessage.createdAt).getTime()
    : 0;
  // newest first
  return bd - ad;
}

export function useConversations(limit = 20) {
  useChatSocket();
  const qc = useQueryClient();
  const upsertUsers = useEntities((s) => s.upsertUsers);

  const query = useInfiniteQuery<Page>({
    queryKey: qk.conversations(limit),
    queryFn: async ({ pageParam = 1 }: any) => {
      const res = await fetchConversations(pageParam, limit);
      upsertUsers(res.items.map((c) => c.peer).filter(Boolean));
      return res;
    },
    getNextPageParam: (last, all) => {
      const loaded = all.flatMap((p) => p.items).length;
      return loaded < last.total ? (last.page ?? 1) + 1 : undefined;
    },
    staleTime: 15_000,
    initialPageParam: 1,
  });

  // Helper: upsert + resort + re-slice pages
  function upsertAndResort(old: any, incoming: ChatConversation) {
    if (!old?.pages?.length) return old;

    // 1) flatten
    const pages = old.pages as Page[];
    const flat = pages.flatMap((p) => p.items);

    // 2) upsert by id
    const idx = flat.findIndex((c) => c.id === incoming.id);
    if (idx >= 0) flat[idx] = { ...flat[idx], ...incoming };
    else flat.push(incoming);

    // 3) resort by lastMessage.createdAt (desc)
    flat.sort(sortByRecency);

    // 4) re-slice into pages of `limit`
    const total = flat.length;
    const newPages: Page[] = [];
    const countPages = Math.max(1, Math.ceil(total / limit));
    for (let p = 0; p < countPages; p++) {
      const start = p * limit;
      const end = start + limit;
      newPages.push({
        items: flat.slice(start, end),
        total,
        page: p + 1,
        limit,
      });
    }
    return { ...old, pages: newPages };
  }

  // Live: per-user "conversation:updated" (includes lastMessage, unreadCount, etc.)
  useEffect(() => {
    const s = getChatSocket();
    if (!s) return undefined;

    const onConv = (row: ChatConversation) => {
      // Optionally cache peer user
      if (row.peer) upsertUsers([row.peer]);

      qc.setQueryData(qk.conversations(limit), (old: any) =>
        upsertAndResort(old, row)
      );
    };

    s.on("conversation:updated", onConv);
    return () => {
      s.off("conversation:updated", onConv);
    };
  }, [qc, limit, upsertUsers]);

  const items = useMemo(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data]
  );

  return {
    items,
    loading: query.isLoading,
    hasMore: !!query.hasNextPage,
    loadMore: () => query.fetchNextPage(),
    refresh: () => query.refetch(),
  };
}
