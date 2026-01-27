import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types
export interface CustomThemeColors {
  bg: string;
  main: string;
  caret: string;
  sub: string;
  subAlt: string;
  text: string;
  error: string;
  errorExtra: string;
}

export type TestMode = 'time' | 'words' | 'quote' | 'zen';
export type TimeDuration = 15 | 30 | 60 | 120 | number;
export type WordCount = 10 | 25 | 50 | 100 | number;
export type QuoteLength = 'short' | 'medium' | 'long' | 'all';
export type Difficulty = 'easy' | 'normal' | 'expert' | 'master';
export type Language = 'english' | 'english_1k' | 'english_5k' | 'english_10k' | 'english_25k' | 'english_50k' | 'code_javascript' | 'code_python' | 'code_rust' | 'code_go';

export type Theme =
  | 'serika-dark'
  | 'serika'
  | 'solarized-light'
  | 'github-light'
  | 'nord-light'
  | 'dracula'
  | 'nord'
  | 'monokai'
  | 'solarized-dark'
  | 'gruvbox-dark'
  | 'catppuccin-mocha'
  | 'tokyo-night'
  | 'github-dark'
  | 'one-dark'
  | 'cyber'
  | 'midnight'
  | 'ocean'
  | 'matrix'
  | '8008'
  | 'botanical'
  | 'vaporwave'
  | 'laser'
  | 'olive'
  | 'superuser'
  | 'terminal'
  | 'nautilus'
  | 'pulse'
  | 'camping'
  | 'hammerhead'
  | 'blueberry'
  | 'strawberry'
  | 'mint'
  | 'moonlight'
  | 'papercolor'
  | 'sonokai'
  | 'material'
  | 'oblivion'
  | 'joker'
  | 'custom';
export type FontFamily = 'roboto_mono' | 'jetbrains_mono' | 'fira_code' | 'source_code_pro' | 'ibm_plex_mono';
export type FontSize = 'small' | 'medium' | 'large' | 'extra_large';

export type CaretStyle = 'line' | 'block' | 'underline' | 'outline' | 'box';
export type SmoothCaret = 'off' | 'slow' | 'medium' | 'fast';
export type CaretAnimation = 'blink' | 'phase' | 'expand' | 'solid';

export type SoundVolume = 0 | 0.25 | 0.5 | 0.75 | 1;
export type ClickSound = 'off' | 'click' | 'beep' | 'pop' | 'nk_cream' | 'typewriter';
export type ErrorSound = 'off' | 'beep' | 'damage';

export type KeymapLayout = 'qwerty' | 'dvorak' | 'colemak' | 'workman';
export type FunboxMode = 'none' | 'memory' | 'readAhead' | 'weakspot';

export interface TestSettings {
  mode: TestMode;
  time: TimeDuration;
  words: WordCount;
  quoteLength: QuoteLength;
  language: Language;
  difficulty: Difficulty;
}

export interface VisualSettings {
  theme: Theme;
  fontFamily: FontFamily;
  fontSize: FontSize;
  lineHeight: number;
  letterSpacing: number;
  smoothLineScroll: boolean;
  showAllLines: boolean;
  showLiveWpm: boolean;
  showLiveAccuracy: boolean;
  showLiveBurst: boolean;
  showTimer: boolean;
  showKeyTips: boolean;
  showKeymap: boolean;
  keymapLayout: KeymapLayout;
}

export interface CaretSettings {
  style: CaretStyle;
  smoothCaret: SmoothCaret;
  animation: CaretAnimation;
  caretColor: string | null;
}

export interface SoundSettings {
  volume: SoundVolume;
  clickSound: ClickSound;
  errorSound: ErrorSound;
  soundOnClick: boolean;
  soundOnError: boolean;
}

export interface PacemakerSettings {
  enabled: boolean;
  wpm: number;
}

export interface FunboxSettings {
  mode: FunboxMode;
  memoryDuration: number;
  readAheadCount: 1 | 2 | 3;
}

export type BigramPreset = 'common' | 'difficult' | 'programming' | 'custom';

export interface BigramSettings {
  enabled: boolean;
  preset: BigramPreset;
  pairs: string[];
}

// Common English bi-grams (most frequent letter pairs)
export const COMMON_BIGRAMS = ['th', 'he', 'in', 'er', 'an', 're', 'on', 'at', 'en', 'nd', 'ti', 'es', 'or', 'te', 'of'];

// Difficult/challenging bi-grams for practice
export const DIFFICULT_BIGRAMS = ['qu', 'xy', 'xc', 'zz', 'wh', 'ck', 'gh', 'ph', 'rh', 'wr', 'kn', 'gn', 'mb', 'bt', 'mn'];

// Programming-related bi-grams
export const PROGRAMMING_BIGRAMS = ['if', 'fo', 'wh', 'fu', 're', 'ar', 'st', 'tr', 'pr', 'cl', 'co', 'va', 'le', 'fn', 'as'];

export interface BehaviorSettings {
  punctuation: boolean;
  numbers: boolean;
  stopOnError: 'off' | 'word' | 'letter';
  confidenceMode: 'off' | 'on' | 'max';
  indicateTypos: 'off' | 'below' | 'replace';
  hideExtraLetters: boolean;
  lazyMode: boolean;
  blindMode: boolean;
  quickRestart: 'off' | 'tab' | 'esc' | 'enter';
  repeatQuotes: 'off' | 'typing' | 'result';
  oppositeShiftMode: 'off' | 'on' | 'keymap';
  freedomMode: boolean;
  strictSpace: boolean;
  quickEnd: boolean;
  minWpm: 'off' | number;
  minAccuracy: 'off' | number;
  minBurst: 'off' | number;
}

export interface ConfigState {
  test: TestSettings;
  visual: VisualSettings;
  caret: CaretSettings;
  sound: SoundSettings;
  behavior: BehaviorSettings;
  pacemaker: PacemakerSettings;
  funbox: FunboxSettings;
  bigram: BigramSettings;
  customTheme: CustomThemeColors | null;

  // Test settings actions
  setMode: (mode: TestMode) => void;
  setTime: (time: TimeDuration) => void;
  setWords: (words: WordCount) => void;
  setCustomTime: (seconds: number) => void;
  setCustomWords: (count: number) => void;
  setQuoteLength: (length: QuoteLength) => void;
  setLanguage: (language: Language) => void;
  setDifficulty: (difficulty: Difficulty) => void;

  // Visual settings actions
  setTheme: (theme: Theme) => void;
  setFontFamily: (font: FontFamily) => void;
  setFontSize: (size: FontSize) => void;
  setLineHeight: (value: number) => void;
  setLetterSpacing: (value: number) => void;
  toggleSmoothLineScroll: () => void;
  toggleShowAllLines: () => void;
  toggleShowLiveWpm: () => void;
  toggleShowLiveAccuracy: () => void;
  toggleShowLiveBurst: () => void;
  toggleShowTimer: () => void;
  toggleShowKeyTips: () => void;
  toggleKeymap: () => void;
  setKeymapLayout: (layout: KeymapLayout) => void;

  // Caret settings actions
  setCaretStyle: (style: CaretStyle) => void;
  setSmoothCaret: (smooth: SmoothCaret) => void;
  setCaretAnimation: (animation: CaretAnimation) => void;
  setCaretColor: (color: string | null) => void;

  // Sound settings actions
  setVolume: (volume: SoundVolume) => void;
  setClickSound: (sound: ClickSound) => void;
  setErrorSound: (sound: ErrorSound) => void;
  toggleSoundOnClick: () => void;
  toggleSoundOnError: () => void;

  // Behavior settings actions
  togglePunctuation: () => void;
  toggleNumbers: () => void;
  setStopOnError: (mode: 'off' | 'word' | 'letter') => void;
  setConfidenceMode: (mode: 'off' | 'on' | 'max') => void;
  setIndicateTypos: (mode: 'off' | 'below' | 'replace') => void;
  toggleHideExtraLetters: () => void;
  toggleLazyMode: () => void;
  toggleBlindMode: () => void;
  setQuickRestart: (mode: 'off' | 'tab' | 'esc' | 'enter') => void;
  toggleFreedomMode: () => void;
  toggleStrictSpace: () => void;
  setQuickEnd: (enabled: boolean) => void;
  toggleQuickEnd: () => void;
  setMinWpm: (value: 'off' | number) => void;
  setMinAccuracy: (value: 'off' | number) => void;
  setMinBurst: (value: 'off' | number) => void;

  // Pacemaker settings actions
  setPacemakerEnabled: (enabled: boolean) => void;
  setPacemakerWpm: (wpm: number) => void;

  // Funbox settings actions
  setFunboxMode: (mode: FunboxMode) => void;
  setMemoryDuration: (seconds: number) => void;
  setReadAheadCount: (count: 1 | 2 | 3) => void;

  // Bigram settings actions
  setBigramEnabled: (enabled: boolean) => void;
  setBigramPreset: (preset: BigramPreset) => void;
  setBigramPairs: (pairs: string[]) => void;
  toggleBigramMode: () => void;

  // Bulk actions
  resetToDefaults: () => void;
  importSettings: (settings: Partial<ConfigState>) => void;

  // Custom theme actions
  setCustomThemeColor: (key: keyof CustomThemeColors, color: string) => void;
  saveCustomTheme: (name: string) => void;
  loadCustomTheme: () => void;
  clearCustomTheme: () => void;
}

const defaultTestSettings: TestSettings = {
  mode: 'time',
  time: 30,
  words: 25,
  quoteLength: 'medium',
  language: 'english',
  difficulty: 'normal',
};

const defaultVisualSettings: VisualSettings = {
  theme: 'serika-dark',
  fontFamily: 'roboto_mono',
  fontSize: 'medium',
  lineHeight: 1.5,
  letterSpacing: 0,
  smoothLineScroll: true,
  showAllLines: false,
  showLiveWpm: true,
  showLiveAccuracy: true,
  showLiveBurst: false,
  showTimer: true,
  showKeyTips: true,
  showKeymap: false,
  keymapLayout: 'qwerty',
};

const defaultCaretSettings: CaretSettings = {
  style: 'line',
  smoothCaret: 'medium',
  animation: 'blink',
  caretColor: null,
};

const defaultSoundSettings: SoundSettings = {
  volume: 0.5,
  clickSound: 'off',
  errorSound: 'off',
  soundOnClick: false,
  soundOnError: false,
};

const defaultPacemakerSettings: PacemakerSettings = {
  enabled: false,
  wpm: 60,
};

const defaultFunboxSettings: FunboxSettings = {
  mode: 'none',
  memoryDuration: 3,
  readAheadCount: 2,
};

const defaultBehaviorSettings: BehaviorSettings = {
  punctuation: false,
  numbers: false,
  stopOnError: 'off',
  confidenceMode: 'off',
  indicateTypos: 'off',
  hideExtraLetters: false,
  lazyMode: false,
  blindMode: false,
  quickRestart: 'tab',
  repeatQuotes: 'off',
  oppositeShiftMode: 'off',
  freedomMode: false,
  strictSpace: false,
  quickEnd: true,
  minWpm: 'off',
  minAccuracy: 'off',
  minBurst: 'off',
};

const defaultBigramSettings: BigramSettings = {
  enabled: false,
  preset: 'common',
  pairs: [...COMMON_BIGRAMS],
};

const defaultCustomThemeColors: CustomThemeColors = {
  bg: '#323437',
  main: '#e2b714',
  caret: '#e2b714',
  sub: '#646669',
  subAlt: '#2c2e31',
  text: '#d1d0c5',
  error: '#ca4754',
  errorExtra: '#7e2a33',
};

export const useConfigStore = create<ConfigState>()(
  persist(
    (set, get) => ({
      test: { ...defaultTestSettings },
      visual: { ...defaultVisualSettings },
      caret: { ...defaultCaretSettings },
      sound: { ...defaultSoundSettings },
      behavior: { ...defaultBehaviorSettings },
      pacemaker: { ...defaultPacemakerSettings },
      funbox: { ...defaultFunboxSettings },
      bigram: { ...defaultBigramSettings },
      customTheme: null,

      // Test settings actions
      setMode: (mode) => set((state) => ({ test: { ...state.test, mode } })),
      setTime: (time) => set((state) => ({ test: { ...state.test, time } })),
      setWords: (words) => set((state) => ({ test: { ...state.test, words } })),
      setCustomTime: (seconds) => set((state) => {
        const validatedTime = Math.max(1, Math.min(3600, Math.round(seconds)));
        return { test: { ...state.test, time: validatedTime as TimeDuration } };
      }),
      setCustomWords: (count) => set((state) => {
        const validatedCount = Math.max(1, Math.min(1000, Math.round(count)));
        return { test: { ...state.test, words: validatedCount as WordCount } };
      }),
      setQuoteLength: (quoteLength) => set((state) => ({ test: { ...state.test, quoteLength } })),
      setLanguage: (language) => set((state) => ({ test: { ...state.test, language } })),
      setDifficulty: (difficulty) => set((state) => ({ test: { ...state.test, difficulty } })),

      // Visual settings actions
      setTheme: (theme) => set((state) => ({ visual: { ...state.visual, theme } })),
      setFontFamily: (fontFamily) => set((state) => ({ visual: { ...state.visual, fontFamily } })),
      setFontSize: (fontSize) => set((state) => ({ visual: { ...state.visual, fontSize } })),
      setLineHeight: (lineHeight) => set((state) => ({
        // Validate between 1.0-2.5
        visual: { ...state.visual, lineHeight: Math.max(1.0, Math.min(2.5, lineHeight)) }
      })),
      setLetterSpacing: (letterSpacing) => set((state) => ({
        // Validate between -0.05 and 0.2 em
        visual: { ...state.visual, letterSpacing: Math.max(-0.05, Math.min(0.2, letterSpacing)) }
      })),
      toggleSmoothLineScroll: () => set((state) => ({ visual: { ...state.visual, smoothLineScroll: !state.visual.smoothLineScroll } })),
      toggleShowAllLines: () => set((state) => ({ visual: { ...state.visual, showAllLines: !state.visual.showAllLines } })),
      toggleShowLiveWpm: () => set((state) => ({ visual: { ...state.visual, showLiveWpm: !state.visual.showLiveWpm } })),
      toggleShowLiveAccuracy: () => set((state) => ({ visual: { ...state.visual, showLiveAccuracy: !state.visual.showLiveAccuracy } })),
      toggleShowLiveBurst: () => set((state) => ({ visual: { ...state.visual, showLiveBurst: !state.visual.showLiveBurst } })),
      toggleShowTimer: () => set((state) => ({ visual: { ...state.visual, showTimer: !state.visual.showTimer } })),
      toggleShowKeyTips: () => set((state) => ({ visual: { ...state.visual, showKeyTips: !state.visual.showKeyTips } })),
      toggleKeymap: () => set((state) => ({ visual: { ...state.visual, showKeymap: !state.visual.showKeymap } })),
      setKeymapLayout: (keymapLayout) => set((state) => ({ visual: { ...state.visual, keymapLayout } })),

      // Caret settings actions
      setCaretStyle: (style) => set((state) => ({ caret: { ...state.caret, style } })),
      setSmoothCaret: (smoothCaret) => set((state) => ({ caret: { ...state.caret, smoothCaret } })),
      setCaretAnimation: (animation) => set((state) => ({ caret: { ...state.caret, animation } })),
      setCaretColor: (caretColor) => set((state) => ({ caret: { ...state.caret, caretColor } })),

      // Sound settings actions
      setVolume: (volume) => set((state) => ({ sound: { ...state.sound, volume } })),
      setClickSound: (clickSound) => set((state) => ({ sound: { ...state.sound, clickSound } })),
      setErrorSound: (errorSound) => set((state) => ({ sound: { ...state.sound, errorSound } })),
      toggleSoundOnClick: () => set((state) => ({ sound: { ...state.sound, soundOnClick: !state.sound.soundOnClick } })),
      toggleSoundOnError: () => set((state) => ({ sound: { ...state.sound, soundOnError: !state.sound.soundOnError } })),

      // Behavior settings actions
      togglePunctuation: () => set((state) => ({ behavior: { ...state.behavior, punctuation: !state.behavior.punctuation } })),
      toggleNumbers: () => set((state) => ({ behavior: { ...state.behavior, numbers: !state.behavior.numbers } })),
      setStopOnError: (stopOnError) => set((state) => ({ behavior: { ...state.behavior, stopOnError } })),
      setConfidenceMode: (confidenceMode) => set((state) => ({ behavior: { ...state.behavior, confidenceMode } })),
      setIndicateTypos: (indicateTypos) => set((state) => ({ behavior: { ...state.behavior, indicateTypos } })),
      toggleHideExtraLetters: () => set((state) => ({ behavior: { ...state.behavior, hideExtraLetters: !state.behavior.hideExtraLetters } })),
      toggleLazyMode: () => set((state) => ({ behavior: { ...state.behavior, lazyMode: !state.behavior.lazyMode } })),
      toggleBlindMode: () => set((state) => ({ behavior: { ...state.behavior, blindMode: !state.behavior.blindMode } })),
      setQuickRestart: (quickRestart) => set((state) => ({ behavior: { ...state.behavior, quickRestart } })),
      toggleFreedomMode: () => set((state) => ({ behavior: { ...state.behavior, freedomMode: !state.behavior.freedomMode } })),
      toggleStrictSpace: () => set((state) => ({ behavior: { ...state.behavior, strictSpace: !state.behavior.strictSpace } })),
      setQuickEnd: (quickEnd) => set((state) => ({ behavior: { ...state.behavior, quickEnd } })),
      toggleQuickEnd: () => set((state) => ({ behavior: { ...state.behavior, quickEnd: !state.behavior.quickEnd } })),
      setMinWpm: (minWpm) => set((state) => ({ behavior: { ...state.behavior, minWpm } })),
      setMinAccuracy: (minAccuracy) => set((state) => ({ behavior: { ...state.behavior, minAccuracy } })),
      setMinBurst: (minBurst) => set((state) => ({ behavior: { ...state.behavior, minBurst } })),

      // Pacemaker settings actions
      setPacemakerEnabled: (enabled) => set((state) => ({ pacemaker: { ...state.pacemaker, enabled } })),
      setPacemakerWpm: (wpm) => set((state) => ({
        pacemaker: { ...state.pacemaker, wpm: Math.max(20, Math.min(300, Math.round(wpm))) }
      })),

      // Funbox settings actions
      setFunboxMode: (mode) => set((state) => ({ funbox: { ...state.funbox, mode } })),
      setMemoryDuration: (seconds) => set((state) => ({
        funbox: { ...state.funbox, memoryDuration: Math.max(1, Math.min(10, Math.round(seconds))) }
      })),
      setReadAheadCount: (count) => set((state) => ({ funbox: { ...state.funbox, readAheadCount: count } })),

      // Bigram settings actions
      setBigramEnabled: (enabled) => set((state) => ({ bigram: { ...state.bigram, enabled } })),
      setBigramPreset: (preset) => set((state) => {
        // Auto-update pairs based on preset
        let pairs: string[];
        switch (preset) {
          case 'common':
            pairs = [...COMMON_BIGRAMS];
            break;
          case 'difficult':
            pairs = [...DIFFICULT_BIGRAMS];
            break;
          case 'programming':
            pairs = [...PROGRAMMING_BIGRAMS];
            break;
          case 'custom':
            pairs = state.bigram.pairs; // Keep current pairs for custom
            break;
          default:
            pairs = [...COMMON_BIGRAMS];
        }
        return { bigram: { ...state.bigram, preset, pairs } };
      }),
      setBigramPairs: (pairs) => set((state) => ({
        bigram: { ...state.bigram, pairs, preset: 'custom' as BigramPreset }
      })),
      toggleBigramMode: () => set((state) => ({
        bigram: { ...state.bigram, enabled: !state.bigram.enabled }
      })),

      // Bulk actions
      resetToDefaults: () => set({
        test: { ...defaultTestSettings },
        visual: { ...defaultVisualSettings },
        caret: { ...defaultCaretSettings },
        sound: { ...defaultSoundSettings },
        behavior: { ...defaultBehaviorSettings },
        pacemaker: { ...defaultPacemakerSettings },
        funbox: { ...defaultFunboxSettings },
        bigram: { ...defaultBigramSettings },
        customTheme: null,
      }),

      importSettings: (settings) => set((state) => ({
        test: settings.test ? { ...state.test, ...settings.test } : state.test,
        visual: settings.visual ? { ...state.visual, ...settings.visual } : state.visual,
        caret: settings.caret ? { ...state.caret, ...settings.caret } : state.caret,
        sound: settings.sound ? { ...state.sound, ...settings.sound } : state.sound,
        behavior: settings.behavior ? { ...state.behavior, ...settings.behavior } : state.behavior,
        pacemaker: settings.pacemaker ? { ...state.pacemaker, ...settings.pacemaker } : state.pacemaker,
        funbox: settings.funbox ? { ...state.funbox, ...settings.funbox } : state.funbox,
        bigram: settings.bigram ? { ...state.bigram, ...settings.bigram } : state.bigram,
        customTheme: settings.customTheme !== undefined ? settings.customTheme : state.customTheme,
      })),

      // Custom theme actions
      setCustomThemeColor: (key, color) => set((state) => {
        const currentTheme = state.customTheme || { ...defaultCustomThemeColors };
        return {
          customTheme: { ...currentTheme, [key]: color },
          visual: { ...state.visual, theme: 'custom' as Theme },
        };
      }),

      saveCustomTheme: (name) => {
        const state = get();
        if (state.customTheme) {
          const savedThemes = JSON.parse(localStorage.getItem('gorilla-type-custom-themes') || '{}');
          savedThemes[name] = state.customTheme;
          localStorage.setItem('gorilla-type-custom-themes', JSON.stringify(savedThemes));
        }
      },

      loadCustomTheme: () => {
        const savedTheme = localStorage.getItem('gorilla-type-custom-theme');
        if (savedTheme) {
          try {
            const theme = JSON.parse(savedTheme) as CustomThemeColors;
            set({ customTheme: theme });
          } catch (e) {
            console.error('Failed to load custom theme:', e);
          }
        }
      },

      clearCustomTheme: () => set((state) => ({
        customTheme: null,
        visual: { ...state.visual, theme: 'serika-dark' as Theme },
      })),
    }),
    {
      name: 'gorilla-type-config',
      partialize: (state) => ({
        test: state.test,
        visual: state.visual,
        caret: state.caret,
        sound: state.sound,
        behavior: state.behavior,
        pacemaker: state.pacemaker,
        funbox: state.funbox,
        bigram: state.bigram,
        customTheme: state.customTheme,
      }),
    }
  )
);
