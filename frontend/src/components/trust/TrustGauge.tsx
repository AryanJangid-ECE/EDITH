import { BAND_META, bandFor, clampScore } from '@/lib/trust'

type TrustGaugeProps = {
  score: number | null | undefined
  confidence?: string
  delta?: number
  size?: 'sm' | 'md' | 'lg'
  label?: string
}

export function TrustGauge({ score, confidence, delta, size = 'md', label = 'Trust score' }: TrustGaugeProps) {
  const safeScore = typeof score === 'number' && Number.isFinite(score) ? clampScore(score) : null
  const band = safeScore === null ? 'high_risk' : bandFor(safeScore)
  const meta = BAND_META[band]
  const radius = size === 'sm' ? 36 : size === 'lg' ? 52 : 44
  const circumference = 2 * Math.PI * radius
  const progress = safeScore === null ? 0 : (safeScore / 100) * circumference
  const strokeDasharray = `${progress} ${circumference - progress}`

  return (
    <div className="flex items-center gap-4 rounded-card border border-line bg-canvas p-4" aria-label={label}>
      <div className="relative" style={{ width: radius * 2 + 16, height: radius * 2 + 16 }}>
        <svg viewBox={`0 0 ${radius * 2 + 16} ${radius * 2 + 16}`} className="overflow-visible">
          <circle cx={radius + 8} cy={radius + 8} r={radius} fill="none" stroke="rgb(38 54 72)" strokeWidth="10" strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`} transform={`rotate(-135 ${radius + 8} ${radius + 8})`} />
          <circle
            cx={radius + 8}
            cy={radius + 8}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            transform={`rotate(-135 ${radius + 8} ${radius + 8})`}
            className={meta.textClass}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono text-2xl font-semibold text-ink">{safeScore === null ? '-' : Math.round(safeScore)}</span>
        </div>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted">{label}</span>
          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] ${meta.toneClass}`}>
            {meta.label}
          </span>
        </div>
        <p className="mt-2 text-xs text-muted">Estimated trust indicator based on observed permissions and behaviour. Not a guarantee of safety.</p>
        {typeof delta === 'number' ? (
          <p className="mt-2 font-mono text-xs text-ink">{delta >= 0 ? '+' : ''}{delta.toFixed(1)} vs previous window</p>
        ) : null}
        {confidence ? <p className="mt-2 text-xs text-muted">Confidence: {confidence}</p> : null}
      </div>
    </div>
  )
}
