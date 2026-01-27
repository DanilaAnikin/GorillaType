import { describe, it, expect, beforeEach } from 'vitest'
import { useConfigStore, COMMON_BIGRAMS, DIFFICULT_BIGRAMS, PROGRAMMING_BIGRAMS } from '@/store/config-store'

describe('Config Store', () => {
  beforeEach(() => {
    // Reset to defaults before each test
    useConfigStore.getState().resetToDefaults()
  })

  // ===========================================================================
  // Default state
  // ===========================================================================
  describe('default state', () => {
    it('should have correct default test settings', () => {
      const { test } = useConfigStore.getState()
      expect(test.mode).toBe('time')
      expect(test.time).toBe(30)
      expect(test.words).toBe(25)
      expect(test.quoteLength).toBe('medium')
      expect(test.language).toBe('english')
      expect(test.difficulty).toBe('normal')
    })

    it('should have correct default visual settings', () => {
      const { visual } = useConfigStore.getState()
      expect(visual.theme).toBe('serika-dark')
      expect(visual.fontFamily).toBe('roboto_mono')
      expect(visual.fontSize).toBe('medium')
      expect(visual.lineHeight).toBe(1.5)
      expect(visual.letterSpacing).toBe(0)
      expect(visual.smoothLineScroll).toBe(true)
      expect(visual.showAllLines).toBe(false)
      expect(visual.showLiveWpm).toBe(true)
      expect(visual.showLiveAccuracy).toBe(true)
      expect(visual.showLiveBurst).toBe(false)
      expect(visual.showTimer).toBe(true)
      expect(visual.showKeyTips).toBe(true)
      expect(visual.showKeymap).toBe(false)
      expect(visual.keymapLayout).toBe('qwerty')
    })

    it('should have correct default caret settings', () => {
      const { caret } = useConfigStore.getState()
      expect(caret.style).toBe('line')
      expect(caret.smoothCaret).toBe('medium')
      expect(caret.animation).toBe('blink')
      expect(caret.caretColor).toBeNull()
    })

    it('should have correct default sound settings', () => {
      const { sound } = useConfigStore.getState()
      expect(sound.volume).toBe(0.5)
      expect(sound.clickSound).toBe('off')
      expect(sound.errorSound).toBe('off')
      expect(sound.soundOnClick).toBe(false)
      expect(sound.soundOnError).toBe(false)
    })

    it('should have correct default behavior settings', () => {
      const { behavior } = useConfigStore.getState()
      expect(behavior.punctuation).toBe(false)
      expect(behavior.numbers).toBe(false)
      expect(behavior.stopOnError).toBe('off')
      expect(behavior.confidenceMode).toBe('off')
      expect(behavior.indicateTypos).toBe('off')
      expect(behavior.hideExtraLetters).toBe(false)
      expect(behavior.lazyMode).toBe(false)
      expect(behavior.blindMode).toBe(false)
      expect(behavior.quickRestart).toBe('tab')
      expect(behavior.freedomMode).toBe(false)
      expect(behavior.strictSpace).toBe(false)
      expect(behavior.quickEnd).toBe(true)
      expect(behavior.minWpm).toBe('off')
      expect(behavior.minAccuracy).toBe('off')
      expect(behavior.minBurst).toBe('off')
    })

    it('should have correct default pacemaker settings', () => {
      const { pacemaker } = useConfigStore.getState()
      expect(pacemaker.enabled).toBe(false)
      expect(pacemaker.wpm).toBe(60)
    })

    it('should have correct default funbox settings', () => {
      const { funbox } = useConfigStore.getState()
      expect(funbox.mode).toBe('none')
      expect(funbox.memoryDuration).toBe(3)
      expect(funbox.readAheadCount).toBe(2)
    })

    it('should have correct default bigram settings', () => {
      const { bigram } = useConfigStore.getState()
      expect(bigram.enabled).toBe(false)
      expect(bigram.preset).toBe('common')
      expect(bigram.pairs).toEqual(COMMON_BIGRAMS)
    })

    it('should have null custom theme by default', () => {
      expect(useConfigStore.getState().customTheme).toBeNull()
    })
  })

  // ===========================================================================
  // Test settings actions
  // ===========================================================================
  describe('test settings actions', () => {
    it('should update test mode', () => {
      useConfigStore.getState().setMode('words')
      expect(useConfigStore.getState().test.mode).toBe('words')
    })

    it('should update test time', () => {
      useConfigStore.getState().setTime(60)
      expect(useConfigStore.getState().test.time).toBe(60)
    })

    it('should update word count', () => {
      useConfigStore.getState().setWords(100)
      expect(useConfigStore.getState().test.words).toBe(100)
    })

    it('should update custom time with validation (clamp 1-3600)', () => {
      useConfigStore.getState().setCustomTime(0)
      expect(useConfigStore.getState().test.time).toBe(1) // clamped to min 1

      useConfigStore.getState().setCustomTime(5000)
      expect(useConfigStore.getState().test.time).toBe(3600) // clamped to max 3600
    })

    it('should update custom words with validation (clamp 1-1000)', () => {
      useConfigStore.getState().setCustomWords(0)
      expect(useConfigStore.getState().test.words).toBe(1) // clamped to min 1

      useConfigStore.getState().setCustomWords(2000)
      expect(useConfigStore.getState().test.words).toBe(1000) // clamped to max 1000
    })

    it('should update quote length', () => {
      useConfigStore.getState().setQuoteLength('long')
      expect(useConfigStore.getState().test.quoteLength).toBe('long')
    })

    it('should update language', () => {
      useConfigStore.getState().setLanguage('english_1k')
      expect(useConfigStore.getState().test.language).toBe('english_1k')
    })

    it('should update difficulty', () => {
      useConfigStore.getState().setDifficulty('expert')
      expect(useConfigStore.getState().test.difficulty).toBe('expert')
    })
  })

  // ===========================================================================
  // Visual settings actions
  // ===========================================================================
  describe('visual settings actions', () => {
    it('should update theme', () => {
      useConfigStore.getState().setTheme('dracula')
      expect(useConfigStore.getState().visual.theme).toBe('dracula')
    })

    it('should update font family', () => {
      useConfigStore.getState().setFontFamily('fira_code')
      expect(useConfigStore.getState().visual.fontFamily).toBe('fira_code')
    })

    it('should update font size', () => {
      useConfigStore.getState().setFontSize('large')
      expect(useConfigStore.getState().visual.fontSize).toBe('large')
    })

    it('should update line height with clamping (1.0-2.5)', () => {
      useConfigStore.getState().setLineHeight(0.5)
      expect(useConfigStore.getState().visual.lineHeight).toBe(1.0)

      useConfigStore.getState().setLineHeight(3.0)
      expect(useConfigStore.getState().visual.lineHeight).toBe(2.5)

      useConfigStore.getState().setLineHeight(1.8)
      expect(useConfigStore.getState().visual.lineHeight).toBe(1.8)
    })

    it('should update letter spacing with clamping (-0.05 to 0.2)', () => {
      useConfigStore.getState().setLetterSpacing(-1)
      expect(useConfigStore.getState().visual.letterSpacing).toBe(-0.05)

      useConfigStore.getState().setLetterSpacing(1)
      expect(useConfigStore.getState().visual.letterSpacing).toBe(0.2)

      useConfigStore.getState().setLetterSpacing(0.1)
      expect(useConfigStore.getState().visual.letterSpacing).toBe(0.1)
    })

    it('should toggle smoothLineScroll', () => {
      expect(useConfigStore.getState().visual.smoothLineScroll).toBe(true)
      useConfigStore.getState().toggleSmoothLineScroll()
      expect(useConfigStore.getState().visual.smoothLineScroll).toBe(false)
      useConfigStore.getState().toggleSmoothLineScroll()
      expect(useConfigStore.getState().visual.smoothLineScroll).toBe(true)
    })

    it('should toggle showAllLines', () => {
      expect(useConfigStore.getState().visual.showAllLines).toBe(false)
      useConfigStore.getState().toggleShowAllLines()
      expect(useConfigStore.getState().visual.showAllLines).toBe(true)
    })

    it('should toggle showLiveWpm', () => {
      expect(useConfigStore.getState().visual.showLiveWpm).toBe(true)
      useConfigStore.getState().toggleShowLiveWpm()
      expect(useConfigStore.getState().visual.showLiveWpm).toBe(false)
    })

    it('should toggle showKeymap', () => {
      expect(useConfigStore.getState().visual.showKeymap).toBe(false)
      useConfigStore.getState().toggleKeymap()
      expect(useConfigStore.getState().visual.showKeymap).toBe(true)
    })

    it('should update keymap layout', () => {
      useConfigStore.getState().setKeymapLayout('dvorak')
      expect(useConfigStore.getState().visual.keymapLayout).toBe('dvorak')
    })
  })

  // ===========================================================================
  // Caret settings actions
  // ===========================================================================
  describe('caret settings actions', () => {
    it('should update caret style', () => {
      useConfigStore.getState().setCaretStyle('block')
      expect(useConfigStore.getState().caret.style).toBe('block')
    })

    it('should update smooth caret', () => {
      useConfigStore.getState().setSmoothCaret('fast')
      expect(useConfigStore.getState().caret.smoothCaret).toBe('fast')
    })

    it('should update caret animation', () => {
      useConfigStore.getState().setCaretAnimation('phase')
      expect(useConfigStore.getState().caret.animation).toBe('phase')
    })

    it('should update caret color', () => {
      useConfigStore.getState().setCaretColor('#ff0000')
      expect(useConfigStore.getState().caret.caretColor).toBe('#ff0000')
    })

    it('should clear caret color', () => {
      useConfigStore.getState().setCaretColor('#ff0000')
      useConfigStore.getState().setCaretColor(null)
      expect(useConfigStore.getState().caret.caretColor).toBeNull()
    })
  })

  // ===========================================================================
  // Sound settings actions
  // ===========================================================================
  describe('sound settings actions', () => {
    it('should update volume', () => {
      useConfigStore.getState().setVolume(0.75)
      expect(useConfigStore.getState().sound.volume).toBe(0.75)
    })

    it('should update click sound', () => {
      useConfigStore.getState().setClickSound('click')
      expect(useConfigStore.getState().sound.clickSound).toBe('click')
    })

    it('should update error sound', () => {
      useConfigStore.getState().setErrorSound('beep')
      expect(useConfigStore.getState().sound.errorSound).toBe('beep')
    })

    it('should toggle sound on click', () => {
      expect(useConfigStore.getState().sound.soundOnClick).toBe(false)
      useConfigStore.getState().toggleSoundOnClick()
      expect(useConfigStore.getState().sound.soundOnClick).toBe(true)
    })

    it('should toggle sound on error', () => {
      expect(useConfigStore.getState().sound.soundOnError).toBe(false)
      useConfigStore.getState().toggleSoundOnError()
      expect(useConfigStore.getState().sound.soundOnError).toBe(true)
    })
  })

  // ===========================================================================
  // Behavior settings actions
  // ===========================================================================
  describe('behavior settings actions', () => {
    it('should toggle punctuation', () => {
      expect(useConfigStore.getState().behavior.punctuation).toBe(false)
      useConfigStore.getState().togglePunctuation()
      expect(useConfigStore.getState().behavior.punctuation).toBe(true)
    })

    it('should toggle numbers', () => {
      expect(useConfigStore.getState().behavior.numbers).toBe(false)
      useConfigStore.getState().toggleNumbers()
      expect(useConfigStore.getState().behavior.numbers).toBe(true)
    })

    it('should update stop on error', () => {
      useConfigStore.getState().setStopOnError('word')
      expect(useConfigStore.getState().behavior.stopOnError).toBe('word')
    })

    it('should update confidence mode', () => {
      useConfigStore.getState().setConfidenceMode('on')
      expect(useConfigStore.getState().behavior.confidenceMode).toBe('on')
    })

    it('should toggle blind mode', () => {
      expect(useConfigStore.getState().behavior.blindMode).toBe(false)
      useConfigStore.getState().toggleBlindMode()
      expect(useConfigStore.getState().behavior.blindMode).toBe(true)
    })

    it('should update quick restart', () => {
      useConfigStore.getState().setQuickRestart('esc')
      expect(useConfigStore.getState().behavior.quickRestart).toBe('esc')
    })

    it('should toggle quickEnd', () => {
      expect(useConfigStore.getState().behavior.quickEnd).toBe(true)
      useConfigStore.getState().toggleQuickEnd()
      expect(useConfigStore.getState().behavior.quickEnd).toBe(false)
    })

    it('should set quickEnd directly', () => {
      useConfigStore.getState().setQuickEnd(false)
      expect(useConfigStore.getState().behavior.quickEnd).toBe(false)
    })

    it('should set min WPM', () => {
      useConfigStore.getState().setMinWpm(40)
      expect(useConfigStore.getState().behavior.minWpm).toBe(40)
    })

    it('should set min accuracy', () => {
      useConfigStore.getState().setMinAccuracy(90)
      expect(useConfigStore.getState().behavior.minAccuracy).toBe(90)
    })

    it('should toggle freedom mode', () => {
      expect(useConfigStore.getState().behavior.freedomMode).toBe(false)
      useConfigStore.getState().toggleFreedomMode()
      expect(useConfigStore.getState().behavior.freedomMode).toBe(true)
    })

    it('should toggle strict space', () => {
      expect(useConfigStore.getState().behavior.strictSpace).toBe(false)
      useConfigStore.getState().toggleStrictSpace()
      expect(useConfigStore.getState().behavior.strictSpace).toBe(true)
    })
  })

  // ===========================================================================
  // Pacemaker settings actions
  // ===========================================================================
  describe('pacemaker settings actions', () => {
    it('should enable/disable pacemaker', () => {
      useConfigStore.getState().setPacemakerEnabled(true)
      expect(useConfigStore.getState().pacemaker.enabled).toBe(true)
    })

    it('should set pacemaker WPM with clamping (20-300)', () => {
      useConfigStore.getState().setPacemakerWpm(10)
      expect(useConfigStore.getState().pacemaker.wpm).toBe(20) // clamped

      useConfigStore.getState().setPacemakerWpm(500)
      expect(useConfigStore.getState().pacemaker.wpm).toBe(300) // clamped

      useConfigStore.getState().setPacemakerWpm(100)
      expect(useConfigStore.getState().pacemaker.wpm).toBe(100)
    })
  })

  // ===========================================================================
  // Funbox settings actions
  // ===========================================================================
  describe('funbox settings actions', () => {
    it('should set funbox mode', () => {
      useConfigStore.getState().setFunboxMode('memory')
      expect(useConfigStore.getState().funbox.mode).toBe('memory')
    })

    it('should set memory duration with clamping (1-10)', () => {
      useConfigStore.getState().setMemoryDuration(0)
      expect(useConfigStore.getState().funbox.memoryDuration).toBe(1)

      useConfigStore.getState().setMemoryDuration(20)
      expect(useConfigStore.getState().funbox.memoryDuration).toBe(10)
    })

    it('should set read ahead count', () => {
      useConfigStore.getState().setReadAheadCount(3)
      expect(useConfigStore.getState().funbox.readAheadCount).toBe(3)
    })
  })

  // ===========================================================================
  // Bigram settings actions
  // ===========================================================================
  describe('bigram settings actions', () => {
    it('should enable/disable bigram mode', () => {
      useConfigStore.getState().setBigramEnabled(true)
      expect(useConfigStore.getState().bigram.enabled).toBe(true)
    })

    it('should toggle bigram mode', () => {
      expect(useConfigStore.getState().bigram.enabled).toBe(false)
      useConfigStore.getState().toggleBigramMode()
      expect(useConfigStore.getState().bigram.enabled).toBe(true)
      useConfigStore.getState().toggleBigramMode()
      expect(useConfigStore.getState().bigram.enabled).toBe(false)
    })

    it('should set bigram preset and update pairs for common', () => {
      useConfigStore.getState().setBigramPreset('common')
      const { bigram } = useConfigStore.getState()
      expect(bigram.preset).toBe('common')
      expect(bigram.pairs).toEqual(COMMON_BIGRAMS)
    })

    it('should set bigram preset and update pairs for difficult', () => {
      useConfigStore.getState().setBigramPreset('difficult')
      const { bigram } = useConfigStore.getState()
      expect(bigram.preset).toBe('difficult')
      expect(bigram.pairs).toEqual(DIFFICULT_BIGRAMS)
    })

    it('should set bigram preset and update pairs for programming', () => {
      useConfigStore.getState().setBigramPreset('programming')
      const { bigram } = useConfigStore.getState()
      expect(bigram.preset).toBe('programming')
      expect(bigram.pairs).toEqual(PROGRAMMING_BIGRAMS)
    })

    it('should keep current pairs for custom preset', () => {
      const customPairs = ['ab', 'cd', 'ef']
      useConfigStore.getState().setBigramPairs(customPairs)
      useConfigStore.getState().setBigramPreset('custom')
      expect(useConfigStore.getState().bigram.pairs).toEqual(customPairs)
    })

    it('should set custom bigram pairs and switch to custom preset', () => {
      const customPairs = ['xy', 'zw']
      useConfigStore.getState().setBigramPairs(customPairs)
      const { bigram } = useConfigStore.getState()
      expect(bigram.pairs).toEqual(customPairs)
      expect(bigram.preset).toBe('custom')
    })
  })

  // ===========================================================================
  // Bulk actions
  // ===========================================================================
  describe('bulk actions', () => {
    it('should reset all settings to defaults', () => {
      // Change a bunch of settings
      useConfigStore.getState().setMode('words')
      useConfigStore.getState().setTheme('dracula')
      useConfigStore.getState().setVolume(1)
      useConfigStore.getState().togglePunctuation()

      // Reset
      useConfigStore.getState().resetToDefaults()

      const state = useConfigStore.getState()
      expect(state.test.mode).toBe('time')
      expect(state.visual.theme).toBe('serika-dark')
      expect(state.sound.volume).toBe(0.5)
      expect(state.behavior.punctuation).toBe(false)
      expect(state.customTheme).toBeNull()
    })

    it('should import partial settings', () => {
      useConfigStore.getState().importSettings({
        test: { mode: 'words', time: 60, words: 100, quoteLength: 'long', language: 'english', difficulty: 'expert' },
      })

      const state = useConfigStore.getState()
      expect(state.test.mode).toBe('words')
      expect(state.test.difficulty).toBe('expert')
      // Other settings should remain at defaults
      expect(state.visual.theme).toBe('serika-dark')
    })

    it('should not overwrite unspecified sections on import', () => {
      useConfigStore.getState().setTheme('dracula')
      useConfigStore.getState().importSettings({
        test: { mode: 'zen', time: 30, words: 25, quoteLength: 'medium', language: 'english', difficulty: 'normal' },
      })
      // visual should remain changed
      expect(useConfigStore.getState().visual.theme).toBe('dracula')
    })
  })

  // ===========================================================================
  // Custom theme actions
  // ===========================================================================
  describe('custom theme actions', () => {
    it('should set a custom theme color and switch theme to custom', () => {
      useConfigStore.getState().setCustomThemeColor('bg', '#111111')
      expect(useConfigStore.getState().customTheme).not.toBeNull()
      expect(useConfigStore.getState().customTheme!.bg).toBe('#111111')
      expect(useConfigStore.getState().visual.theme).toBe('custom')
    })

    it('should clear custom theme and switch to serika-dark', () => {
      useConfigStore.getState().setCustomThemeColor('bg', '#111111')
      useConfigStore.getState().clearCustomTheme()
      expect(useConfigStore.getState().customTheme).toBeNull()
      expect(useConfigStore.getState().visual.theme).toBe('serika-dark')
    })
  })

  // ===========================================================================
  // Multiple settings changes
  // ===========================================================================
  describe('multiple settings changes', () => {
    it('should handle multiple sequential updates correctly', () => {
      const store = useConfigStore.getState()
      store.setMode('words')
      store.setWords(100)
      store.setTheme('monokai')
      store.togglePunctuation()
      store.setCaretStyle('block')

      const state = useConfigStore.getState()
      expect(state.test.mode).toBe('words')
      expect(state.test.words).toBe(100)
      expect(state.visual.theme).toBe('monokai')
      expect(state.behavior.punctuation).toBe(true)
      expect(state.caret.style).toBe('block')
    })
  })
})
