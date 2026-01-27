import { describe, it, expect } from 'vitest'
import {
  calculateWPM,
  calculateRawWPM,
  calculateAccuracy,
  calculateConsistency,
  calculateXP,
  validateResult,
} from '@/lib/utils/calculations'

// =============================================================================
// calculateWPM
// =============================================================================
describe('calculateWPM', () => {
  it('should calculate WPM correctly for normal input', () => {
    // 250 correct chars in 60 seconds = 250/5 = 50 words in 1 minute = 50 WPM
    expect(calculateWPM(250, 60)).toBe(50)
  })

  it('should return 0 when seconds is 0', () => {
    expect(calculateWPM(100, 0)).toBe(0)
  })

  it('should return 0 when seconds is negative', () => {
    expect(calculateWPM(100, -5)).toBe(0)
  })

  it('should return 0 when correctChars is 0', () => {
    expect(calculateWPM(0, 60)).toBe(0)
  })

  it('should handle large numbers correctly', () => {
    // 5000 correct chars in 60 seconds = 1000 WPM
    expect(calculateWPM(5000, 60)).toBe(1000)
  })

  it('should round the result to the nearest integer', () => {
    // 17 chars in 60s = 17/5 / 1 = 3.4 -> rounds to 3
    expect(calculateWPM(17, 60)).toBe(3)
    // 18 chars in 60s = 18/5 / 1 = 3.6 -> rounds to 4
    expect(calculateWPM(18, 60)).toBe(4)
  })

  it('should handle partial-minute durations', () => {
    // 250 correct chars in 30 seconds = 250/5 / 0.5 = 100 WPM
    expect(calculateWPM(250, 30)).toBe(100)
  })

  it('should never return negative values', () => {
    // Even with negative correctChars the function uses Math.max(0, ...)
    expect(calculateWPM(-10, 60)).toBe(0)
  })
})

// =============================================================================
// calculateRawWPM
// =============================================================================
describe('calculateRawWPM', () => {
  it('should calculate raw WPM correctly for normal input', () => {
    // 300 total chars in 60 seconds = 300/5 = 60 words in 1 minute = 60 WPM
    expect(calculateRawWPM(300, 60)).toBe(60)
  })

  it('should return 0 when seconds is 0', () => {
    expect(calculateRawWPM(200, 0)).toBe(0)
  })

  it('should return 0 when seconds is negative', () => {
    expect(calculateRawWPM(200, -10)).toBe(0)
  })

  it('should return 0 when totalChars is 0', () => {
    expect(calculateRawWPM(0, 60)).toBe(0)
  })

  it('should handle large numbers of total characters', () => {
    expect(calculateRawWPM(6000, 60)).toBe(1200)
  })

  it('should round to the nearest integer', () => {
    // 13 chars in 60s = 13/5 / 1 = 2.6 -> rounds to 3
    expect(calculateRawWPM(13, 60)).toBe(3)
  })
})

// =============================================================================
// calculateAccuracy
// =============================================================================
describe('calculateAccuracy', () => {
  it('should return 100% when all characters are correct', () => {
    expect(calculateAccuracy(100, 100)).toBe(100)
  })

  it('should return 100 when totalChars is 0 (no input)', () => {
    expect(calculateAccuracy(0, 0)).toBe(100)
  })

  it('should return 0% when no characters are correct', () => {
    expect(calculateAccuracy(0, 100)).toBe(0)
  })

  it('should calculate normal accuracy', () => {
    // 90 correct out of 100 = 90%
    expect(calculateAccuracy(90, 100)).toBe(90)
  })

  it('should handle fractional accuracy with 2 decimal precision', () => {
    // 85 correct out of 99 = 85.858585...% -> rounded to 85.86
    expect(calculateAccuracy(85, 99)).toBe(85.86)
  })

  it('should clamp to maximum of 100', () => {
    // More correct than total should still be capped at 100
    expect(calculateAccuracy(150, 100)).toBe(100)
  })

  it('should return 100 when totalChars is negative', () => {
    expect(calculateAccuracy(50, -1)).toBe(100)
  })

  it('should calculate 50% accuracy correctly', () => {
    expect(calculateAccuracy(50, 100)).toBe(50)
  })
})

// =============================================================================
// calculateConsistency
// =============================================================================
describe('calculateConsistency', () => {
  it('should return 100 for empty array', () => {
    expect(calculateConsistency([])).toBe(100)
  })

  it('should return 100 for single-element array', () => {
    expect(calculateConsistency([50])).toBe(100)
  })

  it('should return 100 when all WPM values are the same (stable typing)', () => {
    expect(calculateConsistency([60, 60, 60, 60, 60])).toBe(100)
  })

  it('should return a high value for very consistent typing', () => {
    const result = calculateConsistency([58, 60, 62, 59, 61])
    expect(result).toBeGreaterThan(95)
    expect(result).toBeLessThanOrEqual(100)
  })

  it('should return a low value for erratic typing', () => {
    const result = calculateConsistency([10, 100, 20, 90, 15, 85])
    expect(result).toBeLessThan(50)
  })

  it('should ignore zero values in the history', () => {
    // [0, 0, 60, 60, 60] -> filtered to [60, 60, 60] -> perfectly consistent
    expect(calculateConsistency([0, 0, 60, 60, 60])).toBe(100)
  })

  it('should return 100 when all values are zero', () => {
    expect(calculateConsistency([0, 0, 0])).toBe(100)
  })

  it('should return 100 for array with only one non-zero value', () => {
    expect(calculateConsistency([0, 0, 50, 0])).toBe(100)
  })

  it('should clamp result between 0 and 100', () => {
    const result = calculateConsistency([1, 200, 1, 200])
    expect(result).toBeGreaterThanOrEqual(0)
    expect(result).toBeLessThanOrEqual(100)
  })
})

// =============================================================================
// calculateXP
// =============================================================================
describe('calculateXP', () => {
  it('should calculate XP for a normal result', () => {
    // 60 WPM, 95% accuracy, 60s
    // wpmXP = 60
    // accuracyMultiplier = 0.5 + 0.95 = 1.45
    // durationMultiplier = 60/60 = 1
    // totalXP = 60 * 1.45 * 1 = 87
    // accuracyBonus (>= 95%) = floor(60 * 0.1) = 6
    // speedBonus (< 100 WPM) = 0
    // Result = round(87 + 6 + 0) = 93
    expect(calculateXP(60, 95, 60)).toBe(93)
  })

  it('should return 0 for 0 WPM', () => {
    expect(calculateXP(0, 100, 60)).toBe(0)
  })

  it('should cap duration at 120 seconds', () => {
    // 100 WPM, 100% accuracy, 180s (capped to 120s)
    // wpmXP = 100
    // accuracyMultiplier = 0.5 + 1.0 = 1.5
    // durationMultiplier = 120/60 = 2
    // totalXP = 100 * 1.5 * 2 = 300
    // accuracyBonus (>= 95%) = floor(100 * 0.1) = 10
    // speedBonus (>= 100) = floor((100 - 100) * 0.5) = 0
    // Result = round(300 + 10 + 0) = 310
    expect(calculateXP(100, 100, 180)).toBe(310)
  })

  it('should give accuracy bonus for >= 95% accuracy', () => {
    const xpWith95 = calculateXP(60, 95, 60)
    const xpWith94 = calculateXP(60, 94, 60)
    // At 95% accuracy there is a bonus of floor(60 * 0.1) = 6
    expect(xpWith95).toBeGreaterThan(xpWith94)
  })

  it('should give speed bonus for >= 100 WPM', () => {
    // 120 WPM, 90% accuracy, 60s
    // wpmXP = 120
    // accuracyMultiplier = 0.5 + 0.9 = 1.4
    // durationMultiplier = 60/60 = 1
    // totalXP = 120 * 1.4 * 1 = 168
    // accuracyBonus = 0 (< 95%)
    // speedBonus = floor((120 - 100) * 0.5) = 10
    // Result = round(168 + 0 + 10) = 178
    expect(calculateXP(120, 90, 60)).toBe(178)
  })

  it('should scale with duration', () => {
    const xp30s = calculateXP(60, 90, 30)
    const xp60s = calculateXP(60, 90, 60)
    expect(xp60s).toBeGreaterThan(xp30s)
  })

  it('should handle 0 seconds', () => {
    // wpmXP = 100
    // accuracyMultiplier = 0.5 + 1.0 = 1.5
    // durationMultiplier = 0/60 = 0
    // totalXP = 100 * 1.5 * 0 = 0
    // accuracyBonus (>=95%) = floor(100 * 0.1) = 10
    // speedBonus (>=100) = floor((100-100) * 0.5) = 0
    // Result = round(0 + 10 + 0) = 10
    expect(calculateXP(100, 100, 0)).toBe(10)
  })

  it('should handle low accuracy (50%)', () => {
    // 50 WPM, 50% accuracy, 60s
    // wpmXP = 50
    // accuracyMultiplier = 0.5 + 0.5 = 1.0
    // durationMultiplier = 60/60 = 1
    // totalXP = 50 * 1.0 * 1 = 50
    // no bonuses
    // Result = round(50) = 50
    expect(calculateXP(50, 50, 60)).toBe(50)
  })
})

// =============================================================================
// validateResult
// =============================================================================
describe('validateResult', () => {
  it('should accept a valid result', () => {
    const result = validateResult({
      correctChars: 250,
      totalChars: 280,
      seconds: 60,
    })
    expect(result.isValid).toBe(true)
    expect(result.reason).toBeUndefined()
  })

  it('should reject test duration < 5 seconds', () => {
    const result = validateResult({
      correctChars: 20,
      totalChars: 25,
      seconds: 3,
    })
    expect(result.isValid).toBe(false)
    expect(result.reason).toBe('Test duration too short')
  })

  it('should reject WPM > 300', () => {
    // 10000 correct chars in 10 seconds -> 10000/5 / (10/60) = 12000 WPM
    const result = validateResult({
      correctChars: 10000,
      totalChars: 10000,
      seconds: 10,
    })
    expect(result.isValid).toBe(false)
    expect(result.reason).toBe('WPM exceeds possible human limits')
  })

  it('should reject perfect accuracy with high speed over 30s', () => {
    // 160 WPM with 100% accuracy over 60 seconds
    // 160 WPM * 5 chars/word * 1 minute = 800 chars in 60s
    const result = validateResult({
      correctChars: 800,
      totalChars: 800,
      seconds: 60,
    })
    expect(result.isValid).toBe(false)
    expect(result.reason).toBe('Suspicious perfect accuracy at high speed')
  })

  it('should reject suspicious sudden WPM changes', () => {
    const result = validateResult({
      correctChars: 250,
      totalChars: 280,
      seconds: 60,
      wpmHistory: [50, 55, 200, 48],
    })
    expect(result.isValid).toBe(false)
    expect(result.reason).toBe('Suspicious sudden WPM change')
  })

  it('should reject timestamp mismatch', () => {
    const now = Date.now()
    const result = validateResult({
      correctChars: 250,
      totalChars: 280,
      seconds: 60,
      startTime: now - 100000, // 100 seconds ago
      endTime: now,
    })
    expect(result.isValid).toBe(false)
    expect(result.reason).toBe('Timestamp mismatch detected')
  })

  it('should reject insufficient characters typed', () => {
    const result = validateResult({
      correctChars: 5,
      totalChars: 8,
      seconds: 10,
    })
    expect(result.isValid).toBe(false)
    expect(result.reason).toBe('Insufficient characters typed')
  })

  it('should reject suspiciously consistent typing at high speed', () => {
    const result = validateResult({
      correctChars: 500,
      totalChars: 520,
      seconds: 30,
      wpmHistory: [200, 200, 200, 200, 200],
    })
    expect(result.isValid).toBe(false)
    expect(result.reason).toBe('Suspiciously consistent typing speed')
  })

  it('should accept a valid result with timestamps that match', () => {
    const now = Date.now()
    const result = validateResult({
      correctChars: 250,
      totalChars: 280,
      seconds: 60,
      startTime: now - 60000,
      endTime: now,
    })
    expect(result.isValid).toBe(true)
  })

  it('should accept a valid result with normal WPM history', () => {
    const result = validateResult({
      correctChars: 250,
      totalChars: 280,
      seconds: 60,
      wpmHistory: [45, 50, 55, 48, 52],
    })
    expect(result.isValid).toBe(true)
  })
})
