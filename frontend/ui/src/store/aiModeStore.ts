import { create } from 'zustand';
import type { AIMode } from '../types/chat';

interface AIModeStore {
  mode: AIMode;
  setMode: (mode: AIMode) => void;
}

export const useAIModeStore = create<AIModeStore>((set) => ({
  mode: 'test-chat',
  setMode: (mode) => set({ mode }),
}));
