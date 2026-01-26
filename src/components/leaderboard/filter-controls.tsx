'use client';

import { cn } from '@/lib/utils/cn';
import { Clock, Type, Globe, Calendar, Filter } from 'lucide-react';

/**
 * Time mode options.
 */
export type TimeMode = 15 | 30 | 60 | 120;

/**
 * Word mode options.
 */
export type WordMode = 10 | 25 | 50 | 100;

/**
 * Test mode type.
 */
export type TestMode = 'time' | 'words';

/**
 * Time range for filtering.
 */
export type TimeRange = 'all' | 'day' | 'week' | 'month';

/**
 * Filter state.
 */
export interface FilterState {
  mode: TestMode;
  timeValue: TimeMode;
  wordValue: WordMode;
  timeRange: TimeRange;
  language: string;
}

/**
 * Language option.
 */
export interface LanguageOption {
  code: string;
  name: string;
}

/**
 * Props for FilterControls component.
 */
export interface FilterControlsProps {
  /** Current filter state */
  filters: FilterState;
  /** Callback when filters change */
  onFiltersChange: (filters: FilterState) => void;
  /** Available languages */
  languages?: LanguageOption[];
  /** Additional CSS classes */
  className?: string;
}

const timeOptions: TimeMode[] = [15, 30, 60, 120];
const wordOptions: WordMode[] = [10, 25, 50, 100];
const timeRangeOptions: { value: TimeRange; label: string }[] = [
  { value: 'all', label: 'All Time' },
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
];

const defaultLanguages: LanguageOption[] = [
  { code: 'english', name: 'English' },
  { code: 'english_1k', name: 'English 1k' },
  { code: 'english_5k', name: 'English 5k' },
  { code: 'english_10k', name: 'English 10k' },
  { code: 'english_25k', name: 'English 25k' },
  { code: 'english_50k', name: 'English 50k' },
  { code: 'code_javascript', name: 'JavaScript' },
  { code: 'code_python', name: 'Python' },
  { code: 'code_rust', name: 'Rust' },
  { code: 'code_go', name: 'Go' },
];

/**
 * FilterControls provides UI for filtering leaderboard results.
 * Designed to work well in a sidebar layout with stacked sections.
 */
export function FilterControls({
  filters,
  onFiltersChange,
  languages = defaultLanguages,
  className,
}: FilterControlsProps) {
  const updateFilter = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div
      className={cn(
        'bg-sub-alt rounded-lg p-4 space-y-5',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 text-text border-b border-sub/30 pb-3">
        <Filter className="w-4 h-4 text-main" />
        <span className="text-sm font-medium">Filters</span>
      </div>

      {/* Mode Selection */}
      <div className="space-y-2">
        <label className="text-xs text-sub uppercase tracking-wider flex items-center gap-2">
          Mode
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => updateFilter('mode', 'time')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
              filters.mode === 'time'
                ? 'bg-main text-bg shadow-sm'
                : 'bg-bg text-sub hover:text-text hover:bg-bg/80'
            )}
          >
            <Clock className="w-4 h-4" />
            Time
          </button>
          <button
            onClick={() => updateFilter('mode', 'words')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
              filters.mode === 'words'
                ? 'bg-main text-bg shadow-sm'
                : 'bg-bg text-sub hover:text-text hover:bg-bg/80'
            )}
          >
            <Type className="w-4 h-4" />
            Words
          </button>
        </div>
      </div>

      {/* Value Selection */}
      <div className="space-y-2">
        <label className="text-xs text-sub uppercase tracking-wider">
          {filters.mode === 'time' ? 'Duration' : 'Word Count'}
        </label>
        <div className="grid grid-cols-4 gap-1.5">
          {filters.mode === 'time'
            ? timeOptions.map((time) => (
                <button
                  key={time}
                  onClick={() => updateFilter('timeValue', time)}
                  className={cn(
                    'px-2 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    filters.timeValue === time
                      ? 'bg-main text-bg shadow-sm'
                      : 'bg-bg text-sub hover:text-text hover:bg-bg/80'
                  )}
                >
                  {time}s
                </button>
              ))
            : wordOptions.map((words) => (
                <button
                  key={words}
                  onClick={() => updateFilter('wordValue', words)}
                  className={cn(
                    'px-2 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    filters.wordValue === words
                      ? 'bg-main text-bg shadow-sm'
                      : 'bg-bg text-sub hover:text-text hover:bg-bg/80'
                  )}
                >
                  {words}
                </button>
              ))}
        </div>
      </div>

      {/* Time Range */}
      <div className="space-y-2">
        <label className="text-xs text-sub uppercase tracking-wider flex items-center gap-2">
          <Calendar className="w-3 h-3" />
          Time Frame
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {timeRangeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => updateFilter('timeRange', option.value)}
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                filters.timeRange === option.value
                  ? 'bg-main text-bg shadow-sm'
                  : 'bg-bg text-sub hover:text-text hover:bg-bg/80'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Language Selection */}
      <div className="space-y-2">
        <label className="text-xs text-sub uppercase tracking-wider flex items-center gap-2">
          <Globe className="w-3 h-3" />
          Language
        </label>
        <div className="relative">
          <select
            value={filters.language}
            onChange={(e) => updateFilter('language', e.target.value)}
            className={cn(
              'w-full h-10 px-3 bg-bg border border-sub/50',
              'rounded-lg text-sm text-text',
              'appearance-none cursor-pointer',
              'transition-all duration-200',
              'hover:border-main/70 focus:border-main focus:outline-none focus:ring-2 focus:ring-main/20'
            )}
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code} className="bg-bg text-text">
                {lang.name}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg
              className="w-4 h-4 text-sub"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FilterControls;
