import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular'
  width?: string | number
  height?: string | number
}

export function Skeleton({ className, variant = 'text', width, height }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse',
        variant === 'text' && 'h-4 rounded',
        variant === 'circular' && 'rounded-full',
        variant === 'rectangular' && 'rounded-lg',
        className
      )}
      style={{
        width,
        height,
        backgroundColor: 'var(--sub-alt-color, rgba(128,128,128,0.2))',
      }}
    />
  )
}

export function SkeletonGroup({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('space-y-3', className)}>{children}</div>
}
