export interface ChatMessage {
  chatid: string;
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}
