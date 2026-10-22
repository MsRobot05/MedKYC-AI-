import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

const ToastContext = createContext({ success: () => {}, error: () => {} });
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id) => setItems((prev) => prev.filter((t) => t.id !== id)), []);
  const push = useCallback(
    (kind, text) => {
      const id = nextId.current++;
      setItems((prev) => [...prev.slice(-3), { id, kind, text }]);
      setTimeout(() => dismiss(id), kind === 'error' ? 6000 : 3500);
    },
    [dismiss]
  );

  const value = useMemo(
    () => ({ success: (t) => push('success', t), error: (t) => push('error', t) }),
    [push]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        style={{ position: 'fixed', right: 20, bottom: 20, zIndex: 100, display: 'flex', flexDirection: 'column', gap: 10 }}
      >
        {items.map((t) => {
          const ok = t.kind === 'success';
          const Icon = ok ? CheckCircle2 : AlertCircle;
          return (
            <div
              key={t.id}
              role="status"
              className="flex items-start gap-3 rounded-xl px-4 py-3 text-sm"
              style={{
                width: 320,
                backgroundColor: '#FFFFFF',
                border: `1px solid ${ok ? '#CDEBD6' : '#F7D4D1'}`,
                boxShadow: '0 8px 24px rgba(16,24,40,0.12)',
                color: '#111827',
              }}
            >
              <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: ok ? '#1E7A3D' : '#B3261E' }} />
              <span className="flex-1">{t.text}</span>
              <button onClick={() => dismiss(t.id)} aria-label="Dismiss">
                <X className="w-3.5 h-3.5" style={{ color: '#8A8F98' }} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}