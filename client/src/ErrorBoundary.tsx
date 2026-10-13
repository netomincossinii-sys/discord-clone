import { Component, type ErrorInfo, type ReactNode } from 'react'

export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <pre style={{ color: '#fff', background: '#1e1f22', padding: 16, whiteSpace: 'pre-wrap' }}>
          {this.state.error.message}
          {'\n'}
          {this.state.error.stack}
        </pre>
      )
    }
    return this.props.children
  }
}
