import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = {
  children: ReactNode
  fallback?: ReactNode
}

type State = {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Route error boundary caught an error', error, info)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="rounded-card border border-risk/50 bg-surface p-6 text-ink">
          <h2 className="text-lg font-semibold">Something went wrong.</h2>
          <p className="mt-2 text-sm text-muted">The app shell could not render this route.</p>
        </div>
      )
    }

    return this.props.children
  }
}
