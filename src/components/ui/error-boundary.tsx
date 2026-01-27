'use client';

import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
  /** Custom fallback UI to display when an error occurs */
  fallback?: ReactNode;
  /** Callback invoked when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Children to render */
  children: ReactNode;
  /** Key to reset the error boundary from parent */
  resetKey?: string | number;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * React Error Boundary component.
 * Catches JavaScript errors in child component tree and displays a fallback UI.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <MyComponent />
 *   </ErrorBoundary>
 *
 *   <ErrorBoundary fallback={<CustomFallback />}>
 *     <MyComponent />
 *   </ErrorBoundary>
 *
 * Reset from parent by changing the resetKey prop.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (
      this.state.hasError &&
      prevProps.resetKey !== this.props.resetKey
    ) {
      this.resetErrorBoundary();
    }
  }

  resetErrorBoundary = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <DefaultErrorFallback onReset={this.resetErrorBoundary} />;
    }

    return this.props.children;
  }
}

/**
 * Default fallback UI displayed when an error is caught and no custom fallback is provided.
 */
function DefaultErrorFallback({ onReset }: { onReset: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-6 p-8 rounded-xl"
      style={{
        backgroundColor: 'var(--bg-color)',
        color: 'var(--text-color)',
      }}
    >
      <div
        className="flex items-center justify-center w-16 h-16 rounded-full"
        style={{ backgroundColor: 'var(--sub-alt-color)' }}
      >
        <AlertTriangle
          className="w-8 h-8"
          style={{ color: 'var(--error-color)' }}
        />
      </div>
      <div className="flex flex-col items-center gap-2 text-center">
        <h2
          className="text-lg font-semibold"
          style={{ color: 'var(--text-color)' }}
        >
          Something went wrong
        </h2>
        <p
          className="text-sm max-w-md"
          style={{ color: 'var(--sub-color)' }}
        >
          An unexpected error occurred. Please try again.
        </p>
      </div>
      <button
        onClick={onReset}
        className="px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-150 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2"
        style={{
          backgroundColor: 'var(--main-color)',
          color: 'var(--bg-color)',
        }}
      >
        Try Again
      </button>
    </div>
  );
}

/**
 * Functional wrapper component that provides sensible defaults for ErrorBoundary.
 * Useful for quick wrapping without needing to configure props.
 *
 * Usage:
 *   <ErrorBoundaryWrapper>
 *     <MyComponent />
 *   </ErrorBoundaryWrapper>
 */
export function ErrorBoundaryWrapper({
  children,
  fallback,
  onError,
  resetKey,
}: {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKey?: string | number;
}) {
  return (
    <ErrorBoundary fallback={fallback} onError={onError} resetKey={resetKey}>
      {children}
    </ErrorBoundary>
  );
}
