'use client';

import { cn } from '@/lib/utils/cn';

interface KeyCapProps {
  /** The key letter to display */
  letter: string;
  /** Error rate from 0 to 1 — higher means worse */
  errorRate: number;
  /** Optional average speed in ms */
  avgSpeed?: number;
  /** Optional sample size */
  sampleSize?: number;
  /** Additional class names */
  className?: string;
}

/**
 * Styled keyboard key cap component.
 * Color intensity is based on error rate (redder = worse).
 */
export function KeyCap({ letter, errorRate, avgSpeed, sampleSize, className }: KeyCapProps) {
  // Determine color intensity based on error rate
  // 0% error -> green, 10-30% -> yellow, 30%+ -> red
  const getBackgroundColor = (): string => {
    if (errorRate <= 0.05) return 'var(--main-color, #e2b714)';
    if (errorRate <= 0.15) return '#e6a700';
    if (errorRate <= 0.3) return '#e07020';
    return 'var(--error-color, #ca4754)';
  };

  const getTextColor = (): string => {
    if (errorRate <= 0.05) return 'var(--bg-color, #323437)';
    return '#ffffff';
  };

  const bgColor = getBackgroundColor();
  const textColor = getTextColor();

  // Build tooltip text
  const tooltipParts: string[] = [];
  tooltipParts.push(`Error rate: ${(errorRate * 100).toFixed(1)}%`);
  if (avgSpeed !== undefined && avgSpeed > 0) {
    tooltipParts.push(`Avg speed: ${Math.round(avgSpeed)}ms`);
  }
  if (sampleSize !== undefined) {
    tooltipParts.push(`Sample size: ${sampleSize}`);
  }
  const tooltip = tooltipParts.join('\n');

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center',
        'w-10 h-10 rounded-lg',
        'font-mono text-lg font-bold uppercase',
        'border-b-2 shadow-sm',
        'transition-all duration-200',
        'hover:scale-110 hover:shadow-md',
        'cursor-default select-none',
        className
      )}
      style={{
        backgroundColor: bgColor,
        color: textColor,
        borderBottomColor: 'rgba(0, 0, 0, 0.2)',
      }}
      title={tooltip}
    >
      {letter.toUpperCase()}
    </div>
  );
}
