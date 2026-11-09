import type { Confidence } from '@/api/types'

const palette = {
  low: 'border-watch/60 bg-watch/10 text-watch',
  medium: 'border-suspicious/60 bg-suspicious/10 text-suspicious',
  high: 'border-trusted/60 bg-trusted/10 text-trusted',
} as const

export function ConfidenceBadge({ value }: { value?: Confidence | null }) {
  const label = value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Low'
  const tone = value ?? 'low'

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] ${palette[tone]}`}>
      {value === 'low' ? 'Low • Learning' : label}
    </span>
  )
}
