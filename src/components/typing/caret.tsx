'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils/cn';
import type { CaretStyle, SmoothCaret } from '@/store/config-store';

export interface CaretProps {
  /** Caret style: line, block, outline, underline */
  style?: CaretStyle;
  /** Enable smooth animation */
  smooth?: SmoothCaret;
  /** Blink animation speed: slow, medium, fast, or off (0) */
  blinkSpeed?: 'slow' | 'medium' | 'fast' | 'off';
  /** Custom color (overrides theme) */
  color?: string | null;
  /** Width for line style */
  width?: number;
  /** Height of the caret */
  height?: number;
  /** Additional class names */
  className?: string;
  /** Whether the caret is currently active */
  isActive?: boolean;
}

const blinkAnimations = {
  slow: 'animate-blink-slow',
  medium: 'animate-blink',
  fast: 'animate-blink-fast',
  off: '',
};

// Smooth transition classes for position movement between characters
// Uses transform and left/top for GPU-accelerated smooth animations
const smoothTransitions = {
  off: '',
  slow: 'transition-[left,top,transform,opacity] duration-200 ease-out will-change-transform',
  medium: 'transition-[left,top,transform,opacity] duration-100 ease-out will-change-transform',
  fast: 'transition-[left,top,transform,opacity] duration-50 ease-out will-change-transform',
};

// Theme color class - uses CSS variable for caret color
const caretColorClass = 'bg-caret';
const caretBorderColorClass = 'border-caret';

export const Caret = memo(function Caret({
  style = 'line',
  smooth = 'medium',
  blinkSpeed = 'medium',
  color,
  width = 2,
  height = 24,
  className,
  isActive = true,
}: CaretProps) {
  const blinkClass = isActive ? blinkAnimations[blinkSpeed] : '';
  const smoothClass = smoothTransitions[smooth];

  const baseClasses = cn(
    'pointer-events-none',
    'absolute',
    blinkClass,
    smoothClass,
    className
  );

  // Custom color overrides theme color via inline style
  const colorStyle = color ? { backgroundColor: color, borderColor: color } : {};

  switch (style) {
    case 'line':
      return (
        <span
          className={cn(baseClasses, caretColorClass, 'rounded-sm')}
          style={{
            width: `${width}px`,
            height: `${height}px`,
            ...colorStyle,
          }}
          aria-hidden="true"
        />
      );

    case 'block':
      return (
        <span
          className={cn(baseClasses, caretColorClass, 'opacity-50 rounded-sm')}
          style={{
            width: '0.6em',
            height: `${height}px`,
            ...colorStyle,
          }}
          aria-hidden="true"
        />
      );

    case 'outline':
      return (
        <span
          className={cn(baseClasses, 'border-2', caretBorderColorClass, 'bg-transparent rounded-sm')}
          style={{
            width: '0.6em',
            height: `${height}px`,
            ...colorStyle,
            backgroundColor: 'transparent',
          }}
          aria-hidden="true"
        />
      );

    case 'underline':
      return (
        <span
          className={cn(baseClasses, caretColorClass, 'rounded-sm')}
          style={{
            width: '0.6em',
            height: `${width}px`,
            marginTop: `${height - width}px`,
            ...colorStyle,
          }}
          aria-hidden="true"
        />
      );

    default:
      return null;
  }
});

export default Caret;
