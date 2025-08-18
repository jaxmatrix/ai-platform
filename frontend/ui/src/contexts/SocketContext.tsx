import { createContext } from 'preact';
import { useContext, useEffect, useRef } from 'preact/hooks';
import { io, Socket } from 'socket.io-client';
import { useChatStore } from '../store/chatStore';
import type { ComponentChildren } from 'preact';

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
});

interface SocketProviderProps {
  children: ComponentChildren;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const socketRef = useRef<Socket | null>(null);
  const { addMessage } = useChatStore();

  useEffect(() => {
    // Initialize socket connection
    const socket = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socketRef.current = socket;

    // Socket event listeners
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socket.on('message', (data: { content: string; role: 'user' | 'assistant' }) => {
      console.log('Received message:', data);
      addMessage({
        content: data.content,
        role: data.role,
      });
    });

    socket.on('ai_response', (data: { content: string }) => {
      console.log('Received AI response:', data);
      addMessage({
        content: data.content,
        role: 'assistant',
      });
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, [addMessage]);

  const contextValue: SocketContextValue = {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected || false,
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}