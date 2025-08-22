import { createContext } from 'preact';
import { useContext, useEffect, useRef, useState } from 'preact/hooks';
import { io, Socket } from 'socket.io-client';
import { useChatStore } from '../store/chatStore';
import type { ComponentChildren } from 'preact';

function extractAndDecodeContent(content: string): string {
  // Check if content contains an iframe with srcdoc
  const iframeRegex = /<iframe[^>]*srcdoc="([^"]*)"[^>]*>/gi;
  const match = iframeRegex.exec(content);
  
  if (match && match[1]) {
    // Extract the srcdoc content
    let extractedContent = match[1];
    
    // Decode HTML entities
    extractedContent = extractedContent
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, '/')
      .replace(/&#x60;/g, '`')
      .replace(/&#x3D;/g, '=');
    
    return extractedContent;
  }
  
  // If no iframe found, return original content
  return content;
}

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
  const [isConnected, setIsConnected] = useState(false);
  const { addMessage, chatid } = useChatStore();

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
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socket.on('message', (data: { content: string; role: 'user' | 'assistant' }) => {
      console.log('Received message:', data);
      addMessage({
        content: data.content,
        role: data.role,
        chatid,
      });
    });

    socket.on('ai_message', (data: string) => {
      console.log('Received AI response:', data);
      
      // Extract content from iframe srcdoc and decode HTML entities
      const processedContent = extractAndDecodeContent(data);
      
      addMessage({
        content: processedContent,
        role: 'assistant',
        chatid,
      });
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, [addMessage]);

  const contextValue: SocketContextValue = {
    socket: socketRef.current,
    isConnected,
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
