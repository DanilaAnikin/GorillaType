'use client'

import { useState, useRef, useCallback, useEffect, useMemo, memo } from 'react'
import { Play, Pause, RotateCcw, FastForward } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { KeystrokeEvent } from '@/lib/hooks/use-keystroke-recorder'

interface ReplayPlayerProps {
  keystrokes: KeystrokeEvent[]
  words: string[]
  totalDurationMs: number
  finalWpm: number
  finalAccuracy: number
  onClose?: () => void
}

const SPEED_OPTIONS = [0.5, 1, 2, 4] as const
type PlaybackSpeed = (typeof SPEED_OPTIONS)[number]

/** Format ms as M:SS.s */
function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = Math.floor(totalSeconds % 60)
  const tenths = Math.floor((totalSeconds % 1) * 10)
  return `${minutes}:${seconds.toString().padStart(2, '0')}.${tenths}`
}

/**
 * Calculate instantaneous WPM at a given point in time based on keystrokes so far.
 * Uses the standard WPM formula: (correctChars / 5) / minutes elapsed
 */
function calculateWpmAtTime(keystrokes: KeystrokeEvent[], currentTimeMs: number): number {
  if (currentTimeMs <= 0) return 0

  const active = keystrokes.filter((k) => k.timestampMs <= currentTimeMs)
  const correctChars = active.filter((k) => k.isCorrect).length
  const minutes = currentTimeMs / 60000

  if (minutes <= 0) return 0
  return Math.round((correctChars / 5) / minutes)
}

/**
 * Build a lookup of char statuses from keystrokes up to a given index.
 * Returns a Map of "wordIndex-charIndex" -> isCorrect
 */
function buildCharStatusMap(
  keystrokes: KeystrokeEvent[],
  upToIndex: number
): Map<string, boolean> {
  const map = new Map<string, boolean>()
  for (let i = 0; i <= upToIndex && i < keystrokes.length; i++) {
    const ks = keystrokes[i]
    // For backspace keys, we skip as they undo rather than add characters
    if (ks.key === 'Backspace') continue
    map.set(`${ks.wordIndex}-${ks.charIndex}`, ks.isCorrect)
  }
  return map
}

/** Single character in the replay word display */
const ReplayChar = memo(function ReplayChar({
  char,
  status,
}: {
  char: string
  status: 'correct' | 'incorrect' | 'pending'
}) {
  return (
    <span
      className={cn(
        'font-mono text-2xl transition-colors duration-75',
        status === 'correct' && 'text-text',
        status === 'incorrect' && 'text-error',
        status === 'pending' && 'text-sub'
      )}
      style={{
        color:
          status === 'correct'
            ? 'var(--text-color)'
            : status === 'incorrect'
              ? 'var(--error-color)'
              : 'var(--sub-color)',
      }}
    >
      {char}
    </span>
  )
})

export const ReplayPlayer = memo(function ReplayPlayer({
  keystrokes,
  words,
  totalDurationMs,
  finalWpm,
  finalAccuracy,
  onClose,
}: ReplayPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1)
  const [currentTimeMs, setCurrentTimeMs] = useState(0)

  const rafRef = useRef<number | null>(null)
  const lastFrameTimeRef = useRef<number | null>(null)
  const wordContainerRef = useRef<HTMLDivElement>(null)
  const caretRef = useRef<HTMLDivElement>(null)

  // Determine current keystroke index based on currentTimeMs
  const currentKeystrokeIndex = useMemo(() => {
    let idx = -1
    for (let i = 0; i < keystrokes.length; i++) {
      if (keystrokes[i].timestampMs <= currentTimeMs) {
        idx = i
      } else {
        break
      }
    }
    return idx
  }, [keystrokes, currentTimeMs])

  // Build the character status map for rendering
  const charStatusMap = useMemo(
    () => buildCharStatusMap(keystrokes, currentKeystrokeIndex),
    [keystrokes, currentKeystrokeIndex]
  )

  // Current WPM at this point in the replay
  const currentWpm = useMemo(
    () => calculateWpmAtTime(keystrokes, currentTimeMs),
    [keystrokes, currentTimeMs]
  )

  // Determine current caret position (word + char) from the latest non-backspace keystroke
  const caretPosition = useMemo(() => {
    if (currentKeystrokeIndex < 0) {
      return { wordIndex: 0, charIndex: 0 }
    }
    // Walk forward through keystrokes to find the effective position
    let wordIndex = 0
    let charIndex = 0
    for (let i = 0; i <= currentKeystrokeIndex && i < keystrokes.length; i++) {
      const ks = keystrokes[i]
      if (ks.key === 'Backspace') {
        // Move back one character
        if (charIndex > 0) {
          charIndex--
        }
      } else if (ks.key === ' ') {
        // Space moves to next word
        wordIndex = ks.wordIndex + 1
        charIndex = 0
      } else {
        wordIndex = ks.wordIndex
        charIndex = ks.charIndex + 1
      }
    }
    return { wordIndex, charIndex }
  }, [keystrokes, currentKeystrokeIndex])

  // Progress percentage
  const progressPercent = totalDurationMs > 0
    ? Math.min(100, (currentTimeMs / totalDurationMs) * 100)
    : 0

  // Animation loop – use a ref so the callback can reference itself without
  // violating the react-hooks/immutability rule (accessing before declaration).
  const animateRef = useRef<(timestamp: number) => void>(() => {})

  // Keep the animation function ref in sync with latest closure values
  useEffect(() => {
    animateRef.current = (timestamp: number) => {
      if (lastFrameTimeRef.current === null) {
        lastFrameTimeRef.current = timestamp
      }

      const deltaMs = (timestamp - lastFrameTimeRef.current) * playbackSpeed
      lastFrameTimeRef.current = timestamp

      setCurrentTimeMs((prev) => {
        const next = prev + deltaMs
        if (next >= totalDurationMs) {
          // Replay finished
          setIsPlaying(false)
          lastFrameTimeRef.current = null
          return totalDurationMs
        }
        return next
      })

      rafRef.current = requestAnimationFrame((ts) => animateRef.current(ts))
    }
  }, [playbackSpeed, totalDurationMs])

  // Start / stop animation loop
  useEffect(() => {
    if (isPlaying) {
      lastFrameTimeRef.current = null
      rafRef.current = requestAnimationFrame((ts) => animateRef.current(ts))
    } else {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      lastFrameTimeRef.current = null
    }

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [isPlaying])

  // Play / Pause toggle
  const togglePlay = useCallback(() => {
    if (currentTimeMs >= totalDurationMs) {
      // If at end, restart
      setCurrentTimeMs(0)
      setIsPlaying(true)
    } else {
      setIsPlaying((prev) => !prev)
    }
  }, [currentTimeMs, totalDurationMs])

  // Restart
  const handleRestart = useCallback(() => {
    setIsPlaying(false)
    setCurrentTimeMs(0)
  }, [])

  // Speed cycle
  const cycleSpeed = useCallback(() => {
    setPlaybackSpeed((prev) => {
      const idx = SPEED_OPTIONS.indexOf(prev)
      return SPEED_OPTIONS[(idx + 1) % SPEED_OPTIONS.length]
    })
  }, [])

  // Scrubber
  const handleScrub = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value)
      const newTime = (value / 100) * totalDurationMs
      setCurrentTimeMs(newTime)
    },
    [totalDurationMs]
  )

  // Position the caret element over the correct character
  useEffect(() => {
    if (!caretRef.current || !wordContainerRef.current) return

    const { wordIndex, charIndex } = caretPosition
    const wordEl = wordContainerRef.current.querySelector(
      `[data-word-index="${wordIndex}"]`
    )
    if (!wordEl) {
      caretRef.current.style.opacity = '0'
      return
    }

    const charEls = wordEl.querySelectorAll('[data-char]')
    let targetEl: Element | null = null

    if (charIndex < charEls.length) {
      targetEl = charEls[charIndex]
    } else if (charEls.length > 0) {
      // Past the end of the word, position after last char
      targetEl = charEls[charEls.length - 1]
    }

    if (!targetEl) {
      // Position at start of word element
      const wordRect = wordEl.getBoundingClientRect()
      const containerRect = wordContainerRef.current.getBoundingClientRect()
      caretRef.current.style.left = `${wordRect.left - containerRect.left}px`
      caretRef.current.style.top = `${wordRect.top - containerRect.top}px`
      caretRef.current.style.height = `${wordRect.height}px`
      caretRef.current.style.opacity = '1'
      return
    }

    const charRect = targetEl.getBoundingClientRect()
    const containerRect = wordContainerRef.current.getBoundingClientRect()

    const isAfterLastChar = charIndex >= charEls.length
    const leftOffset = isAfterLastChar ? charRect.right : charRect.left

    caretRef.current.style.left = `${leftOffset - containerRect.left}px`
    caretRef.current.style.top = `${charRect.top - containerRect.top}px`
    caretRef.current.style.height = `${charRect.height}px`
    caretRef.current.style.opacity = '1'
  }, [caretPosition])

  return (
    <div
      className="w-full max-w-4xl mx-auto space-y-6 p-6 rounded-xl border"
      style={{
        backgroundColor: 'var(--bg-color)',
        borderColor: 'color-mix(in srgb, var(--sub-color) 30%, transparent)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3
          className="text-lg font-semibold"
          style={{ color: 'var(--text-color)' }}
        >
          Replay
        </h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span
              className="text-sm font-mono"
              style={{ color: 'var(--sub-color)' }}
            >
              WPM:
            </span>
            <span
              className="text-sm font-mono font-bold"
              style={{ color: 'var(--main-color)' }}
            >
              {currentTimeMs > 0 ? currentWpm : '--'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="text-sm font-mono"
              style={{ color: 'var(--sub-color)' }}
            >
              Final:
            </span>
            <span
              className="text-sm font-mono font-bold"
              style={{ color: 'var(--text-color)' }}
            >
              {Math.round(finalWpm)} wpm / {finalAccuracy.toFixed(1)}%
            </span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-sm px-3 py-1 rounded transition-colors duration-125"
              style={{
                color: 'var(--sub-color)',
                backgroundColor: 'transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--text-color)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--sub-color)'
              }}
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Word Display Area */}
      <div
        ref={wordContainerRef}
        className="relative min-h-[120px] p-4 rounded-lg leading-relaxed overflow-hidden"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--sub-color) 5%, var(--bg-color))',
        }}
      >
        {/* Caret */}
        <div
          ref={caretRef}
          className="absolute w-[2px] rounded-sm transition-all duration-75"
          style={{
            backgroundColor: 'var(--main-color)',
            opacity: 0,
            zIndex: 10,
          }}
        />

        {/* Words */}
        <div className="flex flex-wrap gap-x-2 gap-y-1">
          {words.map((word, wordIdx) => (
            <span
              key={wordIdx}
              data-word-index={wordIdx}
              className="inline-block"
            >
              {word.split('').map((char, charIdx) => {
                const mapKey = `${wordIdx}-${charIdx}`
                const hasStatus = charStatusMap.has(mapKey)
                let status: 'correct' | 'incorrect' | 'pending' = 'pending'
                if (hasStatus) {
                  status = charStatusMap.get(mapKey) ? 'correct' : 'incorrect'
                }

                return (
                  <span key={charIdx} data-char>
                    <ReplayChar char={char} status={status} />
                  </span>
                )
              })}
            </span>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-3">
        {/* Progress bar / scrubber */}
        <div className="flex items-center gap-3">
          <span
            className="text-xs font-mono min-w-[60px] text-right"
            style={{ color: 'var(--sub-color)' }}
          >
            {formatTime(currentTimeMs)}
          </span>

          <div className="relative flex-1 h-2 group">
            <div
              className="absolute inset-0 rounded-full"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--sub-color) 30%, transparent)',
              }}
            />
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-75"
              style={{
                width: `${progressPercent}%`,
                backgroundColor: 'var(--main-color)',
              }}
            />
            <input
              type="range"
              min="0"
              max="100"
              step="0.1"
              value={progressPercent}
              onChange={handleScrub}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              aria-label="Replay progress"
            />
          </div>

          <span
            className="text-xs font-mono min-w-[60px]"
            style={{ color: 'var(--sub-color)' }}
          >
            {formatTime(totalDurationMs)}
          </span>
        </div>

        {/* Playback buttons */}
        <div className="flex items-center justify-center gap-3">
          {/* Restart */}
          <button
            onClick={handleRestart}
            className="p-2 rounded-lg transition-all duration-125 hover:scale-110 active:scale-95"
            style={{ color: 'var(--sub-color)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-color)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--sub-color)'
            }}
            aria-label="Restart replay"
          >
            <RotateCcw size={20} />
          </button>

          {/* Play / Pause */}
          <button
            onClick={togglePlay}
            className="p-3 rounded-full transition-all duration-125 hover:scale-110 active:scale-95"
            style={{
              backgroundColor: 'var(--main-color)',
              color: 'var(--bg-color)',
            }}
            aria-label={isPlaying ? 'Pause replay' : 'Play replay'}
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </button>

          {/* Speed toggle */}
          <button
            onClick={cycleSpeed}
            className="flex items-center gap-1 px-3 py-2 rounded-lg transition-all duration-125 hover:scale-105 active:scale-95 font-mono text-sm font-bold"
            style={{ color: 'var(--sub-color)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-color)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--sub-color)'
            }}
            aria-label={`Playback speed: ${playbackSpeed}x`}
          >
            <FastForward size={16} />
            {playbackSpeed}x
          </button>
        </div>
      </div>
    </div>
  )
})

export default ReplayPlayer
