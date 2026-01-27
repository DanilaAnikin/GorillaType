import { create } from 'zustand';
import { useConfigStore } from './config-store';

// Types
export interface Word {
  id: number;
  text: string;
  typed: string;
  isCorrect: boolean | null;
  charStatuses: ('correct' | 'incorrect' | 'pending')[];
}

export interface WpmSnapshot {
  timestamp: number;
  wpm: number;
  raw: number;
  errors: number;
}

export interface TestStats {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  correctChars: number;
  incorrectChars: number;
  extraChars: number;
  missedChars: number;
  totalChars: number;
  correctWords: number;
  incorrectWords: number;
  consistency: number;
}

export type TestStatus = 'idle' | 'waiting' | 'running' | 'finished';

export interface TestState {
  // Test content
  words: Word[];
  originalWordStrings: string[]; // Store original words for restart with same words
  currentWordIndex: number;
  currentCharIndex: number;
  currentInput: string;

  // Memory mode (funbox)
  wordVisibility: boolean[]; // Track which words are visible (for memory mode)

  // Test status
  status: TestStatus;
  startTime: number | null;
  endTime: number | null;
  timeElapsed: number;
  timeRemaining: number;

  // Configuration (from config store, duplicated for quick access)
  testDuration: number;
  testMode: 'time' | 'words' | 'quote' | 'zen';
  wordCount: number;

  // Stats
  stats: TestStats;
  wpmHistory: WpmSnapshot[];

  // Tracking
  keystrokes: number;
  errors: number;
  missedKeys: Record<string, number>; // Track error frequency per expected character

  // Burst tracking
  lastWordStartTime: number | null;
  burstWpm: number;

  // Pacemaker
  pacemakerPosition: number; // Character index for ghost caret

  // Actions
  initializeTest: (words: string[], duration?: number, mode?: 'time' | 'words' | 'quote' | 'zen', wordCount?: number) => void;
  startTest: () => void;
  endTest: () => void;
  resetTest: () => void;
  restartWithSameWords: () => void; // Restart test with the same words

  // Input handling
  handleKeyPress: (char: string) => void;
  handleBackspace: () => void;
  handleDeleteWord: () => void;
  handleDeleteLine: () => void;
  handleSpace: () => void;

  // Stats
  updateStats: () => void;
  recordWpmSnapshot: () => void;

  // Pacemaker
  updatePacemakerPosition: (targetWpm: number) => void;

  // Memory mode
  hideWord: (index: number) => void;

  // Timer
  tick: () => void;
}

const initialStats: TestStats = {
  wpm: 0,
  rawWpm: 0,
  accuracy: 100,
  correctChars: 0,
  incorrectChars: 0,
  extraChars: 0,
  missedChars: 0,
  totalChars: 0,
  correctWords: 0,
  incorrectWords: 0,
  consistency: 100,
};

export const useTypingStore = create<TestState>((set, get) => ({
  // Initial state
  words: [],
  originalWordStrings: [],
  currentWordIndex: 0,
  currentCharIndex: 0,
  currentInput: '',

  // Memory mode
  wordVisibility: [],

  status: 'idle',
  startTime: null,
  endTime: null,
  timeElapsed: 0,
  timeRemaining: 30,

  testDuration: 30,
  testMode: 'time',
  wordCount: 25,

  stats: { ...initialStats },
  wpmHistory: [],

  keystrokes: 0,
  errors: 0,
  missedKeys: {},

  // Burst tracking
  lastWordStartTime: null,
  burstWpm: 0,

  // Pacemaker
  pacemakerPosition: 0,

  // Actions
  initializeTest: (wordStrings, duration = 30, mode = 'time', wordCount = 25) => {
    const words: Word[] = wordStrings.map((text, index) => ({
      id: index,
      text,
      typed: '',
      isCorrect: null,
      charStatuses: new Array(text.length).fill('pending'),
    }));

    set({
      words,
      originalWordStrings: [...wordStrings], // Store original words for restart
      currentWordIndex: 0,
      currentCharIndex: 0,
      currentInput: '',
      wordVisibility: new Array(wordStrings.length).fill(true), // All words visible initially
      status: 'waiting',
      startTime: null,
      endTime: null,
      timeElapsed: 0,
      timeRemaining: duration,
      testDuration: duration,
      testMode: mode,
      wordCount,
      stats: { ...initialStats },
      wpmHistory: [],
      keystrokes: 0,
      errors: 0,
      missedKeys: {},
      lastWordStartTime: null,
      burstWpm: 0,
      pacemakerPosition: 0,
    });
  },

  startTest: () => {
    const { status } = get();
    if (status !== 'waiting') return;

    const now = Date.now();
    set({
      status: 'running',
      startTime: now,
      lastWordStartTime: now,
    });
  },

  endTest: () => {
    const state = get();
    if (state.status !== 'running') return;

    const endTime = Date.now();

    // Final stats calculation
    get().updateStats();

    set({
      status: 'finished',
      endTime,
    });
  },

  resetTest: () => {
    set({
      words: [],
      originalWordStrings: [],
      currentWordIndex: 0,
      currentCharIndex: 0,
      currentInput: '',
      wordVisibility: [],
      status: 'idle',
      startTime: null,
      endTime: null,
      timeElapsed: 0,
      timeRemaining: get().testDuration,
      stats: { ...initialStats },
      wpmHistory: [],
      keystrokes: 0,
      errors: 0,
      missedKeys: {},
      lastWordStartTime: null,
      burstWpm: 0,
      pacemakerPosition: 0,
    });
  },

  restartWithSameWords: () => {
    const state = get();
    const { originalWordStrings, testDuration } = state;

    // If no original words stored, do nothing
    if (originalWordStrings.length === 0) return;

    // Recreate words from the original strings
    const words: Word[] = originalWordStrings.map((text, index) => ({
      id: index,
      text,
      typed: '',
      isCorrect: null,
      charStatuses: new Array(text.length).fill('pending'),
    }));

    set({
      words,
      // Keep originalWordStrings unchanged
      currentWordIndex: 0,
      currentCharIndex: 0,
      currentInput: '',
      wordVisibility: new Array(originalWordStrings.length).fill(true), // Reset all words to visible
      status: 'waiting',
      startTime: null,
      endTime: null,
      timeElapsed: 0,
      timeRemaining: testDuration,
      stats: { ...initialStats },
      wpmHistory: [],
      keystrokes: 0,
      errors: 0,
      missedKeys: {},
      lastWordStartTime: null,
      burstWpm: 0,
      pacemakerPosition: 0,
    });
  },

  handleKeyPress: (char) => {
    let state = get();

    // Start test on first keypress if waiting
    if (state.status === 'waiting') {
      get().startTest();
      // Re-fetch state after starting test to get updated status
      state = get();
    }

    if (state.status !== 'running') return;

    const { words, currentWordIndex, currentInput } = state;
    const currentWord = words[currentWordIndex];
    if (!currentWord) return;

    const newInput = currentInput + char;
    const charIndex = currentInput.length;
    const expectedChar = currentWord.text[charIndex];

    // Update character statuses
    const newCharStatuses = [...currentWord.charStatuses];
    if (charIndex < currentWord.text.length) {
      newCharStatuses[charIndex] = char === expectedChar ? 'correct' : 'incorrect';
    }

    // Track errors and missed keys
    let newErrors = state.errors;
    let newMissedKeys = state.missedKeys;
    if (char !== expectedChar) {
      newErrors++;
      // Track the expected character that was missed (if it exists)
      if (expectedChar) {
        newMissedKeys = {
          ...newMissedKeys,
          [expectedChar]: (newMissedKeys[expectedChar] || 0) + 1,
        };
      }
    }

    // Update word
    const updatedWords = [...words];
    updatedWords[currentWordIndex] = {
      ...currentWord,
      typed: newInput,
      charStatuses: newCharStatuses,
    };

    set({
      words: updatedWords,
      currentInput: newInput,
      currentCharIndex: charIndex + 1,
      keystrokes: state.keystrokes + 1,
      errors: newErrors,
      missedKeys: newMissedKeys,
    });

    get().updateStats();

    // Quick End feature: end test immediately when last character is typed correctly
    const quickEnd = useConfigStore.getState().behavior.quickEnd;
    if (quickEnd) {
      const isLastWord = currentWordIndex === words.length - 1;
      const justTypedLastChar = newInput.length === currentWord.text.length;
      const lastCharCorrect = char === expectedChar;
      const wordFullyCorrect = newInput === currentWord.text;

      if (isLastWord && justTypedLastChar && lastCharCorrect && wordFullyCorrect) {
        // Mark the word as correct before ending
        const finalWords = [...updatedWords];
        finalWords[currentWordIndex] = {
          ...finalWords[currentWordIndex],
          isCorrect: true,
        };
        set({ words: finalWords });
        get().endTest();
      }
    }
  },

  handleBackspace: () => {
    const state = get();
    if (state.status !== 'running' && state.status !== 'waiting') return;

    const { words, currentWordIndex, currentInput } = state;

    if (currentInput.length === 0) {
      // Move to previous word if possible
      if (currentWordIndex > 0) {
        const prevWordIndex = currentWordIndex - 1;
        const prevWord = words[prevWordIndex];

        // Reset the previous word's isCorrect status so it can be edited again
        // This also clears the "missed" character styling in word-display
        const updatedWords = [...words];
        updatedWords[prevWordIndex] = {
          ...prevWord,
          isCorrect: null, // Reset correctness so user can continue editing
        };

        set({
          words: updatedWords,
          currentWordIndex: prevWordIndex,
          currentInput: prevWord.typed,
          currentCharIndex: prevWord.typed.length,
        });
      }
      return;
    }

    // Remove last character
    const newInput = currentInput.slice(0, -1);
    const currentWord = words[currentWordIndex];

    // Update character statuses
    const newCharStatuses = [...currentWord.charStatuses];
    if (currentInput.length <= currentWord.text.length) {
      newCharStatuses[currentInput.length - 1] = 'pending';
    }

    const updatedWords = [...words];
    updatedWords[currentWordIndex] = {
      ...currentWord,
      typed: newInput,
      charStatuses: newCharStatuses,
    };

    set({
      words: updatedWords,
      currentInput: newInput,
      currentCharIndex: newInput.length,
    });
  },

  handleDeleteWord: () => {
    const state = get();
    if (state.status !== 'running' && state.status !== 'waiting') return;

    const { words, currentWordIndex, currentInput } = state;

    if (currentInput.length === 0) {
      // At start of current word, move to previous word and clear it
      if (currentWordIndex > 0) {
        const prevWordIndex = currentWordIndex - 1;
        const prevWord = words[prevWordIndex];

        // Reset the previous word completely
        const updatedWords = [...words];
        updatedWords[prevWordIndex] = {
          ...prevWord,
          typed: '',
          isCorrect: null,
          charStatuses: new Array(prevWord.text.length).fill('pending'),
        };

        set({
          words: updatedWords,
          currentWordIndex: prevWordIndex,
          currentInput: '',
          currentCharIndex: 0,
        });
      }
      return;
    }

    // Clear the current word's input entirely
    const currentWord = words[currentWordIndex];
    const updatedWords = [...words];
    updatedWords[currentWordIndex] = {
      ...currentWord,
      typed: '',
      charStatuses: new Array(currentWord.text.length).fill('pending'),
    };

    set({
      words: updatedWords,
      currentInput: '',
      currentCharIndex: 0,
    });
  },

  handleDeleteLine: () => {
    const state = get();
    if (state.status !== 'running' && state.status !== 'waiting') return;

    const { words, originalWordStrings } = state;

    // Reset all words to their initial state
    const resetWords = originalWordStrings.map((text, index) => ({
      id: index,
      text,
      typed: '',
      isCorrect: null,
      charStatuses: new Array(text.length).fill('pending') as ('correct' | 'incorrect' | 'pending')[],
    }));

    // Keep the test running but reset progress
    // Note: We don't reset startTime, keystrokes, or errors to maintain test integrity
    set({
      words: resetWords,
      currentWordIndex: 0,
      currentCharIndex: 0,
      currentInput: '',
    });
  },

  handleSpace: () => {
    let state = get();

    // Start test on space if waiting
    if (state.status === 'waiting') {
      get().startTest();
      // Re-fetch state after starting test to get updated status
      state = get();
    }

    if (state.status !== 'running') return;

    const { words, currentWordIndex, currentInput } = state;
    const currentWord = words[currentWordIndex];

    if (!currentWord || currentInput.length === 0) return;

    // Mark word as correct or incorrect
    const isCorrect = currentInput === currentWord.text;

    const updatedWords = [...words];
    updatedWords[currentWordIndex] = {
      ...currentWord,
      typed: currentInput,
      isCorrect,
    };

    // Calculate burst WPM for this word
    const now = Date.now();
    let newBurstWpm = state.burstWpm;
    if (state.lastWordStartTime !== null) {
      const wordTimeMs = now - state.lastWordStartTime;
      if (wordTimeMs > 0) {
        // Burst WPM = (wordLength / 5) / (timeInMinutes)
        const wordLength = currentInput.length;
        const timeInMinutes = wordTimeMs / 60000;
        newBurstWpm = Math.round((wordLength / 5) / timeInMinutes);
      }
    }

    // Check if test should end (word mode)
    const nextWordIndex = currentWordIndex + 1;
    if (state.testMode === 'words' && nextWordIndex >= state.wordCount) {
      set({ words: updatedWords, burstWpm: newBurstWpm });
      get().endTest();
      return;
    }

    // Move to next word
    set({
      words: updatedWords,
      currentWordIndex: nextWordIndex,
      currentInput: '',
      currentCharIndex: 0,
      keystrokes: state.keystrokes + 1, // Count space as keystroke
      lastWordStartTime: now, // Reset for next word
      burstWpm: newBurstWpm,
    });

    get().updateStats();
  },

  updateStats: () => {
    const state = get();
    const { words, startTime, keystrokes, errors } = state;

    if (!startTime) return;

    const timeElapsed = (Date.now() - startTime) / 1000; // seconds
    if (timeElapsed === 0) return;

    let correctChars = 0;
    let incorrectChars = 0;
    let extraChars = 0;
    let missedChars = 0;
    let correctWords = 0;
    let incorrectWords = 0;

    words.forEach((word, index) => {
      if (index > state.currentWordIndex) return;

      const typed = word.typed;
      const original = word.text;

      // Character-level analysis
      for (let i = 0; i < Math.max(typed.length, original.length); i++) {
        if (i < typed.length && i < original.length) {
          if (typed[i] === original[i]) {
            correctChars++;
          } else {
            incorrectChars++;
          }
        } else if (i >= original.length) {
          extraChars++;
        } else {
          // Count missed characters for:
          // 1. Completed words (isCorrect is set) - user explicitly moved on with space
          // 2. Current word (index === currentWordIndex) - test ended mid-word or user is still typing
          if (word.isCorrect !== null || index === state.currentWordIndex) {
            missedChars++;
          }
        }
      }

      // Word-level analysis
      if (word.isCorrect === true) {
        correctWords++;
      } else if (word.isCorrect === false) {
        incorrectWords++;
      }
    });

    const totalChars = correctChars + incorrectChars + extraChars + missedChars;

    // WPM calculation (standard: 5 chars = 1 word)
    const minutes = timeElapsed / 60;
    const wpm = minutes > 0 ? Math.round((correctChars / 5) / minutes) : 0;
    const rawWpm = minutes > 0 ? Math.round((keystrokes / 5) / minutes) : 0;

    // Accuracy calculation
    const accuracy = keystrokes > 0
      ? Math.round(((keystrokes - errors) / keystrokes) * 100)
      : 100;

    // Consistency calculation (based on WPM variance in history)
    let consistency = 100;
    if (state.wpmHistory.length > 1) {
      const wpmValues = state.wpmHistory.map(s => s.wpm);
      const avgWpm = wpmValues.reduce((a, b) => a + b, 0) / wpmValues.length;
      const variance = wpmValues.reduce((sum, val) => sum + Math.pow(val - avgWpm, 2), 0) / wpmValues.length;
      const stdDev = Math.sqrt(variance);
      consistency = avgWpm > 0 ? Math.max(0, Math.round(100 - (stdDev / avgWpm) * 100)) : 100;
    }

    set({
      timeElapsed,
      stats: {
        wpm,
        rawWpm,
        accuracy,
        correctChars,
        incorrectChars,
        extraChars,
        missedChars,
        totalChars,
        correctWords,
        incorrectWords,
        consistency,
      },
    });
  },

  recordWpmSnapshot: () => {
    const { stats, wpmHistory, errors, timeElapsed } = get();

    const snapshot: WpmSnapshot = {
      timestamp: timeElapsed,
      wpm: stats.wpm,
      raw: stats.rawWpm,
      errors,
    };

    set({
      wpmHistory: [...wpmHistory, snapshot],
    });
  },

  updatePacemakerPosition: (targetWpm: number) => {
    const state = get();
    if (state.status !== 'running' || !state.startTime) return;

    // Calculate elapsed time in seconds
    const elapsedSeconds = (Date.now() - state.startTime) / 1000;

    // Formula: position = (targetWpm / 60) * 5 * elapsedSeconds
    // This gives characters per second based on WPM (where 1 word = 5 characters)
    const charactersPerSecond = (targetWpm / 60) * 5;
    const newPosition = charactersPerSecond * elapsedSeconds;

    // Calculate total characters in all words (including spaces between words)
    const totalChars = state.words.reduce((sum, word, index) => {
      // Add word length + 1 for space (except for last word)
      return sum + word.text.length + (index < state.words.length - 1 ? 1 : 0);
    }, 0);

    // Clamp position to not exceed total characters
    set({
      pacemakerPosition: Math.min(newPosition, totalChars),
    });
  },

  hideWord: (index: number) => {
    const state = get();
    if (index < 0 || index >= state.wordVisibility.length) return;

    const newVisibility = [...state.wordVisibility];
    newVisibility[index] = false;

    set({
      wordVisibility: newVisibility,
    });
  },

  tick: () => {
    const state = get();
    if (state.status !== 'running') return;

    const newTimeRemaining = state.timeRemaining - 1;
    const newTimeElapsed = state.timeElapsed + 1;

    // Record WPM snapshot every second
    get().recordWpmSnapshot();

    if (state.testMode === 'time' && newTimeRemaining <= 0) {
      set({ timeRemaining: 0, timeElapsed: newTimeElapsed });
      get().endTest();
      return;
    }

    set({
      timeRemaining: newTimeRemaining,
      timeElapsed: newTimeElapsed,
    });

    get().updateStats();
  },
}));
