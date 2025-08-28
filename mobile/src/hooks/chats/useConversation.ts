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
  const res = await api.get<Page>("/chats", { page, limit });
  return res;
};
export function useConversations(limit = 20) {
  useChatSocket();
  const qc = useQueryClient();
  const upsertUsers = useEntities((s) => s.upsertUsers);

  const query = useInfiniteQuery<Page>({
    queryKey: qk.conversations(limit),
    queryFn: async ({ pageParam = 1 }: any) => {
      const res = await fetchConversations(pageParam, limit);
      upsertUsers(res.items.map((c) => c.peer));
      return res;
    },
    getNextPageParam: (last, all) => {
      const loaded = all.flatMap((p) => p.items).length;
      return loaded < last.total ? (last.page ?? 1) + 1 : undefined;
    },
    staleTime: 15_000,
    initialPageParam: 1,
  });

  // Live: per-user "conversation:updated" bumps unread & lastMessage
  useEffect(() => {
    const s = getChatSocket();
    if (!s) return;
    const handler = (payload: Partial<ChatConversation> & { id: string }) => {
      qc.setQueryData(qk.conversations(limit), (old: any) => {
        if (!old?.pages) return old;
        const first = old.pages[0];
        const items = [
          // move updated to top
          {
            ...(first.items.find((c: any) => c.id === payload.id) ?? {
              id: payload.id,
            }),
            ...payload,
          },
          ...first.items.filter((c: any) => c.id !== payload.id),
        ];
        return { ...old, pages: [{ ...first, items }, ...old.pages.slice(1)] };
      });
    };
    s.on("conversation:updated", handler);
    return () => {
      s.off("conversation:updated", handler);
    };
  }, [qc, limit]);

  return {
    items: useMemo(
      () => query.data?.pages.flatMap((p) => p.items) ?? [],
      [query.data]
    ),
    loading: query.isLoading,
    hasMore: !!query.hasNextPage,
    loadMore: () => query.fetchNextPage(),
    refresh: () => query.refetch(),
  };
}
