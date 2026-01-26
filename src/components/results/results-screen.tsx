'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils/cn';
import { WpmChart } from './wpm-chart';
import { StatsGrid } from './stats-grid';
import { TestBreakdown } from './test-breakdown';
import type { TestResult, PersonalBest } from '@/store/results-store';

// Crown icon component
function CrownIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn('w-6 h-6', className)}
    >
      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
    </svg>
  );
}

// Refresh icon for restart
function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('w-5 h-5', className)}
    >
      <path d="M21 12a9 9 0 11-9-9" />
      <path d="M21 3v9h-9" />
    </svg>
  );
}

// Share icon
function ShareIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('w-5 h-5', className)}
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

interface ResultsScreenProps {
  result: TestResult;
  personalBest: PersonalBest | null;
  isNewPersonalBest?: boolean;
  onNextTest?: () => void;
  onShare?: () => void;
  className?: string;
}

interface MainStatProps {
  label: string;
  value: string | number;
  unit?: string;
  size?: 'lg' | 'xl';
  highlight?: boolean;
}

function MainStat({ label, value, unit, size = 'lg', highlight = false }: MainStatProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs uppercase tracking-wider text-sub font-medium transition-all duration-125">
        {label}
      </span>
      <div className="flex items-baseline gap-1">
        <span className={cn(
          'font-mono font-bold leading-none transition-all duration-125',
          size === 'xl' ? 'text-6xl sm:text-7xl' : 'text-3xl sm:text-4xl',
          highlight ? 'text-main' : 'text-text'
        )}>
          {value}
        </span>
        {unit && (
          <span className={cn(
            'font-mono text-sub transition-all duration-125',
            size === 'xl' ? 'text-xl' : 'text-sm'
          )}>
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

export function ResultsScreen({
  result,
  personalBest,
  isNewPersonalBest = false,
  onNextTest,
  onShare,
  className,
}: ResultsScreenProps) {
  // Check if current result matches or beats personal best
  const isPersonalBestMatch = useMemo(() => {
    if (!personalBest) return isNewPersonalBest;
    return result.wpm >= personalBest.wpm;
  }, [result.wpm, personalBest, isNewPersonalBest]);

  // Keyboard shortcuts are now handled globally by the TypingTest component
  // to support Tab (new words), Tab+Enter (same words), and Escape (reset)

  return (
    <div className={cn(
      'w-full max-w-4xl mx-auto px-4 py-8 space-y-8',
      'animate-in fade-in slide-in-from-bottom-4 duration-500',
      className
    )}>
      {/* Personal Best Indicator */}
      {isPersonalBestMatch && (
        <div className="flex items-center justify-center gap-3 py-3 px-6 rounded-full bg-main/10 border border-main/30 mx-auto w-fit animate-in zoom-in duration-300 transition-all duration-125">
          <CrownIcon className="text-main animate-pulse" />
          <span className="text-main font-medium text-sm uppercase tracking-wider transition-all duration-125">
            {isNewPersonalBest ? 'New Personal Best!' : 'Personal Best'}
          </span>
          <CrownIcon className="text-main animate-pulse" />
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 p-6 sm:p-8 rounded-xl bg-sub-alt border border-sub/50 transition-all duration-125">
        {/* WPM - Large and prominent */}
        <div className="col-span-2 sm:col-span-1 flex justify-center sm:justify-start">
          <MainStat
            label="wpm"
            value={Math.round(result.wpm)}
            size="xl"
            highlight
          />
        </div>

        {/* Secondary stats */}
        <MainStat
          label="accuracy"
          value={result.accuracy.toFixed(1)}
          unit="%"
        />
        <MainStat
          label="raw"
          value={Math.round(result.rawWpm)}
          unit="wpm"
        />
        <MainStat
          label="consistency"
          value={result.consistency.toFixed(1)}
          unit="%"
        />
      </div>

      {/* WPM Chart */}
      <WpmChart wpmHistory={result.wpmHistory} />

      {/* Character Breakdown */}
      <TestBreakdown
        correctChars={result.correctChars}
        incorrectChars={result.incorrectChars}
        extraChars={result.extraChars}
        missedChars={result.missedChars}
      />

      {/* Detailed Stats Grid */}
      <StatsGrid result={result} />

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
        <button
          onClick={onNextTest}
          className={cn(
            'flex items-center gap-2 px-6 py-3 rounded-lg',
            'bg-main hover:bg-main/90 text-bg',
            'font-medium transition-all duration-125',
            'hover:scale-105 active:scale-95',
            'focus:outline-none focus:ring-2 focus:ring-main focus:ring-offset-2 focus:ring-offset-bg'
          )}
        >
          <RefreshIcon />
          Next Test
        </button>

        <button
          onClick={onShare}
          className={cn(
            'flex items-center gap-2 px-6 py-3 rounded-lg',
            'bg-sub-alt hover:bg-text text-text hover:text-bg',
            'font-medium transition-all duration-125',
            'hover:scale-105 active:scale-95',
            'focus:outline-none focus:ring-2 focus:ring-main focus:ring-offset-2 focus:ring-offset-bg'
          )}
        >
          <ShareIcon />
          Share
        </button>
      </div>

      {/* Keyboard Hint */}
      <div className="flex flex-col items-center gap-2 text-sm text-sub transition-all duration-125">
        <div className="flex items-center gap-2">
          <kbd className="px-2 py-1 rounded bg-sub-alt border border-sub font-mono text-xs text-text transition-all duration-125">
            Tab
          </kbd>
          <span>new words</span>
          <span className="text-sub/50 mx-1">|</span>
          <kbd className="px-2 py-1 rounded bg-sub-alt border border-sub font-mono text-xs text-text transition-all duration-125">
            Tab
          </kbd>
          <span>+</span>
          <kbd className="px-2 py-1 rounded bg-sub-alt border border-sub font-mono text-xs text-text transition-all duration-125">
            Enter
          </kbd>
          <span>same words</span>
          <span className="text-sub/50 mx-1">|</span>
          <kbd className="px-2 py-1 rounded bg-sub-alt border border-sub font-mono text-xs text-text transition-all duration-125">
            Esc
          </kbd>
          <span>reset</span>
        </div>
      </div>
    </div>
  );
}
