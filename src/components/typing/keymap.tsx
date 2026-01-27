'use client';

import { memo, useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils/cn';
import { useConfigStore, type KeymapLayout } from '@/store/config-store';
import { useTypingStore } from '@/store/typing-store';
import {
  getKeyboardLayout,
  getKeyForChar,
  type KeyDefinition,
  type KeyboardLayout as KeyboardLayoutType,
} from '@/lib/utils/keyboard-layouts';

export interface KeymapProps {
  /** Additional class names */
  className?: string;
}

interface KeyProps {
  keyDef: KeyDefinition;
  isNext: boolean;
  isPressed: boolean;
  isShiftRequired: boolean;
}

/**
 * Individual key component
 */
const Key = memo(function Key({ keyDef, isNext, isPressed, isShiftRequired }: KeyProps) {
  const width = keyDef.width ?? 1;
  const display = keyDef.display ?? keyDef.key;
  const isShiftKey = keyDef.key === 'shift';
  const isSpaceKey = keyDef.key === ' ';

  // Highlight shift key when the next character requires shift
  const shouldHighlightShift = isShiftKey && isShiftRequired;

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded text-xs font-medium transition-all duration-75',
        'border border-sub-alt',
        // Base sizing
        isSpaceKey ? 'h-7' : 'h-8',
        // Width based on multiplier
        {
          'w-8': width === 1,
          'w-12': width === 1.5,
          'w-16': width === 2,
          'flex-1 min-w-[200px] max-w-[320px]': width === 8, // Space bar
        },
        // State styling
        {
          // Next key to press - highlighted
          'bg-main text-bg border-main': isNext || shouldHighlightShift,
          // Currently pressed - different highlight
          'bg-text text-bg border-text scale-95': isPressed,
          // Default state
          'bg-sub-alt text-sub': !isNext && !isPressed && !shouldHighlightShift,
        }
      )}
    >
      <span className={cn(
        'select-none',
        isSpaceKey && 'text-[10px] tracking-wider',
        isShiftKey && 'text-[10px]'
      )}>
        {display}
      </span>
    </div>
  );
});

/**
 * Keyboard row component
 */
const KeyboardRow = memo(function KeyboardRow({
  row,
  rowIndex,
  nextKey,
  pressedKeys,
  needsShift,
}: {
  row: KeyDefinition[];
  rowIndex: number;
  nextKey: string | null;
  pressedKeys: Set<string>;
  needsShift: boolean;
}) {
  // Determine left padding for staggered keyboard rows
  const paddingClass = rowIndex === 1 ? 'pl-2' : rowIndex === 2 ? 'pl-4' : 'pl-0';

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-1',
        paddingClass
      )}
    >
      {row.map((keyDef, keyIndex) => {
        const isNext = nextKey !== null && keyDef.key === nextKey;
        const isPressed = pressedKeys.has(keyDef.key);

        return (
          <Key
            key={`${rowIndex}-${keyIndex}-${keyDef.key}`}
            keyDef={keyDef}
            isNext={isNext}
            isPressed={isPressed}
            isShiftRequired={needsShift}
          />
        );
      })}
    </div>
  );
});

/**
 * Visual keyboard component that shows the next expected key
 * and highlights pressed keys during typing
 */
export const Keymap = memo(function Keymap({ className }: KeymapProps) {
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());

  // Get config
  const showKeymap = useConfigStore((state) => state.visual.showKeymap);
  const keymapLayout = useConfigStore((state) => state.visual.keymapLayout);

  // Get typing state
  const words = useTypingStore((state) => state.words);
  const currentWordIndex = useTypingStore((state) => state.currentWordIndex);
  const currentCharIndex = useTypingStore((state) => state.currentCharIndex);
  const status = useTypingStore((state) => state.status);

  // Get the keyboard layout
  const layout: KeyboardLayoutType = getKeyboardLayout(keymapLayout);

  // Calculate the next expected character
  let nextChar: string | null = null;
  let needsShift = false;

  if (status !== 'finished' && words.length > 0 && currentWordIndex < words.length) {
    const currentWord = words[currentWordIndex];
    if (currentWord && currentCharIndex < currentWord.text.length) {
      nextChar = currentWord.text[currentCharIndex];
    } else if (currentWord && currentCharIndex >= currentWord.text.length) {
      // At end of word, next is space (unless it's the last word)
      if (currentWordIndex < words.length - 1) {
        nextChar = ' ';
      }
    }
  }

  // Get the key info for the next character
  let nextKey: string | null = null;
  if (nextChar !== null) {
    const keyInfo = getKeyForChar(nextChar);
    nextKey = keyInfo.key;
    needsShift = keyInfo.needsShift;
  }

  // Track pressed keys via keyboard events
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    setPressedKeys((prev) => {
      const next = new Set(prev);
      if (key === ' ') {
        next.add(' ');
      } else if (key === 'shift') {
        next.add('shift');
      } else if (key.length === 1) {
        next.add(key);
      }
      return next;
    });
  }, []);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    setPressedKeys((prev) => {
      const next = new Set(prev);
      if (key === ' ') {
        next.delete(' ');
      } else if (key === 'shift') {
        next.delete('shift');
      } else if (key.length === 1) {
        next.delete(key);
      }
      return next;
    });
  }, []);

  // Add/remove keyboard listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // Clear pressed keys when test finishes or resets
  useEffect(() => {
    if (status === 'finished' || status === 'idle') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPressedKeys(new Set());
    }
  }, [status]);

  // Don't render if keymap is disabled
  if (!showKeymap) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-1 py-4 select-none',
        className
      )}
    >
      {layout.map((row, rowIndex) => (
        <KeyboardRow
          key={rowIndex}
          row={row}
          rowIndex={rowIndex}
          nextKey={nextKey}
          pressedKeys={pressedKeys}
          needsShift={needsShift}
        />
      ))}
    </div>
  );
});

export default Keymap;
