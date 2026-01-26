'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export interface UseTimerOptions {
  /** Initial time in seconds (for countdown mode) */
  initialTime?: number;
  /** Whether to count down instead of up */
  countdown?: boolean;
  /** Callback when timer reaches zero (countdown mode) */
  onComplete?: () => void;
  /** Callback called every second with current time */
  onTick?: (time: number) => void;
  /** Auto-start the timer */
  autoStart?: boolean;
}

export interface UseTimerReturn {
  /** Current elapsed time in seconds */
  time: number;
  /** Whether the timer is currently running */
  isRunning: boolean;
  /** Start the timer */
  start: () => void;
  /** Stop/pause the timer */
  stop: () => void;
  /** Reset the timer to initial state */
  reset: () => void;
  /** Restart the timer (reset + start) */
  restart: () => void;
}

export function useTimer(options: UseTimerOptions = {}): UseTimerReturn {
  const {
    initialTime = 0,
    countdown = false,
    onComplete,
    onTick,
    autoStart = false,
  } = options;

  const [time, setTime] = useState<number>(countdown ? initialTime : 0);
  const [isRunning, setIsRunning] = useState<boolean>(autoStart);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pausedTimeRef = useRef<number>(countdown ? initialTime : 0);

  // Clear interval helper
  const clearTimerInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Start the timer
  const start = useCallback(() => {
    if (isRunning) return;

    setIsRunning(true);
    startTimeRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - (startTimeRef.current || Date.now())) / 1000);

      let newTime: number;
      if (countdown) {
        newTime = Math.max(0, pausedTimeRef.current - elapsed);
        setTime(newTime);
        onTick?.(newTime);

        if (newTime === 0) {
          clearTimerInterval();
          setIsRunning(false);
          onComplete?.();
        }
      } else {
        newTime = pausedTimeRef.current + elapsed;
        setTime(newTime);
        onTick?.(newTime);
      }
    }, 1000);
  }, [isRunning, countdown, onComplete, onTick, clearTimerInterval]);

  // Stop/pause the timer
  const stop = useCallback(() => {
    if (!isRunning) return;

    clearTimerInterval();
    setIsRunning(false);

    // Save the current time for resuming
    if (startTimeRef.current) {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      if (countdown) {
        pausedTimeRef.current = Math.max(0, pausedTimeRef.current - elapsed);
      } else {
        pausedTimeRef.current = pausedTimeRef.current + elapsed;
      }
    }
    startTimeRef.current = null;
  }, [isRunning, countdown, clearTimerInterval]);

  // Reset the timer
  const reset = useCallback(() => {
    clearTimerInterval();
    setIsRunning(false);
    startTimeRef.current = null;
    pausedTimeRef.current = countdown ? initialTime : 0;
    setTime(countdown ? initialTime : 0);
  }, [countdown, initialTime, clearTimerInterval]);

  // Restart the timer (reset + start)
  const restart = useCallback(() => {
    reset();
    // Use setTimeout to ensure state is reset before starting
    setTimeout(() => {
      pausedTimeRef.current = countdown ? initialTime : 0;
      setIsRunning(true);
      startTimeRef.current = Date.now();

      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - (startTimeRef.current || Date.now())) / 1000);

        let newTime: number;
        if (countdown) {
          newTime = Math.max(0, initialTime - elapsed);
          setTime(newTime);
          onTick?.(newTime);

          if (newTime === 0) {
            clearTimerInterval();
            setIsRunning(false);
            onComplete?.();
          }
        } else {
          newTime = elapsed;
          setTime(newTime);
          onTick?.(newTime);
        }
      }, 1000);
    }, 0);
  }, [countdown, initialTime, onComplete, onTick, reset, clearTimerInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimerInterval();
    };
  }, [clearTimerInterval]);

  // Auto-start if enabled
  useEffect(() => {
    if (autoStart) {
      // Use queueMicrotask to defer the state update and avoid synchronous setState in effect
      queueMicrotask(() => {
        start();
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    time,
    isRunning,
    start,
    stop,
    reset,
    restart,
  };
}

export default useTimer;
