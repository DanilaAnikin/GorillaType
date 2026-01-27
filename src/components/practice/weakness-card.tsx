'use client';

import { cn } from '@/lib/utils/cn';

interface WeaknessCardProps {
  /** Label to display (e.g., a key letter or bigram) */
  label: string;
  /** Error rate from 0 to 1 */
  errorRate: number;
  /** Average speed in ms */
  avgSpeed: number;
  /** Number of samples */
  sampleSize: number;
  /** Whether this is a bigram (two characters) */
  isBigram?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * Shows individual key/bigram weakness with a progress bar (error rate visualization).
 * Color coded: red for high error, yellow for medium, green for low.
 */
export function WeaknessCard({
  label,
  errorRate,
  avgSpeed,
  sampleSize,
  isBigram = false,
  className,
}: WeaknessCardProps) {
  // Determine color based on error rate
  const getBarColor = (): string => {
    if (errorRate <= 0.05) return 'var(--main-color, #e2b714)';
    if (errorRate <= 0.15) return '#e6a700';
    if (errorRate <= 0.3) return '#e07020';
    return 'var(--error-color, #ca4754)';
  };

  const getLabelColor = (): string => {
    if (errorRate <= 0.05) return 'var(--main-color, #e2b714)';
    if (errorRate <= 0.15) return '#e6a700';
    if (errorRate <= 0.3) return '#e07020';
    return 'var(--error-color, #ca4754)';
  };

  const barColor = getBarColor();
  const labelColor = getLabelColor();
  const errorPercent = Math.round(errorRate * 100);

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg',
        'transition-all duration-200',
        className
      )}
      style={{ backgroundColor: 'var(--sub-alt-color, rgba(128,128,128,0.1))' }}
    >
      {/* Key/Bigram label */}
      <span
        className={cn(
          'font-mono font-bold text-sm uppercase shrink-0',
          isBigram ? 'w-10 text-center' : 'w-6 text-center'
        )}
        style={{ color: labelColor }}
      >
        {label}
      </span>

      {/* Progress bar and stats */}
      <div className="flex-1 min-w-0">
        {/* Progress bar */}
        <div
          className="w-full h-2 rounded-full overflow-hidden"
          style={{ backgroundColor: 'var(--bg-color, #323437)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${Math.min(errorRate * 100, 100)}%`,
              backgroundColor: barColor,
            }}
          />
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between mt-1">
          <span
            className="text-xs"
            style={{ color: 'var(--sub-color, #646669)' }}
          >
            {errorPercent}% errors
          </span>
          <span
            className="text-xs"
            style={{ color: 'var(--sub-color, #646669)' }}
          >
            {avgSpeed > 0 ? `${Math.round(avgSpeed)}ms` : '--'} avg
            {' / '}
            {sampleSize} samples
          </span>
        </div>
      </div>
    </div>
  );
}
