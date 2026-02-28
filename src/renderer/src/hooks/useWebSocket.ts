import { useState, useEffect, useCallback } from 'react';

interface WebSocketMessage {
    type: string;
    payload: any;
}

export function useWebSocket(url: string) {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

    useEffect(() => {
        const ws = new WebSocket(url);

        ws.onopen = () => {
            console.log(`Connected to WS: ${url}`);
            setIsConnected(true);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                setLastMessage(data);
            } catch (err) {
                console.error("Failed to parse WS message", err);
            }
        };

        ws.onclose = () => {
            console.log(`Disconnected from WS: ${url}`);
            setIsConnected(false);
            // Optionally implement reconnect logic here
        };

        setSocket(ws);

        return () => {
            ws.close();
        };
    }, [url]);

    const sendMessage = useCallback((type: string, payload: any) => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type, payload }));
        } else {
            console.warn("WebSocket not connected, message not sent");
        }
    }, [socket]);

    return { isConnected, lastMessage, sendMessage };
}
