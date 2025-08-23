export type AIMode = "test-chat" | "spec1" | "spec2" | "spec3";

export interface ChatMessage {
  chatid: string;
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}
