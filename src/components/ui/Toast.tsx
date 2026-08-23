/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import { CheckCircle2, CircleAlert, X } from 'lucide-react'

type Toast = { id: string; message: string; tone: 'success' | 'error' }
type ToastContextValue = {
  notify: (message: string, tone?: Toast['tone']) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])
  const notify = useCallback(
    (message: string, tone: Toast['tone'] = 'success') => {
      const id = crypto.randomUUID()
      setToasts((current) => [...current.slice(-2), { id, message, tone }])
      window.setTimeout(() => dismiss(id), 4_000)
    },
    [dismiss],
  )
  const value = useMemo(() => ({ notify }), [notify])
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.tone}`}>
            {toast.tone === 'success' ? (
              <CheckCircle2 aria-hidden size={18} />
            ) : (
              <CircleAlert aria-hidden size={18} />
            )}
            <span>{toast.message}</span>
            <button onClick={() => dismiss(toast.id)} aria-label="閉じる">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}
