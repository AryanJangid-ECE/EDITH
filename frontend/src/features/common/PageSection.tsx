import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

type PageSectionProps = {
  title: string
  description?: string
  action?: ReactNode
  className?: string
  children: ReactNode
}

export function PageSection({ title, description, action, className, children }: PageSectionProps) {
  return (
    <section className={cn('rounded-card border border-line bg-surface p-5', className)}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted">{title}</p>
          {description ? <p className="mt-2 text-sm text-muted">{description}</p> : null}
        </div>
        {action ? <div>{action}</div> : null}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  )
}
