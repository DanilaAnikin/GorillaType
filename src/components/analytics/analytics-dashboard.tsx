'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { StatCard } from './stat-card';
import { ActivityHeatmap } from './activity-heatmap';
import { BarChart3, Clock, Target, Zap, Trophy, Keyboard } from 'lucide-react';

// Dynamically import chart components to avoid SSR issues with Chart.js
const WpmProgressionChart = dynamic(
  () => import('./wpm-chart').then(mod => ({ default: mod.WpmProgressionChart })),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  }
);

const AccuracyChart = dynamic(
  () => import('./accuracy-chart').then(mod => ({ default: mod.AccuracyChart })),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  }
);

const ModeBreakdown = dynamic(
  () => import('./mode-breakdown').then(mod => ({ default: mod.ModeBreakdown })),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  }
);

interface AnalyticsData {
  wpmHistory: { wpm: number; raw_wpm: number; accuracy: number; date: string; test_mode: string }[];
  dailyTests: { date: string; count: number; avg_wpm: number }[];
  modeStats: { mode: string; avg_wpm: number; best_wpm: number; tests: number }[];
  languageStats: { language: string; avg_wpm: number; avg_accuracy: number; tests: number }[];
  overallStats: {
    totalTests: number;
    totalTime: number;
    avgWpm: number;
    avgAccuracy: number;
    avgConsistency: number;
    bestWpm: number;
    charsCorrect: number;
    charsIncorrect: number;
    charsExtra: number;
    charsMissed: number;
  };
  recentProgress: {
    currentAvg: number;
    previousAvg: number;
    improvement: number;
  };
}

function ChartSkeleton() {
  return (
    <div
      className="h-72 rounded-lg animate-pulse"
      style={{ backgroundColor: 'var(--sub-alt-color)' }}
    />
  );
}

function StatCardSkeleton() {
  return (
    <div
      className="h-24 rounded-lg animate-pulse"
      style={{ backgroundColor: 'var(--sub-alt-color)' }}
    />
  );
}

function SectionTitle({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="h-5 w-5" style={{ color: 'var(--main-color)' }} />
      <h2
        className="text-lg font-semibold"
        style={{ color: 'var(--text-color)' }}
      >
        {children}
      </h2>
    </div>
  );
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [heatmapDays, setHeatmapDays] = useState<number>(500);

  const fetchAnalytics = useCallback(async (days: number, isInitial: boolean) => {
    try {
      if (isInitial) {
        setIsLoading(true);
      } else {
        setIsRefetching(true);
      }
      setError(null);

      const response = await fetch(`/api/analytics?days=${days}`);

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to fetch analytics data');
      }

      const analyticsData: AnalyticsData = await response.json();
      setData(analyticsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      console.error('Analytics fetch error:', err);
    } finally {
      setIsLoading(false);
      setIsRefetching(false);
    }
  }, []);

  useEffect(() => {
    // Only the very first fetch is "initial" (data is null)
    fetchAnalytics(heatmapDays, data === null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchAnalytics, heatmapDays]);

  const handleTimelineChange = useCallback((days: number) => {
    setHeatmapDays(days);
  }, []);

  // Loading state - only shown on initial load (no data yet)
  if (isLoading && !data) {
    return (
      <div className="space-y-8">
        {/* Overview skeleton */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-5 w-5 rounded animate-pulse" style={{ backgroundColor: 'var(--sub-alt-color)' }} />
            <div className="h-5 w-32 rounded animate-pulse" style={{ backgroundColor: 'var(--sub-alt-color)' }} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
        </div>

        {/* Chart skeletons */}
        <ChartSkeleton />
        <ChartSkeleton />

        {/* Activity skeleton */}
        <div
          className="h-40 rounded-lg animate-pulse"
          style={{ backgroundColor: 'var(--sub-alt-color)' }}
        />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className="rounded-lg border p-8 text-center"
        style={{
          backgroundColor: 'var(--sub-alt-color)',
          borderColor: 'color-mix(in srgb, var(--error-color) 30%, transparent)',
        }}
      >
        <p className="text-sm mb-2" style={{ color: 'var(--error-color)' }}>
          {error}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="text-sm font-medium px-4 py-2 rounded-lg transition-colors duration-150"
          style={{
            backgroundColor: 'var(--main-color)',
            color: 'var(--bg-color)',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  // No data state
  if (!data || data.overallStats.totalTests === 0) {
    return (
      <div
        className="rounded-lg border p-8 text-center"
        style={{
          backgroundColor: 'var(--sub-alt-color)',
          borderColor: 'color-mix(in srgb, var(--sub-color) 30%, transparent)',
        }}
      >
        <Keyboard className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--sub-color)' }} />
        <p className="text-lg font-medium mb-1" style={{ color: 'var(--text-color)' }}>
          No data yet
        </p>
        <p className="text-sm" style={{ color: 'var(--sub-color)' }}>
          Complete some typing tests to see your analytics here.
        </p>
      </div>
    );
  }

  const { overallStats, recentProgress, wpmHistory, dailyTests, modeStats, languageStats } = data;

  return (
    <div className="space-y-8">
      {/* --- Overview Stats --- */}
      <section>
        <SectionTitle icon={BarChart3}>Overview</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard
            label="Tests"
            value={overallStats.totalTests}
          />
          <StatCard
            label="Avg WPM"
            value={overallStats.avgWpm}
            unit="wpm"
            change={recentProgress.improvement}
            changeLabel="vs prev 10"
          />
          <StatCard
            label="Best WPM"
            value={overallStats.bestWpm}
            unit="wpm"
          />
          <StatCard
            label="Avg Accuracy"
            value={overallStats.avgAccuracy}
            unit="%"
          />
          <StatCard
            label="Consistency"
            value={overallStats.avgConsistency}
            unit="%"
          />
          <StatCard
            label="Time Typing"
            value={formatTime(overallStats.totalTime)}
          />
        </div>
      </section>

      {/* --- Character Stats --- */}
      <section>
        <SectionTitle icon={Keyboard}>Character Breakdown</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label="Correct"
            value={overallStats.charsCorrect.toLocaleString()}
          />
          <StatCard
            label="Incorrect"
            value={overallStats.charsIncorrect.toLocaleString()}
          />
          <StatCard
            label="Extra"
            value={overallStats.charsExtra.toLocaleString()}
          />
          <StatCard
            label="Missed"
            value={overallStats.charsMissed.toLocaleString()}
          />
        </div>
      </section>

      {/* --- WPM Progression --- */}
      <section>
        <SectionTitle icon={Zap}>WPM Progression</SectionTitle>
        <WpmProgressionChart data={wpmHistory} />
      </section>

      {/* --- Accuracy Trend --- */}
      <section>
        <SectionTitle icon={Target}>Accuracy Trend</SectionTitle>
        <AccuracyChart data={wpmHistory} />
      </section>

      {/* --- Daily Activity --- */}
      <section>
        <SectionTitle icon={Clock}>Daily Activity</SectionTitle>
        <ActivityHeatmap
          data={dailyTests}
          selectedDays={heatmapDays}
          onTimelineChange={handleTimelineChange}
          isRefetching={isRefetching}
        />
      </section>

      {/* --- Mode Breakdown --- */}
      <section>
        <SectionTitle icon={Trophy}>Mode Breakdown</SectionTitle>
        <ModeBreakdown data={modeStats} />
      </section>

      {/* --- Language Stats --- */}
      {languageStats.length > 0 && (
        <section>
          <SectionTitle icon={BarChart3}>Language Stats</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {languageStats.map((lang) => (
              <div
                key={lang.language}
                className="rounded-lg border p-4"
                style={{
                  backgroundColor: 'var(--sub-alt-color)',
                  borderColor: 'color-mix(in srgb, var(--sub-color) 30%, transparent)',
                }}
              >
                <p
                  className="text-xs uppercase tracking-wider font-medium mb-2"
                  style={{ color: 'var(--sub-color)' }}
                >
                  {lang.language}
                </p>
                <div className="space-y-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-mono" style={{ color: 'var(--sub-color)' }}>
                      Avg WPM
                    </span>
                    <span className="text-lg font-bold font-mono" style={{ color: 'var(--main-color)' }}>
                      {lang.avg_wpm}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-mono" style={{ color: 'var(--sub-color)' }}>
                      Avg Accuracy
                    </span>
                    <span className="text-sm font-mono" style={{ color: 'var(--text-color)' }}>
                      {lang.avg_accuracy}%
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-mono" style={{ color: 'var(--sub-color)' }}>
                      Tests
                    </span>
                    <span className="text-sm font-mono" style={{ color: 'var(--text-color)' }}>
                      {lang.tests}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* --- Recent Progress Summary --- */}
      <section>
        <div
          className="rounded-lg border p-6"
          style={{
            backgroundColor: 'var(--sub-alt-color)',
            borderColor: 'color-mix(in srgb, var(--sub-color) 30%, transparent)',
          }}
        >
          <h3
            className="text-sm font-medium uppercase tracking-wider mb-4"
            style={{ color: 'var(--sub-color)' }}
          >
            Recent Progress
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs mb-1" style={{ color: 'var(--sub-color)' }}>
                Last 10 tests avg
              </p>
              <p className="text-2xl font-bold font-mono" style={{ color: 'var(--main-color)' }}>
                {recentProgress.currentAvg}
                <span className="text-sm ml-1" style={{ color: 'var(--sub-color)' }}>wpm</span>
              </p>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: 'var(--sub-color)' }}>
                Previous 10 tests avg
              </p>
              <p className="text-2xl font-bold font-mono" style={{ color: 'var(--text-color)' }}>
                {recentProgress.previousAvg}
                <span className="text-sm ml-1" style={{ color: 'var(--sub-color)' }}>wpm</span>
              </p>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: 'var(--sub-color)' }}>
                Change
              </p>
              <p
                className="text-2xl font-bold font-mono"
                style={{
                  color: recentProgress.improvement > 0
                    ? 'var(--main-color)'
                    : recentProgress.improvement < 0
                      ? 'var(--error-color)'
                      : 'var(--sub-color)',
                }}
              >
                {recentProgress.improvement > 0 ? '+' : ''}{recentProgress.improvement}%
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
