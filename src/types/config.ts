// Configuration-related type definitions

/**
 * Theme color configuration
 */
export interface ThemeColors {
  /** Background color */
  background: string;
  /** Main text color */
  text: string;
  /** Primary accent color */
  primary: string;
  /** Secondary accent color */
  secondary: string;
  /** Tertiary/subtle color */
  tertiary: string;
  /** Error/incorrect color */
  error: string;
  /** Extra character color */
  extra: string;
  /** Color for colorful mode */
  colorfulError: string;
  /** Caret color */
  caret: string;
  /** Caret color (secondary) */
  caretSecondary: string;
  /** Sub/muted text color */
  sub: string;
  /** Sub alt color */
  subAlt: string;
}

/**
 * Theme configuration
 */
export interface ThemeConfig {
  /** Unique theme identifier */
  id: string;
  /** Display name */
  name: string;
  /** Theme author */
  author: string;
  /** Theme description */
  description: string | null;
  /** Theme colors */
  colors: ThemeColors;
  /** Whether this is a dark theme */
  isDark: boolean;
  /** Whether this is a custom user theme */
  isCustom: boolean;
  /** Theme tags for filtering */
  tags: string[];
  /** Preview image URL */
  previewUrl: string | null;
  /** Number of users using this theme */
  usageCount: number;
  /** When theme was created */
  createdAt: string;
}

/**
 * Caret style options
 */
export type CaretStyle = 'line' | 'block' | 'underline' | 'outline';

/**
 * Caret configuration
 */
export interface CaretConfig {
  /** Caret style */
  style: CaretStyle;
  /** Enable smooth caret animation */
  smooth: boolean;
  /** Caret blink speed in ms (0 to disable) */
  blinkSpeed: number;
  /** Caret width in pixels (for line style) */
  width: number;
  /** Custom caret color (overrides theme) */
  customColor: string | null;
  /** Caret opacity (0-1) */
  opacity: number;
}

/**
 * Sound effect pack
 */
export interface SoundPack {
  /** Pack identifier */
  id: string;
  /** Display name */
  name: string;
  /** Pack description */
  description: string | null;
  /** Author name */
  author: string;
  /** Sound files */
  sounds: {
    /** Key press sounds (array for variation) */
    keyPress: string[];
    /** Key release sounds */
    keyRelease: string[] | null;
    /** Space bar sound */
    space: string | null;
    /** Backspace sound */
    backspace: string | null;
    /** Enter sound */
    enter: string | null;
    /** Error sound */
    error: string | null;
    /** Test complete sound */
    complete: string | null;
    /** Personal best sound */
    personalBest: string | null;
  };
  /** Preview audio URL */
  previewUrl: string | null;
}

/**
 * Sound configuration
 */
export interface SoundConfig {
  /** Enable all sounds */
  enabled: boolean;
  /** Master volume (0-1) */
  volume: number;
  /** Current sound pack ID */
  packId: string;
  /** Enable keyboard sounds */
  keyboardSounds: boolean;
  /** Keyboard sound volume (0-1) */
  keyboardVolume: number;
  /** Enable click variation */
  clickVariation: boolean;
  /** Enable error sounds */
  errorSounds: boolean;
  /** Enable completion sounds */
  completionSounds: boolean;
  /** Enable ambient sounds */
  ambientSounds: boolean;
  /** Ambient volume (0-1) */
  ambientVolume: number;
  /** Current ambient sound ID */
  ambientSoundId: string | null;
}

/**
 * Font configuration
 */
export interface FontConfig {
  /** Font family name */
  family: string;
  /** Font size in pixels */
  size: number;
  /** Font weight */
  weight: number;
  /** Line height multiplier */
  lineHeight: number;
  /** Letter spacing in em */
  letterSpacing: number;
  /** Whether font is monospace */
  isMonospace: boolean;
}

/**
 * Layout configuration
 */
export interface LayoutConfig {
  /** Page width ('full' | 'wide' | 'normal' | 'narrow') */
  pageWidth: 'full' | 'wide' | 'normal' | 'narrow';
  /** Show header */
  showHeader: boolean;
  /** Show footer */
  showFooter: boolean;
  /** Show key tips */
  showKeyTips: boolean;
  /** Test layout ('standard' | 'split' | 'stacked') */
  testLayout: 'standard' | 'split' | 'stacked';
  /** Words per line (0 for auto) */
  wordsPerLine: number;
  /** Enable smooth scrolling */
  smoothScrolling: boolean;
  /** Scroll behavior ('page' | 'word' | 'continuous') */
  scrollBehavior: 'page' | 'word' | 'continuous';
}

/**
 * Complete app configuration
 */
export interface AppConfig {
  /** Theme configuration */
  theme: ThemeConfig;
  /** Caret configuration */
  caret: CaretConfig;
  /** Sound configuration */
  sound: SoundConfig;
  /** Font configuration */
  font: FontConfig;
  /** Layout configuration */
  layout: LayoutConfig;
}
