// src/store/toast.ts
import { create } from 'zustand';

type ToastState = {
  message: string | null;
  type: 'success' | 'error';
  showToast: (message: string, type: 'success' | 'error') => void;
  hideToast: () => void;
};

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  type: 'success',
  showToast: (message, type) => set({ message, type }),
  hideToast: () => set({ message: null }),
}));

