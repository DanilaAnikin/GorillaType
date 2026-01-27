'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { useTypingStore } from '@/store/typing-store';
import { useConfigStore } from '@/store/config-store';
import { useUIStore } from '@/store/ui-store';
import { useUserStore, selectDisplayName, selectAvatarUrl } from '@/store/user-store';
import { useResultsStore, type TestResult, type PersonalBest } from '@/store/results-store';
import { generateFromCustomList } from '@/lib/utils/word-generator';
import { useSyncResults } from '@/lib/hooks/use-sync-results';
import { useSound } from '@/lib/hooks/use-sound';
import { useKeystrokeRecorder, type KeystrokeEvent } from '@/lib/hooks/use-keystroke-recorder';
import { WordDisplay } from '@/components/typing/word-display';
import { LiveStats } from '@/components/typing/live-stats';
import { TimerDisplay } from '@/components/typing/timer-display';
import { RestartButton } from '@/components/typing/restart-button';
import { Keymap } from '@/components/typing/keymap';
import { ResultsScreen, ShareModal } from '@/components/results';
import { announce } from '@/components/ui/sr-announcer';
import { ArrowLeft, RotateCcw, Target } from 'lucide-react';

interface PracticeConfig {
  words: string[];
  focusKeys: string[];
  wordCount: number;
  duration: number;
}

function getPracticeConfig(): PracticeConfig | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem('practiceConfig');
    if (!raw) return null;
    return JSON.parse(raw) as PracticeConfig;
  } catch {
    return null;
  }
}

export default function PracticeSessionPage() {
  const router = useRouter();

  // Practice config loaded from sessionStorage
  const [practiceConfig, setPracticeConfig] = useState<PracticeConfig | null>(null);
  const [configLoaded, setConfigLoaded] = useState(false);

  // Typing test state
  const [isFocused, setIsFocused] = useState(false);
  const [currentResult, setCurrentResult] = useState<TestResult | null>(null);
  const [isNewPersonalBest, setIsNewPersonalBest] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [capturedKeystrokes, setCapturedKeystrokes] = useState<KeystrokeEvent[]>([]);
  const [capturedWords, setCapturedWords] = useState<string[]>([]);

  const tabPressedRef = useRef(false);
  const tabTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastProcessedStatusRef = useRef<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasInitializedRef = useRef(false);

  // Keystroke recorder
  const { startRecording, recordKeystroke, stopRecording, reset: resetRecorder } = useKeystrokeRecorder();

  // Typing store
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

  // Config store
  const showAllLines = useConfigStore((state) => state.visual.showAllLines);
  const soundVolume = useConfigStore((state) => state.sound.volume);
  const soundOnClick = useConfigStore((state) => state.sound.soundOnClick);
  const soundOnError = useConfigStore((state) => state.sound.soundOnError);
  const clickSound = useConfigStore((state) => state.sound.clickSound);
  const errorSound = useConfigStore((state) => state.sound.errorSound);

  // UI store
  const setFocusMode = useUIStore((state) => state.setFocusMode);

  // Sound hook
  const { playClick, playError, playComplete, setVolume: setSoundVolume, setEnabled: setSoundEnabled } = useSound({
    volume: soundVolume,
    enabled: soundOnClick || soundOnError,
  });

  useEffect(() => {
    setSoundVolume(soundVolume);
    setSoundEnabled((soundOnClick && clickSound !== 'off') || (soundOnError && errorSound !== 'off'));
  }, [soundVolume, soundOnClick, soundOnError, clickSound, errorSound, setSoundVolume, setSoundEnabled]);

  // Results store
  const addResult = useResultsStore((state) => state.addResult);
  const updatePersonalBest = useResultsStore((state) => state.updatePersonalBest);
  const updateWeakspotData = useResultsStore((state) => state.updateWeakspotData);

  // User store
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const userId = useUserStore((state) => state.user?.id);
  const displayName = useUserStore(selectDisplayName);
  const avatarUrl = useUserStore(selectAvatarUrl);

  // Sync results
  const { syncResult } = useSyncResults();

  // Load practice config from sessionStorage on mount
  useEffect(() => {
    const config = getPracticeConfig();
    setPracticeConfig(config);
    setConfigLoaded(true);
  }, []);

  // Initialize the practice test once config is loaded
  useEffect(() => {
    if (!configLoaded || !practiceConfig || hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const words = generateFromCustomList(practiceConfig.words, practiceConfig.wordCount);
    initializeTest(words, practiceConfig.duration, 'time', practiceConfig.wordCount);

    setTimeout(() => inputRef.current?.focus(), 0);
  }, [configLoaded, practiceConfig, initializeTest]);

  // Focus mode: activate when typing starts, deactivate when test ends or resets
  useEffect(() => {
    if (status === 'running') {
      setFocusMode(true);
    } else {
      setFocusMode(false);
    }
    return () => {
      setFocusMode(false);
    };
  }, [status, setFocusMode]);

  // Keystroke recording
  useEffect(() => {
    if (status === 'running') {
      startRecording();
    }
  }, [status, startRecording]);

  // Announce test state changes for screen readers
  useEffect(() => {
    if (status === 'running') {
      announce('Practice typing test started', 'assertive');
    } else if (status === 'finished') {
      announce(
        `Practice finished. WPM: ${Math.round(stats.wpm)}, Accuracy: ${Math.round(stats.accuracy)}%`,
        'assertive'
      );
    }
  }, [status, stats.wpm, stats.accuracy]);

  // Restart with new practice words
  const initPracticeTest = useCallback(() => {
    if (!practiceConfig) return;
    const words = generateFromCustomList(practiceConfig.words, practiceConfig.wordCount);
    initializeTest(words, practiceConfig.duration, 'time', practiceConfig.wordCount);
  }, [practiceConfig, initializeTest]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isTypingInInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      const isOurHiddenInput = target === inputRef.current;

      if (isTypingInInput && !isOurHiddenInput) return;

      if (event.key === 'Tab') {
        event.preventDefault();
        tabPressedRef.current = true;

        if (tabTimeoutRef.current) {
          clearTimeout(tabTimeoutRef.current);
        }

        tabTimeoutRef.current = setTimeout(() => {
          if (tabPressedRef.current) {
            setCurrentResult(null);
            setIsNewPersonalBest(false);
            resetTest();
            initPracticeTest();
            setTimeout(() => inputRef.current?.focus(), 0);
          }
          tabPressedRef.current = false;
        }, 500);

        return;
      }

      if (event.key === 'Enter') {
        if (tabPressedRef.current) {
          event.preventDefault();
          tabPressedRef.current = false;

          if (tabTimeoutRef.current) {
            clearTimeout(tabTimeoutRef.current);
            tabTimeoutRef.current = null;
          }

          setCurrentResult(null);
          setIsNewPersonalBest(false);
          restartWithSameWords();
          setTimeout(() => inputRef.current?.focus(), 0);
          return;
        }

        if (status === 'finished') {
          event.preventDefault();
          setCurrentResult(null);
          setIsNewPersonalBest(false);
          resetTest();
          initPracticeTest();
          setTimeout(() => inputRef.current?.focus(), 0);
          return;
        }
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        tabPressedRef.current = false;
        if (tabTimeoutRef.current) {
          clearTimeout(tabTimeoutRef.current);
          tabTimeoutRef.current = null;
        }

        if (status === 'running') {
          endTest();
        } else {
          setCurrentResult(null);
          setIsNewPersonalBest(false);
          resetTest();
          initPracticeTest();
          setTimeout(() => inputRef.current?.focus(), 0);
        }
        return;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown, { capture: true });
      if (tabTimeoutRef.current) {
        clearTimeout(tabTimeoutRef.current);
      }
    };
  }, [status, resetTest, initPracticeTest, restartWithSameWords, endTest]);

  // Auto-focus when transitioning from results back to typing
  useEffect(() => {
    const showingResults = status === 'finished' && currentResult !== null;
    if (!showingResults) {
      const frameId = requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
      return () => cancelAnimationFrame(frameId);
    }
  }, [status, currentResult]);

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const handleContainerClick = useCallback(() => {
    focusInput();
  }, [focusInput]);

  // Handle keyboard input from hidden input
  const handleInputKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Tab' || event.key === 'Escape' || event.key === 'Enter') return;
      if (status === 'finished') return;

      if (event.key === 'Backspace') {
        event.preventDefault();
        if (event.metaKey) {
          handleDeleteLine();
          if (soundOnClick && clickSound !== 'off') playClick();
          return;
        }
        if (event.ctrlKey || event.altKey) {
          handleDeleteWord();
          if (soundOnClick && clickSound !== 'off') playClick();
          return;
        }
        {
          const storeState = useTypingStore.getState();
          recordKeystroke({
            key: 'Backspace',
            keyCode: 'Backspace',
            isCorrect: true,
            charIndex: storeState.currentCharIndex,
            wordIndex: storeState.currentWordIndex,
          });
        }
        handleBackspace();
        if (soundOnClick && clickSound !== 'off') playClick();
        return;
      }

      if (event.key === ' ') {
        event.preventDefault();
        {
          const storeState = useTypingStore.getState();
          recordKeystroke({
            key: ' ',
            keyCode: 'Space',
            isCorrect: true,
            charIndex: storeState.currentCharIndex,
            wordIndex: storeState.currentWordIndex,
          });
        }
        handleSpace();
        if (soundOnClick && clickSound !== 'off') playClick();
        return;
      }

      if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        const currentWord = useTypingStore.getState().words[useTypingStore.getState().currentWordIndex];
        const currentCharIndex = useTypingStore.getState().currentCharIndex;
        const expectedChar = currentWord?.text[currentCharIndex];
        const isError = expectedChar !== undefined && event.key !== expectedChar;

        recordKeystroke({
          key: event.key,
          keyCode: event.code || event.key,
          isCorrect: !isError,
          charIndex: currentCharIndex,
          wordIndex: useTypingStore.getState().currentWordIndex,
        });

        handleKeyPress(event.key);

        if (isError && soundOnError && errorSound !== 'off') {
          playError();
        } else if (soundOnClick && clickSound !== 'off') {
          playClick();
        }
      }
    },
    [status, handleKeyPress, handleBackspace, handleDeleteWord, handleDeleteLine, handleSpace, soundOnClick, soundOnError, clickSound, errorSound, playClick, playError, recordKeystroke]
  );

  const handleInputFocus = useCallback(() => setIsFocused(true), []);
  const handleInputBlur = useCallback(() => setIsFocused(false), []);

  // Handle test completion
  useEffect(() => {
    if (status !== 'finished') {
      if (lastProcessedStatusRef.current === 'finished') {
        lastProcessedStatusRef.current = null;
      }
      return;
    }
    if (lastProcessedStatusRef.current === 'finished') return;
    lastProcessedStatusRef.current = 'finished';

    const finishedKeystrokes = stopRecording();
    const finishedWords = useTypingStore.getState().originalWordStrings;
    setCapturedKeystrokes(finishedKeystrokes);
    setCapturedWords([...finishedWords]);

    const duration = practiceConfig?.duration ?? 60;
    const result: TestResult = {
      id: `practice-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: isAuthenticated && userId ? userId : null,
      mode: 'time',
      duration,
      language: 'english',
      punctuation: false,
      numbers: false,
      difficulty: 'normal',
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

    setCurrentResult(result);
    setIsNewPersonalBest(false); // Practice sessions don't count for PBs

    // Still save results locally and update weakspot data
    addResult(result);

    if (Object.keys(missedKeys).length > 0) {
      updateWeakspotData(missedKeys);
    }

    if (isAuthenticated && userId) {
      syncResult(result).catch((error) => {
        console.error('Error syncing practice result:', error);
      });
    }

    playComplete();
  }, [status, stats, wpmHistory, timeElapsed, missedKeys, practiceConfig, addResult, updateWeakspotData, isAuthenticated, userId, syncResult, playComplete, stopRecording]);

  // Restart handler
  const handleRestart = useCallback(() => {
    setCurrentResult(null);
    setIsNewPersonalBest(false);
    setCapturedKeystrokes([]);
    setCapturedWords([]);
    resetRecorder();
    resetTest();
    initPracticeTest();
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [resetTest, initPracticeTest, resetRecorder]);

  // Share handler
  const handleShare = useCallback(() => {
    if (!currentResult) return;
    setIsShareModalOpen(true);
  }, [currentResult]);

  const handleCloseShareModal = useCallback(() => {
    setIsShareModalOpen(false);
  }, []);

  const isActive = status === 'running';
  const isFinished = status === 'finished';

  // Loading state - config not yet loaded from sessionStorage
  if (!configLoaded) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
          style={{ borderColor: 'var(--main-color)', borderTopColor: 'transparent' }}
        />
        <p className="text-sm" style={{ color: 'var(--sub-color)' }}>
          Loading practice session...
        </p>
      </div>
    );
  }

  // No practice config found - redirect back
  if (!practiceConfig) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center gap-6">
          <Target
            className="w-12 h-12"
            style={{ color: 'var(--sub-color)' }}
          />
          <p className="text-sm text-center" style={{ color: 'var(--sub-color)' }}>
            No practice session configured. Go back to set up your practice.
          </p>
          <button
            onClick={() => router.push('/practice')}
            className={cn(
              'flex items-center gap-2 px-6 py-3 rounded-lg font-medium',
              'transition-all duration-200',
              'hover:scale-105 active:scale-95',
            )}
            style={{
              backgroundColor: 'var(--main-color)',
              color: 'var(--bg-color)',
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Practice
          </button>
        </div>
      </div>
    );
  }

  // Finished state - show results inline
  if (isFinished && currentResult) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-8">
        {/* Practice header */}
        <div className="flex items-center gap-3 mb-6">
          <Target className="w-5 h-5" style={{ color: 'var(--main-color)' }} />
          <h1
            className="text-lg font-semibold"
            style={{ color: 'var(--text-color)' }}
          >
            Practice Results
          </h1>
          {practiceConfig.focusKeys.length > 0 && (
            <div className="flex items-center gap-1 ml-2">
              <span className="text-xs" style={{ color: 'var(--sub-color)' }}>
                Focus:
              </span>
              {practiceConfig.focusKeys.map((key) => (
                <span
                  key={key}
                  className="px-1.5 py-0.5 rounded text-xs font-mono font-bold"
                  style={{
                    backgroundColor: 'var(--main-color)',
                    color: 'var(--bg-color)',
                  }}
                >
                  {key.toUpperCase()}
                </span>
              ))}
            </div>
          )}
        </div>

        <ResultsScreen
          result={currentResult}
          personalBest={null}
          isNewPersonalBest={false}
          onNextTest={handleRestart}
          onShare={handleShare}
          className=""
          replayKeystrokes={capturedKeystrokes}
          replayWords={capturedWords}
        />

        <ShareModal
          isOpen={isShareModalOpen}
          onClose={handleCloseShareModal}
          result={currentResult}
          username={isAuthenticated ? displayName : null}
          avatarUrl={avatarUrl}
        />

        {/* Practice-specific actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
          <button
            onClick={handleRestart}
            className={cn(
              'flex items-center gap-2 px-6 py-3 rounded-lg font-medium',
              'transition-all duration-200',
              'hover:scale-105 active:scale-95',
            )}
            style={{
              backgroundColor: 'var(--main-color)',
              color: 'var(--bg-color)',
            }}
          >
            <RotateCcw className="w-4 h-4" />
            Practice Again
          </button>
          <button
            onClick={() => router.push('/practice')}
            className={cn(
              'flex items-center gap-2 px-6 py-3 rounded-lg font-medium',
              'transition-all duration-200',
              'hover:scale-105 active:scale-95',
            )}
            style={{
              backgroundColor: 'var(--sub-alt-color)',
              color: 'var(--text-color)',
              border: '1px solid var(--sub-color)',
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Practice
          </button>
        </div>
      </div>
    );
  }

  // Main typing test view
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      {/* Practice header - hidden during active test */}
      <div
        className={cn(
          'transition-opacity duration-200 mb-6',
          isActive ? 'opacity-0 pointer-events-none h-0 mb-0 overflow-hidden' : 'opacity-100'
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5" style={{ color: 'var(--main-color)' }} />
            <h1
              className="text-lg font-semibold"
              style={{ color: 'var(--text-color)' }}
            >
              Practice Session
            </h1>
            {practiceConfig.focusKeys.length > 0 && (
              <div className="flex items-center gap-1 ml-2">
                <span className="text-xs" style={{ color: 'var(--sub-color)' }}>
                  Focus:
                </span>
                {practiceConfig.focusKeys.map((key) => (
                  <span
                    key={key}
                    className="px-1.5 py-0.5 rounded text-xs font-mono font-bold"
                    style={{
                      backgroundColor: 'var(--main-color)',
                      color: 'var(--bg-color)',
                    }}
                  >
                    {key.toUpperCase()}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => router.push('/practice')}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded text-sm',
              'transition-all duration-200',
              'hover:scale-105 active:scale-95',
            )}
            style={{
              color: 'var(--sub-color)',
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
      </div>

      {/* Typing area */}
      <div
        ref={containerRef}
        role="application"
        aria-label="Practice typing test"
        className="w-full max-w-4xl mx-auto space-y-8"
        onClick={handleContainerClick}
      >
        {/* Hidden input for keyboard capture */}
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

        {/* Stats row */}
        <div className="flex items-center justify-between">
          <LiveStats />
          <TimerDisplay />
        </div>

        {/* Word display */}
        <div className="relative">
          <WordDisplay showAllLines={showAllLines} />
        </div>

        {/* Focus lost indicator */}
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

        {/* Focus hint */}
        {isFocused && (status === 'idle' || status === 'waiting') ? (
          <div className="flex items-center justify-center py-2">
            <p className="text-sub text-sm animate-pulse">
              Start typing to begin practice
            </p>
          </div>
        ) : null}

        {/* Initial focus hint */}
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

        {/* Visual keyboard */}
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
    </div>
  );
}
