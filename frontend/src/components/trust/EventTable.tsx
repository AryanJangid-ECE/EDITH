import type { KeyboardEvent, MouseEvent } from 'react'

import { formatBytes, formatSimTime, RESOURCE_META } from '@/lib/trust'
import type { EventRow } from '@/api/types'
import { OutcomeBadge, SourceBadge } from './index'

type EventTableProps = {
  rows: EventRow[]
  loading?: boolean
  empty?: boolean
  onRowClick?: (row: EventRow) => void
}

export function EventTable({ rows, loading = false, empty = false, onRowClick }: EventTableProps) {
  if (loading) {
    return (
      <div className="rounded-card border border-line bg-surface p-4">
        <div className="space-y-3">
          <div className="h-4 w-1/3 animate-pulse rounded bg-line/60" />
          <div className="h-4 w-full animate-pulse rounded bg-line/60" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-line/60" />
        </div>
      </div>
    )
  }

  if (empty || !rows.length) {
    return <div className="rounded-card border border-line bg-surface p-5 text-sm text-muted">No events recorded.</div>
  }

  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="bg-canvas text-muted">
            <tr>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">App</th>
              <th className="px-4 py-3">Resource</th>
              <th className="px-4 py-3">Outcome</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Network</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isBlocked = row.outcome === 'blocked'
              const destination = row.destination ? row.destination : '—'
              const label = RESOURCE_META[row.resource]?.label ?? row.resource

              const handleClick = (event: MouseEvent<HTMLTableRowElement> | KeyboardEvent<HTMLTableRowElement>) => {
                if ('key' in event && event.key !== 'Enter' && event.key !== ' ') return
                onRowClick?.(row)
              }

              return (
                <tr
                  key={row.id}
                  tabIndex={0}
                  onClick={handleClick as never}
                  onKeyDown={handleClick as never}
                  className={`cursor-pointer border-t border-line text-ink ${isBlocked ? 'line-through opacity-80' : ''}`}
                >
                  <td className="px-4 py-3 font-mono text-[11px]">{formatSimTime(row.sim_tick)}</td>
                  <td className="px-4 py-3">{row.app_name}</td>
                  <td className="px-4 py-3">{label}</td>
                  <td className="px-4 py-3"><OutcomeBadge outcome={row.outcome} /></td>
                  <td className="px-4 py-3"><SourceBadge source={row.source} /></td>
                  <td className="px-4 py-3 font-mono text-[11px]">{row.resource === 'network' ? `${formatBytes(row.bytes_out)} → ${destination}` : destination}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
