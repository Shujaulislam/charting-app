/**
 * Toast Notification State Management Module
 * Uses Zustand to manage global toast notifications
 * Provides a simple API for showing success, error, and info messages
 */

import { create } from 'zustand';

/**
 * Toast message type definition
 * Includes all necessary properties for rendering a toast notification
 */
interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  duration?: number;
}

/**
 * Toast state interface
 * Manages an array of active toast messages and provides actions
 */
interface ToastState {
  // Active toast messages
  messages: ToastMessage[];
  
  // Actions for managing toasts
  addToast: (message: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}

/**
 * Creates the toast store using Zustand
 * Provides actions to show and hide toast notifications
 */
export const useToastStore = create<ToastState>((set) => ({
  // Initial state
  messages: [],

  // Add a new toast message with a unique ID
  addToast: (message) => set((state) => ({
    messages: [...state.messages, { ...message, id: crypto.randomUUID() }]
  })),

  // Remove a toast message by ID
  removeToast: (id) => set((state) => ({
    messages: state.messages.filter((msg) => msg.id !== id)
  }))
}));

