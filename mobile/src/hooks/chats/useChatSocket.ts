import { io, Socket } from "socket.io-client";
import { useEffect, useRef } from "react";
import { useAuthStore } from "../../store/authStore";
import { BASE_URL } from "../../api/client";

let sock: Socket | null = null;
export function getChatSocket() {
  return sock;
}

export default function useChatSocket() {
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (!token) return;
    // connect with token in auth
    sock = io(`${BASE_URL}/ws`, { auth: { token } });

    return () => {
      sock?.disconnect();
      sock = null;
    };
  }, [token]);
}

export function joinConversationRoom(conversationId: string) {
  const s = getChatSocket();
  if (!s) return;
  s.emit("conversation:join", { conversationId });
  // optional: listen once for ack to confirm room join
  const onJoined = (payload: any) => {
    if (payload?.conversationId === conversationId) {
      // console.log('[socket] joined', conversationId);
      s.off("conversation:joined", onJoined);
    }
  };
  s.on("conversation:joined", onJoined);
}
export function leaveConversationRoom(conversationId: string) {
  getChatSocket()?.emit("conversation:leave", { conversationId });
}
