import type { Resource } from '@/api/types'
import { RESOURCE_META } from '@/lib/trust'

export function ResourceChip({ resource }: { resource: Resource }) {
  const meta = RESOURCE_META[resource]

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-ink">
      <span aria-hidden="true">{meta.icon}</span>
      {meta.label}
    </span>
  )
}
