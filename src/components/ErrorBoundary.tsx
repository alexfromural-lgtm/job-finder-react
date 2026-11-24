// ─── components/ErrorBoundary.tsx — React Class Error Boundary ───────────────
//
// Error Boundaries are a React concept: a component that catches JavaScript
// errors that occur during rendering, in lifecycle methods, or in constructors
// of child components, and displays a fallback UI instead of crashing.
//
// IMPORTANT: Error Boundaries must be CLASS components.
// React hooks (useState, useEffect) cannot catch render errors.
// This is the ONE place in the app where we use a class component.
//
// What it catches:  errors thrown during render, componentDidMount, componentDidUpdate
// What it DOESN'T: errors in event handlers, async code, setTimeout
//
// Usage (in main.tsx):
//   <ErrorBoundary>
//     <App />
//   </ErrorBoundary>

import { Component, type ErrorInfo, type ReactNode } from 'react';

// Props the ErrorBoundary accepts:
//   children — the content to protect
//   fallback — optional custom fallback UI (overrides the default error screen)
interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

// State shape:
//   hasError — true when an error has been caught
//   error    — the actual Error object (for display in dev mode)
interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Catches unhandled render errors and displays a fallback UI instead of
 * crashing the entire application with a blank screen.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <App />
 *   </ErrorBoundary>
 */
class ErrorBoundary extends Component<Props, State> {
  // Initial state: no error.
  state: State = { hasError: false };

  // getDerivedStateFromError is a static lifecycle method.
  // "static" means it belongs to the class, not an instance.
  // React calls this when a child throws during rendering.
  // We return new state here — { hasError: true } — which triggers a re-render
  // that shows the fallback UI instead of the crashed children.
  //
  // Why static? React needs to call this BEFORE creating the instance
  // (which may have already thrown). Static methods work without an instance.
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  // componentDidCatch is called after getDerivedStateFromError.
  // Use it for side effects like logging to an error reporting service (Sentry, etc.).
  // `info.componentStack` shows WHICH component caused the error.
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Unhandled render error:', error, info.componentStack);
  }

  render() {
    // If an error was caught, show the fallback UI.
    if (this.state.hasError) {
      // If a custom fallback was provided via props, use that.
      if (this.props.fallback) return this.props.fallback;

      // Default fallback: a centered error screen with a refresh button.
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            gap: '1rem',
            fontFamily: 'system-ui, sans-serif',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <h1 style={{ fontSize: '2rem', color: '#e53e3e' }}>Something went wrong</h1>
          <p style={{ color: '#718096', maxWidth: '400px' }}>
            An unexpected error occurred. Please refresh the page to try again.
          </p>

          {/* window.location.reload() does a full page refresh, clearing the error state. */}
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#4f46e5',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            Refresh Page
          </button>

          {/* Only show the error message in development (not production). */}
          {/* import.meta.env.DEV is true when running `vite dev`, false in `vite build`. */}
          {import.meta.env.DEV && this.state.error && (
            <pre
              style={{
                marginTop: '1rem',
                padding: '1rem',
                background: '#fff5f5',
                border: '1px solid #fed7d7',
                borderRadius: '8px',
                textAlign: 'left',
                fontSize: '0.75rem',
                maxWidth: '600px',
                overflowX: 'auto',
              }}
            >
              {this.state.error.message}
            </pre>
          )}
        </div>
      );
    }

    // No error — render children normally.
    return this.props.children;
  }
}

export default ErrorBoundary;
