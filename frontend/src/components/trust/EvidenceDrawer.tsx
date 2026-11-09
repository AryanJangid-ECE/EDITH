import { useEffect } from 'react'

import type { FindingRow } from '@/api/types'
import { useFocusTrap } from '@/lib/useFocusTrap'
import { SeverityBadge } from './SeverityBadge'

type EvidenceDrawerProps = {
  open: boolean
  findings: FindingRow[]
  mode?: 'simple' | 'technical'
  onClose: () => void
}

export function EvidenceDrawer({ open, findings, mode = 'simple', onClose }: EvidenceDrawerProps) {
  const ref = useFocusTrap<HTMLDivElement>(open)

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

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/40" aria-modal="true" role="dialog">
      <div ref={ref} className="h-full w-full max-w-xl border-l border-line bg-surface p-5 text-ink">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xl font-semibold">Evidence</h3>
          <button type="button" onClick={onClose} className="rounded-card border border-line bg-canvas px-3 py-2">Close</button>
        </div>

        {findings.length === 0 ? (
          <div className="mt-6 rounded-card border border-line bg-canvas p-4 text-sm text-muted">No evidence recorded.</div>
        ) : (
          <div className="mt-6 space-y-4">
            {findings.map((finding) => (
              <div key={finding.id} className="rounded-card border border-line bg-canvas p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-ink">{finding.message}</p>
                  <SeverityBadge severity={finding.severity} />
                </div>
                {mode === 'technical' ? (
                  <dl className="mt-3 space-y-2 text-xs text-muted">
                    <div className="flex justify-between gap-4"><dt>Rule</dt><dd className="font-mono text-ink">{finding.rule_id}</dd></div>
                    <div className="flex justify-between gap-4"><dt>z</dt><dd className="font-mono text-ink">{finding.z ?? '—'}</dd></div>
                    <div className="flex justify-between gap-4"><dt>Baseline</dt><dd className="font-mono text-ink">{finding.baseline_mean ?? '—'}</dd></div>
                  </dl>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
