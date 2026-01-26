'use client';

import { useEffect, useCallback, useRef, useMemo } from 'react';

export type KeyHandler = (event: KeyboardEvent) => void;

export interface KeyBinding {
  /** The key to listen for (e.g., 'Enter', 'Escape', 'a', 'Tab') */
  key: string;
  /** Handler function for the key */
  handler: KeyHandler;
  /** Modifier keys required */
  modifiers?: {
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
    meta?: boolean;
  };
  /** Whether to prevent default behavior */
  preventDefault?: boolean;
  /** Whether to stop propagation */
  stopPropagation?: boolean;
}

export interface UseKeyboardOptions {
  /** Key bindings to register */
  bindings?: KeyBinding[];
  /** Generic keydown handler */
  onKeyDown?: KeyHandler;
  /** Generic keyup handler */
  onKeyUp?: KeyHandler;
  /** Whether keyboard handling is enabled */
  enabled?: boolean;
  /** Target element (defaults to window) */
  target?: 'window' | 'document' | React.RefObject<HTMLElement>;
}

export interface UseKeyboardReturn {
  /** Check if a key is currently pressed */
  isKeyPressed: (key: string) => boolean;
  /** Get all currently pressed keys */
  pressedKeys: Set<string>;
}

export function useKeyboard(options: UseKeyboardOptions = {}): UseKeyboardReturn {
  const {
    bindings = [],
    onKeyDown,
    onKeyUp,
    enabled = true,
    target = 'window',
  } = options;

  const pressedKeysRef = useRef<Set<string>>(new Set());

  // Check if modifiers match
  const checkModifiers = useCallback(
    (event: KeyboardEvent, modifiers?: KeyBinding['modifiers']): boolean => {
      if (!modifiers) return true;

      const { ctrl = false, alt = false, shift = false, meta = false } = modifiers;

      return (
        event.ctrlKey === ctrl &&
        event.altKey === alt &&
        event.shiftKey === shift &&
        event.metaKey === meta
      );
    },
    []
  );

  // Handle keydown events
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Track pressed keys
      pressedKeysRef.current.add(event.key);

      // Call generic handler
      onKeyDown?.(event);

      // Check bindings
      for (const binding of bindings) {
        if (
          event.key === binding.key &&
          checkModifiers(event, binding.modifiers)
        ) {
          if (binding.preventDefault) {
            event.preventDefault();
          }
          if (binding.stopPropagation) {
            event.stopPropagation();
          }
          binding.handler(event);
        }
      }
    },
    [enabled, onKeyDown, bindings, checkModifiers]
  );

  // Handle keyup events
  const handleKeyUp = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Track pressed keys
      pressedKeysRef.current.delete(event.key);

      // Call generic handler
      onKeyUp?.(event);
    },
    [enabled, onKeyUp]
  );

  // Register event listeners
  useEffect(() => {
    if (!enabled) return;

    let targetElement: Window | Document | HTMLElement;

    if (target === 'window') {
      targetElement = window;
    } else if (target === 'document') {
      targetElement = document;
    } else if (target && 'current' in target && target.current) {
      targetElement = target.current;
    } else {
      return;
    }

    // Capture the ref value at effect setup time for use in cleanup
    const pressedKeys = pressedKeysRef.current;

    targetElement.addEventListener('keydown', handleKeyDown as EventListener);
    targetElement.addEventListener('keyup', handleKeyUp as EventListener);

    return () => {
      targetElement.removeEventListener('keydown', handleKeyDown as EventListener);
      targetElement.removeEventListener('keyup', handleKeyUp as EventListener);
      pressedKeys.clear();
    };
  }, [enabled, target, handleKeyDown, handleKeyUp]);

  // Check if a specific key is pressed
  const isKeyPressed = useCallback((key: string): boolean => {
    return pressedKeysRef.current.has(key);
  }, []);

  // Return a stable object that provides access to pressed keys via a getter function
  // instead of directly exposing the ref value during render
  const pressedKeys = useMemo(() => ({
    has: (key: string) => pressedKeysRef.current.has(key),
    get size() { return pressedKeysRef.current.size; },
    values: () => pressedKeysRef.current.values(),
    keys: () => pressedKeysRef.current.keys(),
    entries: () => pressedKeysRef.current.entries(),
    forEach: (callback: (value: string, key: string, set: Set<string>) => void) => pressedKeysRef.current.forEach(callback),
    [Symbol.iterator]: () => pressedKeysRef.current[Symbol.iterator](),
  }), []);

  return {
    isKeyPressed,
    pressedKeys: pressedKeys as unknown as Set<string>,
  };
}

// Helper function to check if a character is printable
export function isPrintableKey(event: KeyboardEvent): boolean {
  // Single character keys that are printable
  if (event.key.length === 1) {
    // Exclude control characters
    const charCode = event.key.charCodeAt(0);
    return charCode >= 32 && charCode <= 126;
  }
  return false;
}

// Helper to check if it's a special typing key
export function isTypingKey(event: KeyboardEvent): boolean {
  return isPrintableKey(event) || event.key === 'Backspace' || event.key === ' ';
}

// Helper to check if input should be ignored (e.g., when in an input field)
export function shouldIgnoreInput(event: KeyboardEvent): boolean {
  const target = event.target as HTMLElement;
  const tagName = target?.tagName?.toLowerCase();

  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    target?.isContentEditable
  );
}

export default useKeyboard;
