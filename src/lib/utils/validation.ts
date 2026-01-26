/**
 * Input validation utilities for user data and form inputs.
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate username format.
 * - 3-20 characters
 * - Alphanumeric and underscores only
 * - Must start with a letter
 *
 * @param username - Username to validate
 * @returns Validation result
 */
export function validateUsername(username: string): ValidationResult {
  if (!username || typeof username !== "string") {
    return { isValid: false, error: "Username is required" };
  }

  const trimmed = username.trim();

  if (trimmed.length < 3) {
    return { isValid: false, error: "Username must be at least 3 characters" };
  }

  if (trimmed.length > 20) {
    return { isValid: false, error: "Username must be at most 20 characters" };
  }

  if (!/^[a-zA-Z]/.test(trimmed)) {
    return { isValid: false, error: "Username must start with a letter" };
  }

  if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(trimmed)) {
    return { isValid: false, error: "Username can only contain letters, numbers, and underscores" };
  }

  return { isValid: true };
}

/**
 * Validate email format.
 *
 * @param email - Email to validate
 * @returns Validation result
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || typeof email !== "string") {
    return { isValid: false, error: "Email is required" };
  }

  const trimmed = email.trim();

  // Basic email regex pattern
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(trimmed)) {
    return { isValid: false, error: "Please enter a valid email address" };
  }

  if (trimmed.length > 254) {
    return { isValid: false, error: "Email address is too long" };
  }

  return { isValid: true };
}

/**
 * Validate password strength.
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 *
 * @param password - Password to validate
 * @returns Validation result with strength indicator
 */
export function validatePassword(password: string): ValidationResult & { strength?: "weak" | "medium" | "strong" } {
  if (!password || typeof password !== "string") {
    return { isValid: false, error: "Password is required" };
  }

  if (password.length < 8) {
    return { isValid: false, error: "Password must be at least 8 characters" };
  }

  if (password.length > 128) {
    return { isValid: false, error: "Password is too long" };
  }

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  if (!hasUppercase) {
    return { isValid: false, error: "Password must contain at least one uppercase letter" };
  }

  if (!hasLowercase) {
    return { isValid: false, error: "Password must contain at least one lowercase letter" };
  }

  if (!hasNumber) {
    return { isValid: false, error: "Password must contain at least one number" };
  }

  // Determine strength
  let strength: "weak" | "medium" | "strong" = "weak";
  const score = [hasUppercase, hasLowercase, hasNumber, hasSpecial, password.length >= 12].filter(Boolean).length;

  if (score >= 5) {
    strength = "strong";
  } else if (score >= 3) {
    strength = "medium";
  }

  return { isValid: true, strength };
}

/**
 * Validate that two values match (e.g., password confirmation).
 *
 * @param value1 - First value
 * @param value2 - Second value
 * @param fieldName - Name of the field for error message
 * @returns Validation result
 */
export function validateMatch(value1: string, value2: string, fieldName: string = "values"): ValidationResult {
  if (value1 !== value2) {
    return { isValid: false, error: `${fieldName} do not match` };
  }
  return { isValid: true };
}

/**
 * Validate a positive integer within a range.
 *
 * @param value - Value to validate
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @param fieldName - Name of the field for error message
 * @returns Validation result
 */
export function validateNumber(
  value: number | string,
  min: number,
  max: number,
  fieldName: string = "Value"
): ValidationResult {
  const num = typeof value === "string" ? parseInt(value, 10) : value;

  if (isNaN(num)) {
    return { isValid: false, error: `${fieldName} must be a number` };
  }

  if (!Number.isInteger(num)) {
    return { isValid: false, error: `${fieldName} must be a whole number` };
  }

  if (num < min) {
    return { isValid: false, error: `${fieldName} must be at least ${min}` };
  }

  if (num > max) {
    return { isValid: false, error: `${fieldName} must be at most ${max}` };
  }

  return { isValid: true };
}

/**
 * Validate test duration selection.
 *
 * @param duration - Duration in seconds
 * @returns Validation result
 */
export function validateTestDuration(duration: number): ValidationResult {
  const allowedDurations = [15, 30, 60, 120, 300];

  if (!allowedDurations.includes(duration)) {
    return {
      isValid: false,
      error: `Duration must be one of: ${allowedDurations.map((d) => d + "s").join(", ")}`
    };
  }

  return { isValid: true };
}

/**
 * Validate word count selection.
 *
 * @param count - Number of words
 * @returns Validation result
 */
export function validateWordCount(count: number): ValidationResult {
  const allowedCounts = [10, 25, 50, 100, 200];

  if (!allowedCounts.includes(count)) {
    return {
      isValid: false,
      error: `Word count must be one of: ${allowedCounts.join(", ")}`
    };
  }

  return { isValid: true };
}

/**
 * Sanitize user input by removing potentially dangerous characters.
 *
 * @param input - Input string to sanitize
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  return input
    .trim()
    .replace(/[<>]/g, "") // Remove angle brackets
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, ""); // Remove event handlers
}

/**
 * Validate custom word list input.
 *
 * @param words - Array of custom words
 * @returns Validation result
 */
export function validateCustomWords(words: string[]): ValidationResult {
  if (!Array.isArray(words)) {
    return { isValid: false, error: "Words must be provided as an array" };
  }

  if (words.length < 10) {
    return { isValid: false, error: "Please provide at least 10 words" };
  }

  if (words.length > 1000) {
    return { isValid: false, error: "Maximum 1000 words allowed" };
  }

  const invalidWords = words.filter((word) => {
    if (typeof word !== "string") return true;
    if (word.trim().length === 0) return true;
    if (word.length > 50) return true;
    return false;
  });

  if (invalidWords.length > 0) {
    return { isValid: false, error: "Some words are invalid (empty or too long)" };
  }

  return { isValid: true };
}
