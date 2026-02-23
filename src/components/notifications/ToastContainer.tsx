'use client';

import { useState, useCallback } from 'react';
import Toast from './Toast';
import type { EventSeverity } from '@/types';

interface ToastItem {
  id: string;
  title: string;
  message: string;
  severity: EventSeverity;
}

const MAX_VISIBLE = 5;

// Singleton pattern: expose addToast globally so the polling hook can trigger toasts
let _addToastFn: ((toast: Omit<ToastItem, 'id'>) => void) | null = null;

export function triggerToast(toast: Omit<ToastItem, 'id'>): void {
  _addToastFn?.(toast);
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { ...toast, id }].slice(-MAX_VISIBLE));
  }, []);

  // Register the singleton
  _addToastFn = addToast;

  const handleDismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column-reverse',
        gap: '8px',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => (
        <div key={toast.id} style={{ pointerEvents: 'auto' }}>
          <Toast
            id={toast.id}
            title={toast.title}
            message={toast.message}
            severity={toast.severity}
            onDismiss={handleDismiss}
          />
        </div>
      ))}
    </div>
  );
}
