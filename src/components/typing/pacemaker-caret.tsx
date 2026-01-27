'use client';

import { memo, useEffect, useRef, useMemo } from 'react';
import { cn } from '@/lib/utils/cn';
import { useTypingStore } from '@/store/typing-store';
import { useConfigStore } from '@/store/config-store';

export interface PacemakerCaretProps {
  /** Container ref for positioning */
  containerRef: React.RefObject<HTMLDivElement>;
  /** Word refs for calculating positions */
  wordRefs: React.RefObject<Map<number, HTMLSpanElement>>;
  /** Additional class names */
  className?: string;
}

/**
 * PacemakerCaret - A ghost caret that moves at a fixed target WPM
 * for users to race against. Helps users maintain a target typing speed.
 */
export const PacemakerCaret = memo(function PacemakerCaret({
  containerRef,
  wordRefs,
  className,
}: PacemakerCaretProps) {
  const caretRef = useRef<HTMLSpanElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Get state from stores
  const pacemakerEnabled = useConfigStore((state) => state.pacemaker.enabled);
  const pacemakerWpm = useConfigStore((state) => state.pacemaker.wpm);
  const status = useTypingStore((state) => state.status);
  const words = useTypingStore((state) => state.words);
  const startTime = useTypingStore((state) => state.startTime);
  const updatePacemakerPosition = useTypingStore((state) => state.updatePacemakerPosition);

  // Calculate which word and character the pacemaker is at
  const calculatePosition = useMemo(() => {
    return (pacemakerPos: number) => {
      let charCount = 0;
      let wordIndex = 0;
      let charIndex = 0;

      for (let i = 0; i < words.length; i++) {
        const wordLength = words[i].text.length;
        const wordWithSpace = wordLength + (i < words.length - 1 ? 1 : 0); // +1 for space

        if (charCount + wordWithSpace > pacemakerPos) {
          wordIndex = i;
          charIndex = Math.floor(pacemakerPos - charCount);
          // If charIndex equals word length, we're at the space position
          if (charIndex > wordLength) {
            charIndex = wordLength;
          }
          break;
        }
        charCount += wordWithSpace;
        wordIndex = i;
        charIndex = wordLength; // End of word
      }

      return { wordIndex, charIndex };
    };
  }, [words]);

  // Animation loop for smooth pacemaker movement
  useEffect(() => {
    if (!pacemakerEnabled || status !== 'running' || !startTime) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const animate = () => {
      // Update the pacemaker position in the store
      updatePacemakerPosition(pacemakerWpm);

      // Get the current position
      const state = useTypingStore.getState();
      const pacemakerPos = state.pacemakerPosition;
      const { wordIndex, charIndex } = calculatePosition(pacemakerPos);

      // Position the caret
      if (caretRef.current && wordRefs.current && containerRef.current) {
        const wordElement = wordRefs.current.get(wordIndex);
        if (wordElement) {
          const wordRect = wordElement.getBoundingClientRect();
          const containerRect = containerRef.current.getBoundingClientRect();

          // Find the character position within the word
          const chars = wordElement.querySelectorAll('.word > span > span');
          let left = wordRect.left - containerRect.left;
          let top = wordRect.top - containerRect.top + containerRef.current.scrollTop;

          if (chars.length > 0 && charIndex < chars.length) {
            const charRect = chars[charIndex].getBoundingClientRect();
            left = charRect.left - containerRect.left;
            top = charRect.top - containerRect.top + containerRef.current.scrollTop;
          } else if (chars.length > 0 && charIndex >= chars.length) {
            // Position at end of word (after last character)
            const lastCharRect = chars[chars.length - 1].getBoundingClientRect();
            left = lastCharRect.right - containerRect.left;
            top = lastCharRect.top - containerRect.top + containerRef.current.scrollTop;
          }

          caretRef.current.style.transform = `translate(${left}px, ${top}px)`;
        }
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [pacemakerEnabled, status, startTime, pacemakerWpm, calculatePosition, updatePacemakerPosition, wordRefs, containerRef]);

  // Don't render if pacemaker is disabled or test is not running
  if (!pacemakerEnabled || status !== 'running') {
    return null;
  }

  return (
    <span
      ref={caretRef}
      className={cn(
        'absolute pointer-events-none z-10',
        'w-0.5 h-6 rounded-sm',
        'bg-sub opacity-50',
        'transition-transform duration-75 ease-linear',
        className
      )}
      style={{
        transform: 'translate(0, 0)',
      }}
      aria-hidden="true"
      data-testid="pacemaker-caret"
    />
  );
});

export default PacemakerCaret;
