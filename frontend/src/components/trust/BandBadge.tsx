import { BAND_META, bandFor } from '@/lib/trust'

export function BandBadge({ score }: { score: number | null | undefined }) {
  const band = bandFor(score)
  const meta = BAND_META[band]

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] ${meta.toneClass}`}>
      <span aria-hidden="true">{meta.icon}</span>
      {meta.label}
    </span>
  )
}
