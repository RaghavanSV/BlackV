import { useEffect, useRef } from "react";

export function useWebSocket(onMessage: (msg: any) => void) {
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    function connect() {
      const ws = new WebSocket("ws://localhost:8080/ws");
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[WS] Connected");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
        } catch (e) {
          console.error("[WS] Invalid message", event.data);
        }
      };

      ws.onclose = () => {
        console.log("[WS] Disconnected. Reconnecting in 2s...");
        setTimeout(connect, 2000);
      };

      ws.onerror = () => {
        console.log("[WS] Error. Closing socket...");
        ws.close();
      };
    }

    connect();

    return () => {
      wsRef.current?.close();
    };
  }, [onMessage]);

  return wsRef;
}
