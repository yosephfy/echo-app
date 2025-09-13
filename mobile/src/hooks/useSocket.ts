import { useEffect, useRef } from "react";
import io, { Socket } from "socket.io-client";

export default function useSocket<T>(
  event: string,
  handler: (data: T) => void,
  url: string = "http://localhost:3000"
) {
  const socketRef = useRef<Socket | null>(null);
  const handlerRef = useRef(handler);

  // Keep latest handler without re-subscribing socket event
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    // 1. Connect (one socket per event/url pair)
    const socket = io(url, { autoConnect: true });
    socketRef.current = socket;

    // 2. Listen for event forwarding to latest handler
    const listener = (data: T) => handlerRef.current?.(data);
    socket.on(event, listener);

    // 3. Cleanup on unmount
    return () => {
      socket.off(event, listener);
      socket.disconnect();
    };
  }, [event, url]);

  // No return value needed
}
