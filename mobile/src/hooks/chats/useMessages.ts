// mobile/src/hooks/chat/useMessages.ts
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { api } from "../../api/client";
import { useAuthStore } from "../../store/authStore";
import { useEntities } from "../../store/entities";
import useChatSocket, {
  getChatSocket,
  joinConversationRoom,
  leaveConversationRoom,
} from "./useChatSocket";
import { ChatMessage, qk } from "./types";

type Page = {
  items: ChatMessage[];
  total: number;
  page: number;
  limit: number;
};

export function useMessages(conversationId: string, pageSize = 30) {
  useChatSocket();
  const qc = useQueryClient();
  const my = useAuthStore((s) => s.user);
  const upsertUsers = useEntities((s) => s.upsertUsers);

  const query = useInfiniteQuery<Page>({
    queryKey: qk.messages(conversationId, pageSize),
    enabled: !!conversationId,
    queryFn: async ({ pageParam = 1 }: any) => {
      const res = await api.get<Page>(`/chats/${conversationId}/messages`, {
        page: pageParam,
        limit: pageSize,
      });
      upsertUsers(res.items.map((m) => m.author));
      return res; // OLDEST -> NEWEST
    },
    getNextPageParam: (last, all) => {
      const loaded = all.flatMap((p) => p.items).length;
      return loaded < last.total ? (last.page ?? 1) + 1 : undefined;
    },
    staleTime: 10_000,
    initialPageParam: 1,
  });

  // Join/leave room
  useEffect(() => {
    if (!conversationId) return;
    joinConversationRoom(conversationId);
    return () => {
      leaveConversationRoom(conversationId);
    };
  }, [conversationId]);

  // Live: append to end (ASC)
  useEffect(() => {
    const s = getChatSocket();
    if (!s) return;
    const handler = (payload: {
      conversationId: string;
      message: ChatMessage;
    }) => {
      if (payload.conversationId !== conversationId) return;
      qc.setQueryData(qk.messages(conversationId, pageSize), (old: any) => {
        if (!old?.pages) return old;
        const pages = [...old.pages];
        const lastPage = pages[pages.length - 1];
        const exists = lastPage.items.some(
          (m: any) => m.id === payload.message.id
        );
        if (exists) return old;
        lastPage.items = [...lastPage.items, payload.message];
        return { ...old, pages };
      });
    };
    s.on("message:new", handler);
    return () => {
      s.off("conversation:updated", handler);
    };
  }, [qc, conversationId, pageSize]);

  // Optimistic send (no temp UUID sent to server)
  const send = useMutation({
    mutationFn: async (vars: { body: string; attachmentUrl?: string }) => {
      const clientToken = `${my?.id}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
      const res = await api.post<ChatMessage>(
        `/chats/${conversationId}/messages`,
        {
          ...vars,
          clientToken,
        }
      );
      return res;
    },
    onMutate: async (vars) => {
      await qc.cancelQueries({
        queryKey: qk.messages(conversationId, pageSize),
      });
      const snapshot = qc.getQueryData<any>(
        qk.messages(conversationId, pageSize)
      );

      const pending: ChatMessage & { __pending?: true } = {
        id: `client:${Date.now()}`,
        conversationId,
        author: {
          id: my?.id!,
          handle: my?.handle ?? "me",
          avatarUrl: my?.avatarUrl,
        },
        body: vars.body,
        attachmentUrl: vars.attachmentUrl,
        createdAt: new Date().toISOString(),
        __pending: true,
      };

      if (snapshot?.pages?.length) {
        const pages = [...snapshot.pages];
        pages[pages.length - 1] = {
          ...pages[pages.length - 1],
          items: [...pages[pages.length - 1].items, pending], // append at end
        };
        qc.setQueryData(qk.messages(conversationId, pageSize), {
          ...snapshot,
          pages,
        });
      }
      return { snapshot, pendingId: pending.id };
    },
    onSuccess: (message, _vars, ctx) => {
      // replace pending with real
      qc.setQueryData(qk.messages(conversationId, pageSize), (old: any) => {
        if (!old?.pages) return old;
        const pages = [...old.pages];
        const last = pages[pages.length - 1];
        last.items = last.items.map((m: any) =>
          m.id === ctx?.pendingId ? message : m
        );
        return { ...old, pages };
      });
    },
    onError: (_e, _vars, ctx) => {
      // remove pending
      qc.setQueryData(qk.messages(conversationId, pageSize), (old: any) => {
        if (!old?.pages) return old;
        const pages = [...old.pages];
        const last = pages[pages.length - 1];
        last.items = last.items.filter((m: any) => m.id !== ctx?.pendingId);
        return { ...old, pages };
      });
    },
  });

  // Helpers
  const items = useMemo(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data]
  );
  const newestId = items.length ? items[items.length - 1].id : undefined;

  const markRead = async () => {
    if (!newestId) return;
    try {
      await api.patch(`/chats/${conversationId}/read`, {
        lastReadMessageId: newestId,
      });
    } catch {}
  };

  return {
    items, // ASC, render top→down
    loading: query.isLoading,
    hasMore: !!query.hasNextPage,
    loadMore: () => query.fetchNextPage(), // append newer pages
    refresh: () => query.refetch(),
    send: (body: string, attachmentUrl?: string) =>
      send.mutateAsync({ body, attachmentUrl }),
    sending: send.isPending,
    markRead,
  };
}
