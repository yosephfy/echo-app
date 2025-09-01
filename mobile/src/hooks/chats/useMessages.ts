// mobile/src/hooks/chat/useMessages.ts
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";
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

  const seenIdsRef = useRef<Set<string>>(new Set());
  // Reset seen set when switching conversation
  useEffect(() => {
    seenIdsRef.current = new Set();
  }, [conversationId]);

  const query = useInfiniteQuery<Page>({
    queryKey: qk.messages(conversationId, pageSize),
    enabled: !!conversationId,
    queryFn: async ({ pageParam = 1 }: any) => {
      const res = await api.get<Page>(`/chats/${conversationId}/messages`, {
        page: pageParam,
        limit: pageSize,
      });
      upsertUsers(res.items.map((m) => m.author));
      // seed seen set for fetched pages
      for (const m of res.items) if (m.id) seenIdsRef.current.add(m.id);
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
    return () => leaveConversationRoom(conversationId);
  }, [conversationId]);

  // Robust listener: attach and reattach on connect
  useEffect(() => {
    const s = getChatSocket();
    if (!s) return;

    const onNew = (payload: {
      conversationId: string;
      message: ChatMessage;
    }) => {
      if (payload.conversationId !== conversationId) return;
      const msg = payload.message;
      if (msg.id && seenIdsRef.current.has(msg.id)) return;
      if (msg.id) seenIdsRef.current.add(msg.id);

      qc.setQueryData(qk.messages(conversationId, pageSize), (old: any) => {
        if (!old?.pages) return old;
        const pages = old.pages.map((p: any) => ({
          ...p,
          items: [...p.items],
        }));
        const tail = pages[pages.length - 1];

        const isMine = msg.author?.id === my?.id;
        if (isMine) {
          const pendingIdxRev = [...tail.items]
            .reverse()
            .findIndex((m: any) => m.__pending);
          if (pendingIdxRev >= 0) {
            const idx = tail.items.length - 1 - pendingIdxRev;
            tail.items.splice(idx, 1);
          }
        }

        const exists = pages.some((p: any) =>
          p.items.some((m: any) => m.id && msg.id && m.id === msg.id)
        );
        if (!exists) tail.items.push(msg);
        return { ...old, pages };
      });
    };

    const attach = () => s.on("message:new", onNew);
    attach();
    s.on("connect", attach); // re-attach after reconnect
    return () => {
      s.off("message:new", onNew);
      s.off("connect", attach);
    };
  }, [qc, conversationId, pageSize, my?.id]);

  // Optimistic send: add pending; server/WS will replace it
  const send = useMutation({
    mutationFn: async (vars: { body: string; attachmentUrl?: string; mimeType?: string }) => {
      const clientToken = `${my?.id}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
      const res = await api.post<ChatMessage>(
        `/chats/${conversationId}/messages`,
        {
          ...vars,
          clientToken,
        }
      );
      return { res, clientToken };
    },
    onMutate: async (vars) => {
      await qc.cancelQueries({
        queryKey: qk.messages(conversationId, pageSize),
      });
      const snapshot = qc.getQueryData<any>(
        qk.messages(conversationId, pageSize)
      );
      const clientToken = `${my?.id}:${Date.now()}:${Math.random().toString(36).slice(2, 6)}`;

      const pending: ChatMessage & {
        __pending?: true;
        __clientToken?: string;
      } = {
        id: undefined as any,
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
        __clientToken: clientToken,
      };

      if (snapshot?.pages?.length) {
        const pages = [...snapshot.pages];
        const tail = pages[pages.length - 1];
        pages[pages.length - 1] = { ...tail, items: [...tail.items, pending] };
        qc.setQueryData(qk.messages(conversationId, pageSize), {
          ...snapshot,
          pages,
        });
      }
      return { snapshot, clientToken };
    },
    onSuccess: ({ res, clientToken }) => {
      // Fallback replacement in case socket hasn’t delivered yet
      qc.setQueryData(qk.messages(conversationId, pageSize), (old: any) => {
        if (!old?.pages) return old;
        const pages = old.pages.map((p: any) => ({
          ...p,
          items: [...p.items],
        }));
        for (let pi = pages.length - 1; pi >= 0; pi--) {
          const items = pages[pi].items;
          const idx = items.findIndex(
            (m: any) => m.__clientToken === clientToken || m.__pending
          );
          if (idx >= 0) {
            items[idx] = res;
            if (res.id) seenIdsRef.current.add(res.id); // prevent later duplicate via socket
            return { ...old, pages };
          }
        }
        // If pending not found (already removed), append if not exists
        const tail = pages[pages.length - 1];
        if (!tail.items.some((m: any) => m.id === res.id)) {
          tail.items.push(res);
          if (res.id) seenIdsRef.current.add(res.id);
        }
        return { ...old, pages };
      });
    },
    onError: (_e, _vars, ctx) => {
      qc.setQueryData(qk.messages(conversationId, pageSize), (old: any) => {
        if (!old?.pages) return old;
        const pages = old.pages.map((p: any) => ({
          ...p,
          items: [...p.items],
        }));
        for (let pi = pages.length - 1; pi >= 0; pi--) {
          const items = pages[pi].items;
          const idx = items.findIndex(
            (m: any) => m.__clientToken === ctx?.clientToken || m.__pending
          );
          if (idx >= 0) {
            items.splice(idx, 1);
            break;
          }
        }
        return { ...old, pages };
      });
    },
  });
  // Helpers
  const items = useMemo(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data]
  );

  const newestNonPendingId = useMemo(() => {
    for (let i = items.length - 1; i >= 0; i--) {
      const m: any = items[i];
      if (!m?.__pending && m?.id) return m.id;
    }
    return undefined;
  }, [items]);

  const markRead = async () => {
    if (!newestNonPendingId) return;
    // Optimistic: zero out the badge in the conversations list immediately
    qc.setQueryData(qk.conversations(20 /* or your default */), (old: any) => {
      if (!old?.pages) return old;
      const pages = old.pages.map((p: any) => ({ ...p, items: [...p.items] }));
      for (const pg of pages) {
        const idx = pg.items.findIndex((c: any) => c.id === conversationId);
        if (idx >= 0) {
          pg.items[idx] = { ...pg.items[idx], unreadCount: 0 };
          break;
        }
      }
      return { ...old, pages };
    });

    try {
      await api.patch(`/chats/${conversationId}/read`, {
        lastReadMessageId: newestNonPendingId,
      });
      // The server will also emit conversation:updated { unreadCount: 0 }, which keeps things consistent.
    } catch {
      // (optional) Rollback if you want:
      // qc.invalidateQueries({ queryKey: chatKeys.conversations(20) });
    }
  };

  return {
    items, // ASC
    loading: query.isLoading,
    hasMore: !!query.hasNextPage,
    loadMore: () => query.fetchNextPage(),
    refresh: () => query.refetch(),
    send: (body: string, attachmentUrl?: string, mimeType?: string) =>
      send.mutateAsync({ body, attachmentUrl, mimeType }),
    sending: send.isPending,
    markRead,
  };
}
