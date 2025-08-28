// mobile/src/hooks/chat/types.ts
export type ChatConversation = {
  id: string;
  peer: { id: string; handle: string; avatarUrl?: string | null };
  unreadCount: number;
  lastMessage?: ChatMessage | null;
  updatedAt?: string; // optional
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  author: { id: string; handle: string; avatarUrl?: string | null };
  body: string;
  attachmentUrl?: string | null;
  createdAt: string;
};

export const qk = {
  conversations: (limit: number) => ["conversations", limit] as const,
  messages: (conversationId: string, limit: number) =>
    ["messages", conversationId, limit] as const,
};
