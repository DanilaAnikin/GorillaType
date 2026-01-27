'use client'

import { Keyboard } from 'lucide-react'
import { useMediaQuery } from '@/lib/hooks/use-media-query'

interface MobileKeyboardHintProps {
  isActive: boolean
  onTap: () => void
}

export function MobileKeyboardHint({ isActive, onTap }: MobileKeyboardHintProps) {
  // Read use-media-query to understand the hook pattern, then use it
  const isMobile = useMediaQuery('(max-width: 768px)')

  if (!isMobile || isActive) return null

  return (
    <button
      onClick={onTap}
      className="flex items-center gap-2 px-4 py-3 rounded-lg transition-all active:scale-95 mx-auto mt-4"
      style={{
        backgroundColor: 'var(--sub-alt-color)',
        color: 'var(--sub-color)',
        border: '1px dashed var(--sub-color)',
      }}
    >
      <Keyboard size={20} />
      <span className="text-sm">Tap here to start typing</span>
    </button>
  )
}
