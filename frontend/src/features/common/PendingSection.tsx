import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

type PendingSectionProps = {
  title: string
  phase: number
  children?: ReactNode
}

export function PendingSection({ title, phase, children }: PendingSectionProps) {
  return (
    <section className={cn('rounded-card border border-dashed border-line bg-canvas p-5 text-muted')}>
      <p className="text-xs uppercase tracking-[0.2em] text-accent">Pending data</p>
      <h3 className="mt-3 text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-sm text-muted">Scaffold: connected to real data in Phase {phase}.</p>
      {children ? <div className="mt-4">{children}</div> : null}
    </section>
  )
}
