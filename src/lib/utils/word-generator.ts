/**
 * Word generation utilities for typing tests.
 */

// Common English words for typing tests (sorted by frequency)
const ENGLISH_WORDS = [
  "the", "be", "to", "of", "and", "a", "in", "that", "have", "i",
  "it", "for", "not", "on", "with", "he", "as", "you", "do", "at",
  "this", "but", "his", "by", "from", "they", "we", "say", "her", "she",
  "or", "an", "will", "my", "one", "all", "would", "there", "their", "what",
  "so", "up", "out", "if", "about", "who", "get", "which", "go", "me",
  "when", "make", "can", "like", "time", "no", "just", "him", "know", "take",
  "people", "into", "year", "your", "good", "some", "could", "them", "see", "other",
  "than", "then", "now", "look", "only", "come", "its", "over", "think", "also",
  "back", "after", "use", "two", "how", "our", "work", "first", "well", "way",
  "even", "new", "want", "because", "any", "these", "give", "day", "most", "us",
  "is", "was", "are", "been", "has", "had", "were", "said", "did", "get",
  "made", "find", "found", "may", "should", "must", "before", "more", "never", "very",
  "where", "much", "through", "here", "between", "life", "being", "same", "another", "while",
  "last", "might", "great", "old", "still", "own", "place", "end", "following", "three",
  "small", "set", "put", "home", "read", "hand", "large", "next", "world", "high"
];

// Programming-related words
const PROGRAMMING_WORDS = [
  "function", "const", "let", "var", "return", "if", "else", "for", "while", "class",
  "import", "export", "default", "async", "await", "try", "catch", "throw", "new", "this",
  "true", "false", "null", "undefined", "typeof", "instanceof", "delete", "void", "yield", "break",
  "continue", "switch", "case", "extends", "implements", "interface", "type", "enum", "static", "public",
  "private", "protected", "readonly", "abstract", "override", "super", "constructor", "get", "set", "module",
  "require", "package", "namespace", "declare", "global", "keyof", "infer", "never", "unknown", "any",
  "string", "number", "boolean", "object", "array", "map", "set", "promise", "observable", "iterator",
  "generator", "symbol", "bigint", "tuple", "record", "partial", "required", "pick", "omit", "exclude"
];

// Sample quotes for quote mode
const QUOTES = [
  {
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs",
    length: "short"
  },
  {
    text: "In the middle of difficulty lies opportunity.",
    author: "Albert Einstein",
    length: "short"
  },
  {
    text: "Life is what happens when you're busy making other plans.",
    author: "John Lennon",
    length: "short"
  },
  {
    text: "The future belongs to those who believe in the beauty of their dreams.",
    author: "Eleanor Roosevelt",
    length: "medium"
  },
  {
    text: "It is during our darkest moments that we must focus to see the light.",
    author: "Aristotle",
    length: "medium"
  },
  {
    text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    author: "Winston Churchill",
    length: "medium"
  },
  {
    text: "The greatest glory in living lies not in never falling, but in rising every time we fall.",
    author: "Nelson Mandela",
    length: "long"
  },
  {
    text: "In three words I can sum up everything I've learned about life: it goes on.",
    author: "Robert Frost",
    length: "medium"
  },
  {
    text: "Many of life's failures are people who did not realize how close they were to success when they gave up.",
    author: "Thomas Edison",
    length: "long"
  },
  {
    text: "You have brains in your head. You have feet in your shoes. You can steer yourself any direction you choose.",
    author: "Dr. Seuss",
    length: "long"
  }
];

export type Language = "english" | "programming" | "custom";
export type QuoteLength = "short" | "medium" | "long" | "all";

export interface GenerateWordsOptions {
  /** Include punctuation in generated words */
  punctuation?: boolean;
  /** Include numbers in generated words */
  numbers?: boolean;
  /** Custom word list to use */
  customWords?: string[];
  /** Seed for deterministic generation */
  seed?: number;
}

/**
 * Fisher-Yates shuffle algorithm for arrays.
 * Creates a new shuffled array without modifying the original.
 *
 * @param array - Array to shuffle
 * @returns New shuffled array
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Get word list for a specific language.
 *
 * @param language - Language to get words for
 * @param customWords - Custom words if language is "custom"
 * @returns Array of words
 */
function getWordList(language: Language, customWords?: string[]): string[] {
  switch (language) {
    case "english":
      return ENGLISH_WORDS;
    case "programming":
      return PROGRAMMING_WORDS;
    case "custom":
      return customWords && customWords.length > 0 ? customWords : ENGLISH_WORDS;
    default:
      return ENGLISH_WORDS;
  }
}

/**
 * Apply punctuation to a word randomly.
 *
 * @param word - Word to potentially add punctuation to
 * @returns Object with word and whether next word should be capitalized
 */
function applyPunctuation(word: string): { word: string; capitalizeNext: boolean } {
  const punctuationChance = 0.15;
  if (Math.random() > punctuationChance) {
    return { word, capitalizeNext: false };
  }

  const punctuationMarks = [".", ",", "!", "?", ";", ":"];
  const mark = punctuationMarks[Math.floor(Math.random() * punctuationMarks.length)];

  // Sentence-ending punctuation means next word should be capitalized
  const isSentenceEnding = [".", "!", "?"].includes(mark);

  return {
    word: word + mark,
    capitalizeNext: isSentenceEnding
  };
}

/**
 * Generate a random number string.
 *
 * @returns Random number string (1-4 digits)
 */
function generateNumber(): string {
  const length = Math.floor(Math.random() * 4) + 1;
  let num = "";
  for (let i = 0; i < length; i++) {
    num += Math.floor(Math.random() * 10).toString();
  }
  return num;
}

/**
 * Capitalize the first letter of a word.
 *
 * @param word - Word to capitalize
 * @returns Word with first letter capitalized
 */
function capitalizeFirst(word: string): string {
  if (word.length === 0) return word;
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/**
 * Generate an array of words for a typing test.
 *
 * @param language - Language for word selection
 * @param count - Number of words to generate
 * @param options - Generation options
 * @returns Array of generated words
 */
export function generateWords(
  language: Language = "english",
  count: number = 50,
  options: GenerateWordsOptions = {}
): string[] {
  const { punctuation = false, numbers = false, customWords } = options;

  const wordList = getWordList(language, customWords);
  const result: string[] = [];
  let shouldCapitalizeNext = punctuation; // Start with capital if punctuation mode

  while (result.length < count) {
    // Occasionally insert a number if numbers option is enabled
    if (numbers && Math.random() < 0.1) {
      result.push(generateNumber());
      // Numbers don't affect capitalization state
      continue;
    }

    // Pick a random word from the list
    const randomIndex = Math.floor(Math.random() * wordList.length);
    let word = wordList[randomIndex];

    // Capitalize if needed (after sentence-ending punctuation or first word)
    if (shouldCapitalizeNext) {
      word = capitalizeFirst(word);
      shouldCapitalizeNext = false;
    }

    // Apply punctuation if enabled
    if (punctuation) {
      const punctResult = applyPunctuation(word);
      word = punctResult.word;
      shouldCapitalizeNext = punctResult.capitalizeNext;
    }

    result.push(word);
  }

  return result;
}

/**
 * Generate a quote for quote mode typing test.
 *
 * @param length - Preferred quote length
 * @returns Quote object with text and author
 */
export function generateQuote(length: QuoteLength = "all"): { text: string; author: string } {
  let filteredQuotes = QUOTES;

  if (length !== "all") {
    filteredQuotes = QUOTES.filter((quote) => quote.length === length);
  }

  if (filteredQuotes.length === 0) {
    filteredQuotes = QUOTES;
  }

  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  const quote = filteredQuotes[randomIndex];

  return {
    text: quote.text,
    author: quote.author
  };
}

/**
 * Get all available quotes.
 *
 * @returns Array of all quotes
 */
export function getAllQuotes(): Array<{ text: string; author: string; length: string }> {
  return [...QUOTES];
}

/**
 * Add custom words to the generator.
 * Useful for user-defined word lists.
 *
 * @param words - Array of words to add
 * @param language - Language category to add to
 */
export function createCustomWordList(words: string[]): string[] {
  // Filter out empty strings and trim whitespace
  return words
    .map((word) => word.trim().toLowerCase())
    .filter((word) => word.length > 0);
}
