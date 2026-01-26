"use client";

import { cn } from "@/lib/utils/cn";
import { formatNumber, formatPercentage } from "@/lib/utils/formatting";
import {
  Target,
  Clock,
  Zap,
  Crosshair,
  Flame,
  Trophy,
  Star
} from "lucide-react";

/**
 * User statistics data structure.
 */
export interface UserStats {
  testsCompleted: number;
  timeTyping: number; // in seconds
  averageWPM: number;
  averageAccuracy: number;
  currentStreak: number;
  maxStreak: number;
  xp: number;
  level: number;
}

/**
 * Props for the StatsOverview component.
 */
export interface StatsOverviewProps {
  /** User statistics data */
  stats: UserStats;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Format seconds into hours and minutes display.
 */
function formatTypingTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Calculate XP required to reach a given level.
 * Formula: XP = 100 * (level - 1)^2
 * This is derived from the database formula: level = floor(sqrt(xp / 100)) + 1
 */
function getXPForLevel(level: number): number {
  return 100 * Math.pow(level - 1, 2);
}

/**
 * Individual stat card component.
 */
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
}

function StatCard({ icon, label, value, subValue }: StatCardProps) {
  return (
    <div className="bg-sub-alt rounded-lg p-4 flex flex-col transition-all duration-125">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-main">{icon}</span>
        <span className="text-sm text-sub">{label}</span>
      </div>
      <p className="text-2xl font-bold text-text">{value}</p>
      {subValue && (
        <p className="text-xs text-sub mt-1">{subValue}</p>
      )}
    </div>
  );
}

/**
 * StatsOverview displays a summary of user typing statistics.
 *
 * @example
 * <StatsOverview
 *   stats={{
 *     testsCompleted: 523,
 *     timeTyping: 36000,
 *     averageWPM: 85,
 *     averageAccuracy: 96.5,
 *     currentStreak: 7,
 *     maxStreak: 30,
 *     xp: 12500,
 *     level: 15
 *   }}
 * />
 */
export function StatsOverview({ stats, className }: StatsOverviewProps) {
  const currentLevelXP = getXPForLevel(stats.level);
  const nextLevelXP = getXPForLevel(stats.level + 1);
  const xpProgress = stats.xp - currentLevelXP;
  const xpNeeded = nextLevelXP - currentLevelXP;
  const progressPercent = Math.min(100, (xpProgress / xpNeeded) * 100);

  return (
    <div
      className={cn(
        "rounded-lg bg-sub-alt border border-sub p-6 transition-all duration-125",
        className
      )}
    >
      <h2 className="text-xl font-semibold text-text mb-4 transition-all duration-125">Statistics Overview</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Tests Completed */}
        <StatCard
          icon={<Target className="w-5 h-5" />}
          label="Tests Completed"
          value={formatNumber(stats.testsCompleted)}
        />

        {/* Time Typing */}
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          label="Time Typing"
          value={formatTypingTime(stats.timeTyping)}
          subValue={`${Math.floor(stats.timeTyping / 3600)} hours total`}
        />

        {/* Average WPM */}
        <StatCard
          icon={<Zap className="w-5 h-5" />}
          label="Average WPM"
          value={Math.round(stats.averageWPM)}
        />

        {/* Average Accuracy */}
        <StatCard
          icon={<Crosshair className="w-5 h-5" />}
          label="Accuracy"
          value={formatPercentage(stats.averageAccuracy, { decimals: 1 })}
        />

        {/* Current Streak */}
        <StatCard
          icon={<Flame className="w-5 h-5" />}
          label="Current Streak"
          value={`${stats.currentStreak} days`}
          subValue={stats.currentStreak > 0 ? "Keep it going!" : "Start a streak today!"}
        />

        {/* Max Streak */}
        <StatCard
          icon={<Trophy className="w-5 h-5" />}
          label="Best Streak"
          value={`${stats.maxStreak} days`}
        />
      </div>

      {/* XP and Level Progress */}
      <div className="mt-6 p-4 bg-sub-alt rounded-lg transition-all duration-125">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-main" />
            <span className="font-medium text-text">Level {stats.level}</span>
          </div>
          <span className="text-sm text-sub">
            {formatNumber(stats.xp)} XP total
          </span>
        </div>

        <div className="relative">
          <div className="h-3 bg-bg rounded-full overflow-hidden transition-all duration-125">
            <div
              className="h-full bg-main transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-sub">
            <span>Level {stats.level}</span>
            <span>
              {formatNumber(xpProgress)} / {formatNumber(xpNeeded)} XP
            </span>
            <span>Level {stats.level + 1}</span>
          </div>
        </div>

        <p className="text-center text-sm text-sub mt-3">
          {formatNumber(xpNeeded - xpProgress)} XP needed for next level
        </p>
      </div>
    </div>
  );
}

export default StatsOverview;
