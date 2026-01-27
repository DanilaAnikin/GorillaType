/**
 * Analyzes typing results to identify weaknesses and generate practice data.
 */

export interface KeyWeakness {
  key: string
  errorRate: number  // 0-1
  avgSpeed: number   // ms per keypress
  sampleSize: number
}

export interface BigramWeakness {
  bigram: string
  errorRate: number
  avgSpeed: number
  sampleSize: number
}

export interface WeaknessReport {
  weakKeys: KeyWeakness[]
  weakBigrams: BigramWeakness[]
  slowestKeys: KeyWeakness[]
  overallErrorRate: number
  suggestedFocus: string[]
  practiceWords: string[]
}

interface KeystrokeData {
  key_char: string
  is_correct: boolean
  timestamp_ms: number
}

export function analyzeWeaknesses(keystrokes: KeystrokeData[]): WeaknessReport {
  // Analyze per-key error rates
  const keyStats = new Map<string, { correct: number; incorrect: number; speeds: number[] }>()

  for (let i = 0; i < keystrokes.length; i++) {
    const ks = keystrokes[i]
    const key = ks.key_char.toLowerCase()
    if (key.length !== 1 || key === ' ') continue

    if (!keyStats.has(key)) {
      keyStats.set(key, { correct: 0, incorrect: 0, speeds: [] })
    }
    const stat = keyStats.get(key)!
    if (ks.is_correct) stat.correct++
    else stat.incorrect++

    // Calculate speed from previous keystroke
    if (i > 0) {
      const speed = ks.timestamp_ms - keystrokes[i - 1].timestamp_ms
      if (speed > 0 && speed < 2000) stat.speeds.push(speed)
    }
  }

  // Build key weakness list
  const weakKeys: KeyWeakness[] = []
  const slowestKeys: KeyWeakness[] = []

  keyStats.forEach((stat, key) => {
    const total = stat.correct + stat.incorrect
    if (total < 3) return
    const errorRate = stat.incorrect / total
    const avgSpeed = stat.speeds.length > 0 ? stat.speeds.reduce((a, b) => a + b, 0) / stat.speeds.length : 0

    weakKeys.push({ key, errorRate, avgSpeed, sampleSize: total })
    slowestKeys.push({ key, errorRate, avgSpeed, sampleSize: total })
  })

  weakKeys.sort((a, b) => b.errorRate - a.errorRate)
  slowestKeys.sort((a, b) => b.avgSpeed - a.avgSpeed)

  // Analyze bigrams
  const bigramStats = new Map<string, { correct: number; incorrect: number; speeds: number[] }>()

  for (let i = 1; i < keystrokes.length; i++) {
    const prev = keystrokes[i - 1]
    const curr = keystrokes[i]
    if (prev.key_char === ' ' || curr.key_char === ' ') continue
    if (prev.key_char.length !== 1 || curr.key_char.length !== 1) continue

    const bigram = (prev.key_char + curr.key_char).toLowerCase()
    if (!bigramStats.has(bigram)) {
      bigramStats.set(bigram, { correct: 0, incorrect: 0, speeds: [] })
    }
    const stat = bigramStats.get(bigram)!
    if (curr.is_correct) stat.correct++
    else stat.incorrect++

    const speed = curr.timestamp_ms - prev.timestamp_ms
    if (speed > 0 && speed < 2000) stat.speeds.push(speed)
  }

  const weakBigrams: BigramWeakness[] = []
  bigramStats.forEach((stat, bigram) => {
    const total = stat.correct + stat.incorrect
    if (total < 2) return
    const errorRate = stat.incorrect / total
    const avgSpeed = stat.speeds.length > 0 ? stat.speeds.reduce((a, b) => a + b, 0) / stat.speeds.length : 0
    weakBigrams.push({ bigram, errorRate, avgSpeed, sampleSize: total })
  })
  weakBigrams.sort((a, b) => b.errorRate - a.errorRate)

  // Overall error rate
  const totalCorrect = keystrokes.filter(k => k.is_correct).length
  const overallErrorRate = keystrokes.length > 0 ? 1 - (totalCorrect / keystrokes.length) : 0

  // Generate suggested focus keys
  const suggestedFocus = weakKeys.slice(0, 5).map(k => k.key)

  // Generate practice words containing weak keys
  const practiceWords = generatePracticeWords(suggestedFocus, weakBigrams.slice(0, 10).map(b => b.bigram))

  return {
    weakKeys: weakKeys.slice(0, 15),
    weakBigrams: weakBigrams.slice(0, 15),
    slowestKeys: slowestKeys.slice(0, 15),
    overallErrorRate,
    suggestedFocus,
    practiceWords,
  }
}

// Common English words organized by the letters they emphasize
const WORD_BANK: Record<string, string[]> = {
  q: ['queen', 'quick', 'quiet', 'quote', 'quest', 'quiz', 'square', 'equal', 'require', 'unique'],
  w: ['water', 'world', 'would', 'write', 'wrong', 'power', 'flower', 'window', 'toward', 'winter'],
  x: ['exist', 'exact', 'extra', 'exam', 'taxi', 'pixel', 'oxide', 'toxic', 'mixer', 'boxing'],
  z: ['zone', 'zero', 'size', 'prize', 'frozen', 'puzzle', 'dozen', 'breeze', 'zigzag', 'wizard'],
  j: ['just', 'join', 'jump', 'judge', 'major', 'enjoy', 'project', 'object', 'adjust', 'injury'],
  k: ['know', 'keep', 'kind', 'king', 'look', 'make', 'work', 'think', 'speak', 'market'],
  v: ['very', 'voice', 'value', 'video', 'event', 'never', 'every', 'river', 'cover', 'prove'],
  b: ['both', 'back', 'begin', 'below', 'bring', 'board', 'build', 'brain', 'brown', 'bright'],
  p: ['part', 'place', 'point', 'power', 'press', 'price', 'paper', 'plant', 'play', 'prove'],
  y: ['year', 'your', 'young', 'yield', 'type', 'style', 'system', 'story', 'study', 'beyond'],
  f: ['form', 'find', 'first', 'front', 'field', 'force', 'fresh', 'floor', 'faith', 'fault'],
  g: ['give', 'great', 'group', 'grow', 'going', 'green', 'grade', 'grace', 'guess', 'guide'],
  default: ['the', 'and', 'that', 'have', 'with', 'this', 'will', 'from', 'they', 'been', 'some', 'other', 'about', 'which', 'their', 'there', 'would', 'could', 'after', 'these'],
}

function generatePracticeWords(weakKeys: string[], weakBigrams: string[]): string[] {
  const words: Set<string> = new Set()

  // Add words for each weak key
  for (const key of weakKeys) {
    const keyWords = WORD_BANK[key] || WORD_BANK.default
    keyWords.forEach(w => words.add(w))
  }

  // Add common words containing weak bigrams
  const allWords = Object.values(WORD_BANK).flat()
  for (const bigram of weakBigrams) {
    for (const word of allWords) {
      if (word.includes(bigram)) {
        words.add(word)
      }
    }
  }

  // If we don't have enough, add defaults
  if (words.size < 20) {
    WORD_BANK.default.forEach(w => words.add(w))
  }

  return Array.from(words).slice(0, 50)
}

export function getWeaknessSummary(report: WeaknessReport): string {
  const parts: string[] = []

  if (report.weakKeys.length > 0) {
    const keys = report.weakKeys.slice(0, 3).map(k => k.key.toUpperCase()).join(', ')
    parts.push(`Weakest keys: ${keys}`)
  }

  if (report.slowestKeys.length > 0) {
    const keys = report.slowestKeys.slice(0, 3).map(k => k.key.toUpperCase()).join(', ')
    parts.push(`Slowest keys: ${keys}`)
  }

  if (report.weakBigrams.length > 0) {
    const bigrams = report.weakBigrams.slice(0, 3).map(b => `"${b.bigram}"`).join(', ')
    parts.push(`Weak combinations: ${bigrams}`)
  }

  return parts.join(' | ')
}
