'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils/cn';

interface TestBreakdownProps {
  correctChars: number;
  incorrectChars: number;
  extraChars: number;
  missedChars: number;
  className?: string;
}

interface BreakdownSegment {
  label: string;
  count: number;
  percentage: number;
  color: string;
  bgColor: string;
}

export function TestBreakdown({
  correctChars,
  incorrectChars,
  extraChars,
  missedChars,
  className,
}: TestBreakdownProps) {
  const segments = useMemo((): BreakdownSegment[] => {
    const total = correctChars + incorrectChars + extraChars + missedChars;

    if (total === 0) {
      return [];
    }

    return [
      {
        label: 'Correct',
        count: correctChars,
        percentage: (correctChars / total) * 100,
        color: 'text-main',
        bgColor: 'bg-main',
      },
      {
        label: 'Incorrect',
        count: incorrectChars,
        percentage: (incorrectChars / total) * 100,
        color: 'text-error',
        bgColor: 'bg-error',
      },
      {
        label: 'Extra',
        count: extraChars,
        percentage: (extraChars / total) * 100,
        color: 'text-error-extra',
        bgColor: 'bg-error-extra',
      },
      {
        label: 'Missed',
        count: missedChars,
        percentage: (missedChars / total) * 100,
        color: 'text-sub',
        bgColor: 'bg-sub',
      },
    ].filter((segment) => segment.count > 0);
  }, [correctChars, incorrectChars, extraChars, missedChars]);

  const totalChars = correctChars + incorrectChars + extraChars + missedChars;

  if (totalChars === 0) {
    return (
      <div className={cn(
        'p-6 rounded-lg bg-sub-alt border border-sub/50 transition-all duration-125',
        className
      )}>
        <p className="text-sub text-sm font-mono text-center transition-all duration-125">
          No character data available
        </p>
      </div>
    );
  }

  return (
    <div className={cn(
      'p-6 rounded-lg bg-sub-alt border border-sub/50 transition-all duration-125',
      className
    )}>
      <h3 className="text-sm font-medium text-sub mb-4 transition-all duration-125">
        Character Breakdown
      </h3>

      {/* Visual breakdown bar */}
      <div className="relative h-8 rounded-full overflow-hidden bg-bg mb-6 transition-all duration-125">
        <div className="absolute inset-0 flex">
          {segments.map((segment, index) => (
            <div
              key={segment.label}
              className={cn(
                segment.bgColor,
                'h-full transition-all duration-500 ease-out',
                index === 0 && 'rounded-l-full',
                index === segments.length - 1 && 'rounded-r-full'
              )}
              style={{ width: `${segment.percentage}%` }}
              title={`${segment.label}: ${segment.count} (${segment.percentage.toFixed(1)}%)`}
            />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {segments.map((segment) => (
          <div key={segment.label} className="flex items-center gap-3">
            <div className={cn('w-3 h-3 rounded-full transition-all duration-125', segment.bgColor)} />
            <div className="flex flex-col">
              <span className={cn('text-sm font-mono font-medium transition-all duration-125', segment.color)}>
                {segment.count}
              </span>
              <span className="text-xs text-sub transition-all duration-125">
                {segment.label} ({segment.percentage.toFixed(1)}%)
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Summary stats */}
      <div className="mt-6 pt-4 border-t border-sub/50 transition-all duration-125">
        <div className="flex items-center justify-between text-sm">
          <span className="text-sub transition-all duration-125">Total Characters</span>
          <span className="font-mono font-medium text-text transition-all duration-125">{totalChars}</span>
        </div>
        <div className="flex items-center justify-between text-sm mt-2">
          <span className="text-sub transition-all duration-125">Accuracy</span>
          <span className={cn(
            'font-mono font-medium transition-all duration-125',
            correctChars / totalChars >= 0.95 ? 'text-main' :
            correctChars / totalChars >= 0.90 ? 'text-sub' :
            'text-error'
          )}>
            {((correctChars / totalChars) * 100).toFixed(2)}%
          </span>
        </div>
        <div className="flex items-center justify-between text-sm mt-2">
          <span className="text-sub transition-all duration-125">Error Rate</span>
          <span className="font-mono font-medium text-sub transition-all duration-125">
            {(((incorrectChars + extraChars + missedChars) / totalChars) * 100).toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  );
}
