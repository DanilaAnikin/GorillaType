'use client'

import { useRef, useCallback } from 'react'

export interface KeystrokeEvent {
  key: string
  keyCode: string
  isCorrect: boolean
  timestampMs: number // ms from test start
  charIndex: number
  wordIndex: number
}

export interface ReplayData {
  keystrokes: KeystrokeEvent[]
  words: string[]
  totalDurationMs: number
  finalWpm: number
  finalAccuracy: number
}

export function useKeystrokeRecorder() {
  const keystrokesRef = useRef<KeystrokeEvent[]>([])
  const startTimeRef = useRef<number | null>(null)
  const isRecordingRef = useRef(false)

  const startRecording = useCallback(() => {
    keystrokesRef.current = []
    startTimeRef.current = performance.now()
    isRecordingRef.current = true
  }, [])

  const recordKeystroke = useCallback((event: {
    key: string
    keyCode?: string
    isCorrect: boolean
    charIndex: number
    wordIndex: number
  }) => {
    if (!isRecordingRef.current || !startTimeRef.current) return

    keystrokesRef.current.push({
      key: event.key,
      keyCode: event.keyCode || event.key,
      isCorrect: event.isCorrect,
      timestampMs: Math.round(performance.now() - startTimeRef.current),
      charIndex: event.charIndex,
      wordIndex: event.wordIndex,
    })
  }, [])

  const stopRecording = useCallback((): KeystrokeEvent[] => {
    isRecordingRef.current = false
    return [...keystrokesRef.current]
  }, [])

  const getKeystrokes = useCallback(() => {
    return [...keystrokesRef.current]
  }, [])

  const reset = useCallback(() => {
    keystrokesRef.current = []
    startTimeRef.current = null
    isRecordingRef.current = false
  }, [])

  const getIsRecording = useCallback(() => isRecordingRef.current, [])

  return {
    startRecording,
    recordKeystroke,
    stopRecording,
    getKeystrokes,
    reset,
    getIsRecording,
  }
}
