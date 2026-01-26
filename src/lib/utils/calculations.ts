/**
 * Typing test calculation utilities for WPM, accuracy, and anti-cheat validation.
 */

export interface TestResult {
  correctChars: number;
  totalChars: number;
  seconds: number;
  wpmHistory?: number[];
  startTime?: number;
  endTime?: number;
}

/**
 * Calculate Words Per Minute (WPM) based on correct characters typed.
 * Standard WPM calculation uses 5 characters per word.
 *
 * @param correctChars - Number of correctly typed characters
 * @param seconds - Time elapsed in seconds
 * @returns WPM value (minimum 0)
 */
export function calculateWPM(correctChars: number, seconds: number): number {
  if (seconds <= 0) return 0;
  const minutes = seconds / 60;
  const words = correctChars / 5;
  return Math.max(0, Math.round(words / minutes));
}

/**
 * Calculate Raw WPM including all typed characters (correct and incorrect).
 *
 * @param totalChars - Total number of characters typed
 * @param seconds - Time elapsed in seconds
 * @returns Raw WPM value (minimum 0)
 */
export function calculateRawWPM(totalChars: number, seconds: number): number {
  if (seconds <= 0) return 0;
  const minutes = seconds / 60;
  const words = totalChars / 5;
  return Math.max(0, Math.round(words / minutes));
}

/**
 * Calculate typing accuracy as a percentage.
 *
 * @param correctChars - Number of correctly typed characters
 * @param totalChars - Total number of characters typed
 * @returns Accuracy percentage (0-100)
 */
export function calculateAccuracy(correctChars: number, totalChars: number): number {
  if (totalChars <= 0) return 100;
  const accuracy = (correctChars / totalChars) * 100;
  return Math.max(0, Math.min(100, Math.round(accuracy * 100) / 100));
}

/**
 * Calculate typing consistency based on WPM history.
 * Uses coefficient of variation (CV) to measure consistency.
 * Returns 100 - CV, so higher values mean more consistent typing.
 *
 * @param wpmHistory - Array of WPM values recorded during the test
 * @returns Consistency percentage (0-100)
 */
export function calculateConsistency(wpmHistory: number[]): number {
  if (wpmHistory.length < 2) return 100;

  // Filter out zero values that might occur at start
  const validHistory = wpmHistory.filter((wpm) => wpm > 0);
  if (validHistory.length < 2) return 100;

  // Calculate mean
  const mean = validHistory.reduce((sum, val) => sum + val, 0) / validHistory.length;
  if (mean === 0) return 100;

  // Calculate standard deviation
  const squaredDiffs = validHistory.map((val) => Math.pow(val - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / validHistory.length;
  const standardDeviation = Math.sqrt(avgSquaredDiff);

  // Coefficient of variation (CV) as percentage
  const cv = (standardDeviation / mean) * 100;

  // Return 100 - CV, clamped between 0 and 100
  return Math.max(0, Math.min(100, Math.round((100 - cv) * 100) / 100));
}

/**
 * Anti-cheat validation for test results.
 * Checks for suspicious patterns that might indicate cheating.
 *
 * @param result - Test result to validate
 * @returns Object with isValid flag and reason if invalid
 */
export function validateResult(result: TestResult): { isValid: boolean; reason?: string } {
  const { correctChars, totalChars, seconds, wpmHistory, startTime, endTime } = result;

  // Check for minimum test duration (at least 5 seconds)
  if (seconds < 5) {
    return { isValid: false, reason: "Test duration too short" };
  }

  // Check for impossibly high WPM (world record is around 220 WPM)
  const wpm = calculateWPM(correctChars, seconds);
  if (wpm > 300) {
    return { isValid: false, reason: "WPM exceeds possible human limits" };
  }

  // Check for suspiciously perfect accuracy with high speed
  const accuracy = calculateAccuracy(correctChars, totalChars);
  if (wpm > 150 && accuracy === 100 && seconds > 30) {
    return { isValid: false, reason: "Suspicious perfect accuracy at high speed" };
  }

  // Check WPM history consistency if available
  if (wpmHistory && wpmHistory.length > 2) {
    const consistency = calculateConsistency(wpmHistory);
    // Very high consistency at high speeds is suspicious
    if (wpm > 150 && consistency > 98) {
      return { isValid: false, reason: "Suspiciously consistent typing speed" };
    }

    // Check for sudden impossible jumps in WPM
    for (let i = 1; i < wpmHistory.length; i++) {
      const jump = Math.abs(wpmHistory[i] - wpmHistory[i - 1]);
      if (jump > 100) {
        return { isValid: false, reason: "Suspicious sudden WPM change" };
      }
    }
  }

  // Validate timestamps if provided
  if (startTime && endTime) {
    const calculatedDuration = (endTime - startTime) / 1000;
    const durationDiff = Math.abs(calculatedDuration - seconds);
    if (durationDiff > 2) {
      return { isValid: false, reason: "Timestamp mismatch detected" };
    }
  }

  // Check minimum characters typed
  if (totalChars < 10) {
    return { isValid: false, reason: "Insufficient characters typed" };
  }

  return { isValid: true };
}

/**
 * Calculate experience points (XP) earned from a typing test.
 * XP is based on WPM, accuracy, and test duration.
 *
 * @param wpm - Words per minute achieved
 * @param accuracy - Accuracy percentage (0-100)
 * @param seconds - Test duration in seconds
 * @returns XP points earned
 */
export function calculateXP(wpm: number, accuracy: number, seconds: number): number {
  // Base XP from WPM (1 XP per WPM)
  const wpmXP = wpm;

  // Accuracy multiplier (0.5x at 50% accuracy, 1.5x at 100% accuracy)
  const accuracyMultiplier = 0.5 + (accuracy / 100);

  // Duration bonus (longer tests give more XP, capped at 120 seconds)
  const effectiveDuration = Math.min(seconds, 120);
  const durationMultiplier = effectiveDuration / 60; // 1x for 60s, 2x for 120s

  // Calculate total XP
  const totalXP = wpmXP * accuracyMultiplier * durationMultiplier;

  // Bonus for high accuracy (>95%)
  const accuracyBonus = accuracy >= 95 ? Math.floor(wpm * 0.1) : 0;

  // Bonus for high WPM (>100)
  const speedBonus = wpm >= 100 ? Math.floor((wpm - 100) * 0.5) : 0;

  return Math.round(totalXP + accuracyBonus + speedBonus);
}
