'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Keyboard, Target, Trophy, Users, User } from 'lucide-react'
import { useMediaQuery } from '@/lib/hooks'

const NAV_ITEMS = [
  { href: '/', icon: Keyboard, label: 'Type' },
  { href: '/practice', icon: Target, label: 'Practice' },
  { href: '/tournaments', icon: Trophy, label: 'Compete' },
  { href: '/friends', icon: Users, label: 'Social' },
  { href: '/account', icon: User, label: 'Profile' },
]

export function MobileNav() {
  const pathname = usePathname()
  const isMobile = useMediaQuery('(max-width: 768px)')

  if (!isMobile) return null

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around safe-bottom"
      style={{
        backgroundColor: 'var(--bg-color)',
        borderTop: '1px solid var(--sub-alt-color)',
        paddingBottom: 'env(safe-area-inset-bottom, 8px)',
      }}
    >
      {NAV_ITEMS.map(item => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-1 py-2 px-3 min-h-[44px] justify-center transition-colors"
            style={{
              color: isActive ? 'var(--main-color)' : 'var(--sub-color)',
            }}
          >
            <item.icon size={20} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
