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
  /** Prevent immediate word repeats (default: true) */
  preventRepeats?: boolean;
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

/** Number of recent words to track for repeat prevention */
const RECENT_WORDS_BUFFER_SIZE = 3;

/**
 * Select a random word from the list, avoiding recently used words.
 * Uses a simple retry approach for efficiency - if the randomly selected
 * word was recently used, try again (up to a maximum number of attempts).
 *
 * @param wordList - Available words to choose from
 * @param recentWords - Array of recently used words (base form, lowercase)
 * @param maxAttempts - Maximum selection attempts before accepting any word
 * @returns Selected word from the list
 */
function selectWordAvoidingRepeats(
  wordList: string[],
  recentWords: string[],
  maxAttempts: number = 10
): string {
  // If word list is too small, repeats are unavoidable
  if (wordList.length <= RECENT_WORDS_BUFFER_SIZE) {
    return wordList[Math.floor(Math.random() * wordList.length)];
  }

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const randomIndex = Math.floor(Math.random() * wordList.length);
    const word = wordList[randomIndex];

    // Check if this word was recently used
    if (!recentWords.includes(word)) {
      return word;
    }
  }

  // Fallback: return any random word if max attempts reached
  // This maintains performance even in edge cases
  return wordList[Math.floor(Math.random() * wordList.length)];
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
  const {
    punctuation = false,
    numbers = false,
    customWords,
    preventRepeats = true
  } = options;

  const wordList = getWordList(language, customWords);
  const result: string[] = [];
  let shouldCapitalizeNext = punctuation; // Start with capital if punctuation mode

  // Track recent words (base form, lowercase) for repeat prevention
  const recentWords: string[] = [];

  while (result.length < count) {
    // Occasionally insert a number if numbers option is enabled
    if (numbers && Math.random() < 0.1) {
      result.push(generateNumber());
      // Numbers don't affect capitalization state or recent words tracking
      continue;
    }

    // Pick a random word from the list, optionally avoiding repeats
    let word: string;
    if (preventRepeats) {
      word = selectWordAvoidingRepeats(wordList, recentWords);
      // Update recent words buffer (keep only last N words)
      recentWords.push(word);
      if (recentWords.length > RECENT_WORDS_BUFFER_SIZE) {
        recentWords.shift();
      }
    } else {
      const randomIndex = Math.floor(Math.random() * wordList.length);
      word = wordList[randomIndex];
    }

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

/**
 * Options for generating weakspot-focused words.
 */
export interface GenerateWeakspotWordsOptions {
  /** Include punctuation in generated words */
  punctuation?: boolean;
  /** Include numbers in generated words */
  numbers?: boolean;
  /** Minimum number of weak characters a word should contain to be prioritized */
  minWeakChars?: number;
}

/**
 * Calculate how many weak characters a word contains.
 *
 * @param word - Word to analyze
 * @param weakChars - Set of weak characters
 * @returns Count of weak characters in the word
 */
function countWeakCharsInWord(word: string, weakChars: Set<string>): number {
  let count = 0;
  for (const char of word.toLowerCase()) {
    if (weakChars.has(char)) {
      count++;
    }
  }
  return count;
}

/**
 * Generate words that focus on the user's weak characters.
 * Prioritizes words containing characters the user frequently misses.
 *
 * @param language - Language for word selection
 * @param count - Number of words to generate
 * @param weakspots - Array of weak characters (sorted by frequency, most missed first)
 * @param options - Generation options
 * @returns Array of generated words focusing on weak characters
 */
export function generateWeakspotWords(
  language: Language = "english",
  count: number = 50,
  weakspots: string[] = [],
  options: GenerateWeakspotWordsOptions = {}
): string[] {
  const {
    punctuation = false,
    numbers = false,
    minWeakChars = 1
  } = options;

  // If no weakspots, fall back to regular word generation
  if (weakspots.length === 0) {
    return generateWords(language, count, { punctuation, numbers });
  }

  const wordList = getWordList(language);
  const weakCharsSet = new Set(weakspots.map(c => c.toLowerCase()));

  // Score each word by how many weak characters it contains
  const scoredWords = wordList.map(word => ({
    word,
    score: countWeakCharsInWord(word, weakCharsSet)
  }));

  // Separate words with weak chars from words without
  const wordsWithWeakChars = scoredWords.filter(w => w.score >= minWeakChars);
  const wordsWithoutWeakChars = scoredWords.filter(w => w.score < minWeakChars);

  // Sort words with weak chars by score (descending) - more weak chars = higher priority
  wordsWithWeakChars.sort((a, b) => b.score - a.score);

  const result: string[] = [];
  let shouldCapitalizeNext = punctuation;
  const recentWords: string[] = [];

  // Use weighted selection: 80% from weak char words, 20% from regular words
  // This ensures variety while focusing on practice
  const weakCharRatio = 0.8;

  while (result.length < count) {
    // Occasionally insert a number if numbers option is enabled
    if (numbers && Math.random() < 0.1) {
      result.push(generateNumber());
      continue;
    }

    let selectedWord: string;

    // Select from weak char words or regular words based on ratio
    const useWeakCharWord = Math.random() < weakCharRatio && wordsWithWeakChars.length > 0;

    if (useWeakCharWord) {
      // Weighted selection from weak char words - higher score = higher chance
      // Use exponential weighting to strongly prefer words with more weak chars
      const totalWeight = wordsWithWeakChars.reduce((sum, w) => sum + Math.pow(w.score, 2), 0);
      let random = Math.random() * totalWeight;

      selectedWord = wordsWithWeakChars[0].word; // fallback
      for (const scored of wordsWithWeakChars) {
        random -= Math.pow(scored.score, 2);
        if (random <= 0) {
          selectedWord = scored.word;
          break;
        }
      }
    } else {
      // Select from regular words or all words if no weak char words
      const pool = wordsWithoutWeakChars.length > 0 ? wordsWithoutWeakChars : scoredWords;
      const randomIndex = Math.floor(Math.random() * pool.length);
      selectedWord = pool[randomIndex].word;
    }

    // Avoid immediate repeats
    if (recentWords.includes(selectedWord) && (wordsWithWeakChars.length + wordsWithoutWeakChars.length) > RECENT_WORDS_BUFFER_SIZE) {
      continue;
    }

    // Track recent words
    recentWords.push(selectedWord);
    if (recentWords.length > RECENT_WORDS_BUFFER_SIZE) {
      recentWords.shift();
    }

    let word = selectedWord;

    // Capitalize if needed
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

// ============================================================================
// BI-GRAM WORD GENERATION
// ============================================================================

/**
 * Extended word list for bi-gram mode
 * Contains more words to increase the chance of finding bi-gram matches
 */
const EXTENDED_ENGLISH_WORDS = [
  ...ENGLISH_WORDS,
  // Additional words containing common bi-grams
  "another", "weather", "whether", "either", "neither", "other", "rather", "father", "mother",
  "brother", "together", "feather", "leather", "gather", "lather", "hither", "thither", "whither",
  "there", "where", "here", "everywhere", "therefore", "thereafter", "thereby", "wherein", "wherever",
  "these", "those", "theme", "theory", "thermal", "therapy", "thesis", "theater", "theatre",
  "thing", "think", "thinking", "thinker", "thick", "thin", "thine", "third", "thirteen", "thirty",
  "through", "throughout", "throw", "thrown", "thrust", "thunder", "thursday", "thus", "threat",
  "three", "thresh", "thrill", "thrive", "throat", "throne", "throttle", "thumb", "thump",
  "inherit", "inherent", "inherited", "inhere", "adherent", "coherent", "herein", "hereby",
  "understand", "understanding", "standpoint", "standard", "standing", "outstanding", "withstand",
  "ending", "sending", "pending", "lending", "bending", "mending", "tending", "rending", "wending",
  "finder", "under", "wonder", "blunder", "plunder", "sunder", "asunder", "render",
  "tender", "slender", "gender", "vendor", "splendor", "surrender", "fender", "sender", "lender",
  "enter", "center", "central", "entire", "entry", "enterprise", "entertainment", "entertain",
  "intern", "internal", "internet", "interpret", "international", "interesting",
  "nation", "national", "natural", "station", "patience", "patient", "mention", "attention",
  "intention", "invention", "convention", "prevention", "retention", "portion", "position", "motion",
  "action", "reaction", "fraction", "traction", "attraction", "satisfaction", "section", "election",
  "selection", "direction", "correction", "protection", "collection", "connection", "infection",
  "suggestion", "digestion", "congestion", "western", "eastern", "northern",
  "southern", "yesterday", "festival", "testimony", "destiny", "estimate", "estate", "contest",
  "manifest", "honest", "harvest", "modest", "request",
  "restore", "store", "story", "history", "factory", "territory", "laboratory", "oratory",
  "order", "border", "disorder", "recorder", "corner", "porter", "reporter", "supporter", "shorter",
  "mortar", "portal", "mortal", "immortal", "normal", "formal", "informal",
  "telegram", "diagram", "grammar", "hammer", "manner", "banner", "scanner", "planner",
  "printer", "winter", "splinter", "mentor", "inventor", "interior", "exterior",
  "prior", "junior", "senior", "inferior", "superior", "warrior", "carrier", "barrier", "terrier",
  "character", "charter", "chapter", "capture", "rapture", "pasture", "gesture", "texture", "mixture",
  "picture", "structure", "lecture", "culture", "creature", "adventure",
  "quick", "queen", "quality", "quantity", "quiet", "quite", "quote",
  "require", "acquire", "inquire", "liquid", "frequent", "sequence", "consequence", "subsequent",
  "eloquent", "adequate", "equipment", "equivalent", "technique", "antique", "critique",
  "white", "whisper", "whistle", "wheel", "wheat", "whale", "whip", "whirl", "whole",
  "whom", "whose", "whenever", "whatever", "somewhat", "anywhere",
  "junction", "conjunction", "puncture", "punctual", "funnel", "funny", "fund", "funeral",
  "master", "plaster", "disaster", "faster", "blaster", "caster", "pastor",
  "track", "trick", "truck", "struck", "traffic", "training", "trail", "train", "trait", "trailer",
  "traveler", "traverse", "trap", "trash", "treasure", "treat", "treatment", "treaty",
  "tremendous", "trench", "trend", "trial", "triangle", "tribe", "tribute", "trigger",
  "trim", "trip", "triple", "triumph", "trivial", "troll", "trouble", "trousers", "true",
  "trumpet", "trunk", "trust", "truth", "progress", "project", "promise", "promote",
  "proof", "proper", "property", "propose", "protect", "protest", "proud", "prove", "provide",
  "province", "provision", "provoke", "classic", "classroom", "clause", "clean", "clear",
  "clerk", "clever", "click", "client", "cliff", "climate", "climb", "clinic", "clip", "clock",
  "closely", "closer", "closest", "cloth", "clothes", "clothing", "cloudy", "club",
  "coach", "coal", "coast", "coat", "coffee", "coin", "cold", "collapse",
  "collar", "colleague", "collective", "college", "collision", "colonel",
  "colonial", "colony", "colorful", "column", "combat", "combine", "comedy",
  "comfortable", "commander", "comment", "commerce", "commercial", "commission",
  "committee", "communicate", "communication", "community", "compact", "companion",
  "comparison", "compete", "competition", "competitive", "compile", "complain",
  "complaint", "completely", "complexity", "component", "compose", "composition",
  "variable", "various", "vary", "variety", "valley", "valid", "validate", "valuable",
  "arrange", "arrest", "arrival", "arrive", "arrow", "arsenal", "arson", "article", "artist"
];

/**
 * Count how many target bi-grams a word contains.
 *
 * @param word - Word to check
 * @param bigrams - Array of target bi-grams to look for
 * @returns Number of bi-grams found in the word
 */
function countBigramsInWord(word: string, bigrams: string[]): number {
  const lowerWord = word.toLowerCase();
  let count = 0;
  for (const bigram of bigrams) {
    // Count all occurrences of this bigram in the word
    let index = 0;
    while ((index = lowerWord.indexOf(bigram.toLowerCase(), index)) !== -1) {
      count++;
      index++; // Move forward to find overlapping matches
    }
  }
  return count;
}

/**
 * Check if a word contains at least one of the target bi-grams.
 *
 * @param word - Word to check
 * @param bigrams - Array of target bi-grams
 * @returns True if word contains at least one bi-gram
 */
function wordContainsBigram(word: string, bigrams: string[]): boolean {
  const lowerWord = word.toLowerCase();
  return bigrams.some((bigram) => lowerWord.includes(bigram.toLowerCase()));
}

export interface GenerateBigramWordsOptions extends GenerateWordsOptions {
  /** Minimum ratio of bi-gram words (0-1, default: 0.7) */
  bigramRatio?: number;
}

/**
 * Generate words that contain specific bi-grams for targeted typing practice.
 * Prioritizes words with multiple target bi-grams.
 *
 * @param bigrams - Array of target bi-grams to practice (e.g., ['th', 'he', 'in'])
 * @param language - Language for word selection
 * @param count - Number of words to generate
 * @param options - Generation options
 * @returns Array of generated words, prioritizing those with target bi-grams
 */
export function generateBigramWords(
  bigrams: string[],
  language: Language = "english",
  count: number = 50,
  options: GenerateBigramWordsOptions = {}
): string[] {
  const {
    punctuation = false,
    numbers = false,
    customWords,
    preventRepeats = true,
    bigramRatio = 0.7
  } = options;

  // If no bi-grams specified, fall back to regular word generation
  if (bigrams.length === 0) {
    return generateWords(language, count, options);
  }

  // Use extended word list for English to have more bi-gram options
  const baseWordList = language === "english"
    ? EXTENDED_ENGLISH_WORDS
    : getWordList(language, customWords);

  // Separate words into those with bi-grams and those without
  // Also score words by how many target bi-grams they contain
  const scoredBigramWords: { word: string; score: number }[] = [];
  const regularWords: string[] = [];

  for (const word of baseWordList) {
    const score = countBigramsInWord(word, bigrams);
    if (score > 0) {
      scoredBigramWords.push({ word, score });
    } else {
      regularWords.push(word);
    }
  }

  // Sort bi-gram words by score (highest first) for prioritization
  scoredBigramWords.sort((a, b) => b.score - a.score);
  const bigramWords = scoredBigramWords.map((item) => item.word);

  const result: string[] = [];
  let shouldCapitalizeNext = punctuation;
  const recentWords: string[] = [];

  // Calculate target number of bi-gram words
  const targetBigramCount = Math.floor(count * bigramRatio);

  while (result.length < count) {
    // Occasionally insert a number if numbers option is enabled
    if (numbers && Math.random() < 0.1) {
      result.push(generateNumber());
      continue;
    }

    // Determine if we should try to use a bi-gram word
    const bigramWordsAdded = result.filter((w) =>
      wordContainsBigram(w.replace(/[.,!?;:]/g, ''), bigrams)
    ).length;
    const shouldUseBigram = bigramWordsAdded < targetBigramCount && bigramWords.length > 0;

    let word: string;
    const wordPool = shouldUseBigram ? bigramWords : (regularWords.length > 0 ? regularWords : bigramWords);

    if (preventRepeats) {
      word = selectWordAvoidingRepeats(wordPool, recentWords);
      recentWords.push(word.toLowerCase());
      if (recentWords.length > RECENT_WORDS_BUFFER_SIZE) {
        recentWords.shift();
      }
    } else {
      const randomIndex = Math.floor(Math.random() * wordPool.length);
      word = wordPool[randomIndex];
    }

    // Capitalize if needed
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
 * Get all words from a word list that contain specific bi-grams.
 * Useful for previewing available words for a bi-gram set.
 *
 * @param bigrams - Array of target bi-grams
 * @param language - Language for word selection
 * @returns Array of words containing the specified bi-grams
 */
export function getWordsWithBigrams(
  bigrams: string[],
  language: Language = "english"
): string[] {
  const wordList = language === "english" ? EXTENDED_ENGLISH_WORDS : getWordList(language);
  return wordList.filter((word) => wordContainsBigram(word, bigrams));
}
