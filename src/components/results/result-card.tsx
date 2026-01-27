'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';
import { Keyboard } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import type { TestResult } from '@/store/results-store';

interface ResultCardProps {
  result: TestResult;
  username?: string | null;
  avatarUrl?: string | null;
  className?: string;
}

/**
 * Format the test type for display
 */
function formatTestType(result: TestResult): string {
  switch (result.mode) {
    case 'time':
      return `${result.duration}s`;
    case 'words':
      return `${result.duration} words`;
    case 'quote':
      return 'quote';
    case 'zen':
      return 'zen';
    default:
      return result.mode;
  }
}

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * ResultCard - A shareable card displaying typing test results
 *
 * This component is designed to be captured as an image for sharing.
 * It uses a fixed aspect ratio and the current theme colors.
 */
export const ResultCard = forwardRef<HTMLDivElement, ResultCardProps>(
  function ResultCard({ result, username, avatarUrl, className }, ref) {
    const displayName = username || 'Guest';
    const testConfig = `${formatTestType(result)} | ${result.language.replace('_', ' ')}`;

    return (
      <div
        ref={ref}
        className={cn(
          // Fixed size for image export - 600x300 aspect ratio
          'w-[600px] h-[300px] relative overflow-hidden',
          // Theme colors
          'bg-bg text-text',
          // Rounded corners and border
          'rounded-xl border border-sub/30',
          // Font
          'font-mono',
          className
        )}
      >
        {/* Background pattern - subtle diagonal lines */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              var(--main-color),
              var(--main-color) 1px,
              transparent 1px,
              transparent 20px
            )`,
          }}
        />

        {/* Gradient overlay at bottom */}
        <div
          className="absolute inset-x-0 bottom-0 h-24 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, var(--sub-alt-color) 0%, transparent 100%)',
            opacity: 0.5,
          }}
        />

        {/* Content container */}
        <div className="relative z-10 h-full flex flex-col p-6">
          {/* Top row - User info and branding */}
          <div className="flex items-center justify-between">
            {/* User info */}
            <div className="flex items-center gap-3">
              <Avatar
                src={avatarUrl}
                alt={displayName}
                fallback={displayName.charAt(0)}
                size="md"
                bordered
              />
              <div className="flex flex-col">
                <span className="text-text font-medium text-sm">
                  {displayName}
                </span>
                <span className="text-sub text-xs">
                  {formatDate(result.createdAt)}
                </span>
              </div>
            </div>

            {/* GorillaType branding */}
            <div className="flex items-center gap-2 text-main">
              <Keyboard className="h-5 w-5" />
              <span className="font-bold text-sm">gorilla-type</span>
            </div>
          </div>

          {/* Main stats - centered */}
          <div className="flex-1 flex items-center justify-center gap-12">
            {/* WPM - Large and prominent */}
            <div className="flex flex-col items-center">
              <span className="text-7xl font-bold text-main leading-none">
                {Math.round(result.wpm)}
              </span>
              <span className="text-sub text-sm uppercase tracking-wider mt-1">
                wpm
              </span>
            </div>

            {/* Divider */}
            <div className="h-20 w-px bg-sub/30" />

            {/* Secondary stats */}
            <div className="flex flex-col gap-3">
              {/* Accuracy */}
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-text">
                  {result.accuracy.toFixed(1)}
                </span>
                <span className="text-sub text-sm">% acc</span>
              </div>

              {/* Raw WPM */}
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-medium text-sub">
                  {Math.round(result.rawWpm)}
                </span>
                <span className="text-sub text-xs">raw</span>
              </div>

              {/* Consistency */}
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-medium text-sub">
                  {result.consistency.toFixed(1)}
                </span>
                <span className="text-sub text-xs">% con</span>
              </div>
            </div>
          </div>

          {/* Bottom row - Test configuration */}
          <div className="flex items-center justify-between text-xs text-sub">
            <div className="flex items-center gap-4">
              <span className="px-2 py-1 rounded bg-sub-alt">
                {testConfig}
              </span>
              {result.punctuation && (
                <span className="px-2 py-1 rounded bg-sub-alt">punctuation</span>
              )}
              {result.numbers && (
                <span className="px-2 py-1 rounded bg-sub-alt">numbers</span>
              )}
            </div>
            <span className="text-sub/60">gorillatype.com</span>
          </div>
        </div>
      </div>
    );
  }
);

export default ResultCard;
