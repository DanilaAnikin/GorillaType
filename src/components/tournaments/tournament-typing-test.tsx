'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  Trophy,
  ArrowLeft,
  Timer,
  Type,
  Globe,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/store/user-store';
import { useTypingStore } from '@/store/typing-store';
import { useConfigStore } from '@/store/config-store';
import { useResultsStore, type TestResult } from '@/store/results-store';
import { useUIStore } from '@/store/ui-store';
import { generateWords } from '@/lib/utils/word-generator';
import { useSound } from '@/lib/hooks/use-sound';
import { useKeystrokeRecorder, type KeystrokeEvent } from '@/lib/hooks/use-keystroke-recorder';
import { WordDisplay } from '@/components/typing/word-display';
import { LiveStats } from '@/components/typing/live-stats';
import { TimerDisplay } from '@/components/typing/timer-display';
import { RestartButton } from '@/components/typing/restart-button';
import { Button } from '@/components/ui/button';
import { announce } from '@/components/ui/sr-announcer';

/**
 * Tournament data needed for the typing test
 */
interface TournamentConfig {
  id: string;
  name: string;
  status: string;
  testMode: string;
  testDuration?: number | null;
  testWordCount?: number | null;
  testLanguage: string;
  totalRounds: number;
  creatorId: string;
  participants: {
    id: string;
    userId: string;
    username: string;
  }[];
  rounds: {
    id: string;
    participantId: string;
    roundNumber: number;
  }[];
}

interface TournamentTypingTestProps {
  tournamentId: string;
}

type Phase = 'loading' | 'ready' | 'typing' | 'submitting' | 'done' | 'error';

export function TournamentTypingTest({ tournamentId }: TournamentTypingTestProps) {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const userId = user?.id;

  // Phase tracking
  const [phase, setPhase] = React.useState<Phase>('loading');
  const [tournament, setTournament] = React.useState<TournamentConfig | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [currentRoundNumber, setCurrentRoundNumber] = React.useState<number>(1);

  // Result tracking
  const [currentResult, setCurrentResult] = React.useState<TestResult | null>(null);
  const [submissionMessage, setSubmissionMessage] = React.useState<string | null>(null);

  // Typing test state
  const [isFocused, setIsFocused] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const lastProcessedStatusRef = React.useRef<string | null>(null);

  // Replay data
  const [capturedKeystrokes, setCapturedKeystrokes] = React.useState<KeystrokeEvent[]>([]);
  const [capturedWords, setCapturedWords] = React.useState<string[]>([]);

  // Tab+Enter support
  const tabPressedRef = React.useRef(false);
  const tabTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

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

  // Config store (for sound settings)
  const soundVolume = useConfigStore((state) => state.sound.volume);
  const soundOnClick = useConfigStore((state) => state.sound.soundOnClick);
  const soundOnError = useConfigStore((state) => state.sound.soundOnError);
  const clickSound = useConfigStore((state) => state.sound.clickSound);
  const errorSound = useConfigStore((state) => state.sound.errorSound);
  const showAllLines = useConfigStore((state) => state.visual.showAllLines);

  const setFocusMode = useUIStore((state) => state.setFocusMode);

  // Sound
  const { playClick, playError, playComplete, setVolume: setSoundVolume, setEnabled: setSoundEnabled } = useSound({
    volume: soundVolume,
    enabled: soundOnClick || soundOnError,
  });

  React.useEffect(() => {
    setSoundVolume(soundVolume);
    setSoundEnabled((soundOnClick && clickSound !== 'off') || (soundOnError && errorSound !== 'off'));
  }, [soundVolume, soundOnClick, soundOnError, clickSound, errorSound, setSoundVolume, setSoundEnabled]);

  // Results store
  const addResult = useResultsStore((state) => state.addResult);

  // Focus mode management
  React.useEffect(() => {
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
  React.useEffect(() => {
    if (status === 'running') {
      startRecording();
    }
  }, [status, startRecording]);

  // Announce test state
  React.useEffect(() => {
    if (status === 'running') {
      announce('Tournament round typing test started', 'assertive');
    } else if (status === 'finished') {
      announce(
        `Test finished. WPM: ${Math.round(stats.wpm)}, Accuracy: ${Math.round(stats.accuracy)}%`,
        'assertive'
      );
    }
  }, [status, stats.wpm, stats.accuracy]);

  // Fetch tournament details
  React.useEffect(() => {
    async function fetchTournament() {
      try {
        const response = await fetch(`/api/tournaments/${tournamentId}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Failed to load tournament');
          setPhase('error');
          return;
        }

        const tournamentData: TournamentConfig = data.tournament;

        // Validate tournament status
        if (tournamentData.status !== 'active') {
          setError(
            tournamentData.status === 'upcoming'
              ? 'This tournament has not started yet.'
              : tournamentData.status === 'completed'
              ? 'This tournament has already been completed.'
              : `This tournament cannot be played (status: ${tournamentData.status}).`
          );
          setPhase('error');
          return;
        }

        // Check if user is a participant
        const participant = tournamentData.participants.find(
          (p) => p.userId === userId
        );
        if (!participant) {
          setError('You are not a participant in this tournament.');
          setPhase('error');
          return;
        }

        // Figure out the next round number
        const myCompletedRounds = tournamentData.rounds.filter(
          (r) => r.participantId === participant.id
        );
        const nextRound = myCompletedRounds.length + 1;

        if (nextRound > tournamentData.totalRounds) {
          setError('You have already completed all rounds in this tournament.');
          setPhase('error');
          return;
        }

        setCurrentRoundNumber(nextRound);
        setTournament(tournamentData);
        setPhase('ready');
      } catch (err) {
        setError('Failed to load tournament. Please try again.');
        setPhase('error');
      }
    }

    if (userId) {
      fetchTournament();
    }
  }, [tournamentId, userId]);

  // Initialize the typing test when tournament is loaded and phase is 'ready'
  React.useEffect(() => {
    if (phase !== 'ready' || !tournament) return;

    const testMode = tournament.testMode as 'time' | 'words';
    let wordCount: number;
    let duration: number;
    let generatedWords: string[];

    // Determine language for word generator
    const lang = tournament.testLanguage || 'english';
    const wordGenLanguage: 'english' | 'programming' | 'custom' = lang.startsWith('code_') ? 'programming' : 'english';

    if (testMode === 'time') {
      duration = tournament.testDuration || 60;
      wordCount = Math.ceil(duration * 3);
      generatedWords = generateWords(wordGenLanguage, wordCount, {
        punctuation: false,
        numbers: false,
      });
    } else {
      // words mode
      wordCount = tournament.testWordCount || 50;
      duration = 0;
      generatedWords = generateWords(wordGenLanguage, wordCount, {
        punctuation: false,
        numbers: false,
      });
    }

    initializeTest(generatedWords, duration, testMode, wordCount);
    setPhase('typing');

    // Focus input
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [phase, tournament, initializeTest]);

  // Handle test completion - save result, submit to tournament round API
  React.useEffect(() => {
    if (status !== 'finished') {
      if (lastProcessedStatusRef.current === 'finished') {
        lastProcessedStatusRef.current = null;
      }
      return;
    }

    if (lastProcessedStatusRef.current === 'finished') return;
    lastProcessedStatusRef.current = 'finished';

    if (!tournament) return;

    // Stop keystroke recording
    const finishedKeystrokes = stopRecording();
    const finishedWords = useTypingStore.getState().originalWordStrings;
    setCapturedKeystrokes(finishedKeystrokes);
    setCapturedWords([...finishedWords]);

    // Build test result
    const testMode = tournament.testMode as 'time' | 'words';
    const duration = testMode === 'time' ? (tournament.testDuration || 60) : (tournament.testWordCount || 50);
    const language = tournament.testLanguage || 'english';

    const result: TestResult = {
      id: `tournament-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: isAuthenticated && userId ? userId : null,
      mode: testMode,
      duration,
      language,
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

    // Save result locally
    addResult(result);

    // Play completion sound
    playComplete();

    // Submit the result to the server and then to the tournament round
    setPhase('submitting');

    (async () => {
      try {
        // Step 1: Save result to /api/results to get a server-side ID
        const saveResponse = await fetch('/api/results', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: testMode,
            timeLimit: testMode === 'time' ? (tournament.testDuration || 60) : null,
            wordLimit: testMode === 'words' ? (tournament.testWordCount || 50) : null,
            language,
            punctuation: false,
            numbers: false,
            wpm: stats.wpm,
            rawWpm: stats.rawWpm,
            accuracy: stats.accuracy,
            consistency: stats.consistency,
            totalCharacters: stats.totalChars,
            correctCharacters: stats.correctChars,
            incorrectCharacters: stats.incorrectChars,
            extraCharacters: stats.extraChars,
            missedCharacters: stats.missedChars,
            duration: Math.round(timeElapsed),
            wpmHistory: wpmHistory.map((s) => s.wpm),
            rawWpmHistory: wpmHistory.map((s) => s.raw),
            accuracyHistory: [],
          }),
        });

        const saveData = await saveResponse.json();

        if (!saveResponse.ok) {
          console.error('Failed to save result:', saveData.error);
          setError('Failed to save your result to the server.');
          setPhase('error');
          return;
        }

        const serverResultId = saveData.result?.id;

        if (!serverResultId) {
          setError('Server did not return a result ID.');
          setPhase('error');
          return;
        }

        // Step 2: Submit result to the tournament round API
        const roundResponse = await fetch(`/api/tournaments/${tournamentId}/rounds`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            round_number: currentRoundNumber,
            result_id: serverResultId,
            wpm: Math.round(stats.wpm),
            accuracy: Math.round(stats.accuracy * 100) / 100,
          }),
        });

        const roundData = await roundResponse.json();

        if (!roundResponse.ok) {
          console.error('Failed to submit round result:', roundData.error);
          setError(roundData.error || 'Failed to submit round result.');
          setPhase('error');
          return;
        }

        setSubmissionMessage(
          roundData.message ||
            `Round ${currentRoundNumber} submitted! Score: ${roundData.round?.score?.toFixed(1) || 'N/A'}`
        );
        setPhase('done');
      } catch (err) {
        console.error('Error submitting tournament round:', err);
        setError('An unexpected error occurred while submitting your result.');
        setPhase('error');
      }
    })();
  }, [
    status, tournament, tournamentId, currentRoundNumber, stats, wpmHistory, timeElapsed,
    missedKeys, isAuthenticated, userId, addResult, playComplete, stopRecording,
  ]);

  // Restart handler
  const handleRestart = React.useCallback(() => {
    if (!tournament) return;
    setCurrentResult(null);
    setCapturedKeystrokes([]);
    setCapturedWords([]);
    resetRecorder();
    lastProcessedStatusRef.current = null;

    const testMode = tournament.testMode as 'time' | 'words';
    const lang = tournament.testLanguage || 'english';
    const wordGenLanguage: 'english' | 'programming' | 'custom' = lang.startsWith('code_') ? 'programming' : 'english';

    let wordCount: number;
    let duration: number;
    let generatedWords: string[];

    if (testMode === 'time') {
      duration = tournament.testDuration || 60;
      wordCount = Math.ceil(duration * 3);
      generatedWords = generateWords(wordGenLanguage, wordCount, {
        punctuation: false,
        numbers: false,
      });
    } else {
      wordCount = tournament.testWordCount || 50;
      duration = 0;
      generatedWords = generateWords(wordGenLanguage, wordCount, {
        punctuation: false,
        numbers: false,
      });
    }

    resetTest();
    initializeTest(generatedWords, duration, testMode, wordCount);
    setPhase('typing');
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [tournament, resetTest, initializeTest, resetRecorder]);

  // Focus helpers
  const focusInput = React.useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const handleContainerClick = React.useCallback(() => {
    focusInput();
  }, [focusInput]);

  // Keyboard input handler
  const handleInputKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Tab' || event.key === 'Escape' || event.key === 'Enter') {
        return; // handled by global listener
      }

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

  const handleInputFocus = React.useCallback(() => setIsFocused(true), []);
  const handleInputBlur = React.useCallback(() => setIsFocused(false), []);

  // Global keyboard shortcuts
  React.useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isTypingInInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      const isOurHiddenInput = target === inputRef.current;
      if (isTypingInInput && !isOurHiddenInput) return;

      if (event.key === 'Tab') {
        // Only allow restart if we're in the typing phase (not submitting/done/error)
        if (phase !== 'typing') return;
        event.preventDefault();
        tabPressedRef.current = true;
        if (tabTimeoutRef.current) clearTimeout(tabTimeoutRef.current);
        tabTimeoutRef.current = setTimeout(() => {
          if (tabPressedRef.current) {
            handleRestart();
          }
          tabPressedRef.current = false;
        }, 500);
        return;
      }

      if (event.key === 'Enter') {
        if (tabPressedRef.current && phase === 'typing') {
          event.preventDefault();
          tabPressedRef.current = false;
          if (tabTimeoutRef.current) {
            clearTimeout(tabTimeoutRef.current);
            tabTimeoutRef.current = null;
          }
          setCurrentResult(null);
          lastProcessedStatusRef.current = null;
          restartWithSameWords();
          setTimeout(() => inputRef.current?.focus(), 0);
          return;
        }
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        tabPressedRef.current = false;
        if (tabTimeoutRef.current) {
          clearTimeout(tabTimeoutRef.current);
          tabTimeoutRef.current = null;
        }
        if (phase === 'typing') {
          if (status === 'running') {
            endTest();
          } else {
            handleRestart();
          }
        }
        return;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown, { capture: true });
      if (tabTimeoutRef.current) clearTimeout(tabTimeoutRef.current);
    };
  }, [phase, status, handleRestart, restartWithSameWords, endTest]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      resetTest();
      setFocusMode(false);
    };
  }, [resetTest, setFocusMode]);

  // Build test config label
  const testConfigLabel = React.useMemo(() => {
    if (!tournament) return '';
    const parts: string[] = [];
    if (tournament.testMode === 'time' && tournament.testDuration) {
      parts.push(`${tournament.testDuration}s`);
    } else if (tournament.testMode === 'words' && tournament.testWordCount) {
      parts.push(`${tournament.testWordCount} words`);
    }
    parts.push(tournament.testMode);
    if (tournament.testLanguage) {
      parts.push(tournament.testLanguage);
    }
    return parts.join(' | ');
  }, [tournament]);

  const isActive = status === 'running';

  // --- RENDER ---

  // Loading state
  if (phase === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2
          className="w-8 h-8 animate-spin mb-4"
          style={{ color: 'var(--main-color)' }}
        />
        <p className="text-sm" style={{ color: 'var(--sub-color)' }}>
          Loading tournament...
        </p>
      </div>
    );
  }

  // Error state
  if (phase === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle
          className="w-10 h-10 mb-4"
          style={{ color: 'var(--error-color)' }}
        />
        <p
          className="text-base font-medium mb-2"
          style={{ color: 'var(--error-color)' }}
        >
          {error || 'An error occurred'}
        </p>
        <Button
          variant="outline"
          size="md"
          onClick={() => router.push(`/tournaments/${tournamentId}`)}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          className="mt-4"
        >
          Back to Tournament
        </Button>
      </div>
    );
  }

  // Submitting state
  if (phase === 'submitting') {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2
          className="w-8 h-8 animate-spin mb-4"
          style={{ color: 'var(--main-color)' }}
        />
        <p className="text-sm" style={{ color: 'var(--sub-color)' }}>
          Submitting round {currentRoundNumber} result...
        </p>
        {currentResult && (
          <div className="mt-6 text-center">
            <p className="text-4xl font-mono font-bold" style={{ color: 'var(--main-color)' }}>
              {Math.round(currentResult.wpm)} WPM
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--sub-color)' }}>
              {currentResult.accuracy.toFixed(1)}% accuracy
            </p>
          </div>
        )}
      </div>
    );
  }

  // Done state - result submitted successfully
  if (phase === 'done' && currentResult) {
    const hasMoreRounds = currentRoundNumber < (tournament?.totalRounds || 0);

    return (
      <div className="space-y-8">
        {/* Success banner */}
        <div
          className="flex items-center gap-3 p-4 rounded-lg border"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--main-color) 10%, var(--bg-color))',
            borderColor: 'var(--main-color)',
          }}
        >
          <CheckCircle className="w-6 h-6 flex-shrink-0" style={{ color: 'var(--main-color)' }} />
          <div>
            <p className="font-medium" style={{ color: 'var(--main-color)' }}>
              Round {currentRoundNumber} Submitted!
            </p>
            <p className="text-sm" style={{ color: 'var(--sub-color)' }}>
              {submissionMessage}
            </p>
          </div>
        </div>

        {/* Tournament info */}
        <div
          className="flex items-center gap-4 p-4 rounded-lg border"
          style={{
            backgroundColor: 'var(--bg-color)',
            borderColor: 'var(--sub-color)',
          }}
        >
          <Trophy className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--main-color)' }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium" style={{ color: 'var(--text-color)' }}>
              {tournament?.name} -- Round {currentRoundNumber} of {tournament?.totalRounds}
            </p>
            <div
              className="flex items-center gap-3 text-xs mt-1"
              style={{ color: 'var(--sub-color)' }}
            >
              <span className="inline-flex items-center gap-1">
                {tournament?.testMode === 'time' ? <Timer className="w-3 h-3" /> : <Type className="w-3 h-3" />}
                {testConfigLabel}
              </span>
              {tournament?.testLanguage && (
                <span className="inline-flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  {tournament.testLanguage}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Result summary */}
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-6 p-6 rounded-xl border"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--sub-color) 5%, var(--bg-color))',
            borderColor: 'var(--sub-color)',
          }}
        >
          <div className="flex flex-col items-center gap-1 col-span-2 sm:col-span-1">
            <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--sub-color)' }}>
              wpm
            </span>
            <span className="text-5xl font-mono font-bold" style={{ color: 'var(--main-color)' }}>
              {Math.round(currentResult.wpm)}
            </span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--sub-color)' }}>
              accuracy
            </span>
            <span className="text-3xl font-mono font-bold" style={{ color: 'var(--text-color)' }}>
              {currentResult.accuracy.toFixed(1)}%
            </span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--sub-color)' }}>
              raw
            </span>
            <span className="text-3xl font-mono font-bold" style={{ color: 'var(--text-color)' }}>
              {Math.round(currentResult.rawWpm)}
            </span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--sub-color)' }}>
              consistency
            </span>
            <span className="text-3xl font-mono font-bold" style={{ color: 'var(--text-color)' }}>
              {currentResult.consistency.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-4 pt-4">
          {hasMoreRounds && (
            <Button
              variant="active"
              size="lg"
              onClick={() => {
                // Reload the page to start the next round
                window.location.reload();
              }}
              leftIcon={<Trophy className="w-4 h-4" />}
            >
              Play Round {currentRoundNumber + 1}
            </Button>
          )}
          <Button
            variant={hasMoreRounds ? 'ghost' : 'active'}
            size="lg"
            onClick={() => router.push(`/tournaments/${tournamentId}`)}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Tournament
          </Button>
        </div>
      </div>
    );
  }

  // Typing phase - render the typing test
  return (
    <div className="space-y-6">
      {/* Tournament header */}
      <div
        className={cn(
          'flex items-center gap-4 p-4 rounded-lg border transition-opacity duration-200',
          isActive ? 'opacity-0 pointer-events-none h-0 overflow-hidden p-0 m-0 border-0' : 'opacity-100'
        )}
        style={{
          backgroundColor: 'var(--bg-color)',
          borderColor: 'var(--sub-color)',
        }}
      >
        <Trophy className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--main-color)' }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium" style={{ color: 'var(--text-color)' }}>
            {tournament?.name} -- Round {currentRoundNumber} of {tournament?.totalRounds}
          </p>
          <div
            className="flex items-center gap-3 text-xs mt-1"
            style={{ color: 'var(--sub-color)' }}
          >
            <span className="inline-flex items-center gap-1">
              {tournament?.testMode === 'time' ? <Timer className="w-3 h-3" /> : <Type className="w-3 h-3" />}
              {testConfigLabel}
            </span>
            {tournament?.testLanguage && (
              <span className="inline-flex items-center gap-1">
                <Globe className="w-3 h-3" />
                {tournament.testLanguage}
              </span>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/tournaments/${tournamentId}`)}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Back
        </Button>
      </div>

      {/* Typing test area */}
      <div
        ref={containerRef}
        role="application"
        aria-label="Tournament round typing test"
        className="w-full max-w-4xl mx-auto space-y-8"
        onClick={handleContainerClick}
      >
        {/* Hidden input */}
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
              Start typing to begin round {currentRoundNumber}
            </p>
          </div>
        ) : null}

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

export default TournamentTypingTest;
