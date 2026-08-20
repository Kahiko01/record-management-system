import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";

export interface WebSocketMessage {
  type: string;
  data: any;
}

interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { user } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const isConnectingRef = useRef(false);
  const [isConnected, setIsConnected] = useState(false);

  // 🔑 KEY FIX: Use a ref for the callback so we never reconnect when it changes
  const onMessageRef = useRef(options.onMessage);
  onMessageRef.current = options.onMessage;

  const connect = useCallback(() => {
    // 🔒 PREVENT RECONNECTION LOOP
    if (!user || isConnectingRef.current || wsRef.current) {
      console.log("⏳ Skipping connection - no user, already connecting, or already connected");
      return;
    }

    // Prevent duplicate connections
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const token = localStorage.getItem("access_token");
    if (!token) {
      console.warn("No access token found for WebSocket");
      return;
    }

    isConnectingRef.current = true;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.hostname}:8000/ws?token=${token}`;

    try {
      console.log("🔌 Connecting to WebSocket...");
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("✅ WebSocket connected");
        setIsConnected(true);
        isConnectingRef.current = false;
        reconnectAttempts.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log("📨 WebSocket message:", message.type);
          // Call the latest callback via ref (no re-render dependency)
          onMessageRef.current?.(message);
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      ws.onclose = (event) => {
        console.log(`❌ WebSocket disconnected (code: ${event.code})`);
        setIsConnected(false);
        isConnectingRef.current = false;
        wsRef.current = null;
        
        // 🚫 DISABLE AUTO-RECONNECT FOR NOW
        // if (options.autoReconnect !== false && reconnectAttempts.current < 5) {
        //   const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        //   reconnectTimerRef.current = setTimeout(() => {
        //     reconnectAttempts.current++;
        //     connect();
        //   }, delay);
        // }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        isConnectingRef.current = false;
      };

      wsRef.current = ws;
    } catch (error) {
      console.error("Failed to create WebSocket:", error);
      isConnectingRef.current = false;
    }
  }, [user, options.autoReconnect]);

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    isConnectingRef.current = false;
  }, []);

  // 🔑 KEY FIX: Only run this effect ONCE when user changes, NOT on every render
  useEffect(() => {
    if (user) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Only re-run when user ID changes

  return { isConnected };
}
