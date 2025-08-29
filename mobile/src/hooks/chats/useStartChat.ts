import { useMutation } from "@tanstack/react-query";
import { api } from "../../api/client";

export function useStartChat() {
  return useMutation({
    mutationFn: async (peerUserId: string) => {
      return api.post<{ conversationId: string }>("/chats/start", {
        peerUserId,
      });
    },
  });
}
