'use client';

import { memo, useCallback } from 'react';
import { cn } from '@/lib/utils/cn';

export interface RestartButtonProps {
  /** Callback when restart is triggered */
  onRestart: () => void;
  /** Show keyboard hint */
  showHint?: boolean;
  /** Keyboard shortcut hint text */
  hintText?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional class names */
  className?: string;
  /** Whether button is disabled */
  disabled?: boolean;
}

const RestartIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);

export const RestartButton = memo(function RestartButton({
  onRestart,
  showHint = true,
  hintText = 'Tab - new words | Tab+Enter - same words | Esc - reset',
  size = 'md',
  className,
  disabled = false,
}: RestartButtonProps) {
  const handleClick = useCallback(() => {
    if (!disabled) {
      onRestart();
    }
  }, [onRestart, disabled]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' && !disabled) {
        event.preventDefault();
        onRestart();
      }
    },
    [onRestart, disabled]
  );

  const sizeClasses = {
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <button
        type="button"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={cn(
          'rounded-md transition-all duration-125',
          'bg-sub-alt text-sub',
          'hover:bg-main hover:text-bg hover:scale-105',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-main focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
          'active:scale-95',
          sizeClasses[size],
          {
            'opacity-50 cursor-not-allowed': disabled,
          }
        )}
        aria-label="Restart test"
        tabIndex={0}
      >
        <RestartIcon className={iconSizes[size]} />
      </button>

      {showHint && (
        <span className="text-xs text-sub opacity-70 select-none">
          {hintText}
        </span>
      )}
    </div>
  );
});

export default RestartButton;
