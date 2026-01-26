'use client';

import { memo, useCallback } from 'react';
import { cn } from '@/lib/utils/cn';
import {
  useConfigStore,
  type TestMode,
  type TimeDuration,
  type WordCount,
  type QuoteLength,
} from '@/store/config-store';

export interface TestConfigBarProps {
  /** Whether the test is currently active */
  isActive?: boolean;
  /** Callback when config changes */
  onConfigChange?: () => void;
  /** Additional class names */
  className?: string;
}

interface OptionButtonProps {
  label: string | number;
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const OptionButton = memo(function OptionButton({
  label,
  isActive,
  onClick,
  disabled = false,
}: OptionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'px-3 py-1.5 text-sm font-medium rounded transition-all duration-125',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-main focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        {
          'bg-main text-bg': isActive && !disabled,
          'bg-sub-alt text-sub hover:text-text': !isActive && !disabled,
          'bg-sub-alt text-sub opacity-50 cursor-not-allowed': disabled,
        }
      )}
    >
      {label}
    </button>
  );
});

interface ToggleButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
  icon?: React.ReactNode;
}

const ToggleButton = memo(function ToggleButton({
  label,
  isActive,
  onClick,
  disabled = false,
  icon,
}: ToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded transition-all duration-125',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-main focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        {
          'bg-main text-bg': isActive && !disabled,
          'bg-sub-alt text-sub hover:text-text': !isActive && !disabled,
          'bg-sub-alt text-sub opacity-50 cursor-not-allowed': disabled,
        }
      )}
    >
      {icon}
      {label}
    </button>
  );
});

const Separator = () => (
  <div className="w-px h-6 bg-sub-alt border-l border-sub mx-2" />
);

export const TestConfigBar = memo(function TestConfigBar({
  isActive = false,
  onConfigChange,
  className,
}: TestConfigBarProps) {
  // Config store
  const mode = useConfigStore((state) => state.test.mode);
  const time = useConfigStore((state) => state.test.time);
  const words = useConfigStore((state) => state.test.words);
  const quoteLength = useConfigStore((state) => state.test.quoteLength);
  const punctuation = useConfigStore((state) => state.behavior.punctuation);
  const numbers = useConfigStore((state) => state.behavior.numbers);

  const setMode = useConfigStore((state) => state.setMode);
  const setTime = useConfigStore((state) => state.setTime);
  const setWords = useConfigStore((state) => state.setWords);
  const setQuoteLength = useConfigStore((state) => state.setQuoteLength);
  const togglePunctuation = useConfigStore((state) => state.togglePunctuation);
  const toggleNumbers = useConfigStore((state) => state.toggleNumbers);

  // Mode options
  const modes: { value: TestMode; label: string }[] = [
    { value: 'time', label: 'time' },
    { value: 'words', label: 'words' },
    { value: 'quote', label: 'quote' },
    { value: 'zen', label: 'zen' },
  ];

  // Time options
  const timeOptions: TimeDuration[] = [15, 30, 60, 120];

  // Word options
  const wordOptions: WordCount[] = [10, 25, 50, 100];

  // Quote length options
  const quoteLengthOptions: { value: QuoteLength; label: string }[] = [
    { value: 'short', label: 'short' },
    { value: 'medium', label: 'medium' },
    { value: 'long', label: 'long' },
    { value: 'all', label: 'all' },
  ];

  // Handlers
  const handleModeChange = useCallback((newMode: TestMode) => {
    if (isActive) return;
    setMode(newMode);
    onConfigChange?.();
  }, [isActive, setMode, onConfigChange]);

  const handleTimeChange = useCallback((newTime: TimeDuration) => {
    if (isActive) return;
    setTime(newTime);
    onConfigChange?.();
  }, [isActive, setTime, onConfigChange]);

  const handleWordsChange = useCallback((newWords: WordCount) => {
    if (isActive) return;
    setWords(newWords);
    onConfigChange?.();
  }, [isActive, setWords, onConfigChange]);

  const handleQuoteLengthChange = useCallback((newLength: QuoteLength) => {
    if (isActive) return;
    setQuoteLength(newLength);
    onConfigChange?.();
  }, [isActive, setQuoteLength, onConfigChange]);

  const handlePunctuationToggle = useCallback(() => {
    if (isActive) return;
    togglePunctuation();
    onConfigChange?.();
  }, [isActive, togglePunctuation, onConfigChange]);

  const handleNumbersToggle = useCallback(() => {
    if (isActive) return;
    toggleNumbers();
    onConfigChange?.();
  }, [isActive, toggleNumbers, onConfigChange]);

  return (
    <div
      className={cn(
        'flex items-center justify-center flex-wrap gap-2 px-4 py-3 rounded-lg',
        'bg-sub-alt transition-all duration-125',
        {
          'opacity-50 pointer-events-none': isActive,
        },
        className
      )}
    >
      {/* Behavior toggles */}
      <div className="flex items-center gap-1" role="group" aria-label="Behavior options">
        <span className="text-sub text-xs font-medium mr-1 hidden sm:inline">options:</span>
        <ToggleButton
          label="punctuation"
          isActive={punctuation}
          onClick={handlePunctuationToggle}
          disabled={isActive}
          icon={
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="18" r="2" />
              <circle cx="12" cy="6" r="2" />
            </svg>
          }
        />
        <ToggleButton
          label="numbers"
          isActive={numbers}
          onClick={handleNumbersToggle}
          disabled={isActive}
          icon={
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 17h6M10 7l-6 10M15 7h.01M15 17h.01M21 17h-6l6-10" />
            </svg>
          }
        />
      </div>

      <Separator />

      {/* Mode selection */}
      <div className="flex items-center gap-1" role="group" aria-label="Test mode">
        <span className="text-sub text-xs font-medium mr-1 hidden sm:inline">mode:</span>
        {modes.map((m) => (
          <OptionButton
            key={m.value}
            label={m.label}
            isActive={mode === m.value}
            onClick={() => handleModeChange(m.value)}
            disabled={isActive}
          />
        ))}
      </div>

      <Separator />

      {/* Mode-specific options */}
      <div className="flex items-center gap-1" role="group" aria-label="Mode options">
        {mode === 'time' && (
          <>
            <span className="text-sub text-xs font-medium mr-1 hidden sm:inline">time:</span>
            {timeOptions.map((t) => (
              <OptionButton
                key={t}
                label={t}
                isActive={time === t}
                onClick={() => handleTimeChange(t)}
                disabled={isActive}
              />
            ))}
          </>
        )}

        {mode === 'words' && (
          <>
            <span className="text-sub text-xs font-medium mr-1 hidden sm:inline">words:</span>
            {wordOptions.map((w) => (
              <OptionButton
                key={w}
                label={w}
                isActive={words === w}
                onClick={() => handleWordsChange(w)}
                disabled={isActive}
              />
            ))}
          </>
        )}

        {mode === 'quote' && (
          <>
            <span className="text-sub text-xs font-medium mr-1 hidden sm:inline">length:</span>
            {quoteLengthOptions.map((q) => (
              <OptionButton
                key={q.value}
                label={q.label}
                isActive={quoteLength === q.value}
                onClick={() => handleQuoteLengthChange(q.value)}
                disabled={isActive}
              />
            ))}
          </>
        )}

        {mode === 'zen' && (
          <span className="text-sub text-sm px-3 italic">type freely...</span>
        )}
      </div>
    </div>
  );
});

export default TestConfigBar;
