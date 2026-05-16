"use client"

import { Component, type ReactNode } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

type Props = { children: ReactNode; fallback?: ReactNode }
type State = { hasError: boolean; error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  // Forward caught errors to Sentry. Dynamically imported so the SDK isn't
  // pulled into the synchronous render path of error-free pages.
  // Fail-safe: any failure here is silently swallowed.
  componentDidCatch(error: Error, info: { componentStack?: string | null }): void {
    import('@sentry/nextjs')
      .then((Sentry) => {
        Sentry.withScope((scope) => {
          if (info?.componentStack) {
            scope.setExtra('componentStack', info.componentStack)
          }
          Sentry.captureException(error)
        })
      })
      .catch(() => { /* SDK not loaded or DSN missing — swallow */ })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-500 mb-4" />
          <h2 className="text-lg font-bold text-slate-900 mb-2">Algo salió mal</h2>
          <p className="text-sm text-slate-500 mb-4 max-w-md">{this.state.error?.message || 'Error inesperado'}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}
            className="flex items-center gap-2 text-sm text-indigo-600 font-medium hover:underline">
            <RotateCcw className="w-4 h-4" /> Reintentar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
