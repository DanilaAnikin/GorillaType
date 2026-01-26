'use client';

// Local Storage Hook
export { useLocalStorage } from './use-local-storage';
export type { } from './use-local-storage';

// Media Query Hooks
export {
  useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  usePrefersDarkMode,
  usePrefersReducedMotion,
} from './use-media-query';

// Timer Hook
export { useTimer } from './use-timer';
export type { UseTimerOptions, UseTimerReturn } from './use-timer';

// Sound Hook
export { useSound } from './use-sound';
export type { UseSoundOptions, UseSoundReturn } from './use-sound';

// Keyboard Hook
export {
  useKeyboard,
  isPrintableKey,
  isTypingKey,
  shouldIgnoreInput,
} from './use-keyboard';
export type {
  KeyHandler,
  KeyBinding,
  UseKeyboardOptions,
  UseKeyboardReturn,
} from './use-keyboard';

// Typing Test Hook
export { useTypingTest } from './use-typing-test';
export type { UseTypingTestOptions, UseTypingTestReturn } from './use-typing-test';

// Sync Results Hook
export { useSyncResults } from './use-sync-results';
