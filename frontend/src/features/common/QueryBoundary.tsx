import type { ReactNode } from 'react'

export type QueryBoundaryProps<T> = {
  isLoading: boolean
  isError: boolean
  error?: Error | null
  data?: T | null
  isEmpty?: (data: T) => boolean
  onRetry?: () => void
  skeleton?: ReactNode
  empty?: ReactNode
  children: (data: T) => ReactNode
}

export function QueryBoundary<T>({
  isLoading,
  isError,
  error,
  data,
  isEmpty,
  onRetry,
  skeleton,
  empty,
  children,
}: QueryBoundaryProps<T>) {
  if (isLoading) {
    return (
      <div className="rounded-card border border-line bg-surface p-4" aria-live="polite">
        {skeleton ?? (
          <div className="space-y-3" aria-label="Loading content">
            <div className="h-4 w-2/3 animate-pulse rounded bg-line/60" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-line/60" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-line/60" />
          </div>
        )}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-card border border-line bg-surface p-5 text-sm text-muted">
        <p className="font-medium text-ink">Unable to load this data.</p>
        <p className="mt-2">{error?.message ?? 'The request failed.'}</p>
        {onRetry ? (
          <button type="button" onClick={onRetry} className="mt-4 rounded-card border border-line bg-canvas px-3 py-2 text-ink">
            Retry
          </button>
        ) : null}
      </div>
    )
  }

  if (!data || (isEmpty && isEmpty(data))) {
    return (
      <div className="rounded-card border border-line bg-surface p-5 text-sm text-muted">
        {empty ?? 'No data available.'}
      </div>
    )
  }

  return <>{children(data)}</>
}
