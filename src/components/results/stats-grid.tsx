'use client';

import { cn } from '@/lib/utils/cn';
import type { TestResult } from '@/store/results-store';

interface StatsGridProps {
  result: TestResult;
  className?: string;
}

interface StatItemProps {
  label: string;
  value: string | number;
  subValue?: string;
  highlight?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

function StatItem({ label, value, subValue, highlight = false, size = 'md' }: StatItemProps) {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
  };

  return (
    <div className="flex flex-col gap-1 transition-all duration-125">
      <span className="text-xs uppercase tracking-wider text-sub font-medium transition-all duration-125">
        {label}
      </span>
      <span className={cn(
        'font-mono font-bold leading-none transition-all duration-125',
        sizeClasses[size],
        highlight ? 'text-main' : 'text-text'
      )}>
        {value}
      </span>
      {subValue && (
        <span className="text-xs text-sub font-mono transition-all duration-125">
          {subValue}
        </span>
      )}
    </div>
  );
}

function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

function formatTestType(result: TestResult): string {
  switch (result.mode) {
    case 'time':
      return `time ${result.duration}`;
    case 'words':
      return `words ${result.duration}`;
    case 'quote':
      return 'quote';
    case 'zen':
      return 'zen';
    default:
      return result.mode;
  }
}

export function StatsGrid({ result, className }: StatsGridProps) {
  const totalChars = result.correctChars + result.incorrectChars + result.extraChars + result.missedChars;
  const charAccuracy = totalChars > 0
    ? ((result.correctChars / totalChars) * 100).toFixed(1)
    : '0';

  return (
    <div className={cn(
      'grid gap-6 p-6 rounded-lg transition-all duration-125',
      'bg-sub-alt border border-sub',
      className
    )}>
      {/* Test Configuration */}
      <div className="pb-4 border-b border-sub transition-all duration-125">
        <h3 className="text-sm font-medium text-sub mb-3 transition-all duration-125">Test Configuration</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatItem
            label="Test Type"
            value={formatTestType(result)}
            size="sm"
          />
          <StatItem
            label="Duration"
            value={formatDuration(result.testDuration)}
            subValue={result.afkTime > 0 ? `${result.afkTime}s afk` : undefined}
            size="sm"
          />
          <StatItem
            label="Language"
            value={result.language.replace('_', ' ')}
            size="sm"
          />
          <StatItem
            label="Difficulty"
            value={result.difficulty}
            size="sm"
          />
        </div>
      </div>

      {/* Character Statistics */}
      <div className="pb-4 border-b border-sub transition-all duration-125">
        <h3 className="text-sm font-medium text-sub mb-3 transition-all duration-125">Characters</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <StatItem
            label="Correct"
            value={result.correctChars}
            highlight
            size="sm"
          />
          <StatItem
            label="Incorrect"
            value={result.incorrectChars}
            size="sm"
          />
          <StatItem
            label="Extra"
            value={result.extraChars}
            size="sm"
          />
          <StatItem
            label="Missed"
            value={result.missedChars}
            size="sm"
          />
          <StatItem
            label="Total"
            value={result.totalChars}
            subValue={`${charAccuracy}% acc`}
            size="sm"
          />
        </div>
      </div>

      {/* Word Statistics */}
      <div className="pb-4 border-b border-sub transition-all duration-125">
        <h3 className="text-sm font-medium text-sub mb-3 transition-all duration-125">Words</h3>
        <div className="grid grid-cols-3 gap-4">
          <StatItem
            label="Correct"
            value={result.correctWords}
            highlight
            size="sm"
          />
          <StatItem
            label="Incorrect"
            value={result.incorrectWords}
            size="sm"
          />
          <StatItem
            label="Total"
            value={result.totalWords}
            size="sm"
          />
        </div>
      </div>

      {/* WPM Comparison */}
      <div className="transition-all duration-125">
        <h3 className="text-sm font-medium text-sub mb-3 transition-all duration-125">Speed Analysis</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatItem
            label="Net WPM"
            value={Math.round(result.wpm)}
            highlight
            size="md"
          />
          <StatItem
            label="Raw WPM"
            value={Math.round(result.rawWpm)}
            size="md"
          />
          <StatItem
            label="Accuracy"
            value={`${result.accuracy.toFixed(1)}%`}
            size="md"
          />
          <StatItem
            label="Consistency"
            value={`${result.consistency.toFixed(1)}%`}
            size="md"
          />
        </div>

        {/* WPM difference indicator */}
        {result.rawWpm > result.wpm && (
          <div className="mt-4 p-3 rounded-md bg-sub-alt border border-sub transition-all duration-125">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-sub transition-all duration-125">WPM penalty:</span>
              <span className="text-error font-mono font-medium transition-all duration-125">
                -{Math.round(result.rawWpm - result.wpm)} wpm
              </span>
              <span className="text-sub transition-all duration-125">from errors</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
