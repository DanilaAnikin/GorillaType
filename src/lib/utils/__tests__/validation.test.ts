import { describe, it, expect } from 'vitest'
import {
  validateUsername,
  validateEmail,
  validatePassword,
  validateMatch,
  validateNumber,
  validateTestDuration,
  validateWordCount,
  sanitizeInput,
  validateCustomWords,
} from '@/lib/utils/validation'

// =============================================================================
// validateUsername
// =============================================================================
describe('validateUsername', () => {
  it('should accept a valid username', () => {
    const result = validateUsername('JohnDoe')
    expect(result.isValid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('should accept username with underscores and numbers', () => {
    expect(validateUsername('user_123').isValid).toBe(true)
  })

  it('should accept minimum length username (3 chars)', () => {
    expect(validateUsername('abc').isValid).toBe(true)
  })

  it('should accept maximum length username (20 chars)', () => {
    expect(validateUsername('abcdefghijklmnopqrst').isValid).toBe(true)
  })

  it('should reject empty string', () => {
    const result = validateUsername('')
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Username is required')
  })

  it('should reject null/undefined-like falsy values', () => {
    // @ts-expect-error testing runtime behavior with null
    const result = validateUsername(null)
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Username is required')
  })

  it('should reject username shorter than 3 characters', () => {
    const result = validateUsername('ab')
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Username must be at least 3 characters')
  })

  it('should reject username longer than 20 characters', () => {
    const result = validateUsername('abcdefghijklmnopqrstu')
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Username must be at most 20 characters')
  })

  it('should reject username starting with a number', () => {
    const result = validateUsername('1user')
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Username must start with a letter')
  })

  it('should reject username starting with an underscore', () => {
    const result = validateUsername('_user')
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Username must start with a letter')
  })

  it('should reject username with special characters', () => {
    const result = validateUsername('user@name')
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Username can only contain letters, numbers, and underscores')
  })

  it('should reject username with spaces', () => {
    const result = validateUsername('user name')
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Username can only contain letters, numbers, and underscores')
  })

  it('should trim whitespace before validating', () => {
    // "  ab  " trimmed is "ab" which is too short
    const result = validateUsername('  ab  ')
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Username must be at least 3 characters')
  })
})

// =============================================================================
// validateEmail
// =============================================================================
describe('validateEmail', () => {
  it('should accept a valid email address', () => {
    const result = validateEmail('user@example.com')
    expect(result.isValid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('should accept email with subdomain', () => {
    expect(validateEmail('user@mail.example.com').isValid).toBe(true)
  })

  it('should accept email with plus sign', () => {
    expect(validateEmail('user+tag@example.com').isValid).toBe(true)
  })

  it('should reject empty string', () => {
    const result = validateEmail('')
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Email is required')
  })

  it('should reject null/undefined-like falsy values', () => {
    // @ts-expect-error testing runtime behavior with null
    const result = validateEmail(null)
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Email is required')
  })

  it('should reject email without @ symbol', () => {
    const result = validateEmail('userexample.com')
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Please enter a valid email address')
  })

  it('should reject email without domain', () => {
    const result = validateEmail('user@')
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Please enter a valid email address')
  })

  it('should reject email without TLD', () => {
    const result = validateEmail('user@example')
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Please enter a valid email address')
  })

  it('should reject email with spaces', () => {
    const result = validateEmail('user @example.com')
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Please enter a valid email address')
  })

  it('should reject excessively long email (>254 chars)', () => {
    const longLocalPart = 'a'.repeat(250)
    const email = `${longLocalPart}@example.com`
    const result = validateEmail(email)
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Email address is too long')
  })
})

// =============================================================================
// validatePassword
// =============================================================================
describe('validatePassword', () => {
  it('should accept a strong password', () => {
    const result = validatePassword('MyStr0ng!Pass')
    expect(result.isValid).toBe(true)
    expect(result.strength).toBe('strong')
  })

  it('should accept a medium password (meets basic requirements)', () => {
    const result = validatePassword('MyPass1x')
    expect(result.isValid).toBe(true)
    // Has uppercase, lowercase, number = 3 criteria -> medium
    expect(result.strength).toBe('medium')
  })

  it('should reject empty string', () => {
    const result = validatePassword('')
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Password is required')
  })

  it('should reject null/undefined-like falsy values', () => {
    // @ts-expect-error testing runtime behavior with null
    const result = validatePassword(null)
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Password is required')
  })

  it('should reject password shorter than 8 characters', () => {
    const result = validatePassword('Ab1cdef')
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Password must be at least 8 characters')
  })

  it('should reject password longer than 128 characters', () => {
    const result = validatePassword('A'.repeat(129))
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Password is too long')
  })

  it('should reject password without uppercase letter', () => {
    const result = validatePassword('nouppercas3')
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Password must contain at least one uppercase letter')
  })

  it('should reject password without lowercase letter', () => {
    const result = validatePassword('NOLOWER123')
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Password must contain at least one lowercase letter')
  })

  it('should reject password without a number', () => {
    const result = validatePassword('NoNumberHere')
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Password must contain at least one number')
  })

  it('should return strength "strong" for 12+ chars with special', () => {
    // All 5: upper, lower, number, special, length>=12
    const result = validatePassword('MyStr0ng!Pass')
    expect(result.isValid).toBe(true)
    expect(result.strength).toBe('strong')
  })

  it('should return strength "weak" when only 2 criteria met (just meets base requirements)', () => {
    // 8 chars, has upper, lower, number (3 criteria), no special, < 12 chars
    // score = 3 (upper + lower + number) -> medium
    const result = validatePassword('Abcdefg1')
    expect(result.isValid).toBe(true)
    expect(result.strength).toBe('medium')
  })
})

// =============================================================================
// validateMatch
// =============================================================================
describe('validateMatch', () => {
  it('should accept matching values', () => {
    const result = validateMatch('password123', 'password123')
    expect(result.isValid).toBe(true)
  })

  it('should reject non-matching values with default field name', () => {
    const result = validateMatch('pass1', 'pass2')
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('values do not match')
  })

  it('should reject non-matching values with custom field name', () => {
    const result = validateMatch('pass1', 'pass2', 'Passwords')
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Passwords do not match')
  })

  it('should accept two empty strings as matching', () => {
    const result = validateMatch('', '')
    expect(result.isValid).toBe(true)
  })

  it('should be case-sensitive', () => {
    const result = validateMatch('Password', 'password')
    expect(result.isValid).toBe(false)
  })
})

// =============================================================================
// validateNumber
// =============================================================================
describe('validateNumber', () => {
  it('should accept a valid number within range', () => {
    const result = validateNumber(50, 1, 100)
    expect(result.isValid).toBe(true)
  })

  it('should accept a string that parses to a valid integer', () => {
    const result = validateNumber('25', 1, 100)
    expect(result.isValid).toBe(true)
  })

  it('should accept the minimum boundary value', () => {
    const result = validateNumber(1, 1, 100)
    expect(result.isValid).toBe(true)
  })

  it('should accept the maximum boundary value', () => {
    const result = validateNumber(100, 1, 100)
    expect(result.isValid).toBe(true)
  })

  it('should reject NaN (non-numeric string)', () => {
    const result = validateNumber('abc', 1, 100, 'Count')
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Count must be a number')
  })

  it('should reject a non-integer', () => {
    const result = validateNumber(5.5, 1, 100, 'Value')
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Value must be a whole number')
  })

  it('should reject value below minimum', () => {
    const result = validateNumber(0, 1, 100, 'Score')
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Score must be at least 1')
  })

  it('should reject value above maximum', () => {
    const result = validateNumber(101, 1, 100, 'Score')
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Score must be at most 100')
  })

  it('should use default field name "Value" when not provided', () => {
    const result = validateNumber(200, 1, 100)
    expect(result.error).toBe('Value must be at most 100')
  })
})

// =============================================================================
// validateTestDuration
// =============================================================================
describe('validateTestDuration', () => {
  it('should accept 15 seconds', () => {
    expect(validateTestDuration(15).isValid).toBe(true)
  })

  it('should accept 30 seconds', () => {
    expect(validateTestDuration(30).isValid).toBe(true)
  })

  it('should accept 60 seconds', () => {
    expect(validateTestDuration(60).isValid).toBe(true)
  })

  it('should accept 120 seconds', () => {
    expect(validateTestDuration(120).isValid).toBe(true)
  })

  it('should accept 300 seconds', () => {
    expect(validateTestDuration(300).isValid).toBe(true)
  })

  it('should reject non-allowed durations', () => {
    const result = validateTestDuration(45)
    expect(result.isValid).toBe(false)
    expect(result.error).toContain('Duration must be one of')
  })

  it('should reject 0', () => {
    expect(validateTestDuration(0).isValid).toBe(false)
  })

  it('should reject negative', () => {
    expect(validateTestDuration(-1).isValid).toBe(false)
  })
})

// =============================================================================
// validateWordCount
// =============================================================================
describe('validateWordCount', () => {
  it('should accept 10 words', () => {
    expect(validateWordCount(10).isValid).toBe(true)
  })

  it('should accept 25 words', () => {
    expect(validateWordCount(25).isValid).toBe(true)
  })

  it('should accept 50 words', () => {
    expect(validateWordCount(50).isValid).toBe(true)
  })

  it('should accept 100 words', () => {
    expect(validateWordCount(100).isValid).toBe(true)
  })

  it('should accept 200 words', () => {
    expect(validateWordCount(200).isValid).toBe(true)
  })

  it('should reject non-allowed word counts', () => {
    const result = validateWordCount(42)
    expect(result.isValid).toBe(false)
    expect(result.error).toContain('Word count must be one of')
  })

  it('should reject 0', () => {
    expect(validateWordCount(0).isValid).toBe(false)
  })
})

// =============================================================================
// sanitizeInput
// =============================================================================
describe('sanitizeInput', () => {
  it('should return the input unchanged if it is safe', () => {
    expect(sanitizeInput('hello world')).toBe('hello world')
  })

  it('should trim whitespace', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello')
  })

  it('should remove angle brackets', () => {
    expect(sanitizeInput('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script')
  })

  it('should remove javascript: protocol', () => {
    expect(sanitizeInput('javascript:alert(1)')).toBe('alert(1)')
  })

  it('should remove event handlers', () => {
    expect(sanitizeInput('onerror=alert(1)')).toBe('alert(1)')
  })

  it('should return empty string for empty input', () => {
    expect(sanitizeInput('')).toBe('')
  })

  it('should return empty string for null/undefined', () => {
    // @ts-expect-error testing runtime behavior with null
    expect(sanitizeInput(null)).toBe('')
    // @ts-expect-error testing runtime behavior with undefined
    expect(sanitizeInput(undefined)).toBe('')
  })

  it('should handle mixed dangerous patterns', () => {
    const result = sanitizeInput('  <div onclick=alert(1)>test</div>  ')
    expect(result).not.toContain('<')
    expect(result).not.toContain('>')
    expect(result).not.toContain('onclick=')
  })
})

// =============================================================================
// validateCustomWords
// =============================================================================
describe('validateCustomWords', () => {
  it('should accept a valid word list', () => {
    const words = Array.from({ length: 15 }, (_, i) => `word${i}`)
    expect(validateCustomWords(words).isValid).toBe(true)
  })

  it('should reject non-array input', () => {
    // @ts-expect-error testing runtime behavior
    const result = validateCustomWords('not-an-array')
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Words must be provided as an array')
  })

  it('should reject fewer than 10 words', () => {
    const result = validateCustomWords(['one', 'two', 'three'])
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Please provide at least 10 words')
  })

  it('should reject more than 1000 words', () => {
    const words = Array.from({ length: 1001 }, (_, i) => `word${i}`)
    const result = validateCustomWords(words)
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Maximum 1000 words allowed')
  })

  it('should reject words with empty strings', () => {
    const words = Array.from({ length: 10 }, (_, i) => (i === 5 ? '  ' : `word${i}`))
    const result = validateCustomWords(words)
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Some words are invalid (empty or too long)')
  })

  it('should reject words longer than 50 characters', () => {
    const words = Array.from({ length: 10 }, (_, i) => (i === 0 ? 'a'.repeat(51) : `word${i}`))
    const result = validateCustomWords(words)
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Some words are invalid (empty or too long)')
  })

  it('should accept exactly 10 words', () => {
    const words = Array.from({ length: 10 }, (_, i) => `word${i}`)
    expect(validateCustomWords(words).isValid).toBe(true)
  })

  it('should accept exactly 1000 words', () => {
    const words = Array.from({ length: 1000 }, (_, i) => `word${i}`)
    expect(validateCustomWords(words).isValid).toBe(true)
  })
})
