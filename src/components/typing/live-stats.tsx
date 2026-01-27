'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils/cn';
import { useTypingStore } from '@/store/typing-store';
import { useConfigStore } from '@/store/config-store';

export interface LiveStatsProps {
  /** Additional class names */
  className?: string;
  /** Force show stats regardless of settings */
  forceShow?: boolean;
}

interface StatItemProps {
  label: string;
  value: number | string;
  unit?: string;
  className?: string;
}

const StatItem = memo(function StatItem({
  label,
  value,
  unit,
  className,
}: StatItemProps) {
  // Ensure value is valid (handle NaN cases)
  const displayValue = typeof value === 'number' && isNaN(value) ? 0 : value;

  return (
    <div
      className={cn('flex flex-col items-start', className)}
      aria-label={`${label}: ${displayValue}${unit ? ` ${unit}` : ''}`}
    >
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-main tabular-nums">{displayValue}</span>
        {unit && <span className="text-sm text-sub">{unit}</span>}
      </div>
    </div>
  );
});

export const LiveStats = memo(function LiveStats({
  className,
  forceShow = false,
}: LiveStatsProps) {
  // Get stats from store
  const stats = useTypingStore((state) => state.stats);
  const status = useTypingStore((state) => state.status);
  const burstWpm = useTypingStore((state) => state.burstWpm);

  // Get visibility settings
  const showLiveWpm = useConfigStore((state) => state.visual.showLiveWpm);
  const showLiveAccuracy = useConfigStore((state) => state.visual.showLiveAccuracy);
  const showLiveBurst = useConfigStore((state) => state.visual.showLiveBurst);

  // Determine if test is running
  const isRunning = status === 'running';

  // Determine visibility
  const shouldShowWpm = forceShow || showLiveWpm;
  const shouldShowAccuracy = forceShow || showLiveAccuracy;
  const shouldShowBurst = forceShow || showLiveBurst;
  const hasStatsToShow = shouldShowWpm || shouldShowAccuracy || shouldShowBurst;

  // Always render the container to maintain layout, but control visibility with opacity
  // This prevents layout shift when stats appear/disappear
  if (!hasStatsToShow) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex items-center gap-6 transition-opacity duration-300 min-h-[2.5rem]',
        {
          'opacity-100': isRunning,
          'opacity-0 pointer-events-none': !isRunning,
        },
        className
      )}
      aria-live="polite"
      aria-atomic="true"
    >
      {shouldShowWpm && (
        <StatItem
          label="wpm"
          value={Math.round(stats.wpm)}
          unit="wpm"
        />
      )}

      {shouldShowAccuracy && (
        <StatItem
          label="accuracy"
          value={Math.round(stats.accuracy)}
          unit="%"
        />
      )}

      {shouldShowBurst && (
        <StatItem
          label="burst"
          value={Math.round(burstWpm)}
          unit="burst"
        />
      )}
    </div>
  );
});

export default LiveStats;
