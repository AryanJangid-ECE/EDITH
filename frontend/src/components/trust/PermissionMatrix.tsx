import { useMemo, useState } from 'react'

import type { DeviceCapabilities, PermissionRow, PermissionMatrixMode } from '@/api/types'
import { RESOURCE_META, sensitivityLevel } from '@/lib/trust'
import { PermissionActionMenu } from './PermissionActionMenu'

type PermissionMatrixProps = {
  rows: PermissionRow[]
  canEdit?: boolean
  capabilities?: DeviceCapabilities
  mode?: PermissionMatrixMode
  appName?: string
  onAction?: (action: 'approve' | 'restrict' | 'revoke', resource: string) => void
}

export function PermissionMatrix({ rows, canEdit = true, capabilities, mode = 'app', appName, onAction }: PermissionMatrixProps) {
  const [localRows, setLocalRows] = useState(rows)
  const displayRows = useMemo(() => localRows ?? rows, [localRows, rows])

  const handleAction = (action: 'approve' | 'restrict' | 'revoke', resource: string) => {
    onAction?.(action, resource)

    if (action === 'approve') {
      setLocalRows((current) => current.map((row) => (row.resource === resource ? { ...row, state: 'granted' } : row)))
    }

    if (action === 'revoke') {
      setLocalRows((current) => current.map((row) => (row.resource === resource ? { ...row, state: 'denied' } : row)))
    }
  }

  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="bg-canvas text-muted">
            <tr>
              <th className="px-4 py-3">Resource</th>
              <th className="px-4 py-3">State</th>
              <th className="px-4 py-3">Sensitivity</th>
              <th className="px-4 py-3">Expected</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row) => {
              const expected = row.expected_for_category ? 'Yes' : 'Unexpected for category'
              const stateText = row.state.charAt(0).toUpperCase() + row.state.slice(1)
              return (
                <tr key={`${mode}-${row.resource}`} className="border-t border-line">
                  <td className="px-4 py-3">
                    <div className="inline-flex items-center gap-2">
                      <span aria-hidden="true">{RESOURCE_META[row.resource].icon}</span>
                      <span>{RESOURCE_META[row.resource].label}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.15em] ${row.state === 'granted' ? 'border-trusted/60 bg-trusted/10 text-trusted' : row.state === 'restricted' ? 'border-watch/60 bg-watch/10 text-watch' : 'border-risk/60 bg-risk/10 text-risk'}`}>
                      {stateText}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">{sensitivityLevel(row.sensitivity_weight)}</td>
                  <td className="px-4 py-3 text-muted">{expected}</td>
                  <td className="px-4 py-3">
                    <PermissionActionMenu row={row} appName={appName ?? 'Permission'} canEdit={canEdit} capabilities={capabilities} onAction={handleAction} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
