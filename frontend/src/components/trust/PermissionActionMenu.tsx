import { useMemo, useState } from 'react'

import type { DeviceCapabilities, PermissionAction, PermissionRow } from '@/api/types'
import { RestrictDialog } from './RestrictDialog'

type PermissionActionMenuProps = {
  row: PermissionRow
  appName?: string
  canEdit?: boolean
  capabilities?: DeviceCapabilities
  onAction?: (action: PermissionAction, resource: string) => void
}

export function PermissionActionMenu({ row, appName, canEdit = true, capabilities, onAction }: PermissionActionMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [restrictOpen, setRestrictOpen] = useState(false)

  const actions = useMemo(() => {
    const items: Array<{ action: PermissionAction; label: string; disabled?: boolean; reason?: string }> = [
      { action: 'approve', label: 'Approve', disabled: row.state === 'granted' },
      { action: 'restrict', label: 'Restrict', disabled: !capabilities?.supports_restrict || row.state === 'restricted' },
      { action: 'revoke', label: 'Revoke', disabled: !capabilities?.supports_revoke || row.state === 'denied' },
    ]

    return items.map((item) => ({
      ...item,
      reason: !canEdit ? 'Viewers cannot edit permissions.' : !capabilities?.supports_restrict && item.action === 'restrict' ? 'Monitor-only on this source' : !capabilities?.supports_revoke && item.action === 'revoke' ? 'Monitor-only on this source' : undefined,
    }))
  }, [canEdit, capabilities, row.state])

  const handleAction = (action: PermissionAction) => {
    if (!canEdit) return
    if (action === 'restrict') {
      setRestrictOpen(true)
      setMenuOpen(false)
      return
    }

    onAction?.(action, row.resource)
    setMenuOpen(false)
  }

  const triggerLabel = canEdit ? 'Actions' : 'View only'

  return (
    <>
      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((current) => !current)}
          className="rounded-card border border-line bg-canvas px-3 py-2 text-sm text-ink disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!canEdit}
          aria-label={canEdit ? `Open action menu for ${appName ?? row.resource}` : `Read-only access for ${appName ?? row.resource}`}
          title={!canEdit ? 'Viewers cannot edit permissions.' : undefined}
        >
          {triggerLabel}
        </button>

        {menuOpen ? (
          <div className="absolute right-0 z-20 mt-2 min-w-44 rounded-card border border-line bg-surface p-2 shadow-lg">
            {actions.map((item) => (
              <button
                key={item.action}
                type="button"
                disabled={item.disabled ?? !canEdit}
                onClick={() => handleAction(item.action)}
                className="flex w-full items-center justify-between rounded-card px-3 py-2 text-left text-sm text-ink disabled:cursor-not-allowed disabled:opacity-40 hover:bg-canvas"
                title={item.reason}
              >
                <span>{item.label}</span>
                {item.reason ? <span className="text-[10px] uppercase tracking-[0.12em] text-muted">{item.reason}</span> : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <RestrictDialog
        open={restrictOpen}
        onClose={() => setRestrictOpen(false)}
        onSubmit={(value) => {
          onAction?.('restrict', row.resource)
          setRestrictOpen(false)
          setMenuOpen(false)
          if (typeof value === 'number') {
            onAction?.('restrict', `${row.resource}:${value}`)
          }
        }}
      />
    </>
  )
}
