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

  // per-conversation seen id set to avoid duplicates from racey sockets
  const seenIdsRef = useRef<Set<string>>(new Set());

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

  // Live: single-writer model (socket owns the real message)
  useEffect(() => {
    const s = getChatSocket();
    if (!s) return;

    const onNew = (payload: {
      conversationId: string;
      message: ChatMessage;
    }) => {
      if (payload.conversationId !== conversationId) return;
      const msg = payload.message;
      if (msg.id && seenIdsRef.current.has(msg.id)) return; // already applied
      if (msg.id) seenIdsRef.current.add(msg.id);

      qc.setQueryData(qk.messages(conversationId, pageSize), (old: any) => {
        if (!old?.pages) return old;

        // clone shallow
        const pages = old.pages.map((p: any) => ({
          ...p,
          items: [...p.items],
        }));
        const tail = pages[pages.length - 1];

        // If it's my own message, replace/remove one pending first
        const isMine = msg.author?.id && msg.author.id === my?.id;
        if (isMine) {
          const pendingIdx = [...tail.items]
            .reverse()
            .findIndex((m: any) => m.__pending); // last pending
          if (pendingIdx >= 0) {
            const idx = tail.items.length - 1 - pendingIdx;
            tail.items.splice(idx, 1); // remove that pending
          }
        }

        // De-dupe by id across all pages just in case
        const exists = pages.some((p: any) =>
          p.items.some((m: any) => m.id && msg.id && m.id === msg.id)
        );
        if (!exists) {
          tail.items.push(msg); // append to end (ASC)
        }
        return { ...old, pages };
      });
    };

    s.on("message:new", onNew);
    return () => {
      s.off("message:new", onNew);
    };
  }, [qc, conversationId, pageSize, my?.id]);

  // Optimistic send: add pending; server/WS will replace it
  const send = useMutation({
    mutationFn: async (vars: { body: string; attachmentUrl?: string }) => {
      const clientToken = `${my?.id}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
      await api.post(`/chats/${conversationId}/messages`, {
        ...vars,
        clientToken,
      });
      // NO cache writes here: socket will deliver the real message
      return { clientToken };
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
    onSuccess: () => {
      // NO-OP: socket will append the real message and the handler will remove one pending
    },
    onError: (_e, _vars, ctx) => {
      // remove pending if request failed
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
    try {
      await api.patch(`/chats/${conversationId}/read`, {
        lastReadMessageId: newestNonPendingId,
      });
    } catch {}
  };

  return {
    items, // ASC
    loading: query.isLoading,
    hasMore: !!query.hasNextPage,
    loadMore: () => query.fetchNextPage(),
    refresh: () => query.refetch(),
    send: (body: string, attachmentUrl?: string) =>
      send.mutateAsync({ body, attachmentUrl }),
    sending: send.isPending,
    markRead,
  };
}
