'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  change?: number;
  changeLabel?: string;
  className?: string;
}

export function StatCard({ label, value, unit, change, changeLabel, className }: StatCardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  const isNeutral = change === undefined || change === 0;

  return (
    <div
      className={`rounded-lg p-4 border transition-all duration-125 ${className || ''}`}
      style={{
        backgroundColor: 'var(--sub-alt-color)',
        borderColor: 'color-mix(in srgb, var(--sub-color) 30%, transparent)',
      }}
    >
      <p
        className="text-xs uppercase tracking-wider font-medium mb-1"
        style={{ color: 'var(--sub-color)' }}
      >
        {label}
      </p>
      <div className="flex items-baseline gap-1">
        <span
          className="text-2xl font-bold font-mono leading-none"
          style={{ color: 'var(--main-color)' }}
        >
          {value}
        </span>
        {unit && (
          <span
            className="text-sm font-mono"
            style={{ color: 'var(--sub-color)' }}
          >
            {unit}
          </span>
        )}
      </div>
      {change !== undefined && (
        <div className="flex items-center gap-1 mt-2">
          {isPositive && (
            <TrendingUp className="h-3 w-3" style={{ color: 'var(--main-color)' }} />
          )}
          {isNegative && (
            <TrendingDown className="h-3 w-3" style={{ color: 'var(--error-color)' }} />
          )}
          {isNeutral && (
            <Minus className="h-3 w-3" style={{ color: 'var(--sub-color)' }} />
          )}
          <span
            className="text-xs font-mono"
            style={{
              color: isPositive
                ? 'var(--main-color)'
                : isNegative
                  ? 'var(--error-color)'
                  : 'var(--sub-color)',
            }}
          >
            {isPositive ? '+' : ''}{change.toFixed(1)}%
          </span>
          {changeLabel && (
            <span
              className="text-xs"
              style={{ color: 'var(--sub-color)' }}
            >
              {changeLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
