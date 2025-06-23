import { useEffect, useRef } from "react";
import io, { Socket } from "socket.io-client";

export default function useSocket<T>(
  event: string,
  handler: (data: T) => void,
  url: string = "http://localhost:3000"
) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // 1. Connect
    const socket = io(url);
    socketRef.current = socket;

    // 2. Listen for event
    socket.on(event, handler);

    // 3. Cleanup on unmount
    return () => {
      socket.off(event, handler);
      socket.disconnect();
    };
  }, [event, handler, url]);

  // No return value needed
}
