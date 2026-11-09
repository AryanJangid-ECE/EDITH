import { useEffect, useState } from 'react'

import { useFocusTrap } from '@/lib/useFocusTrap'

type RestrictDialogProps = {
  open: boolean
  onClose: () => void
  onSubmit: (value: number) => void
}

export function RestrictDialog({ open, onClose, onSubmit }: RestrictDialogProps) {
  const [value, setValue] = useState('5')
  const [error, setError] = useState('')
  const ref = useFocusTrap<HTMLDivElement>(open)

  useEffect(() => {
    if (!open) return
    setValue('5')
    setError('')
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  const handleSubmit = () => {
    const parsed = Number(value)
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) {
      setError('Max-per-window must be an integer from 1 to 100.')
      return
    }

    onSubmit(parsed)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" aria-modal="true" role="dialog">
      <div ref={ref} className="w-full max-w-md rounded-card border border-line bg-surface p-5 text-ink">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-lg font-semibold">Restrict access</h3>
          <button type="button" onClick={onClose} className="rounded-full border border-line px-2 py-1 text-sm">Close</button>
        </div>

        <label className="mt-4 block text-sm text-muted">
          Max per window
          <input
            value={value}
            onChange={(event) => {
              setValue(event.target.value)
              setError('')
            }}
            className="mt-2 w-full rounded-card border border-line bg-canvas px-3 py-2 text-ink"
            aria-invalid={Boolean(error)}
          />
        </label>

        {error ? <p className="mt-2 text-sm text-risk">{error}</p> : null}

        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-card border border-line px-3 py-2 text-ink">Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={!value || Number.isNaN(Number(value))} className="rounded-card bg-accent px-3 py-2 text-canvas disabled:opacity-40">
            Save restriction
          </button>
        </div>
      </div>
    </div>
  )
}
