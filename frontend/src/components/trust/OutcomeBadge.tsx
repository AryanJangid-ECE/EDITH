import type { Outcome } from '@/api/types'

const tone = {
  allowed: 'border-trusted/60 bg-trusted/10 text-trusted',
  limited: 'border-watch/60 bg-watch/10 text-watch',
  blocked: 'border-risk/60 bg-risk/10 text-risk',
} as const

const label = {
  allowed: 'Allowed',
  limited: 'Limited',
  blocked: 'Blocked',
} as const

export function OutcomeBadge({ outcome }: { outcome: Outcome }) {
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] ${tone[outcome]}`}>{label[outcome]}</span>
}
