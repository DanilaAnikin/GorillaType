'use client';

import { memo, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils/cn';
import { useTypingStore } from '@/store/typing-store';
import { useConfigStore } from '@/store/config-store';

export interface TimerDisplayProps {
  /** Additional class names */
  className?: string;
  /** Force show timer regardless of settings */
  forceShow?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

export const TimerDisplay = memo(function TimerDisplay({
  className,
  forceShow = false,
  size = 'lg',
}: TimerDisplayProps) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get state from stores
  const status = useTypingStore((state) => state.status);
  const timeRemaining = useTypingStore((state) => state.timeRemaining);
  const timeElapsed = useTypingStore((state) => state.timeElapsed);
  const currentWordIndex = useTypingStore((state) => state.currentWordIndex);
  const wordCount = useTypingStore((state) => state.wordCount);
  const tick = useTypingStore((state) => state.tick);

  const testMode = useConfigStore((state) => state.test.mode);
  const showTimer = useConfigStore((state) => state.visual.showTimer);

  // Timer interval
  useEffect(() => {
    if (status === 'running') {
      intervalRef.current = setInterval(() => {
        tick();
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [status, tick]);

  // Check visibility
  const shouldShow = forceShow || showTimer;
  if (!shouldShow) {
    return null;
  }

  // Format time for display
  const formatTime = (seconds: number): string => {
    if (seconds < 0) seconds = 0;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return `${secs}`;
  };

  // Determine what to display based on mode
  let displayValue: string;
  let displayLabel: string;

  switch (testMode) {
    case 'time':
      displayValue = formatTime(timeRemaining);
      displayLabel = 'remaining';
      break;

    case 'words':
      displayValue = `${currentWordIndex}/${wordCount}`;
      displayLabel = 'words';
      break;

    case 'quote':
    case 'zen':
    default:
      displayValue = formatTime(timeElapsed);
      displayLabel = 'elapsed';
      break;
  }

  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-5xl',
  };

  const isRunning = status === 'running';
  const isLowTime = testMode === 'time' && timeRemaining <= 5 && timeRemaining > 0;

  return (
    <div
      className={cn(
        'flex flex-col items-center transition-opacity duration-200',
        {
          'opacity-100': isRunning || status === 'waiting',
          'opacity-50': status === 'idle' || status === 'finished',
        },
        className
      )}
    >
      <span
        className={cn(
          'font-bold tabular-nums transition-colors duration-150',
          sizeClasses[size],
          {
            'text-main': !isLowTime,
            'text-error animate-pulse': isLowTime,
          }
        )}
      >
        {displayValue}
      </span>
      {status === 'running' && (
        <span className="text-xs text-sub mt-1">{displayLabel}</span>
      )}
    </div>
  );
});

export default TimerDisplay;
