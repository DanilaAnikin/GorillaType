/**
 * Keyboard layout definitions for the visual keymap
 */

export type KeymapLayoutType = 'qwerty' | 'dvorak' | 'colemak' | 'workman';

export interface KeyDefinition {
  key: string;       // The character or key name
  display?: string;  // Optional display text (e.g., for shift, space)
  width?: number;    // Width multiplier (1 = normal key, 2 = double width, etc.)
}

export type KeyboardRow = KeyDefinition[];
export type KeyboardLayout = KeyboardRow[];

/**
 * QWERTY keyboard layout
 */
export const QWERTY_LAYOUT: KeyboardLayout = [
  // Number row
  [
    { key: '`' },
    { key: '1' },
    { key: '2' },
    { key: '3' },
    { key: '4' },
    { key: '5' },
    { key: '6' },
    { key: '7' },
    { key: '8' },
    { key: '9' },
    { key: '0' },
    { key: '-' },
    { key: '=' },
  ],
  // Top letter row
  [
    { key: 'q' },
    { key: 'w' },
    { key: 'e' },
    { key: 'r' },
    { key: 't' },
    { key: 'y' },
    { key: 'u' },
    { key: 'i' },
    { key: 'o' },
    { key: 'p' },
    { key: '[' },
    { key: ']' },
    { key: '\\' },
  ],
  // Home row
  [
    { key: 'a' },
    { key: 's' },
    { key: 'd' },
    { key: 'f' },
    { key: 'g' },
    { key: 'h' },
    { key: 'j' },
    { key: 'k' },
    { key: 'l' },
    { key: ';' },
    { key: "'" },
  ],
  // Bottom letter row
  [
    { key: 'shift', display: 'shift', width: 1.5 },
    { key: 'z' },
    { key: 'x' },
    { key: 'c' },
    { key: 'v' },
    { key: 'b' },
    { key: 'n' },
    { key: 'm' },
    { key: ',' },
    { key: '.' },
    { key: '/' },
    { key: 'shift', display: 'shift', width: 1.5 },
  ],
  // Space bar row
  [
    { key: ' ', display: 'space', width: 8 },
  ],
];

/**
 * Dvorak keyboard layout
 */
export const DVORAK_LAYOUT: KeyboardLayout = [
  // Number row
  [
    { key: '`' },
    { key: '1' },
    { key: '2' },
    { key: '3' },
    { key: '4' },
    { key: '5' },
    { key: '6' },
    { key: '7' },
    { key: '8' },
    { key: '9' },
    { key: '0' },
    { key: '[' },
    { key: ']' },
  ],
  // Top letter row
  [
    { key: "'" },
    { key: ',' },
    { key: '.' },
    { key: 'p' },
    { key: 'y' },
    { key: 'f' },
    { key: 'g' },
    { key: 'c' },
    { key: 'r' },
    { key: 'l' },
    { key: '/' },
    { key: '=' },
    { key: '\\' },
  ],
  // Home row
  [
    { key: 'a' },
    { key: 'o' },
    { key: 'e' },
    { key: 'u' },
    { key: 'i' },
    { key: 'd' },
    { key: 'h' },
    { key: 't' },
    { key: 'n' },
    { key: 's' },
    { key: '-' },
  ],
  // Bottom letter row
  [
    { key: 'shift', display: 'shift', width: 1.5 },
    { key: ';' },
    { key: 'q' },
    { key: 'j' },
    { key: 'k' },
    { key: 'x' },
    { key: 'b' },
    { key: 'm' },
    { key: 'w' },
    { key: 'v' },
    { key: 'z' },
    { key: 'shift', display: 'shift', width: 1.5 },
  ],
  // Space bar row
  [
    { key: ' ', display: 'space', width: 8 },
  ],
];

/**
 * Colemak keyboard layout
 */
export const COLEMAK_LAYOUT: KeyboardLayout = [
  // Number row
  [
    { key: '`' },
    { key: '1' },
    { key: '2' },
    { key: '3' },
    { key: '4' },
    { key: '5' },
    { key: '6' },
    { key: '7' },
    { key: '8' },
    { key: '9' },
    { key: '0' },
    { key: '-' },
    { key: '=' },
  ],
  // Top letter row
  [
    { key: 'q' },
    { key: 'w' },
    { key: 'f' },
    { key: 'p' },
    { key: 'g' },
    { key: 'j' },
    { key: 'l' },
    { key: 'u' },
    { key: 'y' },
    { key: ';' },
    { key: '[' },
    { key: ']' },
    { key: '\\' },
  ],
  // Home row
  [
    { key: 'a' },
    { key: 'r' },
    { key: 's' },
    { key: 't' },
    { key: 'd' },
    { key: 'h' },
    { key: 'n' },
    { key: 'e' },
    { key: 'i' },
    { key: 'o' },
    { key: "'" },
  ],
  // Bottom letter row
  [
    { key: 'shift', display: 'shift', width: 1.5 },
    { key: 'z' },
    { key: 'x' },
    { key: 'c' },
    { key: 'v' },
    { key: 'b' },
    { key: 'k' },
    { key: 'm' },
    { key: ',' },
    { key: '.' },
    { key: '/' },
    { key: 'shift', display: 'shift', width: 1.5 },
  ],
  // Space bar row
  [
    { key: ' ', display: 'space', width: 8 },
  ],
];

/**
 * Workman keyboard layout
 */
export const WORKMAN_LAYOUT: KeyboardLayout = [
  // Number row
  [
    { key: '`' },
    { key: '1' },
    { key: '2' },
    { key: '3' },
    { key: '4' },
    { key: '5' },
    { key: '6' },
    { key: '7' },
    { key: '8' },
    { key: '9' },
    { key: '0' },
    { key: '-' },
    { key: '=' },
  ],
  // Top letter row
  [
    { key: 'q' },
    { key: 'd' },
    { key: 'r' },
    { key: 'w' },
    { key: 'b' },
    { key: 'j' },
    { key: 'f' },
    { key: 'u' },
    { key: 'p' },
    { key: ';' },
    { key: '[' },
    { key: ']' },
    { key: '\\' },
  ],
  // Home row
  [
    { key: 'a' },
    { key: 's' },
    { key: 'h' },
    { key: 't' },
    { key: 'g' },
    { key: 'y' },
    { key: 'n' },
    { key: 'e' },
    { key: 'o' },
    { key: 'i' },
    { key: "'" },
  ],
  // Bottom letter row
  [
    { key: 'shift', display: 'shift', width: 1.5 },
    { key: 'z' },
    { key: 'x' },
    { key: 'm' },
    { key: 'c' },
    { key: 'v' },
    { key: 'k' },
    { key: 'l' },
    { key: ',' },
    { key: '.' },
    { key: '/' },
    { key: 'shift', display: 'shift', width: 1.5 },
  ],
  // Space bar row
  [
    { key: ' ', display: 'space', width: 8 },
  ],
];

/**
 * Get a keyboard layout by name
 */
export function getKeyboardLayout(layout: KeymapLayoutType): KeyboardLayout {
  switch (layout) {
    case 'qwerty':
      return QWERTY_LAYOUT;
    case 'dvorak':
      return DVORAK_LAYOUT;
    case 'colemak':
      return COLEMAK_LAYOUT;
    case 'workman':
      return WORKMAN_LAYOUT;
    default:
      return QWERTY_LAYOUT;
  }
}

/**
 * Map of shifted characters for special keys
 */
export const SHIFT_MAP: Record<string, string> = {
  '`': '~',
  '1': '!',
  '2': '@',
  '3': '#',
  '4': '$',
  '5': '%',
  '6': '^',
  '7': '&',
  '8': '*',
  '9': '(',
  '0': ')',
  '-': '_',
  '=': '+',
  '[': '{',
  ']': '}',
  '\\': '|',
  ';': ':',
  "'": '"',
  ',': '<',
  '.': '>',
  '/': '?',
};

/**
 * Get the key that would produce the given character (considering shift)
 * Returns an object with the base key and whether shift is required
 */
export function getKeyForChar(char: string): { key: string; needsShift: boolean } {
  // Check if it's an uppercase letter
  if (char >= 'A' && char <= 'Z') {
    return { key: char.toLowerCase(), needsShift: true };
  }

  // Check if it's a shifted symbol
  for (const [base, shifted] of Object.entries(SHIFT_MAP)) {
    if (shifted === char) {
      return { key: base, needsShift: true };
    }
  }

  // Check if it's a lowercase letter or unshifted symbol
  return { key: char.toLowerCase(), needsShift: false };
}

/**
 * Check if a key exists in a given layout
 */
export function keyExistsInLayout(key: string, layout: KeyboardLayout): boolean {
  for (const row of layout) {
    for (const keyDef of row) {
      if (keyDef.key === key || keyDef.key === key.toLowerCase()) {
        return true;
      }
    }
  }
  return false;
}
