import type { Band } from '@/api/types'
import { BAND_META, bandFor } from '@/lib/trust'

type BreakdownBarItem = {
  label: string
  value: number
  cap: number
}

type BreakdownBarsProps = {
  values: BreakdownBarItem[]
  score: number | null | undefined
  previousScore?: number | null
  technical?: boolean
}

export function BreakdownBars({ values, score, previousScore, technical = false }: BreakdownBarsProps) {
  const safeScore = typeof score === 'number' && Number.isFinite(score) ? Math.min(100, Math.max(0, score)) : 0
  const band: Band = bandFor(safeScore)
  const meta = BAND_META[band]

  return (
    <div className="rounded-card border border-line bg-canvas p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">Breakdown</p>
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-ink">{safeScore}</span>
          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] ${meta.toneClass}`}>{meta.label}</span>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {values.map((item) => {
          const width = Math.min(100, (item.value / Math.max(1, item.cap)) * 100)
          return (
            <div key={item.label}>
              <div className="mb-1 flex items-center justify-between text-xs text-muted">
                <span>{item.label}</span>
                <span className="font-mono text-[11px] text-ink">{item.value}/{item.cap}</span>
              </div>
              <div className="h-2 rounded-full bg-line">
                <div className="h-2 rounded-full bg-accent" style={{ width: `${width}%` }} />
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-xs text-muted">
        <span>{technical ? 'score = round(max(0, 100 - E - G - B - D))' : 'Estimated trust indicator'}</span>
        {typeof previousScore === 'number' ? <span className="font-mono text-ink">{previousScore} → {safeScore}</span> : null}
      </div>
      <p className="mt-3 text-xs text-muted">Estimated trust indicator based on observed permissions and behaviour. Not a guarantee of safety.</p>
    </div>
  )
}
