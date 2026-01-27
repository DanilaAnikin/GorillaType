/**
 * Utility functions for Gorilla Type
 */

// Class name utility
export { cn } from "./cn";

// Calculation utilities
export {
  calculateWPM,
  calculateRawWPM,
  calculateAccuracy,
  calculateConsistency,
  validateResult,
  calculateXP,
  type TestResult
} from "./calculations";

// Word generation utilities
export {
  generateWords,
  generateQuote,
  getAllQuotes,
  shuffleArray,
  createCustomWordList,
  type Language,
  type QuoteLength,
  type GenerateWordsOptions
} from "./word-generator";

// Validation utilities
export {
  validateUsername,
  validateEmail,
  validatePassword,
  validateMatch,
  validateNumber,
  validateTestDuration,
  validateWordCount,
  validateCustomWords,
  sanitizeInput,
  type ValidationResult
} from "./validation";

// Formatting utilities
export {
  formatTime,
  formatNumber,
  formatPercentage,
  formatWPM,
  formatDate,
  formatRelativeTime,
  formatBytes,
  formatOrdinal,
  truncateText
} from "./formatting";

// Keyboard layout utilities
export {
  QWERTY_LAYOUT,
  DVORAK_LAYOUT,
  COLEMAK_LAYOUT,
  WORKMAN_LAYOUT,
  getKeyboardLayout,
  getKeyForChar,
  keyExistsInLayout,
  SHIFT_MAP,
  type KeymapLayoutType,
  type KeyDefinition,
  type KeyboardRow,
  type KeyboardLayout
} from "./keyboard-layouts";
