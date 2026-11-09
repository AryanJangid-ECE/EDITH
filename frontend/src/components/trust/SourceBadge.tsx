import type { EventSource } from '@/api/types'
import { getSourceTone } from '@/lib/trust'

export function SourceBadge({ source }: { source: EventSource }) {
  const text = source === 'simulated' ? 'SIMULATED DEVICE' : 'REAL DEVICE'
  const icon = source === 'simulated' ? '◈' : '◉'

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] ${getSourceTone(source)}`}>
      <span aria-hidden="true">{icon}</span>
      {text}
    </span>
  )
}
