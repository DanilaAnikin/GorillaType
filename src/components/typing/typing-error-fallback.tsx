'use client';

import { AlertTriangle } from 'lucide-react';

interface TypingErrorFallbackProps {
  onReset: () => void;
}

/**
 * Error fallback UI specific to the typing test area.
 * Displays a message and restart button styled to match the typing test layout.
 */
export function TypingErrorFallback({ onReset }: TypingErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 w-full py-16">
      <div className="flex items-center gap-3">
        <AlertTriangle
          className="w-6 h-6"
          style={{ color: 'var(--error-color)' }}
        />
        <span
          className="text-lg font-medium font-mono"
          style={{ color: 'var(--text-color)' }}
        >
          Test encountered an error
        </span>
      </div>
      <p
        className="text-sm"
        style={{ color: 'var(--sub-color)' }}
      >
        Something went wrong during the typing test.
      </p>
      <button
        onClick={onReset}
        className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-150 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2"
        style={{
          backgroundColor: 'var(--main-color)',
          color: 'var(--bg-color)',
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5"
        >
          <path d="M21 12a9 9 0 11-9-9" />
          <path d="M21 3v9h-9" />
        </svg>
        Restart Test
      </button>
    </div>
  );
}
