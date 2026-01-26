"use client";

import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/formatting";
import { Trophy, Clock, Type } from "lucide-react";

/**
 * Personal best record for a specific mode.
 */
export interface PersonalBest {
  wpm: number;
  accuracy: number;
  date: Date | string;
}

/**
 * Personal bests organized by mode.
 */
export interface PersonalBestsData {
  time: {
    15?: PersonalBest;
    30?: PersonalBest;
    60?: PersonalBest;
    120?: PersonalBest;
  };
  words: {
    10?: PersonalBest;
    25?: PersonalBest;
    50?: PersonalBest;
    100?: PersonalBest;
  };
}

/**
 * Props for the PersonalBests component.
 */
export interface PersonalBestsProps {
  /** Personal bests data */
  personalBests: PersonalBestsData;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Individual personal best card.
 */
interface PBCardProps {
  mode: string;
  value: number;
  unit: string;
  pb?: PersonalBest;
}

function PBCard({ mode, value, unit, pb }: PBCardProps) {
  const hasPB = pb !== undefined;

  return (
    <div
      className={cn(
        "rounded-lg p-4 transition-all duration-125",
        hasPB
          ? "bg-sub-alt border border-sub"
          : "bg-sub-alt/30 border border-sub/30"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-sub">
          {value} {unit}
        </span>
        {hasPB && (
          <Trophy className="w-4 h-4 text-main" />
        )}
      </div>

      {hasPB ? (
        <>
          <p className="text-3xl font-bold text-text">
            {Math.round(pb.wpm)}
            <span className="text-lg text-sub ml-1">wpm</span>
          </p>
          <div className="mt-2 flex items-center justify-between text-xs text-sub">
            <span>{pb.accuracy.toFixed(1)}% acc</span>
            <span>{formatDate(pb.date, { month: "short", day: "numeric" })}</span>
          </div>
        </>
      ) : (
        <div className="py-3">
          <p className="text-sub/60 text-sm">No record</p>
        </div>
      )}
    </div>
  );
}

/**
 * PersonalBests displays a grid of personal best records by mode.
 *
 * @example
 * <PersonalBests
 *   personalBests={{
 *     time: {
 *       15: { wpm: 125, accuracy: 98.5, date: new Date() },
 *       30: { wpm: 118, accuracy: 97.2, date: new Date() },
 *       60: { wpm: 110, accuracy: 96.8, date: new Date() },
 *       120: { wpm: 105, accuracy: 95.5, date: new Date() }
 *     },
 *     words: {
 *       10: { wpm: 135, accuracy: 100, date: new Date() },
 *       25: { wpm: 120, accuracy: 98.0, date: new Date() },
 *       50: { wpm: 112, accuracy: 97.5, date: new Date() },
 *       100: { wpm: 108, accuracy: 96.0, date: new Date() }
 *     }
 *   }}
 * />
 */
export function PersonalBests({ personalBests, className }: PersonalBestsProps) {
  const timeOptions = [15, 30, 60, 120] as const;
  const wordOptions = [10, 25, 50, 100] as const;

  // Calculate best overall WPM
  const allBests = [
    ...Object.values(personalBests.time),
    ...Object.values(personalBests.words)
  ].filter(Boolean) as PersonalBest[];

  const overallBest = allBests.length > 0
    ? allBests.reduce((best, current) => current.wpm > best.wpm ? current : best)
    : null;

  return (
    <div
      className={cn(
        "rounded-lg bg-sub-alt border border-sub p-6 transition-all duration-125",
        className
      )}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-text">Personal Bests</h2>
        {overallBest && (
          <div className="flex items-center gap-2 px-3 py-1 bg-main/10 border border-main/30 rounded-full transition-all duration-125">
            <Trophy className="w-4 h-4 text-main" />
            <span className="text-sm font-medium text-main">
              Best: {Math.round(overallBest.wpm)} WPM
            </span>
          </div>
        )}
      </div>

      {/* Time Mode */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-main" />
          <h3 className="text-sm font-medium text-text">Time Mode</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {timeOptions.map((time) => (
            <PBCard
              key={`time-${time}`}
              mode="time"
              value={time}
              unit="seconds"
              pb={personalBests.time[time]}
            />
          ))}
        </div>
      </div>

      {/* Words Mode */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Type className="w-4 h-4 text-main" />
          <h3 className="text-sm font-medium text-text">Words Mode</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {wordOptions.map((words) => (
            <PBCard
              key={`words-${words}`}
              mode="words"
              value={words}
              unit="words"
              pb={personalBests.words[words]}
            />
          ))}
        </div>
      </div>

      {/* Empty state */}
      {allBests.length === 0 && (
        <div className="text-center py-8 text-sub">
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No personal bests yet.</p>
          <p className="text-sm">Complete some typing tests to set your first records!</p>
        </div>
      )}
    </div>
  );
}

export default PersonalBests;
