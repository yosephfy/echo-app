// mobile/src/hooks/chat/useChatSocket.ts
import { useEffect } from "react";
import io, { Socket } from "socket.io-client";
import { useAuthStore } from "../../store/authStore";

let socket: Socket | null = null;

export function getChatSocket() {
  return socket;
}

export default function useChatSocket() {
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (!token) return;
    socket = io(
      `${__DEV__ ? "http://localhost:3000" : "https://your.api"}/ws`,
      {
        transports: ["websocket"],
        auth: { token },
      }
    );
    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, [token]);

  return socket;
}

export function joinConversationRoom(conversationId: string) {
  socket?.emit("conversation:join", { conversationId });
}
export function leaveConversationRoom(conversationId: string) {
  socket?.emit("conversation:leave", { conversationId });
}
export function markMessagesRead(
  conversationId: string,
  lastReadMessageId: string
) {
  socket?.emit("messages:markRead", { conversationId, lastReadMessageId });
}
export function sendMessage(
  conversationId: string,
  body: string,
  attachmentUrl?: string
) {
  socket?.emit("message:send", { conversationId, body, attachmentUrl });
}
