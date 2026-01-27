'use client';

import { memo, useRef, useEffect, useMemo, useCallback, useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { useTypingStore, type Word } from '@/store/typing-store';
import { useConfigStore, type CaretStyle, type SmoothCaret } from '@/store/config-store';
import { PacemakerCaret } from './pacemaker-caret';
// Caret import removed - caret is hidden per user preference

export interface WordDisplayProps {
  /** Additional class names */
  className?: string;
  /** Whether to show all lines */
  showAllLines?: boolean;
  /** Lines to show (if not showing all) */
  visibleLines?: number;
}

interface CharacterProps {
  char: string;
  status: 'correct' | 'incorrect' | 'extra' | 'missed' | 'pending';
  isCurrent?: boolean;
  showCaret?: boolean;
  caretStyle?: CaretStyle;
  smoothCaret?: SmoothCaret;
}

interface CaretPlaceholderProps {
  caretStyle: CaretStyle;
  smoothCaret: SmoothCaret;
}

// Separate component for caret placeholder at end of word/extra characters
// Uses a properly sized empty span instead of zero-width space to avoid visual issues
// Caret is hidden - user preference
const CaretPlaceholder = memo(function CaretPlaceholder({
  caretStyle,
  smoothCaret,
}: CaretPlaceholderProps) {
  return null;
});

// Caret is hidden - user preference (removed caret rendering)
const Character = memo(function Character({
  char,
  status,
  isCurrent = false,
  showCaret = false,
  caretStyle = 'line',
  smoothCaret = 'medium',
}: CharacterProps) {
  // Theme-based color classes for letter states
  const statusClasses = {
    correct: 'text-text',       // Correct letters use --text-color
    incorrect: 'text-error',    // Incorrect letters use --error-color
    extra: 'text-error-extra',  // Extra characters use --error-extra-color
    missed: 'text-error opacity-50',
    pending: 'text-sub',        // Pending/upcoming letters use --sub-color
  };

  // Current character (next to type) gets underscore indicator only (no color change)
  const currentClass = isCurrent ? 'border-b-2 border-main' : '';

  return (
    <span className="relative inline-block">
      <span className={cn(
        'transition-colors duration-125',
        statusClasses[status],
        currentClass
      )}>
        {char}
      </span>
    </span>
  );
});

// Space indicator removed - was causing extra space and typing issues

interface WordProps {
  word: Word;
  isCurrentWord: boolean;
  currentCharIndex: number;
  caretStyle: CaretStyle;
  smoothCaret: SmoothCaret;
  hideExtraLetters?: boolean;
  isHidden?: boolean; // For memory mode - word is hidden
}

const WordComponent = memo(function WordComponent({
  word,
  isCurrentWord,
  currentCharIndex,
  caretStyle,
  smoothCaret,
  hideExtraLetters = false,
  isHidden = false,
}: WordProps) {
  const { characters, showEndCaret } = useMemo(() => {
    const result: Array<{
      char: string;
      status: 'correct' | 'incorrect' | 'extra' | 'missed' | 'pending';
      isCurrent: boolean;
      showCaret: boolean;
    }> = [];

    const originalChars = word.text.split('');
    const typedChars = word.typed.split('');

    // Process original characters
    originalChars.forEach((char, index) => {
      let status: 'correct' | 'incorrect' | 'extra' | 'missed' | 'pending' = 'pending';

      if (index < typedChars.length) {
        // Character has been typed
        status = word.charStatuses[index] as 'correct' | 'incorrect' | 'pending';
        if (status === 'pending') {
          status = typedChars[index] === char ? 'correct' : 'incorrect';
        }
      } else if (word.isCorrect === false && index >= typedChars.length) {
        // Word was submitted but this character was missed
        status = 'missed';
      }

      const showCaret = isCurrentWord && index === currentCharIndex;
      // Current character is the next one to type (at currentCharIndex position, still pending)
      const isCurrent = isCurrentWord && index === currentCharIndex && status === 'pending';

      result.push({ char, status, isCurrent, showCaret });
    });

    // Process extra characters (typed beyond the word length)
    if (!hideExtraLetters && typedChars.length > originalChars.length) {
      for (let i = originalChars.length; i < typedChars.length; i++) {
        const showCaret = isCurrentWord && i === currentCharIndex;
        result.push({
          char: typedChars[i],
          status: 'extra',
          isCurrent: false, // Extra characters are already typed, never current
          showCaret,
        });
      }
    }

    // Determine if we need to show a caret placeholder at the end
    // This happens when the caret is positioned after all typed characters (including extra)
    const needsEndCaret = isCurrentWord &&
      currentCharIndex === typedChars.length &&
      currentCharIndex >= originalChars.length &&
      currentCharIndex === result.length;

    return { characters: result, showEndCaret: needsEndCaret };
  }, [word, isCurrentWord, currentCharIndex, hideExtraLetters]);

  const wordClass = cn(
    'word', // Uses word class from globals.css: margin: 0.25em 0.3em, inline-flex
    {
      'border-b-2 border-error': word.isCorrect === false,
    }
  );

  // If word is hidden in memory mode, show underscores instead of the actual characters
  // But still show typed characters for feedback
  if (isHidden) {
    return (
      <span className={wordClass}>
        {characters.map((charData, index) => {
          // For hidden words, show underscore for pending characters
          // but show the typed character (with correct/incorrect status) for already typed
          const displayChar = charData.status === 'pending' || charData.status === 'missed'
            ? '_'
            : charData.char;

          return (
            <Character
              key={index}
              char={displayChar}
              status={charData.status}
              isCurrent={charData.isCurrent}
              showCaret={charData.showCaret}
              caretStyle={caretStyle}
              smoothCaret={smoothCaret}
            />
          );
        })}
        {showEndCaret && (
          <CaretPlaceholder
            caretStyle={caretStyle}
            smoothCaret={smoothCaret}
          />
        )}
      </span>
    );
  }

  return (
    <span className={wordClass}>
      {characters.map((charData, index) => (
        <Character
          key={index}
          char={charData.char}
          status={charData.status}
          isCurrent={charData.isCurrent}
          showCaret={charData.showCaret}
          caretStyle={caretStyle}
          smoothCaret={smoothCaret}
        />
      ))}
      {showEndCaret && (
        <CaretPlaceholder
          caretStyle={caretStyle}
          smoothCaret={smoothCaret}
        />
      )}
    </span>
  );
});

export const WordDisplay = memo(function WordDisplay({
  className,
  showAllLines = false,
  visibleLines = 6,
}: WordDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<Map<number, HTMLSpanElement>>(new Map());
  const lastWordIndexRef = useRef<number>(0);

  // Get state from stores
  const words = useTypingStore((state) => state.words);
  const currentWordIndex = useTypingStore((state) => state.currentWordIndex);
  const currentCharIndex = useTypingStore((state) => state.currentCharIndex);
  const status = useTypingStore((state) => state.status);
  const wordVisibility = useTypingStore((state) => state.wordVisibility);
  const hideWord = useTypingStore((state) => state.hideWord);

  const caretStyle = useConfigStore((state) => state.caret.style);
  const smoothCaret = useConfigStore((state) => state.caret.smoothCaret);
  const hideExtraLetters = useConfigStore((state) => state.behavior.hideExtraLetters);
  const smoothLineScroll = useConfigStore((state) => state.visual.smoothLineScroll);
  const fontSize = useConfigStore((state) => state.visual.fontSize);
  const fontFamily = useConfigStore((state) => state.visual.fontFamily);
  const lineHeight = useConfigStore((state) => state.visual.lineHeight);
  const letterSpacing = useConfigStore((state) => state.visual.letterSpacing);

  // Funbox settings
  const funboxMode = useConfigStore((state) => state.funbox.mode);
  const memoryDuration = useConfigStore((state) => state.funbox.memoryDuration);
  const readAheadCount = useConfigStore((state) => state.funbox.readAheadCount);

  // Track active timers for memory mode
  const memoryTimersRef = useRef<Map<number, NodeJS.Timeout>>(new Map());
  const lastCurrentWordRef = useRef<number>(-1);

  // Memory mode: start timer when word becomes active
  useEffect(() => {
    if (funboxMode !== 'memory' || status !== 'running') return;

    // Only start timer when we move to a new word
    if (currentWordIndex !== lastCurrentWordRef.current) {
      lastCurrentWordRef.current = currentWordIndex;

      // Don't start timer if word is already hidden
      if (wordVisibility[currentWordIndex] === false) return;

      // Clear any existing timer for this word
      const existingTimer = memoryTimersRef.current.get(currentWordIndex);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Start new timer to hide the word after memoryDuration seconds
      const timer = setTimeout(() => {
        hideWord(currentWordIndex);
        memoryTimersRef.current.delete(currentWordIndex);
      }, memoryDuration * 1000);

      memoryTimersRef.current.set(currentWordIndex, timer);
    }

    // Cleanup function
    return () => {
      // Don't clear timers on cleanup - they should persist until they fire
    };
  }, [funboxMode, status, currentWordIndex, memoryDuration, wordVisibility, hideWord]);

  // Clean up all timers when test ends or resets
  useEffect(() => {
    if (status === 'idle' || status === 'finished' || status === 'waiting') {
      memoryTimersRef.current.forEach((timer) => clearTimeout(timer));
      memoryTimersRef.current.clear();
      lastCurrentWordRef.current = -1;
    }
  }, [status]);

  // Map font size setting to CSS class
  const fontSizeClasses: Record<string, string> = {
    small: 'text-lg',       // 1.125rem
    medium: 'text-2xl',     // 1.5rem
    large: 'text-3xl',      // 1.875rem
    extra_large: 'text-4xl', // 2.25rem
  };

  // Map font family setting to CSS class
  const fontFamilyClasses: Record<string, string> = {
    roboto_mono: 'font-roboto-mono',
    jetbrains_mono: 'font-jetbrains-mono',
    fira_code: 'font-fira-code',
    source_code_pro: 'font-source-code-pro',
    ibm_plex_mono: 'font-ibm-plex-mono',
  };

  const fontSizeClass = fontSizeClasses[fontSize] || 'text-2xl';
  const fontFamilyClass = fontFamilyClasses[fontFamily] || 'font-mono';

  // Callback ref to store word element references
  const setWordRef = useCallback((index: number, element: HTMLSpanElement | null) => {
    if (element) {
      wordRefs.current.set(index, element);
    } else {
      wordRefs.current.delete(index);
    }
  }, []);

  // Auto-scroll to current word - handles BOTH forward and backward navigation
  useEffect(() => {
    const currentWordElement = wordRefs.current.get(currentWordIndex);
    const container = containerRef.current;

    if (!currentWordElement || !container) return;

    const containerRect = container.getBoundingClientRect();
    const wordRect = currentWordElement.getBoundingClientRect();

    // Calculate visible boundaries with padding
    const lineHeight = wordRect.height;
    const topPadding = lineHeight * 0.5;
    const bottomPadding = lineHeight * 0.5;

    const isAboveVisibleArea = wordRect.top < containerRect.top + topPadding;
    const isBelowVisibleArea = wordRect.bottom > containerRect.bottom - bottomPadding;

    if (isAboveVisibleArea || isBelowVisibleArea) {
      // Use scrollIntoView for reliable centering in both directions
      currentWordElement.scrollIntoView({
        block: 'center',
        behavior: smoothLineScroll ? 'smooth' : 'auto',
      });
    }

    // Update last word index for direction detection
    lastWordIndexRef.current = currentWordIndex;
  }, [currentWordIndex, currentCharIndex, smoothLineScroll]);

  // Reset scroll position when test resets (words change significantly)
  useEffect(() => {
    if (containerRef.current && currentWordIndex === 0) {
      containerRef.current.scrollTop = 0;
      lastWordIndexRef.current = 0;
    }
  }, [words.length, currentWordIndex]);

  if (words.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-32 text-sub', className)}>
        Loading...
      </div>
    );
  }

  const containerClasses = cn(
    'words-container relative overflow-hidden',
    fontSizeClass,
    {
      'max-h-[16rem]': !showAllLines,
      'blur-sm': status === 'finished',
    },
    className
  );

  return (
    <div
      ref={containerRef}
      className={containerClasses}
      style={{
        maxHeight: showAllLines ? 'none' : `${visibleLines * 2.75}rem`,
        lineHeight: lineHeight,
        letterSpacing: `${letterSpacing}em`,
      }}
    >
      {/* Pacemaker ghost caret */}
      <PacemakerCaret
        containerRef={containerRef as React.RefObject<HTMLDivElement>}
        wordRefs={wordRefs as React.RefObject<Map<number, HTMLSpanElement>>}
      />
      <div className={cn('flex flex-wrap', fontFamilyClass)}>
        {words.map((word, index) => {
          const isCurrentWord = index === currentWordIndex;

          // Determine if word should be hidden based on funbox mode
          let isHidden = false;

          if (funboxMode === 'memory') {
            // In memory mode, hide words that have had their timer expire
            // Only apply hiding for words that have been visited (index <= currentWordIndex)
            // and their visibility has been set to false
            isHidden = wordVisibility[index] === false && index <= currentWordIndex;
          } else if (funboxMode === 'readAhead') {
            // In read-ahead mode:
            // - Hide words behind the current word (already typed)
            // - Show current word and readAheadCount words ahead
            // - Hide words further ahead
            const isBeforeCurrent = index < currentWordIndex;
            const isTooFarAhead = index > currentWordIndex + readAheadCount;
            isHidden = isBeforeCurrent || isTooFarAhead;
          }

          return (
            <span
              key={word.id}
              ref={(el) => setWordRef(index, el)}
              data-word-index={index}
            >
              <WordComponent
                word={word}
                isCurrentWord={isCurrentWord}
                currentCharIndex={isCurrentWord ? currentCharIndex : 0}
                caretStyle={caretStyle}
                smoothCaret={smoothCaret}
                hideExtraLetters={hideExtraLetters}
                isHidden={isHidden}
              />
            </span>
          );
        })}
      </div>
    </div>
  );
});

export default WordDisplay;
