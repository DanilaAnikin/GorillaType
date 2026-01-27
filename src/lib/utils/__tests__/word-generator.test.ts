import { describe, it, expect } from 'vitest'
import {
  shuffleArray,
  generateWords,
  generateQuote,
  getAllQuotes,
  createCustomWordList,
  generateWeakspotWords,
  generateBigramWords,
  getWordsWithBigrams,
  generateFromCustomList,
} from '@/lib/utils/word-generator'

// =============================================================================
// shuffleArray
// =============================================================================
describe('shuffleArray', () => {
  it('should return a new array with the same elements', () => {
    const original = [1, 2, 3, 4, 5]
    const shuffled = shuffleArray(original)
    expect(shuffled).toHaveLength(original.length)
    expect(shuffled.sort()).toEqual(original.sort())
  })

  it('should not modify the original array', () => {
    const original = [1, 2, 3, 4, 5]
    const copy = [...original]
    shuffleArray(original)
    expect(original).toEqual(copy)
  })

  it('should return an empty array for empty input', () => {
    expect(shuffleArray([])).toEqual([])
  })

  it('should return a single-element array unchanged', () => {
    expect(shuffleArray([42])).toEqual([42])
  })

  it('should work with string arrays', () => {
    const words = ['the', 'quick', 'brown', 'fox']
    const shuffled = shuffleArray(words)
    expect(shuffled).toHaveLength(words.length)
    expect(shuffled.sort()).toEqual([...words].sort())
  })
})

// =============================================================================
// generateWords
// =============================================================================
describe('generateWords', () => {
  it('should return the correct number of words', () => {
    const words = generateWords('english', 50)
    expect(words).toHaveLength(50)
  })

  it('should return strings', () => {
    const words = generateWords('english', 10)
    words.forEach(word => {
      expect(typeof word).toBe('string')
      expect(word.length).toBeGreaterThan(0)
    })
  })

  it('should default to 50 words and english language', () => {
    const words = generateWords()
    expect(words).toHaveLength(50)
  })

  it('should generate programming words', () => {
    const words = generateWords('programming', 20)
    expect(words).toHaveLength(20)
    // Programming words should include known programming keywords
    words.forEach(word => {
      expect(typeof word).toBe('string')
    })
  })

  it('should handle count of 1', () => {
    const words = generateWords('english', 1)
    expect(words).toHaveLength(1)
  })

  it('should handle large count', () => {
    const words = generateWords('english', 200)
    expect(words).toHaveLength(200)
  })

  it('should capitalize first word when punctuation is enabled', () => {
    const words = generateWords('english', 10, { punctuation: true })
    expect(words).toHaveLength(10)
    // First word should start with uppercase
    expect(words[0][0]).toBe(words[0][0].toUpperCase())
  })

  it('should include numbers when numbers option is enabled', () => {
    // Generate a lot of words to ensure numbers appear
    const words = generateWords('english', 200, { numbers: true })
    // At least some should be numeric
    const hasNumber = words.some(w => /^\d+$/.test(w))
    expect(hasNumber).toBe(true)
  })

  it('should use custom words when provided', () => {
    const customWords = ['alpha', 'beta', 'gamma', 'delta', 'epsilon']
    const words = generateWords('custom', 20, { customWords })
    words.forEach(word => {
      expect(customWords).toContain(word)
    })
  })

  it('should fall back to english words for custom language without custom words', () => {
    const words = generateWords('custom', 10)
    expect(words).toHaveLength(10)
    // Should still produce words (falls back to ENGLISH_WORDS)
    words.forEach(word => {
      expect(typeof word).toBe('string')
    })
  })

  it('should prevent immediate repeats by default', () => {
    // With preventRepeats (default), consecutive words should generally differ.
    // Since the word list is large, run multiple times
    const words = generateWords('english', 30)
    let consecutiveRepeats = 0
    for (let i = 1; i < words.length; i++) {
      if (words[i].toLowerCase() === words[i - 1].toLowerCase()) {
        consecutiveRepeats++
      }
    }
    // There should be very few (if any) consecutive repeats
    expect(consecutiveRepeats).toBeLessThan(3)
  })
})

// =============================================================================
// generateQuote
// =============================================================================
describe('generateQuote', () => {
  it('should return an object with text and author', () => {
    const quote = generateQuote()
    expect(quote).toHaveProperty('text')
    expect(quote).toHaveProperty('author')
    expect(typeof quote.text).toBe('string')
    expect(typeof quote.author).toBe('string')
  })

  it('should return a short quote when requested', () => {
    const quote = generateQuote('short')
    expect(quote.text.length).toBeGreaterThan(0)
    expect(quote.author.length).toBeGreaterThan(0)
  })

  it('should return a medium quote when requested', () => {
    const quote = generateQuote('medium')
    expect(quote.text.length).toBeGreaterThan(0)
  })

  it('should return a long quote when requested', () => {
    const quote = generateQuote('long')
    expect(quote.text.length).toBeGreaterThan(0)
  })

  it('should return a quote for "all" length', () => {
    const quote = generateQuote('all')
    expect(quote.text.length).toBeGreaterThan(0)
  })

  it('should always return a non-empty text', () => {
    // Run multiple times to test randomness
    for (let i = 0; i < 10; i++) {
      const quote = generateQuote()
      expect(quote.text.length).toBeGreaterThan(0)
    }
  })
})

// =============================================================================
// getAllQuotes
// =============================================================================
describe('getAllQuotes', () => {
  it('should return an array of quotes', () => {
    const quotes = getAllQuotes()
    expect(Array.isArray(quotes)).toBe(true)
    expect(quotes.length).toBeGreaterThan(0)
  })

  it('should return quotes with text, author, and length properties', () => {
    const quotes = getAllQuotes()
    quotes.forEach(quote => {
      expect(quote).toHaveProperty('text')
      expect(quote).toHaveProperty('author')
      expect(quote).toHaveProperty('length')
    })
  })

  it('should return a copy (not the original array)', () => {
    const quotes1 = getAllQuotes()
    const quotes2 = getAllQuotes()
    expect(quotes1).not.toBe(quotes2)
    expect(quotes1).toEqual(quotes2)
  })
})

// =============================================================================
// createCustomWordList
// =============================================================================
describe('createCustomWordList', () => {
  it('should trim and lowercase words', () => {
    const result = createCustomWordList(['  Hello  ', '  World  '])
    expect(result).toEqual(['hello', 'world'])
  })

  it('should filter out empty strings after trimming', () => {
    const result = createCustomWordList(['hello', '  ', '', 'world'])
    expect(result).toEqual(['hello', 'world'])
  })

  it('should return empty array for all-empty input', () => {
    const result = createCustomWordList(['', '  ', '   '])
    expect(result).toEqual([])
  })

  it('should handle an empty array', () => {
    expect(createCustomWordList([])).toEqual([])
  })

  it('should lowercase all words', () => {
    const result = createCustomWordList(['HELLO', 'WORLD', 'Test'])
    expect(result).toEqual(['hello', 'world', 'test'])
  })
})

// =============================================================================
// generateWeakspotWords
// =============================================================================
describe('generateWeakspotWords', () => {
  it('should generate the correct number of words', () => {
    const words = generateWeakspotWords('english', 30, ['e', 'r', 't'])
    expect(words).toHaveLength(30)
  })

  it('should fall back to regular generation when no weakspots provided', () => {
    const words = generateWeakspotWords('english', 20, [])
    expect(words).toHaveLength(20)
    words.forEach(word => {
      expect(typeof word).toBe('string')
    })
  })

  it('should prioritize words containing weak characters', () => {
    const weakChars = ['z', 'x', 'q']
    const words = generateWeakspotWords('english', 50, weakChars)
    // Many words should contain at least one of z, x, q
    const containsWeakChar = words.filter(w =>
      weakChars.some(c => w.toLowerCase().includes(c))
    )
    // With 80% ratio, at least some should have weak chars
    expect(containsWeakChar.length).toBeGreaterThan(0)
  })

  it('should handle punctuation option', () => {
    const words = generateWeakspotWords('english', 10, ['e'], { punctuation: true })
    expect(words).toHaveLength(10)
    // First word should be capitalized when punctuation is on
    expect(words[0][0]).toBe(words[0][0].toUpperCase())
  })

  it('should return strings for all words', () => {
    const words = generateWeakspotWords('english', 20, ['a', 'b'])
    words.forEach(word => {
      expect(typeof word).toBe('string')
      expect(word.length).toBeGreaterThan(0)
    })
  })
})

// =============================================================================
// generateBigramWords
// =============================================================================
describe('generateBigramWords', () => {
  it('should generate the correct number of words', () => {
    const words = generateBigramWords(['th', 'he'], 'english', 30)
    expect(words).toHaveLength(30)
  })

  it('should fall back to regular generation when no bigrams provided', () => {
    const words = generateBigramWords([], 'english', 20)
    expect(words).toHaveLength(20)
  })

  it('should prioritize words containing target bigrams', () => {
    const bigrams = ['th', 'he']
    const words = generateBigramWords(bigrams, 'english', 50)
    // Many words should contain "th" or "he"
    const containsBigram = words.filter(w =>
      bigrams.some(bg => w.toLowerCase().includes(bg))
    )
    // With default 0.7 ratio, expect a majority to contain bigrams
    expect(containsBigram.length).toBeGreaterThan(20)
  })

  it('should respect bigramRatio option', () => {
    const bigrams = ['th']
    const words = generateBigramWords(bigrams, 'english', 50, { bigramRatio: 1.0 })
    // With ratio 1.0, nearly all words should contain "th"
    const containsBigram = words.filter(w => w.toLowerCase().includes('th'))
    expect(containsBigram.length).toBeGreaterThan(30)
  })

  it('should handle programming language', () => {
    const words = generateBigramWords(['re', 'fu'], 'programming', 20)
    expect(words).toHaveLength(20)
  })

  it('should return only strings', () => {
    const words = generateBigramWords(['th', 'in'], 'english', 20)
    words.forEach(word => {
      expect(typeof word).toBe('string')
      expect(word.length).toBeGreaterThan(0)
    })
  })
})

// =============================================================================
// getWordsWithBigrams
// =============================================================================
describe('getWordsWithBigrams', () => {
  it('should return words that contain the specified bigrams', () => {
    const words = getWordsWithBigrams(['th'])
    expect(words.length).toBeGreaterThan(0)
    words.forEach(word => {
      expect(word.toLowerCase()).toContain('th')
    })
  })

  it('should return words for multiple bigrams', () => {
    const words = getWordsWithBigrams(['th', 'qu'])
    expect(words.length).toBeGreaterThan(0)
    words.forEach(word => {
      const lower = word.toLowerCase()
      expect(lower.includes('th') || lower.includes('qu')).toBe(true)
    })
  })

  it('should return empty array for impossible bigrams', () => {
    const words = getWordsWithBigrams(['zzzz'])
    expect(words).toHaveLength(0)
  })

  it('should work with programming language', () => {
    const words = getWordsWithBigrams(['fu'], 'programming')
    expect(words.length).toBeGreaterThan(0)
    // "function" should contain "fu"
    expect(words.some(w => w.toLowerCase().includes('fu'))).toBe(true)
  })
})

// =============================================================================
// generateFromCustomList
// =============================================================================
describe('generateFromCustomList', () => {
  it('should return the specified count of words', () => {
    const words = generateFromCustomList(['apple', 'banana', 'cherry'], 10)
    expect(words).toHaveLength(10)
  })

  it('should return words only from the provided list', () => {
    const customList = ['alpha', 'beta', 'gamma']
    const words = generateFromCustomList(customList, 20)
    words.forEach(word => {
      expect(customList).toContain(word)
    })
  })

  it('should return empty array for empty input', () => {
    expect(generateFromCustomList([], 10)).toEqual([])
  })

  it('should handle single-word list', () => {
    const words = generateFromCustomList(['only'], 5)
    expect(words).toHaveLength(5)
    words.forEach(word => {
      expect(word).toBe('only')
    })
  })

  it('should handle count of 0', () => {
    const words = generateFromCustomList(['a', 'b'], 0)
    expect(words).toHaveLength(0)
  })
})
