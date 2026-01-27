'use client';

import { memo, useCallback, useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';
import {
  useConfigStore,
  type TestMode,
  type TimeDuration,
  type WordCount,
  type QuoteLength,
  type FunboxMode,
  type BigramPreset,
  COMMON_BIGRAMS,
  DIFFICULT_BIGRAMS,
  PROGRAMMING_BIGRAMS,
} from '@/store/config-store';
import { useResultsStore } from '@/store/results-store';

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
        'min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0',
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
        'min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0',
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

interface CustomInputButtonProps {
  currentValue: number;
  presetValues: number[];
  onSubmit: (value: number) => void;
  disabled?: boolean;
  min: number;
  max: number;
  label: string;
}

const CustomInputButton = memo(function CustomInputButton({
  currentValue,
  presetValues,
  onSubmit,
  disabled = false,
  min,
  max,
  label,
}: CustomInputButtonProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const isCustomValue = !presetValues.includes(currentValue);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = () => {
    if (disabled) return;
    setInputValue(isCustomValue ? String(currentValue) : '');
    setIsEditing(true);
  };

  const handleSubmit = () => {
    const numValue = parseInt(inputValue, 10);
    if (!isNaN(numValue) && numValue >= min && numValue <= max) {
      onSubmit(numValue);
    }
    setIsEditing(false);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setInputValue('');
    }
  };

  const handleBlur = () => {
    // Small delay to allow click events to fire first
    setTimeout(() => {
      if (isEditing) {
        handleSubmit();
      }
    }, 100);
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="number"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        min={min}
        max={max}
        placeholder={label}
        className={cn(
          'w-16 px-2 py-1.5 text-sm font-medium rounded transition-all duration-125',
          'bg-bg border border-main text-text text-center',
          'focus:outline-none focus:ring-2 focus:ring-main focus:ring-offset-1 focus:ring-offset-bg',
          '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
        )}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        'px-3 py-1.5 text-sm font-medium rounded transition-all duration-125',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-main focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        {
          'bg-main text-bg': isCustomValue && !disabled,
          'bg-sub-alt text-sub hover:text-text': !isCustomValue && !disabled,
          'bg-sub-alt text-sub opacity-50 cursor-not-allowed': disabled,
        }
      )}
    >
      {isCustomValue ? currentValue : 'custom'}
    </button>
  );
});

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
  const setCustomTime = useConfigStore((state) => state.setCustomTime);
  const setCustomWords = useConfigStore((state) => state.setCustomWords);
  const setQuoteLength = useConfigStore((state) => state.setQuoteLength);
  const togglePunctuation = useConfigStore((state) => state.togglePunctuation);
  const toggleNumbers = useConfigStore((state) => state.toggleNumbers);
  const showKeymap = useConfigStore((state) => state.visual.showKeymap);
  const toggleKeymap = useConfigStore((state) => state.toggleKeymap);

  // Funbox settings
  const funboxMode = useConfigStore((state) => state.funbox.mode);
  const memoryDuration = useConfigStore((state) => state.funbox.memoryDuration);
  const readAheadCount = useConfigStore((state) => state.funbox.readAheadCount);
  const setFunboxMode = useConfigStore((state) => state.setFunboxMode);
  const setMemoryDuration = useConfigStore((state) => state.setMemoryDuration);
  const setReadAheadCount = useConfigStore((state) => state.setReadAheadCount);

  // Weakspot data from results store
  const weakspotData = useResultsStore((state) => state.weakspotData);
  const getTopWeakspots = useResultsStore((state) => state.getTopWeakspots);
  const resetWeakspotData = useResultsStore((state) => state.resetWeakspotData);

  // Bigram settings
  const bigramEnabled = useConfigStore((state) => state.bigram.enabled);
  const bigramPreset = useConfigStore((state) => state.bigram.preset);
  const bigramPairs = useConfigStore((state) => state.bigram.pairs);
  const setBigramEnabled = useConfigStore((state) => state.setBigramEnabled);
  const setBigramPreset = useConfigStore((state) => state.setBigramPreset);
  const setBigramPairs = useConfigStore((state) => state.setBigramPairs);

  // Custom bigram input state
  const [showCustomBigrams, setShowCustomBigrams] = useState(false);
  const [customBigramInput, setCustomBigramInput] = useState('');

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

  // Funbox mode options
  const funboxModes: { value: FunboxMode; label: string }[] = [
    { value: 'none', label: 'none' },
    { value: 'memory', label: 'memory' },
    { value: 'readAhead', label: 'read ahead' },
    { value: 'weakspot', label: 'weakspot' },
  ];

  // Bigram preset options
  const bigramPresets: { value: BigramPreset; label: string }[] = [
    { value: 'common', label: 'common' },
    { value: 'difficult', label: 'difficult' },
    { value: 'programming', label: 'programming' },
    { value: 'custom', label: 'custom' },
  ];

  // Get top weakspots for display
  const topWeakspots = getTopWeakspots(10);
  const hasWeakspots = topWeakspots.length > 0;

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

  const handleKeymapToggle = useCallback(() => {
    toggleKeymap();
    // Don't call onConfigChange since keymap is purely visual and doesn't affect the test
  }, [toggleKeymap]);

  const handleCustomTimeChange = useCallback((seconds: number) => {
    if (isActive) return;
    setCustomTime(seconds);
    onConfigChange?.();
  }, [isActive, setCustomTime, onConfigChange]);

  const handleCustomWordsChange = useCallback((count: number) => {
    if (isActive) return;
    setCustomWords(count);
    onConfigChange?.();
  }, [isActive, setCustomWords, onConfigChange]);

  const handleFunboxModeChange = useCallback((newMode: FunboxMode) => {
    if (isActive) return;
    setFunboxMode(newMode);
    onConfigChange?.();
  }, [isActive, setFunboxMode, onConfigChange]);

  const handleMemoryDurationChange = useCallback((seconds: number) => {
    if (isActive) return;
    setMemoryDuration(seconds);
    onConfigChange?.();
  }, [isActive, setMemoryDuration, onConfigChange]);

  const handleReadAheadCountChange = useCallback((count: 1 | 2 | 3) => {
    if (isActive) return;
    setReadAheadCount(count);
    onConfigChange?.();
  }, [isActive, setReadAheadCount, onConfigChange]);

  const handleResetWeakspots = useCallback(() => {
    if (isActive) return;
    resetWeakspotData();
    onConfigChange?.();
  }, [isActive, resetWeakspotData, onConfigChange]);

  const handleBigramToggle = useCallback(() => {
    if (isActive) return;
    setBigramEnabled(!bigramEnabled);
    onConfigChange?.();
  }, [isActive, bigramEnabled, setBigramEnabled, onConfigChange]);

  const handleBigramPresetChange = useCallback((preset: BigramPreset) => {
    if (isActive) return;
    setBigramPreset(preset);
    if (preset === 'custom') {
      setShowCustomBigrams(true);
      setCustomBigramInput(bigramPairs.join(' '));
    } else {
      setShowCustomBigrams(false);
    }
    onConfigChange?.();
  }, [isActive, setBigramPreset, bigramPairs, onConfigChange]);

  const handleCustomBigramSubmit = useCallback(() => {
    if (isActive) return;
    const pairs = customBigramInput
      .toLowerCase()
      .split(/[\s,]+/)
      .filter((p) => p.length === 2)
      .slice(0, 15); // Limit to 15 bigrams
    if (pairs.length > 0) {
      setBigramPairs(pairs);
    }
    setShowCustomBigrams(false);
    onConfigChange?.();
  }, [isActive, customBigramInput, setBigramPairs, onConfigChange]);

  return (
    <div
      className={cn(
        'config-bar flex items-center justify-center flex-wrap gap-2 px-4 py-3 rounded-lg',
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
        <ToggleButton
          label="keymap"
          isActive={showKeymap}
          onClick={handleKeymapToggle}
          disabled={false}
          icon={
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="6" width="20" height="12" rx="2" />
              <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8" />
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
            <CustomInputButton
              currentValue={time}
              presetValues={timeOptions}
              onSubmit={handleCustomTimeChange}
              disabled={isActive}
              min={1}
              max={3600}
              label="sec"
            />
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
            <CustomInputButton
              currentValue={words}
              presetValues={wordOptions}
              onSubmit={handleCustomWordsChange}
              disabled={isActive}
              min={1}
              max={1000}
              label="words"
            />
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

      <Separator />

      {/* Funbox mode selection */}
      <div className="flex items-center gap-1" role="group" aria-label="Funbox mode">
        <span className="text-sub text-xs font-medium mr-1 hidden sm:inline">funbox:</span>
        {funboxModes.map((f) => (
          <OptionButton
            key={f.value}
            label={f.label}
            isActive={funboxMode === f.value}
            onClick={() => handleFunboxModeChange(f.value)}
            disabled={isActive}
          />
        ))}
        {/* Memory duration input when memory mode is selected */}
        {funboxMode === 'memory' && (
          <>
            <span className="text-sub text-xs font-medium ml-2 mr-1 hidden sm:inline">duration:</span>
            {[2, 3, 5].map((d) => (
              <OptionButton
                key={d}
                label={`${d}s`}
                isActive={memoryDuration === d}
                onClick={() => handleMemoryDurationChange(d)}
                disabled={isActive}
              />
            ))}
            <CustomInputButton
              currentValue={memoryDuration}
              presetValues={[2, 3, 5]}
              onSubmit={handleMemoryDurationChange}
              disabled={isActive}
              min={1}
              max={10}
              label="sec"
            />
          </>
        )}
        {/* Read ahead count when read ahead mode is selected */}
        {funboxMode === 'readAhead' && (
          <>
            <span className="text-sub text-xs font-medium ml-2 mr-1 hidden sm:inline">words ahead:</span>
            {([1, 2, 3] as const).map((count) => (
              <OptionButton
                key={count}
                label={count}
                isActive={readAheadCount === count}
                onClick={() => handleReadAheadCountChange(count)}
                disabled={isActive}
              />
            ))}
          </>
        )}
        {/* Weakspot info and reset button when weakspot mode is selected */}
        {funboxMode === 'weakspot' && (
          <>
            <div className="flex items-center gap-2 ml-2">
              <span className="text-sub text-xs font-medium hidden sm:inline">weakspots:</span>
              {hasWeakspots ? (
                <div className="flex items-center gap-1">
                  {topWeakspots.slice(0, 5).map((char, index) => (
                    <span
                      key={index}
                      className="px-1.5 py-0.5 text-xs font-mono bg-bg text-text rounded border border-sub"
                      title={`Missed ${weakspotData[char] || 0} times`}
                    >
                      {char === ' ' ? 'space' : char}
                    </span>
                  ))}
                  {topWeakspots.length > 5 && (
                    <span className="text-sub text-xs">+{topWeakspots.length - 5} more</span>
                  )}
                </div>
              ) : (
                <span className="text-sub text-xs italic">no data yet</span>
              )}
              <button
                type="button"
                onClick={handleResetWeakspots}
                disabled={isActive || !hasWeakspots}
                className={cn(
                  'px-2 py-1 text-xs font-medium rounded transition-all duration-125',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-main focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
                  {
                    'bg-error/20 text-error hover:bg-error/30': !isActive && hasWeakspots,
                    'bg-sub-alt text-sub opacity-50 cursor-not-allowed': isActive || !hasWeakspots,
                  }
                )}
                title="Reset weakspot data"
              >
                reset
              </button>
            </div>
          </>
        )}
      </div>

      <Separator />

      {/* Bigram mode section */}
      <div className="flex items-center gap-1" role="group" aria-label="Bigram practice">
        <ToggleButton
          label="bigrams"
          isActive={bigramEnabled}
          onClick={handleBigramToggle}
          disabled={isActive}
          icon={
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7h6M4 12h8M4 17h4M14 7h6M14 12h6M14 17h6" />
            </svg>
          }
        />
        {bigramEnabled && (
          <>
            <span className="text-sub text-xs font-medium ml-2 mr-1 hidden sm:inline">preset:</span>
            {bigramPresets.map((preset) => (
              <OptionButton
                key={preset.value}
                label={preset.label}
                isActive={bigramPreset === preset.value}
                onClick={() => handleBigramPresetChange(preset.value)}
                disabled={isActive}
              />
            ))}
            {/* Show current bigrams preview */}
            <div className="flex items-center gap-1 ml-2">
              <span className="text-sub text-xs font-medium hidden sm:inline">pairs:</span>
              <div className="flex items-center gap-0.5 flex-wrap max-w-xs">
                {bigramPairs.slice(0, 5).map((pair, index) => (
                  <span
                    key={index}
                    className="px-1 py-0.5 text-xs font-mono bg-bg text-text rounded border border-sub"
                  >
                    {pair}
                  </span>
                ))}
                {bigramPairs.length > 5 && (
                  <span className="text-sub text-xs">+{bigramPairs.length - 5}</span>
                )}
              </div>
            </div>
          </>
        )}
        {/* Custom bigram input modal */}
        {showCustomBigrams && (
          <div className="flex items-center gap-2 ml-2">
            <input
              type="text"
              value={customBigramInput}
              onChange={(e) => setCustomBigramInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleCustomBigramSubmit();
                } else if (e.key === 'Escape') {
                  setShowCustomBigrams(false);
                }
              }}
              placeholder="th he in er an..."
              className={cn(
                'w-40 px-2 py-1 text-xs font-mono rounded transition-all duration-125',
                'bg-bg border border-main text-text',
                'focus:outline-none focus:ring-2 focus:ring-main focus:ring-offset-1 focus:ring-offset-bg'
              )}
            />
            <button
              type="button"
              onClick={handleCustomBigramSubmit}
              className={cn(
                'px-2 py-1 text-xs font-medium rounded transition-all duration-125',
                'bg-main text-bg hover:opacity-90',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-main'
              )}
            >
              save
            </button>
            <button
              type="button"
              onClick={() => setShowCustomBigrams(false)}
              className={cn(
                'px-2 py-1 text-xs font-medium rounded transition-all duration-125',
                'bg-sub-alt text-sub hover:text-text',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-main'
              )}
            >
              cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

export default TestConfigBar;
