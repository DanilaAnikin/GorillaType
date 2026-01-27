'use client';

import { useEffect, useCallback, memo, useState, useRef, useMemo } from 'react';
import { cn } from '@/lib/utils/cn';
import { useTypingStore } from '@/store/typing-store';
import { useConfigStore } from '@/store/config-store';
import { useUIStore } from '@/store/ui-store';
import { useUserStore, selectDisplayName, selectAvatarUrl } from '@/store/user-store';
import { useResultsStore, type TestResult, type PersonalBest } from '@/store/results-store';
import { generateWords, generateQuote, generateWeakspotWords, generateBigramWords } from '@/lib/utils/word-generator';
import { useSyncResults } from '@/lib/hooks/use-sync-results';
import { useSound } from '@/lib/hooks/use-sound';

// Import typing components
import { WordDisplay } from './word-display';
import { TestConfigBar } from './test-config-bar';
import { LiveStats } from './live-stats';
import { TimerDisplay } from './timer-display';
import { RestartButton } from './restart-button';
import { Keymap } from './keymap';
import { ResultsScreen, ShareModal } from '@/components/results';

export interface TypingTestProps {
  /** Callback when test completes */
  onComplete?: () => void;
  /** Additional class names */
  className?: string;
  /** Whether to show the results screen */
  showResults?: boolean;
  /** Custom result renderer */
  renderResults?: (stats: {
    wpm: number;
    accuracy: number;
    rawWpm: number;
    consistency: number;
  }) => React.ReactNode;
}

export const TypingTest = memo(function TypingTest({
  onComplete,
  className,
  showResults = true,
  renderResults,
}: TypingTestProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [currentResult, setCurrentResult] = useState<TestResult | null>(null);
  const [isNewPersonalBest, setIsNewPersonalBest] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  // Track Tab key state for Tab+Enter combination
  const tabPressedRef = useRef(false);
  const tabTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Track the last processed status to avoid duplicate processing
  const lastProcessedStatusRef = useRef<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get state from stores
  const status = useTypingStore((state) => state.status);
  const stats = useTypingStore((state) => state.stats);
  const wpmHistory = useTypingStore((state) => state.wpmHistory);
  const timeElapsed = useTypingStore((state) => state.timeElapsed);
  const missedKeys = useTypingStore((state) => state.missedKeys);
  const initializeTest = useTypingStore((state) => state.initializeTest);
  const handleKeyPress = useTypingStore((state) => state.handleKeyPress);
  const handleBackspace = useTypingStore((state) => state.handleBackspace);
  const handleDeleteWord = useTypingStore((state) => state.handleDeleteWord);
  const handleDeleteLine = useTypingStore((state) => state.handleDeleteLine);
  const handleSpace = useTypingStore((state) => state.handleSpace);
  const resetTest = useTypingStore((state) => state.resetTest);
  const restartWithSameWords = useTypingStore((state) => state.restartWithSameWords);
  const endTest = useTypingStore((state) => state.endTest);

  const mode = useConfigStore((state) => state.test.mode);
  const time = useConfigStore((state) => state.test.time);
  const words = useConfigStore((state) => state.test.words);
  const language = useConfigStore((state) => state.test.language);
  const quoteLength = useConfigStore((state) => state.test.quoteLength);
  const difficulty = useConfigStore((state) => state.test.difficulty);
  const punctuation = useConfigStore((state) => state.behavior.punctuation);
  const numbers = useConfigStore((state) => state.behavior.numbers);
  const showAllLines = useConfigStore((state) => state.visual.showAllLines);

  // Sound settings
  const soundVolume = useConfigStore((state) => state.sound.volume);
  const soundOnClick = useConfigStore((state) => state.sound.soundOnClick);
  const soundOnError = useConfigStore((state) => state.sound.soundOnError);
  const clickSound = useConfigStore((state) => state.sound.clickSound);
  const errorSound = useConfigStore((state) => state.sound.errorSound);

  const setFocusMode = useUIStore((state) => state.setFocusMode);

  // Sound hook - initialized with settings from config store
  const { playClick, playError, setVolume: setSoundVolume, setEnabled: setSoundEnabled } = useSound({
    volume: soundVolume,
    enabled: soundOnClick || soundOnError,
  });

  // Update sound settings when config changes
  useEffect(() => {
    setSoundVolume(soundVolume);
    setSoundEnabled((soundOnClick && clickSound !== 'off') || (soundOnError && errorSound !== 'off'));
  }, [soundVolume, soundOnClick, soundOnError, clickSound, errorSound, setSoundVolume, setSoundEnabled]);

  // Funbox settings
  const funboxMode = useConfigStore((state) => state.funbox.mode);

  // Bigram settings
  const bigramEnabled = useConfigStore((state) => state.bigram.enabled);
  const bigramPairs = useConfigStore((state) => state.bigram.pairs);

  // Results store
  const addResult = useResultsStore((state) => state.addResult);
  const updatePersonalBest = useResultsStore((state) => state.updatePersonalBest);
  const getPersonalBest = useResultsStore((state) => state.getPersonalBest);
  const updateWeakspotData = useResultsStore((state) => state.updateWeakspotData);
  const getTopWeakspots = useResultsStore((state) => state.getTopWeakspots);

  // User store - for authenticated user info
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const userId = useUserStore((state) => state.user?.id);
  const displayName = useUserStore(selectDisplayName);
  const avatarUrl = useUserStore(selectAvatarUrl);

  // Sync results hook - for syncing to API when authenticated
  // Note: isSyncing could be used to show a sync indicator in the future
  const { syncResult } = useSyncResults();

  // Get personal best for current test configuration
  const personalBest = useMemo((): PersonalBest | null => {
    if (mode === 'zen') return null;
    const duration = mode === 'time' ? time : words;
    return getPersonalBest(mode as 'time' | 'words' | 'quote', duration, language);
  }, [mode, time, words, language, getPersonalBest]);

  // Focus mode: activate when typing starts, deactivate when test ends or resets
  useEffect(() => {
    if (status === 'running') {
      setFocusMode(true);
    } else {
      setFocusMode(false);
    }

    // Cleanup: ensure focus mode is disabled when component unmounts
    return () => {
      setFocusMode(false);
    };
  }, [status, setFocusMode]);

  // Map language setting to word generator language type
  const getWordGeneratorLanguage = useCallback((lang: string): 'english' | 'programming' | 'custom' => {
    if (lang.startsWith('code_')) {
      return 'programming';
    }
    return 'english';
  }, []);

  // Initialize test
  const initTest = useCallback(() => {
    let wordCount: number;
    let duration: number;
    let generatedWords: string[];
    const wordGenLanguage = getWordGeneratorLanguage(language);

    // Check if weakspot mode is enabled - will use special word generator
    const useWeakspotGenerator = funboxMode === 'weakspot';
    const weakspots = useWeakspotGenerator ? getTopWeakspots(10) : []; // Get top 10 weak characters

    // Check if bigram mode is enabled - will use bigram word generator
    const useBigramGenerator = bigramEnabled && bigramPairs.length > 0;

    // Helper function to generate words based on current mode settings
    const generateModeWords = (count: number): string[] => {
      if (useWeakspotGenerator) {
        return generateWeakspotWords(wordGenLanguage, count, weakspots, {
          punctuation,
          numbers,
        });
      } else if (useBigramGenerator) {
        return generateBigramWords(bigramPairs, wordGenLanguage, count, {
          punctuation,
          numbers,
        });
      } else {
        return generateWords(wordGenLanguage, count, {
          punctuation,
          numbers,
        });
      }
    };

    switch (mode) {
      case 'time':
        // Generate enough words for the time limit
        wordCount = Math.ceil(time * 3); // ~3 words per second max typing speed
        duration = time;
        generatedWords = generateModeWords(wordCount);
        break;
      case 'words':
        wordCount = words;
        duration = 0; // No time limit
        generatedWords = generateModeWords(wordCount);
        break;
      case 'quote':
        // Generate a quote - quotes have their own punctuation, use configured quote length
        // Note: Weakspot mode and Bigram mode don't apply to quote mode as we use predefined quotes
        const quote = generateQuote(quoteLength);
        // Split quote text into words, preserving punctuation attached to words
        generatedWords = quote.text.split(/\s+/).filter(word => word.length > 0);
        wordCount = generatedWords.length;
        duration = 0;
        break;
      case 'zen':
        wordCount = 200; // Lots of words for zen mode
        duration = 0;
        generatedWords = generateModeWords(wordCount);
        break;
      default:
        wordCount = 50;
        duration = 30;
        generatedWords = generateModeWords(wordCount);
    }

    initializeTest(generatedWords, duration, mode, wordCount);
  }, [mode, time, words, language, quoteLength, punctuation, numbers, initializeTest, getWordGeneratorLanguage, funboxMode, getTopWeakspots, bigramEnabled, bigramPairs]);

  // Global keyboard shortcuts - works in all states including results screen
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      // Don't handle if user is typing in an actual input field (not our hidden input)
      const target = event.target as HTMLElement;
      const isTypingInInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      const isOurHiddenInput = target === inputRef.current;

      // For Tab, Enter, Escape - handle globally unless in a different input
      if (isTypingInInput && !isOurHiddenInput) {
        return;
      }

      // Handle Tab key
      if (event.key === 'Tab') {
        event.preventDefault();

        // Track that Tab was pressed for Tab+Enter combination
        tabPressedRef.current = true;

        // Clear any existing timeout
        if (tabTimeoutRef.current) {
          clearTimeout(tabTimeoutRef.current);
        }

        // Set timeout to reset tab pressed state and trigger new words restart
        // If Enter is pressed within 500ms, it will do same words instead
        tabTimeoutRef.current = setTimeout(() => {
          if (tabPressedRef.current) {
            // Tab was pressed but Enter wasn't pressed within timeout
            // Restart with new words
            setCurrentResult(null);
            setIsNewPersonalBest(false);
            resetTest();
            initTest();
            setTimeout(() => inputRef.current?.focus(), 0);
          }
          tabPressedRef.current = false;
        }, 500);

        return;
      }

      // Handle Enter key (for Tab+Enter combination)
      if (event.key === 'Enter') {
        // Check if Tab was recently pressed
        if (tabPressedRef.current) {
          event.preventDefault();
          tabPressedRef.current = false;

          // Clear the timeout since we're handling it now
          if (tabTimeoutRef.current) {
            clearTimeout(tabTimeoutRef.current);
            tabTimeoutRef.current = null;
          }

          // Restart with same words
          setCurrentResult(null);
          setIsNewPersonalBest(false);
          restartWithSameWords();
          setTimeout(() => inputRef.current?.focus(), 0);
          return;
        }

        // On results screen, Enter alone also restarts (with new words, like Tab)
        if (status === 'finished') {
          event.preventDefault();
          setCurrentResult(null);
          setIsNewPersonalBest(false);
          resetTest();
          initTest();
          setTimeout(() => inputRef.current?.focus(), 0);
          return;
        }
      }

      // Handle Escape key - end test early or reset
      if (event.key === 'Escape') {
        event.preventDefault();

        // Clear tab state
        tabPressedRef.current = false;
        if (tabTimeoutRef.current) {
          clearTimeout(tabTimeoutRef.current);
          tabTimeoutRef.current = null;
        }

        if (status === 'running') {
          // End the test early
          endTest();
        } else if (status === 'finished') {
          // On results screen, go back to test (reset with new words)
          setCurrentResult(null);
          setIsNewPersonalBest(false);
          resetTest();
          initTest();
          setTimeout(() => inputRef.current?.focus(), 0);
        } else {
          // Waiting or idle - just reset
          setCurrentResult(null);
          setIsNewPersonalBest(false);
          resetTest();
          initTest();
          setTimeout(() => inputRef.current?.focus(), 0);
        }
        return;
      }
    };

    // Add global listener with capture phase to ensure shortcuts work
    // even when focus is elsewhere (e.g., on page load, after test completes)
    // Using capture: true ensures we get the event before it bubbles to other handlers
    window.addEventListener('keydown', handleGlobalKeyDown, { capture: true });

    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown, { capture: true });
      // Clean up timeout on unmount
      if (tabTimeoutRef.current) {
        clearTimeout(tabTimeoutRef.current);
      }
    };
  }, [status, resetTest, initTest, restartWithSameWords, endTest]);

  // Handle mount and auto-focus
  useEffect(() => {
    initTest();
    // Auto-focus the hidden input on mount
    inputRef.current?.focus();
  }, [initTest]);

  // Auto-focus when transitioning from results back to typing view
  // This ensures the input is focused after the component re-renders with the input visible
  useEffect(() => {
    // Only focus when we're in the typing view (not showing results)
    const showingResults = status === 'finished' && showResults && currentResult !== null;
    if (!showingResults) {
      // Use requestAnimationFrame to ensure the DOM has updated
      const frameId = requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
      return () => cancelAnimationFrame(frameId);
    }
  }, [status, showResults, currentResult]);

  // Focus the hidden input
  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  // Handle container click to refocus
  const handleContainerClick = useCallback(() => {
    focusInput();
  }, [focusInput]);

  // Handle keyboard input from hidden input
  const handleInputKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      // Tab, Escape, and Enter (for Tab+Enter) are handled by the global keyboard listener
      // to ensure they work even when the input is not focused
      if (event.key === 'Tab' || event.key === 'Escape' || event.key === 'Enter') {
        // Let the global handler deal with it
        return;
      }

      // Don't process input if test is finished
      if (status === 'finished') {
        return;
      }

      // Handle backspace with modifiers
      if (event.key === 'Backspace') {
        event.preventDefault();

        // Cmd+Backspace (Mac) - delete line (reset all progress)
        if (event.metaKey) {
          handleDeleteLine();
          if (soundOnClick && clickSound !== 'off') {
            playClick();
          }
          return;
        }

        // Ctrl+Backspace or Alt+Backspace - delete word
        if (event.ctrlKey || event.altKey) {
          handleDeleteWord();
          if (soundOnClick && clickSound !== 'off') {
            playClick();
          }
          return;
        }

        // Regular backspace - delete single character
        handleBackspace();
        // Play click sound on backspace too
        if (soundOnClick && clickSound !== 'off') {
          playClick();
        }
        return;
      }

      // Handle space
      if (event.key === ' ') {
        event.preventDefault();
        handleSpace();
        // Play click sound on space
        if (soundOnClick && clickSound !== 'off') {
          playClick();
        }
        return;
      }

      // Handle printable characters
      if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();

        // Check if this keystroke will be an error before processing
        const currentWord = useTypingStore.getState().words[useTypingStore.getState().currentWordIndex];
        const currentCharIndex = useTypingStore.getState().currentCharIndex;
        const expectedChar = currentWord?.text[currentCharIndex];
        const isError = expectedChar !== undefined && event.key !== expectedChar;

        handleKeyPress(event.key);

        // Play appropriate sound
        if (isError && soundOnError && errorSound !== 'off') {
          playError();
        } else if (soundOnClick && clickSound !== 'off') {
          playClick();
        }
      }
    },
    [status, handleKeyPress, handleBackspace, handleDeleteWord, handleDeleteLine, handleSpace, soundOnClick, soundOnError, clickSound, errorSound, playClick, playError]
  );

  // Handle focus events
  const handleInputFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleInputBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  // Handle test completion - create result, save to store, and sync to API
  // This effect is triggered when the test status changes to 'finished'
  // We use a ref to prevent duplicate processing
  useEffect(() => {
    // Only run when test finishes and we haven't processed this completion yet
    if (status !== 'finished') {
      // Reset tracking when test is not finished (e.g., restarted)
      if (lastProcessedStatusRef.current === 'finished') {
        lastProcessedStatusRef.current = null;
      }
      return;
    }

    // Prevent duplicate processing using ref
    if (lastProcessedStatusRef.current === 'finished') return;
    lastProcessedStatusRef.current = 'finished';

    // Create the test result
    const duration = mode === 'time' ? time : words;
    const result: TestResult = {
      id: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: isAuthenticated && userId ? userId : null,
      mode,
      duration,
      language,
      punctuation,
      numbers,
      difficulty,
      wpm: stats.wpm,
      rawWpm: stats.rawWpm,
      accuracy: stats.accuracy,
      consistency: stats.consistency,
      correctChars: stats.correctChars,
      incorrectChars: stats.incorrectChars,
      extraChars: stats.extraChars,
      missedChars: stats.missedChars,
      totalChars: stats.totalChars,
      correctWords: stats.correctWords,
      incorrectWords: stats.incorrectWords,
      totalWords: stats.correctWords + stats.incorrectWords,
      testDuration: Math.round(timeElapsed),
      afkTime: 0,
      wpmHistory,
      createdAt: new Date().toISOString(),
      syncedAt: null,
      quoteId: null,
    };

    // Check if this is a new personal best
    const isNewPB = !personalBest || stats.wpm > personalBest.wpm;

    // Update local component state
    // Note: This is a valid use case for setState in useEffect - we're responding
    // to external state changes (typing store status) and creating derived state
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentResult(result);
    setIsNewPersonalBest(isNewPB);

    // Save result to local store (always)
    addResult(result);
    if (mode !== 'zen') {
      updatePersonalBest(result);
    }

    // Update weakspot data with missed keys from this test
    // This accumulates across all sessions to track historical weak spots
    if (Object.keys(missedKeys).length > 0) {
      updateWeakspotData(missedKeys);
    }

    // Sync to API if authenticated (async, doesn't block UI)
    if (isAuthenticated && userId) {
      syncResult(result).then((syncResponse) => {
        if (syncResponse.error) {
          console.warn('Failed to sync result to server:', syncResponse.error);
          // Result is still saved locally, will be synced later
        }
        // Server confirmation of personal best is handled by the UI state
      }).catch((error) => {
        console.error('Error syncing result:', error);
        // Result is still saved locally, will be synced later
      });
    }

    onComplete?.();
  }, [status, mode, time, words, language, difficulty, punctuation, numbers, stats, wpmHistory, timeElapsed, missedKeys, personalBest, addResult, updatePersonalBest, updateWeakspotData, onComplete, isAuthenticated, userId, syncResult]);

  // Restart handler - generates new words
  const handleRestart = useCallback(() => {
    setCurrentResult(null);
    setIsNewPersonalBest(false);
    resetTest();
    initTest();
    // Focus the input after restart
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [resetTest, initTest]);

  // Config change handler
  const handleConfigChange = useCallback(() => {
    setCurrentResult(null);
    setIsNewPersonalBest(false);
    resetTest();
    initTest();
  }, [resetTest, initTest]);

  // Share handler - opens share modal
  const handleShare = useCallback(() => {
    if (!currentResult) return;
    setIsShareModalOpen(true);
  }, [currentResult]);

  // Close share modal handler
  const handleCloseShareModal = useCallback(() => {
    setIsShareModalOpen(false);
  }, []);

  const isActive = status === 'running';
  const isFinished = status === 'finished';

  // Render results screen using the full ResultsScreen component
  if (isFinished && showResults && currentResult) {
    if (renderResults) {
      return (
        <div className={cn('w-full max-w-4xl mx-auto', className)}>
          {renderResults({
            wpm: stats.wpm,
            accuracy: stats.accuracy,
            rawWpm: stats.rawWpm,
            consistency: stats.consistency,
          })}
          <div className="mt-8 flex justify-center">
            <RestartButton onRestart={handleRestart} />
          </div>
        </div>
      );
    }

    // Use the full ResultsScreen component
    return (
      <>
        <ResultsScreen
          result={currentResult}
          personalBest={personalBest}
          isNewPersonalBest={isNewPersonalBest}
          onNextTest={handleRestart}
          onShare={handleShare}
          className={className}
        />
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={handleCloseShareModal}
          result={currentResult}
          username={isAuthenticated ? displayName : null}
          avatarUrl={avatarUrl}
        />
      </>
    );
  }

  // Main typing test view
  return (
    <div
      ref={containerRef}
      className={cn('w-full max-w-4xl mx-auto space-y-8', className)}
      onClick={handleContainerClick}
    >
      {/* Hidden input for capturing keyboard events */}
      <input
        ref={inputRef}
        type="text"
        className="absolute opacity-0 pointer-events-none"
        style={{
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
          width: '1px',
          height: '1px',
          caretColor: 'transparent',
        }}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        tabIndex={0}
        onKeyDown={handleInputKeyDown}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        aria-label="Type here"
      />

      {/* Config bar - hidden during active test */}
      <div
        className={cn(
          'transition-opacity duration-200',
          isActive ? 'opacity-0 pointer-events-none' : 'opacity-100'
        )}
      >
        <TestConfigBar isActive={isActive} onConfigChange={handleConfigChange} />
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between">
        <LiveStats />
        <TimerDisplay />
      </div>

      {/* Word display */}
      <div className="relative">
        <WordDisplay showAllLines={showAllLines} />
      </div>

      {/* Focus lost indicator - shown when input loses focus during active test */}
      {!isFocused && (status === 'running' || status === 'waiting') && (
        <div
          className="flex items-center justify-center py-2 cursor-pointer"
          onClick={handleContainerClick}
        >
          <p className="text-sub text-sm animate-pulse">
            Click here to continue typing
          </p>
        </div>
      )}

      {/* Focus hint - shown when test hasn't started yet and focused */}
      {isFocused && (status === 'idle' || status === 'waiting') ? (
        <div className="flex items-center justify-center py-2">
          <p className="text-sub text-sm animate-pulse">
            Start typing to begin
          </p>
        </div>
      ) : null}

      {/* Initial focus hint - shown when not focused and test not started */}
      {!isFocused && status === 'idle' ? (
        <div
          className="flex items-center justify-center py-2 cursor-pointer"
          onClick={handleContainerClick}
        >
          <p className="text-sub text-sm animate-pulse">
            Click here or start typing to begin
          </p>
        </div>
      ) : null}

      {/* Visual keyboard - shows next key and pressed keys */}
      <Keymap />

      {/* Restart button */}
      <div
        className={cn(
          'flex justify-center transition-opacity duration-200',
          isActive ? 'opacity-0' : 'opacity-100'
        )}
      >
        <RestartButton
          onRestart={handleRestart}
          showHint={!isActive}
          size="md"
        />
      </div>
    </div>
  );
});

export default TypingTest;
