import type { Severity } from '@/api/types'
import { getSeverityMeta } from '@/lib/trust'

export function SeverityBadge({ severity }: { severity: Severity }) {
  const meta = getSeverityMeta(severity)

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] ${meta.toneClass}`}>
      <span aria-hidden="true">{meta.icon}</span>
      {meta.label}
    </span>
  )
}
