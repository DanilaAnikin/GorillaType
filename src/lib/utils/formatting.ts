/**
 * Number and time formatting utilities.
 */

/**
 * Format seconds into a human-readable time string.
 * Supports formats: "ss", "m:ss", "h:mm:ss"
 *
 * @param seconds - Number of seconds to format
 * @param options - Formatting options
 * @returns Formatted time string
 *
 * @example
 * formatTime(65) // "1:05"
 * formatTime(3665) // "1:01:05"
 * formatTime(45, { padMinutes: true }) // "0:45"
 */
export function formatTime(
  seconds: number,
  options: { showHours?: boolean; padMinutes?: boolean } = {}
): string {
  const { showHours = false, padMinutes = false } = options;

  if (seconds < 0) seconds = 0;

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const paddedSecs = secs.toString().padStart(2, "0");

  if (hours > 0 || showHours) {
    const paddedMins = minutes.toString().padStart(2, "0");
    return `${hours}:${paddedMins}:${paddedSecs}`;
  }

  if (padMinutes) {
    return `${minutes}:${paddedSecs}`;
  }

  return minutes > 0 ? `${minutes}:${paddedSecs}` : `${secs}`;
}

/**
 * Format a number with thousand separators.
 *
 * @param num - Number to format
 * @param locale - Locale for formatting (default: "en-US")
 * @returns Formatted number string
 *
 * @example
 * formatNumber(1234567) // "1,234,567"
 * formatNumber(1234.56) // "1,234.56"
 */
export function formatNumber(num: number, locale: string = "en-US"): string {
  return num.toLocaleString(locale);
}

/**
 * Format a number as a percentage.
 *
 * @param num - Number to format (0-100 or 0-1)
 * @param options - Formatting options
 * @returns Formatted percentage string
 *
 * @example
 * formatPercentage(85.5) // "85.5%"
 * formatPercentage(0.855, { isDecimal: true }) // "85.5%"
 * formatPercentage(85.567, { decimals: 1 }) // "85.6%"
 */
export function formatPercentage(
  num: number,
  options: { decimals?: number; isDecimal?: boolean } = {}
): string {
  const { decimals = 2, isDecimal = false } = options;

  let percentage = isDecimal ? num * 100 : num;

  // Clamp between 0 and 100
  percentage = Math.max(0, Math.min(100, percentage));

  // Round to specified decimals
  const factor = Math.pow(10, decimals);
  percentage = Math.round(percentage * factor) / factor;

  // Remove unnecessary trailing zeros
  const formatted = percentage.toFixed(decimals).replace(/\.?0+$/, "");

  return `${formatted}%`;
}

/**
 * Format WPM value for display.
 *
 * @param wpm - Words per minute value
 * @returns Formatted WPM string
 *
 * @example
 * formatWPM(85) // "85 WPM"
 * formatWPM(85.7) // "86 WPM"
 */
export function formatWPM(wpm: number): string {
  return `${Math.round(wpm)} WPM`;
}

/**
 * Format a date for display.
 *
 * @param date - Date to format
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 *
 * @example
 * formatDate(new Date()) // "Jan 25, 2026"
 */
export function formatDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const dateObj = date instanceof Date ? date : new Date(date);

  const defaultOptions: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...options
  };

  return dateObj.toLocaleDateString("en-US", defaultOptions);
}

/**
 * Format a date as relative time (e.g., "2 hours ago").
 *
 * @param date - Date to format
 * @returns Relative time string
 *
 * @example
 * formatRelativeTime(new Date(Date.now() - 3600000)) // "1 hour ago"
 */
export function formatRelativeTime(date: Date | string | number): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSecs < 60) {
    return "just now";
  } else if (diffMins < 60) {
    return `${diffMins} ${diffMins === 1 ? "minute" : "minutes"} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
  } else if (diffWeeks < 4) {
    return `${diffWeeks} ${diffWeeks === 1 ? "week" : "weeks"} ago`;
  } else if (diffMonths < 12) {
    return `${diffMonths} ${diffMonths === 1 ? "month" : "months"} ago`;
  } else {
    return `${diffYears} ${diffYears === 1 ? "year" : "years"} ago`;
  }
}

/**
 * Format bytes into human-readable size.
 *
 * @param bytes - Number of bytes
 * @param decimals - Number of decimal places
 * @returns Formatted size string
 *
 * @example
 * formatBytes(1024) // "1 KB"
 * formatBytes(1234567) // "1.18 MB"
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * Format ordinal numbers (1st, 2nd, 3rd, etc.).
 *
 * @param num - Number to format
 * @returns Formatted ordinal string
 *
 * @example
 * formatOrdinal(1) // "1st"
 * formatOrdinal(22) // "22nd"
 */
export function formatOrdinal(num: number): string {
  const suffixes = ["th", "st", "nd", "rd"];
  const v = num % 100;
  return num + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

/**
 * Truncate text with ellipsis.
 *
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text
 *
 * @example
 * truncateText("Hello World", 8) // "Hello..."
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}
