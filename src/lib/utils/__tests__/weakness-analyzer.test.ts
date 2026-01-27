import { describe, it, expect } from 'vitest'
import { analyzeWeaknesses, getWeaknessSummary, type WeaknessReport } from '@/lib/utils/weakness-analyzer'

interface KeystrokeData {
  key_char: string
  is_correct: boolean
  timestamp_ms: number
}

function createKeystroke(key_char: string, is_correct: boolean, timestamp_ms: number): KeystrokeData {
  return { key_char, is_correct, timestamp_ms }
}

// =============================================================================
// analyzeWeaknesses
// =============================================================================
describe('analyzeWeaknesses', () => {
  it('should return a valid report structure', () => {
    const keystrokes: KeystrokeData[] = [
      createKeystroke('h', true, 0),
      createKeystroke('e', true, 100),
      createKeystroke('l', true, 200),
      createKeystroke('l', true, 300),
      createKeystroke('o', true, 400),
    ]

    const report = analyzeWeaknesses(keystrokes)

    expect(report).toHaveProperty('weakKeys')
    expect(report).toHaveProperty('weakBigrams')
    expect(report).toHaveProperty('slowestKeys')
    expect(report).toHaveProperty('overallErrorRate')
    expect(report).toHaveProperty('suggestedFocus')
    expect(report).toHaveProperty('practiceWords')
  })

  it('should handle empty keystroke array', () => {
    const report = analyzeWeaknesses([])

    expect(report.weakKeys).toEqual([])
    expect(report.weakBigrams).toEqual([])
    expect(report.slowestKeys).toEqual([])
    expect(report.overallErrorRate).toBe(0)
    expect(report.suggestedFocus).toEqual([])
    expect(report.practiceWords.length).toBeGreaterThan(0) // defaults are added
  })

  it('should identify weak keys based on error rate', () => {
    const keystrokes: KeystrokeData[] = [
      // 'a' is always correct
      createKeystroke('a', true, 0),
      createKeystroke('a', true, 100),
      createKeystroke('a', true, 200),
      createKeystroke('a', true, 300),
      // 'z' is always incorrect
      createKeystroke('z', false, 400),
      createKeystroke('z', false, 500),
      createKeystroke('z', false, 600),
      createKeystroke('z', false, 700),
    ]

    const report = analyzeWeaknesses(keystrokes)

    // 'z' should have a higher error rate than 'a'
    const zKey = report.weakKeys.find(k => k.key === 'z')
    const aKey = report.weakKeys.find(k => k.key === 'a')

    expect(zKey).toBeDefined()
    expect(zKey!.errorRate).toBe(1) // 100% error rate
    if (aKey) {
      expect(aKey.errorRate).toBe(0) // 0% error rate
    }
  })

  it('should identify slow keys based on average speed', () => {
    const keystrokes: KeystrokeData[] = [
      createKeystroke('a', true, 0),
      createKeystroke('a', true, 50),   // fast
      createKeystroke('a', true, 100),  // fast
      createKeystroke('a', true, 150),  // fast
      createKeystroke('z', true, 200),
      createKeystroke('z', true, 500),  // slow (300ms gap)
      createKeystroke('z', true, 800),  // slow (300ms gap)
      createKeystroke('z', true, 1100), // slow (300ms gap)
    ]

    const report = analyzeWeaknesses(keystrokes)

    const zKey = report.slowestKeys.find(k => k.key === 'z')
    const aKey = report.slowestKeys.find(k => k.key === 'a')

    expect(zKey).toBeDefined()
    expect(aKey).toBeDefined()
    // 'z' should be slower on average than 'a'
    expect(zKey!.avgSpeed).toBeGreaterThan(aKey!.avgSpeed)
  })

  it('should analyze bigrams correctly', () => {
    const keystrokes: KeystrokeData[] = [
      createKeystroke('t', true, 0),
      createKeystroke('h', true, 100), // "th" bigram - correct
      createKeystroke('e', true, 200), // "he" bigram - correct
      createKeystroke(' ', true, 300),
      createKeystroke('t', true, 400),
      createKeystroke('h', false, 500), // "th" bigram - error
      createKeystroke('e', true, 600), // "he" bigram - correct
    ]

    const report = analyzeWeaknesses(keystrokes)

    const thBigram = report.weakBigrams.find(b => b.bigram === 'th')
    expect(thBigram).toBeDefined()
    // 'th' should have 1 correct and 1 incorrect = 50% error rate
    expect(thBigram!.errorRate).toBe(0.5)
  })

  it('should skip spaces in bigram analysis', () => {
    const keystrokes: KeystrokeData[] = [
      createKeystroke('a', true, 0),
      createKeystroke(' ', true, 100),
      createKeystroke('b', true, 200),
    ]

    const report = analyzeWeaknesses(keystrokes)

    // There should be no "a " or " b" bigrams
    const hasSpaceBigram = report.weakBigrams.some(b =>
      b.bigram.includes(' ')
    )
    expect(hasSpaceBigram).toBe(false)
  })

  it('should calculate overall error rate', () => {
    const keystrokes: KeystrokeData[] = [
      createKeystroke('a', true, 0),
      createKeystroke('b', true, 100),
      createKeystroke('c', false, 200),
      createKeystroke('d', false, 300),
    ]

    const report = analyzeWeaknesses(keystrokes)
    // 2 incorrect out of 4 = 0.5
    expect(report.overallErrorRate).toBe(0.5)
  })

  it('should limit weak keys to top 15', () => {
    // Create keystrokes for many different keys
    const keystrokes: KeystrokeData[] = []
    const letters = 'abcdefghijklmnopqrstuvwxyz'
    let time = 0
    for (const letter of letters) {
      for (let i = 0; i < 5; i++) {
        keystrokes.push(createKeystroke(letter, i % 2 === 0, time))
        time += 100
      }
    }

    const report = analyzeWeaknesses(keystrokes)
    expect(report.weakKeys.length).toBeLessThanOrEqual(15)
    expect(report.slowestKeys.length).toBeLessThanOrEqual(15)
    expect(report.weakBigrams.length).toBeLessThanOrEqual(15)
  })

  it('should generate suggested focus keys from weakest keys', () => {
    const keystrokes: KeystrokeData[] = [
      // 'x' with high error rate
      createKeystroke('x', false, 0),
      createKeystroke('x', false, 100),
      createKeystroke('x', false, 200),
      // 'a' with no errors
      createKeystroke('a', true, 300),
      createKeystroke('a', true, 400),
      createKeystroke('a', true, 500),
    ]

    const report = analyzeWeaknesses(keystrokes)
    expect(report.suggestedFocus).toContain('x')
  })

  it('should generate practice words', () => {
    const keystrokes: KeystrokeData[] = [
      createKeystroke('q', false, 0),
      createKeystroke('q', false, 100),
      createKeystroke('q', false, 200),
      createKeystroke('a', true, 300),
      createKeystroke('a', true, 400),
      createKeystroke('a', true, 500),
    ]

    const report = analyzeWeaknesses(keystrokes)
    expect(report.practiceWords.length).toBeGreaterThan(0)
    // Should include words with 'q' since it's a weak key
    const hasQWord = report.practiceWords.some(w => w.includes('q'))
    expect(hasQWord).toBe(true)
  })

  it('should skip keys that are not single characters', () => {
    const keystrokes: KeystrokeData[] = [
      createKeystroke('Shift', true, 0),
      createKeystroke('a', true, 100),
      createKeystroke('Control', true, 200),
      createKeystroke('b', true, 300),
    ]

    const report = analyzeWeaknesses(keystrokes)
    const hasShift = report.weakKeys.some(k => k.key === 'shift')
    expect(hasShift).toBe(false)
  })

  it('should ignore keys with sample size below threshold', () => {
    const keystrokes: KeystrokeData[] = [
      // Only 2 'z' keystrokes - below minimum of 3
      createKeystroke('z', false, 0),
      createKeystroke('z', false, 100),
      // 4 'a' keystrokes - above minimum
      createKeystroke('a', true, 200),
      createKeystroke('a', true, 300),
      createKeystroke('a', true, 400),
      createKeystroke('a', false, 500),
    ]

    const report = analyzeWeaknesses(keystrokes)
    const zKey = report.weakKeys.find(k => k.key === 'z')
    // 'z' should be excluded due to low sample size
    expect(zKey).toBeUndefined()
  })

  it('should ignore very slow keypresses (> 2000ms) in speed calculation', () => {
    const keystrokes: KeystrokeData[] = [
      createKeystroke('a', true, 0),
      createKeystroke('a', true, 100),   // 100ms - counted
      createKeystroke('a', true, 200),   // 100ms - counted
      createKeystroke('a', true, 3000),  // 2800ms - ignored (> 2000)
    ]

    const report = analyzeWeaknesses(keystrokes)
    const aKey = report.slowestKeys.find(k => k.key === 'a')
    expect(aKey).toBeDefined()
    // Average should be ~100ms, not inflated by the 2800ms gap
    expect(aKey!.avgSpeed).toBeLessThan(200)
  })
})

// =============================================================================
// getWeaknessSummary
// =============================================================================
describe('getWeaknessSummary', () => {
  it('should return a summary string with weak keys', () => {
    const report: WeaknessReport = {
      weakKeys: [
        { key: 'z', errorRate: 0.8, avgSpeed: 200, sampleSize: 10 },
        { key: 'x', errorRate: 0.6, avgSpeed: 180, sampleSize: 8 },
        { key: 'q', errorRate: 0.5, avgSpeed: 150, sampleSize: 5 },
      ],
      weakBigrams: [],
      slowestKeys: [],
      overallErrorRate: 0.3,
      suggestedFocus: ['z', 'x', 'q'],
      practiceWords: [],
    }

    const summary = getWeaknessSummary(report)
    expect(summary).toContain('Weakest keys: Z, X, Q')
  })

  it('should include slowest keys in summary', () => {
    const report: WeaknessReport = {
      weakKeys: [],
      weakBigrams: [],
      slowestKeys: [
        { key: 'p', errorRate: 0.2, avgSpeed: 500, sampleSize: 10 },
        { key: 'b', errorRate: 0.1, avgSpeed: 400, sampleSize: 8 },
      ],
      overallErrorRate: 0.1,
      suggestedFocus: [],
      practiceWords: [],
    }

    const summary = getWeaknessSummary(report)
    expect(summary).toContain('Slowest keys: P, B')
  })

  it('should include weak bigrams in summary', () => {
    const report: WeaknessReport = {
      weakKeys: [],
      weakBigrams: [
        { bigram: 'th', errorRate: 0.4, avgSpeed: 200, sampleSize: 10 },
        { bigram: 'qu', errorRate: 0.3, avgSpeed: 180, sampleSize: 5 },
      ],
      slowestKeys: [],
      overallErrorRate: 0.2,
      suggestedFocus: [],
      practiceWords: [],
    }

    const summary = getWeaknessSummary(report)
    expect(summary).toContain('Weak combinations: "th", "qu"')
  })

  it('should return empty string when no weaknesses', () => {
    const report: WeaknessReport = {
      weakKeys: [],
      weakBigrams: [],
      slowestKeys: [],
      overallErrorRate: 0,
      suggestedFocus: [],
      practiceWords: [],
    }

    const summary = getWeaknessSummary(report)
    expect(summary).toBe('')
  })

  it('should separate sections with pipe character', () => {
    const report: WeaknessReport = {
      weakKeys: [
        { key: 'z', errorRate: 0.5, avgSpeed: 200, sampleSize: 5 },
      ],
      weakBigrams: [
        { bigram: 'th', errorRate: 0.3, avgSpeed: 200, sampleSize: 5 },
      ],
      slowestKeys: [
        { key: 'p', errorRate: 0.1, avgSpeed: 500, sampleSize: 5 },
      ],
      overallErrorRate: 0.2,
      suggestedFocus: ['z'],
      practiceWords: [],
    }

    const summary = getWeaknessSummary(report)
    expect(summary).toContain(' | ')
    const parts = summary.split(' | ')
    expect(parts.length).toBe(3)
  })
})
