import { useEffect, useRef, useState, useCallback } from 'react';

export function useWebSocket({ onMessage }: { onMessage: (data: any) => void }) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectingRef = useRef(false);

  const onMessageRef = useRef(onMessage);
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const connect = useCallback(() => {
    if (isConnectingRef.current || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    isConnectingRef.current = true;
    // FIX 1: Use 'access_token' to match your api.ts and login logic
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

    if (!token) {
      isConnectingRef.current = false;
      return;
    }

    // FIX 2: Explicitly target backend port 8000, NOT the frontend port 3000
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//localhost:8000/ws?token=${token}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      isConnectingRef.current = false;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessageRef.current(data);
      } catch (err) {
        console.error('WebSocket message parse error:', err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      isConnectingRef.current = false;
      wsRef.current = null;

      // Exponential backoff for reconnection (starts at 3s, max 30s)
      const currentDelay = reconnectTimeoutRef.current ? 1.5 : 1;
      const delay = Math.min(30000, currentDelay * 3000);

      reconnectTimeoutRef.current = setTimeout(connect, delay);
    };

    ws.onerror = () => {
      console.warn('WebSocket connection error (will attempt reconnect)');
      ws.close(); // Force close to trigger the onclose handler's reconnection logic
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      wsRef.current = null;
      isConnectingRef.current = false;
    };
  }, [connect]);

  return { isConnected };
}
