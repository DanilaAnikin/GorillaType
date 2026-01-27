'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { KeyCap } from './key-cap';
import { WeaknessCard } from './weakness-card';
import { useResultsStore } from '@/store/results-store';
import { Target, Zap, AlertTriangle, TrendingUp, Loader2 } from 'lucide-react';
import type { WeaknessReport } from '@/lib/utils/weakness-analyzer';

type FetchStatus = 'idle' | 'loading' | 'success' | 'error';

interface PracticeData {
  report: WeaknessReport | null;
  message?: string;
}

export function SmartPractice() {
  const router = useRouter();
  const [fetchStatus, setFetchStatus] = useState<FetchStatus>('idle');
  const [practiceData, setPracticeData] = useState<PracticeData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const results = useResultsStore((state) => state.results);
  const weakspotData = useResultsStore((state) => state.weakspotData);

  // Fetch weakness report on mount
  useEffect(() => {
    let cancelled = false;

    async function fetchReport() {
      setFetchStatus('loading');
      setErrorMessage(null);

      try {
        const response = await fetch('/api/practice');

        if (!response.ok) {
          // If unauthorized, try local analysis instead
          if (response.status === 401) {
            performLocalAnalysis();
            return;
          }
          throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        if (!cancelled) {
          setPracticeData(data);
          setFetchStatus('success');
        }
      } catch {
        if (!cancelled) {
          // Fallback to local analysis on any fetch error
          performLocalAnalysis();
        }
      }
    }

    fetchReport();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Local analysis fallback using results store data
  const performLocalAnalysis = useCallback(() => {
    const recentResults = results.slice(0, 20);

    if (recentResults.length === 0 && Object.keys(weakspotData).length === 0) {
      setPracticeData({
        report: null,
        message: 'No test results found. Complete some tests first to generate a practice plan.',
      });
      setFetchStatus('success');
      return;
    }

    // Build a report from local weakspot data and results
    const weakKeys = Object.entries(weakspotData)
      .filter(([key]) => key.length === 1 && key !== ' ')
      .map(([key, count]) => ({
        key,
        errorRate: Math.min(count / 50, 1), // Normalize: 50 misses = 100% error rate
        avgSpeed: 0,
        sampleSize: count,
      }))
      .sort((a, b) => b.errorRate - a.errorRate)
      .slice(0, 15);

    const suggestedFocus = weakKeys.slice(0, 5).map(k => k.key);

    // Generate practice words from the word bank
    const WORD_BANK: Record<string, string[]> = {
      q: ['queen', 'quick', 'quiet', 'quote', 'quest', 'quiz', 'square', 'equal', 'require', 'unique'],
      w: ['water', 'world', 'would', 'write', 'wrong', 'power', 'flower', 'window', 'toward', 'winter'],
      x: ['exist', 'exact', 'extra', 'exam', 'taxi', 'pixel', 'oxide', 'toxic', 'mixer', 'boxing'],
      z: ['zone', 'zero', 'size', 'prize', 'frozen', 'puzzle', 'dozen', 'breeze', 'zigzag', 'wizard'],
      j: ['just', 'join', 'jump', 'judge', 'major', 'enjoy', 'project', 'object', 'adjust', 'injury'],
      k: ['know', 'keep', 'kind', 'king', 'look', 'make', 'work', 'think', 'speak', 'market'],
      v: ['very', 'voice', 'value', 'video', 'event', 'never', 'every', 'river', 'cover', 'prove'],
      b: ['both', 'back', 'begin', 'below', 'bring', 'board', 'build', 'brain', 'brown', 'bright'],
      p: ['part', 'place', 'point', 'power', 'press', 'price', 'paper', 'plant', 'play', 'prove'],
      y: ['year', 'your', 'young', 'yield', 'type', 'style', 'system', 'story', 'study', 'beyond'],
      f: ['form', 'find', 'first', 'front', 'field', 'force', 'fresh', 'floor', 'faith', 'fault'],
      g: ['give', 'great', 'group', 'grow', 'going', 'green', 'grade', 'grace', 'guess', 'guide'],
      default: ['the', 'and', 'that', 'have', 'with', 'this', 'will', 'from', 'they', 'been'],
    };

    const practiceWords: Set<string> = new Set();
    for (const key of suggestedFocus) {
      const keyWords = WORD_BANK[key] || WORD_BANK.default;
      keyWords.forEach(w => practiceWords.add(w));
    }
    if (practiceWords.size < 20) {
      WORD_BANK.default.forEach(w => practiceWords.add(w));
    }

    // Calculate overall error rate from recent results
    let totalCorrect = 0;
    let totalChars = 0;
    for (const result of recentResults) {
      totalCorrect += result.correctChars;
      totalChars += result.totalChars;
    }
    const overallErrorRate = totalChars > 0 ? 1 - (totalCorrect / totalChars) : 0;

    const report: WeaknessReport = {
      weakKeys,
      weakBigrams: [],
      slowestKeys: [],
      overallErrorRate,
      suggestedFocus,
      practiceWords: Array.from(practiceWords).slice(0, 50),
    };

    setPracticeData({ report });
    setFetchStatus('success');
  }, [results, weakspotData]);

  // Start practice with the generated words
  const handleStartPractice = useCallback(() => {
    if (!practiceData?.report?.practiceWords?.length) return;

    // Store practice config in sessionStorage for the practice session page
    const practiceConfig = {
      words: practiceData.report.practiceWords,
      focusKeys: practiceData.report.suggestedFocus || [],
      wordCount: 50,
      duration: 60,
    };
    sessionStorage.setItem('practiceConfig', JSON.stringify(practiceConfig));
    router.push('/practice/session');
  }, [practiceData, router]);

  // Loading state
  if (fetchStatus === 'loading' || fetchStatus === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <Loader2
          className="w-8 h-8 animate-spin"
          style={{ color: 'var(--main-color)' }}
        />
        <p className="text-sm" style={{ color: 'var(--sub-color)' }}>
          Analyzing your typing patterns...
        </p>
      </div>
    );
  }

  // Error state
  if (fetchStatus === 'error' || errorMessage) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <AlertTriangle
          className="w-8 h-8"
          style={{ color: 'var(--error-color)' }}
        />
        <p className="text-sm" style={{ color: 'var(--error-color)' }}>
          {errorMessage || 'Failed to analyze weaknesses. Please try again.'}
        </p>
      </div>
    );
  }

  // No data state
  if (!practiceData?.report) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <Target
          className="w-12 h-12"
          style={{ color: 'var(--sub-color)' }}
        />
        <p className="text-sm text-center max-w-md" style={{ color: 'var(--sub-color)' }}>
          {practiceData?.message || 'No test results found. Complete some tests first to generate a practice plan.'}
        </p>
        <button
          onClick={() => router.push('/')}
          className={cn(
            'px-6 py-3 rounded-lg font-medium',
            'transition-all duration-200',
            'hover:scale-105 active:scale-95',
          )}
          style={{
            backgroundColor: 'var(--main-color)',
            color: 'var(--bg-color)',
          }}
        >
          Take a Test
        </button>
      </div>
    );
  }

  const { report } = practiceData;

  return (
    <div className="space-y-8">
      {/* Summary Card */}
      <div
        className="rounded-xl p-6 border"
        style={{
          backgroundColor: 'var(--sub-alt-color)',
          borderColor: 'var(--sub-color)',
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <Target className="w-5 h-5" style={{ color: 'var(--main-color)' }} />
          <h2
            className="text-lg font-semibold"
            style={{ color: 'var(--text-color)' }}
          >
            Based on your recent tests...
          </h2>
        </div>

        {/* Overall Error Rate */}
        <div
          className="flex items-center gap-3 mb-6 px-4 py-3 rounded-lg"
          style={{ backgroundColor: 'var(--bg-color)' }}
        >
          <span className="text-sm" style={{ color: 'var(--sub-color)' }}>
            Overall error rate:
          </span>
          <span
            className="font-mono font-bold text-lg"
            style={{
              color: report.overallErrorRate > 0.1
                ? 'var(--error-color)'
                : 'var(--main-color)',
            }}
          >
            {(report.overallErrorRate * 100).toFixed(1)}%
          </span>
        </div>

        {/* Weak Keys Section */}
        {report.weakKeys.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4" style={{ color: 'var(--error-color)' }} />
              <h3
                className="text-sm font-medium uppercase tracking-wider"
                style={{ color: 'var(--sub-color)' }}
              >
                Weakest Keys
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {report.weakKeys.slice(0, 5).map((weakness) => (
                <KeyCap
                  key={weakness.key}
                  letter={weakness.key}
                  errorRate={weakness.errorRate}
                  avgSpeed={weakness.avgSpeed}
                  sampleSize={weakness.sampleSize}
                />
              ))}
            </div>
          </div>
        )}

        {/* Slowest Keys Section */}
        {report.slowestKeys.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4" style={{ color: 'var(--sub-color)' }} />
              <h3
                className="text-sm font-medium uppercase tracking-wider"
                style={{ color: 'var(--sub-color)' }}
              >
                Slowest Keys
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {report.slowestKeys.slice(0, 5).map((weakness) => (
                <KeyCap
                  key={`slow-${weakness.key}`}
                  letter={weakness.key}
                  errorRate={weakness.errorRate}
                  avgSpeed={weakness.avgSpeed}
                  sampleSize={weakness.sampleSize}
                />
              ))}
            </div>
          </div>
        )}

        {/* Weak Bigrams Section */}
        {report.weakBigrams.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4" style={{ color: 'var(--sub-color)' }} />
              <h3
                className="text-sm font-medium uppercase tracking-wider"
                style={{ color: 'var(--sub-color)' }}
              >
                Weak Combinations
              </h3>
            </div>
            <div className="space-y-2">
              {report.weakBigrams.slice(0, 5).map((bigram) => (
                <WeaknessCard
                  key={bigram.bigram}
                  label={bigram.bigram}
                  errorRate={bigram.errorRate}
                  avgSpeed={bigram.avgSpeed}
                  sampleSize={bigram.sampleSize}
                  isBigram
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Detailed Breakdowns */}
      {report.weakKeys.length > 0 && (
        <div
          className="rounded-xl p-6 border"
          style={{
            backgroundColor: 'var(--sub-alt-color)',
            borderColor: 'var(--sub-color)',
          }}
        >
          <h3
            className="text-sm font-medium uppercase tracking-wider mb-4"
            style={{ color: 'var(--sub-color)' }}
          >
            Key Error Breakdown
          </h3>
          <div className="space-y-2">
            {report.weakKeys.map((weakness) => (
              <WeaknessCard
                key={weakness.key}
                label={weakness.key}
                errorRate={weakness.errorRate}
                avgSpeed={weakness.avgSpeed}
                sampleSize={weakness.sampleSize}
              />
            ))}
          </div>
        </div>
      )}

      {/* Improvement Tips */}
      <div
        className="rounded-xl p-6 border"
        style={{
          backgroundColor: 'var(--sub-alt-color)',
          borderColor: 'var(--sub-color)',
        }}
      >
        <h3
          className="text-sm font-medium uppercase tracking-wider mb-4"
          style={{ color: 'var(--sub-color)' }}
        >
          Improvement Tips
        </h3>
        <ul className="space-y-3">
          {report.overallErrorRate > 0.1 && (
            <li className="flex items-start gap-3">
              <span
                className="mt-1 w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: 'var(--error-color)' }}
              />
              <span className="text-sm" style={{ color: 'var(--text-color)' }}>
                Your error rate is above 10%. Focus on accuracy over speed -- slow down and hit the right keys consistently.
              </span>
            </li>
          )}
          {report.suggestedFocus.length > 0 && (
            <li className="flex items-start gap-3">
              <span
                className="mt-1 w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: 'var(--main-color)' }}
              />
              <span className="text-sm" style={{ color: 'var(--text-color)' }}>
                Focus on the keys:{' '}
                <span className="font-mono font-bold" style={{ color: 'var(--main-color)' }}>
                  {report.suggestedFocus.map(k => k.toUpperCase()).join(', ')}
                </span>
                . Practice words containing these characters to build muscle memory.
              </span>
            </li>
          )}
          {report.weakBigrams.length > 0 && (
            <li className="flex items-start gap-3">
              <span
                className="mt-1 w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: 'var(--main-color)' }}
              />
              <span className="text-sm" style={{ color: 'var(--text-color)' }}>
                Work on letter transitions like{' '}
                <span className="font-mono font-bold" style={{ color: 'var(--main-color)' }}>
                  {report.weakBigrams.slice(0, 3).map(b => `"${b.bigram}"`).join(', ')}
                </span>
                . These combinations are slowing you down.
              </span>
            </li>
          )}
          {report.slowestKeys.length > 0 && report.slowestKeys[0].avgSpeed > 200 && (
            <li className="flex items-start gap-3">
              <span
                className="mt-1 w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: 'var(--main-color)' }}
              />
              <span className="text-sm" style={{ color: 'var(--text-color)' }}>
                Some keys are significantly slower than others. Practice reaching for{' '}
                <span className="font-mono font-bold" style={{ color: 'var(--main-color)' }}>
                  {report.slowestKeys.slice(0, 3).map(k => k.key.toUpperCase()).join(', ')}
                </span>
                {' '}without looking at the keyboard.
              </span>
            </li>
          )}
          <li className="flex items-start gap-3">
            <span
              className="mt-1 w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: 'var(--main-color)' }}
            />
            <span className="text-sm" style={{ color: 'var(--text-color)' }}>
              Use the practice mode below to drill your weak areas with targeted word lists.
            </span>
          </li>
        </ul>
      </div>

      {/* Practice Words Preview */}
      {report.practiceWords.length > 0 && (
        <div
          className="rounded-xl p-6 border"
          style={{
            backgroundColor: 'var(--sub-alt-color)',
            borderColor: 'var(--sub-color)',
          }}
        >
          <h3
            className="text-sm font-medium uppercase tracking-wider mb-3"
            style={{ color: 'var(--sub-color)' }}
          >
            Practice Word Pool ({report.practiceWords.length} words)
          </h3>
          <div className="flex flex-wrap gap-2">
            {report.practiceWords.slice(0, 30).map((word, index) => (
              <span
                key={`${word}-${index}`}
                className="px-2 py-1 rounded text-sm font-mono"
                style={{
                  backgroundColor: 'var(--bg-color)',
                  color: 'var(--text-color)',
                  border: '1px solid var(--sub-color)',
                }}
              >
                {word}
              </span>
            ))}
            {report.practiceWords.length > 30 && (
              <span
                className="px-2 py-1 text-sm italic"
                style={{ color: 'var(--sub-color)' }}
              >
                +{report.practiceWords.length - 30} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Start Practice Button */}
      <div className="flex justify-center pt-4">
        <button
          onClick={handleStartPractice}
          disabled={!report.practiceWords?.length}
          className={cn(
            'flex items-center gap-3 px-8 py-4 rounded-lg',
            'font-semibold text-lg',
            'transition-all duration-200',
            'hover:scale-105 active:scale-95',
            'focus:outline-none focus:ring-2 focus:ring-offset-2',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
          )}
          style={{
            backgroundColor: 'var(--main-color)',
            color: 'var(--bg-color)',
          }}
        >
          <Target className="w-5 h-5" />
          Start Practice
        </button>
      </div>
    </div>
  );
}
