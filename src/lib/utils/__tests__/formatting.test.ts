import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  formatTime,
  formatNumber,
  formatPercentage,
  formatWPM,
  formatDate,
  formatRelativeTime,
  formatBytes,
  formatOrdinal,
  truncateText,
} from '@/lib/utils/formatting'

// =============================================================================
// formatTime
// =============================================================================
describe('formatTime', () => {
  it('should format 0 seconds as just "0"', () => {
    expect(formatTime(0)).toBe('0')
  })

  it('should format seconds less than 60 as just seconds', () => {
    expect(formatTime(45)).toBe('45')
  })

  it('should format 60 seconds as "1:00"', () => {
    expect(formatTime(60)).toBe('1:00')
  })

  it('should format 65 seconds as "1:05"', () => {
    expect(formatTime(65)).toBe('1:05')
  })

  it('should format 3661 seconds as "1:01:01"', () => {
    expect(formatTime(3661)).toBe('1:01:01')
  })

  it('should treat negative seconds as 0', () => {
    expect(formatTime(-5)).toBe('0')
  })

  it('should show hours when showHours option is true even if 0 hours', () => {
    expect(formatTime(65, { showHours: true })).toBe('0:01:05')
  })

  it('should pad minutes when padMinutes option is true', () => {
    expect(formatTime(45, { padMinutes: true })).toBe('0:45')
  })

  it('should format 3600 seconds as "1:00:00"', () => {
    expect(formatTime(3600)).toBe('1:00:00')
  })

  it('should handle large values correctly', () => {
    // 7200s = 2 hours
    expect(formatTime(7200)).toBe('2:00:00')
  })

  it('should format fractional seconds by flooring', () => {
    // 65.7 seconds -> 1:05 (floor of 5.7 = 5)
    expect(formatTime(65.7)).toBe('1:05')
  })
})

// =============================================================================
// formatNumber
// =============================================================================
describe('formatNumber', () => {
  it('should format an integer with commas', () => {
    expect(formatNumber(1234567)).toBe('1,234,567')
  })

  it('should format a decimal number', () => {
    expect(formatNumber(1234.56)).toBe('1,234.56')
  })

  it('should format 0', () => {
    expect(formatNumber(0)).toBe('0')
  })

  it('should format negative numbers', () => {
    expect(formatNumber(-1234)).toBe('-1,234')
  })

  it('should format small numbers without commas', () => {
    expect(formatNumber(999)).toBe('999')
  })

  it('should format large numbers', () => {
    expect(formatNumber(1000000000)).toBe('1,000,000,000')
  })
})

// =============================================================================
// formatPercentage
// =============================================================================
describe('formatPercentage', () => {
  it('should format 0%', () => {
    expect(formatPercentage(0)).toBe('0%')
  })

  it('should format 100%', () => {
    expect(formatPercentage(100)).toBe('100%')
  })

  it('should format 50%', () => {
    expect(formatPercentage(50)).toBe('50%')
  })

  it('should format with decimals', () => {
    expect(formatPercentage(85.5)).toBe('85.5%')
  })

  it('should remove unnecessary trailing zeros', () => {
    expect(formatPercentage(50.00)).toBe('50%')
  })

  it('should handle isDecimal option (0-1 range)', () => {
    expect(formatPercentage(0.855, { isDecimal: true })).toBe('85.5%')
  })

  it('should respect decimals option', () => {
    expect(formatPercentage(85.567, { decimals: 1 })).toBe('85.6%')
  })

  it('should clamp values above 100', () => {
    expect(formatPercentage(150)).toBe('100%')
  })

  it('should clamp values below 0', () => {
    expect(formatPercentage(-10)).toBe('0%')
  })

  it('should handle isDecimal with value > 1', () => {
    expect(formatPercentage(1.5, { isDecimal: true })).toBe('100%')
  })

  it('should handle isDecimal with 0', () => {
    expect(formatPercentage(0, { isDecimal: true })).toBe('0%')
  })
})

// =============================================================================
// formatWPM
// =============================================================================
describe('formatWPM', () => {
  it('should format a normal WPM value', () => {
    expect(formatWPM(85)).toBe('85 WPM')
  })

  it('should format 0 WPM', () => {
    expect(formatWPM(0)).toBe('0 WPM')
  })

  it('should round decimal WPM', () => {
    expect(formatWPM(85.7)).toBe('86 WPM')
    expect(formatWPM(85.3)).toBe('85 WPM')
  })

  it('should handle large WPM values', () => {
    expect(formatWPM(250)).toBe('250 WPM')
  })

  it('should handle negative WPM (edge case)', () => {
    expect(formatWPM(-5)).toBe('-5 WPM')
  })
})

// =============================================================================
// formatDate
// =============================================================================
describe('formatDate', () => {
  it('should format a Date object', () => {
    const date = new Date(2026, 0, 25) // January 25, 2026
    const result = formatDate(date)
    expect(result).toBe('Jan 25, 2026')
  })

  it('should format a date string', () => {
    const result = formatDate('2026-01-25T00:00:00.000Z')
    // The exact output may vary by timezone, but it should contain 2026
    expect(result).toContain('2026')
  })

  it('should format a timestamp number', () => {
    const timestamp = new Date(2026, 0, 25).getTime()
    const result = formatDate(timestamp)
    expect(result).toBe('Jan 25, 2026')
  })

  it('should accept custom options', () => {
    const date = new Date(2026, 0, 25)
    const result = formatDate(date, { weekday: 'long' })
    expect(result).toContain('Sunday')
  })
})

// =============================================================================
// formatRelativeTime
// =============================================================================
describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-27T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return "just now" for recent times', () => {
    const date = new Date(Date.now() - 30 * 1000) // 30 seconds ago
    expect(formatRelativeTime(date)).toBe('just now')
  })

  it('should format minutes ago (singular)', () => {
    const date = new Date(Date.now() - 60 * 1000) // 1 minute ago
    expect(formatRelativeTime(date)).toBe('1 minute ago')
  })

  it('should format minutes ago (plural)', () => {
    const date = new Date(Date.now() - 5 * 60 * 1000)
    expect(formatRelativeTime(date)).toBe('5 minutes ago')
  })

  it('should format hours ago (singular)', () => {
    const date = new Date(Date.now() - 60 * 60 * 1000)
    expect(formatRelativeTime(date)).toBe('1 hour ago')
  })

  it('should format hours ago (plural)', () => {
    const date = new Date(Date.now() - 3 * 60 * 60 * 1000)
    expect(formatRelativeTime(date)).toBe('3 hours ago')
  })

  it('should format days ago (singular)', () => {
    const date = new Date(Date.now() - 24 * 60 * 60 * 1000)
    expect(formatRelativeTime(date)).toBe('1 day ago')
  })

  it('should format days ago (plural)', () => {
    const date = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    expect(formatRelativeTime(date)).toBe('3 days ago')
  })

  it('should format weeks ago (singular)', () => {
    const date = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    expect(formatRelativeTime(date)).toBe('1 week ago')
  })

  it('should format weeks ago (plural)', () => {
    const date = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    expect(formatRelativeTime(date)).toBe('2 weeks ago')
  })

  it('should format months ago (singular)', () => {
    const date = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000)
    expect(formatRelativeTime(date)).toBe('1 month ago')
  })

  it('should format years ago (singular)', () => {
    const date = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000)
    expect(formatRelativeTime(date)).toBe('1 year ago')
  })

  it('should accept a date string', () => {
    const dateStr = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    expect(formatRelativeTime(dateStr)).toBe('5 minutes ago')
  })

  it('should accept a timestamp number', () => {
    const ts = Date.now() - 2 * 60 * 60 * 1000
    expect(formatRelativeTime(ts)).toBe('2 hours ago')
  })
})

// =============================================================================
// formatBytes
// =============================================================================
describe('formatBytes', () => {
  it('should format 0 bytes', () => {
    expect(formatBytes(0)).toBe('0 Bytes')
  })

  it('should format bytes', () => {
    expect(formatBytes(500)).toBe('500 Bytes')
  })

  it('should format kilobytes', () => {
    expect(formatBytes(1024)).toBe('1 KB')
  })

  it('should format megabytes', () => {
    expect(formatBytes(1048576)).toBe('1 MB')
  })

  it('should format with decimals', () => {
    expect(formatBytes(1234567)).toBe('1.18 MB')
  })

  it('should respect custom decimal places', () => {
    expect(formatBytes(1234567, 0)).toBe('1 MB')
  })

  it('should format gigabytes', () => {
    expect(formatBytes(1073741824)).toBe('1 GB')
  })
})

// =============================================================================
// formatOrdinal
// =============================================================================
describe('formatOrdinal', () => {
  it('should format 1 as "1st"', () => {
    expect(formatOrdinal(1)).toBe('1st')
  })

  it('should format 2 as "2nd"', () => {
    expect(formatOrdinal(2)).toBe('2nd')
  })

  it('should format 3 as "3rd"', () => {
    expect(formatOrdinal(3)).toBe('3rd')
  })

  it('should format 4 as "4th"', () => {
    expect(formatOrdinal(4)).toBe('4th')
  })

  it('should format 11 as "11th"', () => {
    expect(formatOrdinal(11)).toBe('11th')
  })

  it('should format 12 as "12th"', () => {
    expect(formatOrdinal(12)).toBe('12th')
  })

  it('should format 13 as "13th"', () => {
    expect(formatOrdinal(13)).toBe('13th')
  })

  it('should format 21 as "21st"', () => {
    expect(formatOrdinal(21)).toBe('21st')
  })

  it('should format 22 as "22nd"', () => {
    expect(formatOrdinal(22)).toBe('22nd')
  })

  it('should format 23 as "23rd"', () => {
    expect(formatOrdinal(23)).toBe('23rd')
  })

  it('should format 100 as "100th"', () => {
    expect(formatOrdinal(100)).toBe('100th')
  })

  it('should format 101 as "101st"', () => {
    expect(formatOrdinal(101)).toBe('101st')
  })
})

// =============================================================================
// truncateText
// =============================================================================
describe('truncateText', () => {
  it('should not truncate text within max length', () => {
    expect(truncateText('Hello', 10)).toBe('Hello')
  })

  it('should truncate text exceeding max length', () => {
    expect(truncateText('Hello World', 8)).toBe('Hello...')
  })

  it('should return full text if exactly at max length', () => {
    expect(truncateText('Hello', 5)).toBe('Hello')
  })

  it('should handle empty string', () => {
    expect(truncateText('', 5)).toBe('')
  })

  it('should handle maxLength of 3 (minimum for ellipsis)', () => {
    expect(truncateText('Hello', 3)).toBe('...')
  })

  it('should handle long text', () => {
    const longText = 'a'.repeat(100)
    const result = truncateText(longText, 20)
    expect(result.length).toBe(20)
    expect(result.endsWith('...')).toBe(true)
  })
})
