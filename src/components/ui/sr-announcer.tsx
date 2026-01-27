'use client'

import { useState, useEffect, useCallback } from 'react'

let announceCallback: ((message: string, priority?: 'polite' | 'assertive') => void) | null = null

export function announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
  announceCallback?.(message, priority)
}

export function SRAnnouncerProvider({ children }: { children: React.ReactNode }) {
  const [politeMessage, setPoliteMessage] = useState('')
  const [assertiveMessage, setAssertiveMessage] = useState('')

  const handleAnnounce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (priority === 'assertive') {
      setAssertiveMessage('')
      setTimeout(() => setAssertiveMessage(message), 50)
    } else {
      setPoliteMessage('')
      setTimeout(() => setPoliteMessage(message), 50)
    }
  }, [])

  useEffect(() => {
    announceCallback = handleAnnounce
    return () => { announceCallback = null }
  }, [handleAnnounce])

  return (
    <>
      {children}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {politeMessage}
      </div>
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {assertiveMessage}
      </div>
    </>
  )
}
