// Test-related type definitions

/**
 * Test mode configuration
 */
export type TestMode = 'time' | 'words' | 'quote' | 'zen' | 'custom';

/**
 * Quote length options
 */
export type QuoteLength = 'short' | 'medium' | 'long' | 'thicc' | 'all';

/**
 * Difficulty levels
 */
export type Difficulty = 'normal' | 'expert' | 'master';

/**
 * Configuration for a typing test
 */
export interface TestConfig {
  /** Test mode: time-based, word count, quote, zen, or custom */
  mode: TestMode;
  /** Time limit in seconds (for time mode) */
  timeLimit: number;
  /** Word limit (for words mode) */
  wordLimit: number;
  /** Quote length preference */
  quoteLength: QuoteLength;
  /** Language for word generation */
  language: string;
  /** Difficulty level */
  difficulty: Difficulty;
  /** Include punctuation in generated text */
  punctuation: boolean;
  /** Include numbers in generated text */
  numbers: boolean;
  /** Lazy mode: accept incorrect characters and continue */
  lazyMode: boolean;
  /** Blind mode: hide incorrect character indicators */
  blindMode: boolean;
  /** Stop on error: pause until error is corrected */
  stopOnError: 'off' | 'letter' | 'word';
  /** Confidence mode: disable backspace */
  confidenceMode: 'off' | 'on' | 'max';
}

/**
 * Status of a single character in the test
 */
export type CharacterStatus = 'pending' | 'correct' | 'incorrect' | 'extra' | 'missed';

/**
 * State of a single character
 */
export interface CharacterState {
  /** The expected character */
  char: string;
  /** Current status of this character */
  status: CharacterStatus;
  /** The character that was actually typed (if any) */
  typed: string | null;
}

/**
 * State of a single word in the test
 */
export interface WordState {
  /** The original word string */
  word: string;
  /** Array of character states for this word */
  characters: CharacterState[];
  /** Whether the user has moved past this word */
  isCompleted: boolean;
  /** Whether the word was typed correctly */
  isCorrect: boolean;
}

/**
 * Current status of the typing test
 */
export type TestStatus = 'idle' | 'ready' | 'running' | 'paused' | 'completed';

/**
 * Complete state of an ongoing typing test
 */
export interface TestState {
  /** Current test status */
  status: TestStatus;
  /** Test configuration */
  config: TestConfig;
  /** Array of all words in the test */
  words: WordState[];
  /** Index of the current word */
  currentWordIndex: number;
  /** Index of the current character within the current word */
  currentCharIndex: number;
  /** Current input value */
  input: string;
  /** Time elapsed in milliseconds */
  timeElapsed: number;
  /** Time remaining in milliseconds (for time mode) */
  timeRemaining: number;
  /** Timestamp when test started */
  startTime: number | null;
  /** Timestamp when test ended */
  endTime: number | null;
  /** Total keystrokes count */
  totalKeystrokes: number;
  /** Correct keystrokes count */
  correctKeystrokes: number;
  /** Incorrect keystrokes count */
  incorrectKeystrokes: number;
  /** Extra keystrokes count */
  extraKeystrokes: number;
  /** Missed keystrokes count */
  missedKeystrokes: number;
  /** Array of WPM values over time for live graph */
  wpmHistory: number[];
  /** Array of raw WPM values over time */
  rawWpmHistory: number[];
  /** Array of accuracy values over time */
  accuracyHistory: number[];
  /** Array of error positions for analysis */
  errorPositions: number[];
  /** Whether the test is currently active */
  isActive: boolean;
  /** Whether the test has been restarted */
  isRestarted: boolean;
}

/**
 * Result of a completed typing test (saved to database)
 */
export interface TestResult {
  /** Unique identifier */
  id: string;
  /** User ID who took the test */
  userId: string;
  /** Test mode used */
  mode: TestMode;
  /** Time limit if applicable */
  timeLimit: number | null;
  /** Word limit if applicable */
  wordLimit: number | null;
  /** Quote ID if quote mode */
  quoteId: string | null;
  /** Language used */
  language: string;
  /** Whether punctuation was enabled */
  punctuation: boolean;
  /** Whether numbers were enabled */
  numbers: boolean;
  /** Words per minute (adjusted) */
  wpm: number;
  /** Raw words per minute */
  rawWpm: number;
  /** Accuracy percentage (0-100) */
  accuracy: number;
  /** Consistency percentage (0-100) */
  consistency: number;
  /** Total characters typed */
  totalCharacters: number;
  /** Correct characters count */
  correctCharacters: number;
  /** Incorrect characters count */
  incorrectCharacters: number;
  /** Extra characters count */
  extraCharacters: number;
  /** Missed characters count */
  missedCharacters: number;
  /** Test duration in seconds */
  duration: number;
  /** WPM history for chart */
  wpmHistory: number[];
  /** Raw WPM history for chart */
  rawWpmHistory: number[];
  /** Accuracy history for chart */
  accuracyHistory: number[];
  /** Timestamp when test was completed */
  completedAt: string;
  /** Timestamp when record was created */
  createdAt: string;
}
