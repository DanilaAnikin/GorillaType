'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils/cn';

interface KeyboardHeatmapProps {
  missedKeys: Record<string, number>;
  className?: string;
}

// QWERTY keyboard layout
const KEYBOARD_ROWS = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
];

// Special keys
const SPACE_KEY = ' ';

type HeatLevel = 'none' | 'low' | 'medium' | 'high';

function getHeatLevel(errorCount: number): HeatLevel {
  if (errorCount === 0) return 'none';
  if (errorCount <= 2) return 'low';
  if (errorCount <= 5) return 'medium';
  return 'high';
}

function getHeatColor(level: HeatLevel): string {
  switch (level) {
    case 'none':
      return 'bg-sub-alt border-sub';
    case 'low':
      return 'bg-yellow-500/30 border-yellow-500/50';
    case 'medium':
      return 'bg-orange-500/40 border-orange-500/60';
    case 'high':
      return 'bg-error/50 border-error/70';
  }
}

function getTextColor(level: HeatLevel): string {
  switch (level) {
    case 'none':
      return 'text-sub';
    case 'low':
      return 'text-yellow-400';
    case 'medium':
      return 'text-orange-400';
    case 'high':
      return 'text-error';
  }
}

interface KeyProps {
  char: string;
  errorCount: number;
  isSpace?: boolean;
}

function Key({ char, errorCount, isSpace = false }: KeyProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const heatLevel = getHeatLevel(errorCount);
  const displayChar = char === ' ' ? 'Space' : char.toUpperCase();

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        className={cn(
          'flex items-center justify-center rounded-md border font-mono font-medium transition-all duration-200',
          'hover:scale-105 cursor-default',
          getHeatColor(heatLevel),
          getTextColor(heatLevel),
          isSpace
            ? 'h-8 sm:h-10 w-32 sm:w-48 text-xs sm:text-sm'
            : 'h-8 w-8 sm:h-10 sm:w-10 text-xs sm:text-sm'
        )}
      >
        {displayChar}
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div
          className={cn(
            'absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded',
            'bg-sub-alt border border-sub text-text text-xs font-mono whitespace-nowrap z-50',
            'animate-fade-in'
          )}
        >
          {errorCount === 0 ? 'No errors' : `${errorCount} error${errorCount > 1 ? 's' : ''}`}
        </div>
      )}
    </div>
  );
}

export function KeyboardHeatmap({ missedKeys, className }: KeyboardHeatmapProps) {
  // Normalize keys to lowercase for lookup
  const normalizedMissedKeys = useMemo(() => {
    const normalized: Record<string, number> = {};
    for (const [key, count] of Object.entries(missedKeys)) {
      normalized[key.toLowerCase()] = (normalized[key.toLowerCase()] || 0) + count;
    }
    return normalized;
  }, [missedKeys]);

  // Calculate total errors for summary
  const totalErrors = useMemo(() => {
    return Object.values(normalizedMissedKeys).reduce((sum, count) => sum + count, 0);
  }, [normalizedMissedKeys]);

  // Find the most problematic keys
  const worstKeys = useMemo(() => {
    return Object.entries(normalizedMissedKeys)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([key, count]) => ({ key: key === ' ' ? 'Space' : key.toUpperCase(), count }));
  }, [normalizedMissedKeys]);

  return (
    <div
      className={cn(
        'p-6 rounded-lg bg-sub-alt border border-sub/50 transition-all duration-125',
        className
      )}
    >
      <h3 className="text-sm font-medium text-sub mb-4 transition-all duration-125">
        Keyboard Heatmap
      </h3>

      {/* Keyboard visualization */}
      <div className="flex flex-col items-center gap-1 sm:gap-2 overflow-x-auto">
        {/* Number row */}
        <div className="flex gap-1 sm:gap-1.5">
          {KEYBOARD_ROWS[0].map((char) => (
            <Key
              key={char}
              char={char}
              errorCount={normalizedMissedKeys[char] || 0}
            />
          ))}
        </div>

        {/* Top letter row (Q-P) */}
        <div className="flex gap-1 sm:gap-1.5">
          {KEYBOARD_ROWS[1].map((char) => (
            <Key
              key={char}
              char={char}
              errorCount={normalizedMissedKeys[char] || 0}
            />
          ))}
        </div>

        {/* Middle letter row (A-L) */}
        <div className="flex gap-1 sm:gap-1.5 pl-4 sm:pl-6">
          {KEYBOARD_ROWS[2].map((char) => (
            <Key
              key={char}
              char={char}
              errorCount={normalizedMissedKeys[char] || 0}
            />
          ))}
        </div>

        {/* Bottom letter row (Z-M) */}
        <div className="flex gap-1 sm:gap-1.5 pl-8 sm:pl-12">
          {KEYBOARD_ROWS[3].map((char) => (
            <Key
              key={char}
              char={char}
              errorCount={normalizedMissedKeys[char] || 0}
            />
          ))}
        </div>

        {/* Space bar */}
        <div className="flex gap-1 sm:gap-1.5 mt-1">
          <Key
            char={SPACE_KEY}
            errorCount={normalizedMissedKeys[SPACE_KEY] || 0}
            isSpace
          />
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-sub-alt border border-sub" />
          <span className="text-sub">No errors</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-500/30 border border-yellow-500/50" />
          <span className="text-sub">1-2 errors</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-orange-500/40 border border-orange-500/60" />
          <span className="text-sub">3-5 errors</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-error/50 border border-error/70" />
          <span className="text-sub">6+ errors</span>
        </div>
      </div>

      {/* Summary */}
      {totalErrors > 0 && (
        <div className="mt-6 pt-4 border-t border-sub/50 transition-all duration-125">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-sm">
            <span className="text-sub transition-all duration-125">Total key errors</span>
            <span className="font-mono font-medium text-text transition-all duration-125">
              {totalErrors}
            </span>
          </div>
          {worstKeys.length > 0 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-sm mt-2">
              <span className="text-sub transition-all duration-125">Most missed keys</span>
              <div className="flex gap-2">
                {worstKeys.map(({ key, count }) => (
                  <span
                    key={key}
                    className="px-2 py-0.5 rounded bg-error/20 border border-error/30 text-error font-mono text-xs transition-all duration-125"
                  >
                    {key} ({count})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {totalErrors === 0 && (
        <div className="mt-6 pt-4 border-t border-sub/50 text-center transition-all duration-125">
          <span className="text-main font-medium text-sm">Perfect accuracy! No missed keys.</span>
        </div>
      )}
    </div>
  );
}
