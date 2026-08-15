import React, { createContext, useCallback, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { palette, radii, shadows } from '../theme';

interface ToastMessage { id: number; type: 'success' | 'error' | 'info' | 'warning'; message: string; }

interface ToastApi { toast: (msg: { type: ToastMessage['type']; message: string }) => void; }
const ToastContext = createContext<ToastApi>({ toast: () => {} });

export function useToast() { return useContext(ToastContext).toast; }

let nextId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const toast = useCallback((msg: { type: ToastMessage['type']; message: string }) => {
    const id = nextId++;
    setMessages((p) => [...p, { id, ...msg }]);
    setTimeout(() => setMessages((p) => p.filter((m) => m.id !== id)), 3600);
  }, []);

  const colorFor = (t: ToastMessage['type']) =>
    t === 'success' ? palette.success : t === 'error' ? palette.error : t === 'warning' ? palette.info : palette.gold;

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div style={{ position: 'fixed', bottom: 20, right: 20, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 9999, pointerEvents: 'none' }}>
        <AnimatePresence>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              layout
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.18 }}
              style={{
                background: palette.gold,
                color: '#FFFFFF',
                borderLeft: `4px solid ${colorFor(m.type)}`,
                padding: '10px 16px',
                borderRadius: radii.md,
                boxShadow: shadows.card,
                fontSize: 14,
                maxWidth: 380,
              }}
            >
              {m.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <style>{`@keyframes toastIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </ToastContext.Provider>
  );
}
