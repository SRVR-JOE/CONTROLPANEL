'use client';

import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  detailOpen: boolean;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export default class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, detailOpen: false };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, info.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleToggleDetail = () => {
    this.setState((s) => ({ detailOpen: !s.detailOpen }));
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { error, detailOpen } = this.state;

    return (
      <div
        className="flex min-h-screen items-center justify-center p-8"
        style={{ backgroundColor: '#0c0c14', color: '#e0e0e8' }}
      >
        <div
          className="w-full max-w-lg rounded-xl border p-8"
          style={{
            background: 'rgba(14,14,24,0.9)',
            borderColor: 'rgba(239,68,68,0.3)',
          }}
        >
          {/* Icon + heading */}
          <div className="mb-6 flex items-center gap-4">
            <div
              className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full"
              style={{ background: 'rgba(239,68,68,0.15)' }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div>
              <h1
                className="text-lg font-bold tracking-tight"
                style={{ color: '#f0f0f8' }}
              >
                Something went wrong
              </h1>
              <p className="mt-0.5 text-sm" style={{ color: '#7a7a8e' }}>
                An unexpected error occurred in this part of the application.
              </p>
            </div>
          </div>

          {/* Reload button */}
          <button
            onClick={this.handleReload}
            className="mb-4 w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-all"
            style={{
              background: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: '#ef4444',
              cursor: 'pointer',
            }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                'rgba(239,68,68,0.25)';
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                'rgba(239,68,68,0.15)';
            }}
          >
            Reload Page
          </button>

          {/* Collapsible error detail */}
          {error && (
            <div>
              <button
                onClick={this.handleToggleDetail}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-all"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  color: '#5a5a6e',
                  cursor: 'pointer',
                }}
              >
                <span>Error details</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    transform: detailOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.15s',
                  }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {detailOpen && (
                <pre
                  className="mt-2 overflow-x-auto rounded-lg p-3 font-mono text-xs leading-relaxed"
                  style={{
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(255,255,255,0.04)',
                    color: '#ef4444',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {error.message}
                  {error.stack
                    ? '\n\n' + error.stack.replace(error.message, '').trim()
                    : ''}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
}
