import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types
export type TestMode = 'time' | 'words' | 'quote' | 'zen';
export type TimeDuration = 15 | 30 | 60 | 120;
export type WordCount = 10 | 25 | 50 | 100;
export type QuoteLength = 'short' | 'medium' | 'long' | 'all';
export type Difficulty = 'easy' | 'normal' | 'expert' | 'master';
export type Language = 'english' | 'english_1k' | 'english_5k' | 'english_10k' | 'english_25k' | 'english_50k' | 'code_javascript' | 'code_python' | 'code_rust' | 'code_go';

export type Theme = 'serika-dark' | 'serika' | 'solarized-light' | 'github-light' | 'nord-light' | 'dracula' | 'nord' | 'monokai' | 'solarized-dark' | 'gruvbox-dark' | 'catppuccin-mocha' | 'tokyo-night' | 'github-dark' | 'one-dark' | 'cyber' | 'midnight' | 'ocean' | 'matrix';
export type FontFamily = 'roboto_mono' | 'jetbrains_mono' | 'fira_code' | 'source_code_pro' | 'ibm_plex_mono';
export type FontSize = 'small' | 'medium' | 'large' | 'extra_large';

export type CaretStyle = 'line' | 'block' | 'underline' | 'outline';
export type SmoothCaret = 'off' | 'slow' | 'medium' | 'fast';

export type SoundVolume = 0 | 0.25 | 0.5 | 0.75 | 1;
export type ClickSound = 'off' | 'click' | 'beep' | 'pop' | 'nk_cream' | 'typewriter';
export type ErrorSound = 'off' | 'beep' | 'damage';

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
  smoothLineScroll: boolean;
  showAllLines: boolean;
  showLiveWpm: boolean;
  showLiveAccuracy: boolean;
  showTimer: boolean;
  showKeyTips: boolean;
}

export interface CaretSettings {
  style: CaretStyle;
  smoothCaret: SmoothCaret;
  caretColor: string | null; // null = theme default
}

export interface SoundSettings {
  volume: SoundVolume;
  clickSound: ClickSound;
  errorSound: ErrorSound;
  soundOnClick: boolean;
  soundOnError: boolean;
}

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
  minWpm: 'off' | number;
  minAccuracy: 'off' | number;
  minBurst: 'off' | number;
}

export interface ConfigState {
  // Test settings
  test: TestSettings;

  // Visual settings
  visual: VisualSettings;

  // Caret settings
  caret: CaretSettings;

  // Sound settings
  sound: SoundSettings;

  // Behavior settings
  behavior: BehaviorSettings;

  // Actions - Test settings
  setMode: (mode: TestMode) => void;
  setTime: (time: TimeDuration) => void;
  setWords: (words: WordCount) => void;
  setQuoteLength: (length: QuoteLength) => void;
  setLanguage: (language: Language) => void;
  setDifficulty: (difficulty: Difficulty) => void;

  // Actions - Visual settings
  setTheme: (theme: Theme) => void;
  setFontFamily: (font: FontFamily) => void;
  setFontSize: (size: FontSize) => void;
  toggleSmoothLineScroll: () => void;
  toggleShowAllLines: () => void;
  toggleShowLiveWpm: () => void;
  toggleShowLiveAccuracy: () => void;
  toggleShowTimer: () => void;
  toggleShowKeyTips: () => void;

  // Actions - Caret settings
  setCaretStyle: (style: CaretStyle) => void;
  setSmoothCaret: (smooth: SmoothCaret) => void;
  setCaretColor: (color: string | null) => void;

  // Actions - Sound settings
  setVolume: (volume: SoundVolume) => void;
  setClickSound: (sound: ClickSound) => void;
  setErrorSound: (sound: ErrorSound) => void;
  toggleSoundOnClick: () => void;
  toggleSoundOnError: () => void;

  // Actions - Behavior settings
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
  setMinWpm: (value: 'off' | number) => void;
  setMinAccuracy: (value: 'off' | number) => void;
  setMinBurst: (value: 'off' | number) => void;

  // Bulk actions
  resetToDefaults: () => void;
  importSettings: (settings: Partial<ConfigState>) => void;
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
  smoothLineScroll: true,
  showAllLines: false,
  showLiveWpm: true,
  showLiveAccuracy: true,
  showTimer: true,
  showKeyTips: true,
};

const defaultCaretSettings: CaretSettings = {
  style: 'line',
  smoothCaret: 'medium',
  caretColor: null,
};

const defaultSoundSettings: SoundSettings = {
  volume: 0.5,
  clickSound: 'off',
  errorSound: 'off',
  soundOnClick: false,
  soundOnError: false,
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
  minWpm: 'off',
  minAccuracy: 'off',
  minBurst: 'off',
};

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      // Initial state
      test: { ...defaultTestSettings },
      visual: { ...defaultVisualSettings },
      caret: { ...defaultCaretSettings },
      sound: { ...defaultSoundSettings },
      behavior: { ...defaultBehaviorSettings },

      // Test settings actions
      setMode: (mode) => set((state) => ({ test: { ...state.test, mode } })),
      setTime: (time) => set((state) => ({ test: { ...state.test, time } })),
      setWords: (words) => set((state) => ({ test: { ...state.test, words } })),
      setQuoteLength: (quoteLength) => set((state) => ({ test: { ...state.test, quoteLength } })),
      setLanguage: (language) => set((state) => ({ test: { ...state.test, language } })),
      setDifficulty: (difficulty) => set((state) => ({ test: { ...state.test, difficulty } })),

      // Visual settings actions
      setTheme: (theme) => set((state) => ({ visual: { ...state.visual, theme } })),
      setFontFamily: (fontFamily) => set((state) => ({ visual: { ...state.visual, fontFamily } })),
      setFontSize: (fontSize) => set((state) => ({ visual: { ...state.visual, fontSize } })),
      toggleSmoothLineScroll: () => set((state) => ({
        visual: { ...state.visual, smoothLineScroll: !state.visual.smoothLineScroll }
      })),
      toggleShowAllLines: () => set((state) => ({
        visual: { ...state.visual, showAllLines: !state.visual.showAllLines }
      })),
      toggleShowLiveWpm: () => set((state) => ({
        visual: { ...state.visual, showLiveWpm: !state.visual.showLiveWpm }
      })),
      toggleShowLiveAccuracy: () => set((state) => ({
        visual: { ...state.visual, showLiveAccuracy: !state.visual.showLiveAccuracy }
      })),
      toggleShowTimer: () => set((state) => ({
        visual: { ...state.visual, showTimer: !state.visual.showTimer }
      })),
      toggleShowKeyTips: () => set((state) => ({
        visual: { ...state.visual, showKeyTips: !state.visual.showKeyTips }
      })),

      // Caret settings actions
      setCaretStyle: (style) => set((state) => ({ caret: { ...state.caret, style } })),
      setSmoothCaret: (smoothCaret) => set((state) => ({ caret: { ...state.caret, smoothCaret } })),
      setCaretColor: (caretColor) => set((state) => ({ caret: { ...state.caret, caretColor } })),

      // Sound settings actions
      setVolume: (volume) => set((state) => ({ sound: { ...state.sound, volume } })),
      setClickSound: (clickSound) => set((state) => ({ sound: { ...state.sound, clickSound } })),
      setErrorSound: (errorSound) => set((state) => ({ sound: { ...state.sound, errorSound } })),
      toggleSoundOnClick: () => set((state) => ({
        sound: { ...state.sound, soundOnClick: !state.sound.soundOnClick }
      })),
      toggleSoundOnError: () => set((state) => ({
        sound: { ...state.sound, soundOnError: !state.sound.soundOnError }
      })),

      // Behavior settings actions
      togglePunctuation: () => set((state) => ({
        behavior: { ...state.behavior, punctuation: !state.behavior.punctuation }
      })),
      toggleNumbers: () => set((state) => ({
        behavior: { ...state.behavior, numbers: !state.behavior.numbers }
      })),
      setStopOnError: (stopOnError) => set((state) => ({
        behavior: { ...state.behavior, stopOnError }
      })),
      setConfidenceMode: (confidenceMode) => set((state) => ({
        behavior: { ...state.behavior, confidenceMode }
      })),
      setIndicateTypos: (indicateTypos) => set((state) => ({
        behavior: { ...state.behavior, indicateTypos }
      })),
      toggleHideExtraLetters: () => set((state) => ({
        behavior: { ...state.behavior, hideExtraLetters: !state.behavior.hideExtraLetters }
      })),
      toggleLazyMode: () => set((state) => ({
        behavior: { ...state.behavior, lazyMode: !state.behavior.lazyMode }
      })),
      toggleBlindMode: () => set((state) => ({
        behavior: { ...state.behavior, blindMode: !state.behavior.blindMode }
      })),
      setQuickRestart: (quickRestart) => set((state) => ({
        behavior: { ...state.behavior, quickRestart }
      })),
      toggleFreedomMode: () => set((state) => ({
        behavior: { ...state.behavior, freedomMode: !state.behavior.freedomMode }
      })),
      toggleStrictSpace: () => set((state) => ({
        behavior: { ...state.behavior, strictSpace: !state.behavior.strictSpace }
      })),
      setMinWpm: (minWpm) => set((state) => ({
        behavior: { ...state.behavior, minWpm }
      })),
      setMinAccuracy: (minAccuracy) => set((state) => ({
        behavior: { ...state.behavior, minAccuracy }
      })),
      setMinBurst: (minBurst) => set((state) => ({
        behavior: { ...state.behavior, minBurst }
      })),

      // Bulk actions
      resetToDefaults: () => set({
        test: { ...defaultTestSettings },
        visual: { ...defaultVisualSettings },
        caret: { ...defaultCaretSettings },
        sound: { ...defaultSoundSettings },
        behavior: { ...defaultBehaviorSettings },
      }),

      importSettings: (settings) => set((state) => ({
        test: settings.test ? { ...state.test, ...settings.test } : state.test,
        visual: settings.visual ? { ...state.visual, ...settings.visual } : state.visual,
        caret: settings.caret ? { ...state.caret, ...settings.caret } : state.caret,
        sound: settings.sound ? { ...state.sound, ...settings.sound } : state.sound,
        behavior: settings.behavior ? { ...state.behavior, ...settings.behavior } : state.behavior,
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
      }),
    }
  )
);
