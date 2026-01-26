'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useTypingStore } from '@/store/typing-store';
import { useSound } from './use-sound';
import { isPrintableKey, shouldIgnoreInput } from './use-keyboard';

export interface UseTypingTestOptions {
  /** Whether sound is enabled */
  soundEnabled?: boolean;
  /** Sound volume (0-1) */
  soundVolume?: number;
  /** Callback when test completes */
  onComplete?: () => void;
  /** Callback when test starts */
  onStart?: () => void;
  /** Callback when test restarts */
  onRestart?: () => void;
}

export interface UseTypingTestReturn {
  /** Start the typing test */
  start: () => void;
  /** Stop the typing test */
  stop: () => void;
  /** Restart the typing test */
  restart: () => void;
  /** Current WPM */
  wpm: number;
  /** Current accuracy percentage */
  accuracy: number;
  /** Whether test is active */
  isActive: boolean;
  /** Whether test is complete */
  isComplete: boolean;
  /** Elapsed time in seconds */
  elapsedTime: number;
  /** WPM history for chart */
  wpmHistory: number[];
}

export function useTypingTest(options: UseTypingTestOptions = {}): UseTypingTestReturn {
  const {
    soundEnabled = true,
    soundVolume = 0.5,
    onComplete,
    onStart,
    onRestart,
  } = options;

  // Store state
  const status = useTypingStore((state) => state.status);
  const stats = useTypingStore((state) => state.stats);
  const words = useTypingStore((state) => state.words);
  const currentWordIndex = useTypingStore((state) => state.currentWordIndex);
  const currentCharIndex = useTypingStore((state) => state.currentCharIndex);
  const timeElapsed = useTypingStore((state) => state.timeElapsed);
  const testDuration = useTypingStore((state) => state.testDuration);
  const wpmHistory = useTypingStore((state) => state.wpmHistory);
  const errors = useTypingStore((state) => state.errors);

  // Store actions
  const startTest = useTypingStore((state) => state.startTest);
  const endTest = useTypingStore((state) => state.endTest);
  const resetTest = useTypingStore((state) => state.resetTest);
  const handleKeyPress = useTypingStore((state) => state.handleKeyPress);
  const handleBackspaceAction = useTypingStore((state) => state.handleBackspace);
  const handleSpace = useTypingStore((state) => state.handleSpace);
  const tick = useTypingStore((state) => state.tick);

  // Derived state
  const isActive = status === 'running';
  const isComplete = status === 'finished';

  // Sound hooks
  const { playClick, playError, setVolume, setEnabled } = useSound({
    volume: soundVolume,
    enabled: soundEnabled,
  });

  // Refs for interval management
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update sound settings when options change
  useEffect(() => {
    setVolume(soundVolume);
    setEnabled(soundEnabled);
  }, [soundVolume, soundEnabled, setVolume, setEnabled]);

  // Get current text being typed
  const getCurrentText = useCallback(() => {
    return words.map((w) => w.text).join(' ');
  }, [words]);

  // Calculate current char index in full text
  const getCurrentCharIndex = useCallback(() => {
    let index = 0;
    for (let i = 0; i < currentWordIndex; i++) {
      index += words[i]?.text.length || 0;
      index += 1; // space
    }
    index += currentCharIndex;
    return index;
  }, [words, currentWordIndex, currentCharIndex]);

  // Start timer and WPM tracking
  const startTimers = useCallback(() => {
    // Clear any existing intervals
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    // Tick timer every 1000ms (1 second) - tick() also records WPM snapshots
    timerIntervalRef.current = setInterval(() => {
      tick();
    }, 1000);
  }, [tick]);

  // Stop all timers
  const stopTimers = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  // Start test handler
  const start = useCallback(() => {
    startTest();
    startTimers();
    onStart?.();
  }, [startTest, startTimers, onStart]);

  // Stop test handler
  const stop = useCallback(() => {
    endTest();
    stopTimers();
  }, [endTest, stopTimers]);

  // Restart test handler
  const restart = useCallback(() => {
    stopTimers();
    resetTest();
    onRestart?.();
  }, [resetTest, stopTimers, onRestart]);

  // Handle keydown events
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Ignore if typing in an input field
      if (shouldIgnoreInput(event)) return;

      const { key } = event;

      // Tab to restart
      if (key === 'Tab') {
        event.preventDefault();
        restart();
        return;
      }

      // Escape to stop/blur
      if (key === 'Escape') {
        event.preventDefault();
        if (isActive) {
          stop();
        }
        return;
      }

      // If test is complete, don't process more input
      if (isComplete) return;

      // Start test on first keystroke
      if (!isActive && status === 'waiting' && (isPrintableKey(event) || key === ' ')) {
        start();
      }

      // Handle backspace
      if (key === 'Backspace') {
        event.preventDefault();
        handleBackspaceAction();
        playClick();
        return;
      }

      // Handle space
      if (key === ' ') {
        event.preventDefault();
        handleSpace();
        playClick();
        return;
      }

      // Handle printable characters
      if (isPrintableKey(event)) {
        event.preventDefault();
        const currentWord = words[currentWordIndex];
        const expectedChar = currentWord?.text[currentCharIndex];
        const isCorrect = expectedChar === key;

        handleKeyPress(key);

        if (isCorrect) {
          playClick();
        } else {
          playError();
        }

        // Check if test is complete (all words typed)
        const totalWords = words.length;
        const isLastWord = currentWordIndex === totalWords - 1;
        const isLastChar = currentCharIndex === (currentWord?.text.length || 0) - 1;

        if (isLastWord && isLastChar && isCorrect) {
          stop();
          onComplete?.();
        }
      }
    },
    [
      isActive,
      isComplete,
      status,
      words,
      currentWordIndex,
      currentCharIndex,
      start,
      stop,
      restart,
      handleKeyPress,
      handleBackspaceAction,
      handleSpace,
      playClick,
      playError,
      onComplete,
    ]
  );

  // Set up keyboard event listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimers();
    };
  }, [stopTimers]);

  // Handle time limit completion
  useEffect(() => {
    if (testDuration > 0 && timeElapsed >= testDuration && isActive) {
      stop();
      onComplete?.();
    }
  }, [timeElapsed, testDuration, isActive, stop, onComplete]);

  return {
    start,
    stop,
    restart,
    wpm: stats.wpm,
    accuracy: stats.accuracy,
    isActive,
    isComplete,
    elapsedTime: timeElapsed,
    wpmHistory: wpmHistory.map((snapshot) => snapshot.wpm),
  };
}

export default useTypingTest;
