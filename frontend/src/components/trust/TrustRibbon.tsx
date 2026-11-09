import type { ReactNode } from 'react'

import { Area, AreaChart, CartesianGrid, ReferenceDot, ResponsiveContainer, XAxis, YAxis } from 'recharts'

type RibbonDataPoint = { tick: number; score: number; label: string }
type RibbonMarker = { tick: number; label: string; tone?: 'event' | 'alert' | 'action' }

type TrustRibbonProps = {
  data: RibbonDataPoint[]
  markers?: RibbonMarker[]
  onMarkerClick?: (marker: RibbonMarker) => void
  empty?: ReactNode
}

export function TrustRibbon({ data, markers = [], onMarkerClick, empty }: TrustRibbonProps) {
  if (!data.length) {
    return <div className="rounded-card border border-line bg-surface p-5 text-sm text-muted">{empty ?? 'No score ribbon available.'}</div>
  }

  const chartData = data.map((item) => ({ ...item, score: Math.min(100, Math.max(0, item.score)) }))

  return (
    <div className="rounded-card border border-line bg-surface p-4">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">Trust ribbon</p>
      </div>
      <div className="h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="trust-ribbon-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5CC8B8" stopOpacity={0.75} />
                <stop offset="100%" stopColor="#5CC8B8" stopOpacity={0.08} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="rgba(147,164,184,0.12)" />
            <XAxis dataKey="tick" tickLine={false} axisLine={false} tick={{ fill: '#93A4B8', fontSize: 10 }} />
            <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fill: '#93A4B8', fontSize: 10 }} />
            <Area type="monotone" dataKey="score" stroke="#5CC8B8" strokeWidth={2.5} fill="url(#trust-ribbon-fill)" />
            {markers.map((marker) => {
              const markerIndex = chartData.findIndex((item) => item.tick === marker.tick)
              if (markerIndex === -1) return null
              const y = chartData[markerIndex].score
              const color = marker.tone === 'alert' ? '#FF9A52' : marker.tone === 'action' ? '#5CC8B8' : '#D6D0FF'

              return (
                <ReferenceDot
                  key={`${marker.tick}-${marker.label}`}
                  x={marker.tick}
                  y={y}
                  r={6}
                  fill={color}
                  stroke="rgba(11,17,24,0.8)"
                  onClick={() => onMarkerClick?.(marker)}
                />
              )
            })}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {markers.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {markers.map((marker) => {
            const tone = marker.tone === 'alert' ? 'border-suspicious/60 bg-suspicious/10 text-suspicious' : marker.tone === 'action' ? 'border-accent/60 bg-accent/10 text-accent' : 'border-[#9B8CFF]/60 bg-[#9B8CFF]/10 text-[#D9D2FF]'
            return (
              <button
                key={`${marker.tick}-${marker.label}`}
                type="button"
                onClick={() => onMarkerClick?.(marker)}
                className={`rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] ${tone}`}
              >
                {marker.label}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
