import { createContext, useCallback, useContext, useMemo, useState } from 'react'

export type ToastTone = 'success' | 'error' | 'info'

type Toast = {
  id: number
  title: string
  description?: string
  tone: ToastTone
}

type ToastContextValue = {
  pushToast: (title: string, description?: string, tone?: ToastTone) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const pushToast = useCallback((title: string, description?: string, tone: ToastTone = 'info') => {
    const id = Date.now() + Math.random()
    setToasts((current) => [...current, { id, title, description, tone }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id))
    }, 3500)
  }, [])

  const value = useMemo(() => ({ pushToast }), [pushToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed right-4 top-4 z-50 flex max-w-sm flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={[
              'pointer-events-auto rounded-card border px-4 py-3 shadow-lg',
              toast.tone === 'success' && 'border-trusted/60 bg-surface text-ink',
              toast.tone === 'error' && 'border-risk/60 bg-surface text-ink',
              toast.tone === 'info' && 'border-accent/60 bg-surface text-ink',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <p className="font-medium text-ink">{toast.title}</p>
            {toast.description ? <p className="mt-1 text-sm text-muted">{toast.description}</p> : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }

  return context
}
