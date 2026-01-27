"use client";

import * as React from "react";
import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import type { ChallengeUser, ChallengeResult } from "./challenge-card";

/**
 * Props for ChallengeResultComparison
 */
export interface ChallengeResultComparisonProps {
  challenger: ChallengeUser | null;
  challenged: ChallengeUser | null;
  challengerResult: ChallengeResult | null;
  challengedResult: ChallengeResult | null;
  winnerId: string | null;
  className?: string;
}

/**
 * StatRow displays a single stat comparison between two users.
 */
function StatRow({
  label,
  leftValue,
  rightValue,
  suffix = "",
  highlightHigher = true,
}: {
  label: string;
  leftValue: number | null;
  rightValue: number | null;
  suffix?: string;
  highlightHigher?: boolean;
}) {
  const leftNum = leftValue ?? 0;
  const rightNum = rightValue ?? 0;
  const leftWins = highlightHigher ? leftNum > rightNum : leftNum < rightNum;
  const rightWins = highlightHigher ? rightNum > leftNum : rightNum < leftNum;

  return (
    <div className="flex items-center justify-between py-1.5">
      <span
        className="text-sm font-medium tabular-nums"
        style={{
          color: leftWins ? "var(--main-color)" : "var(--text-color)",
        }}
      >
        {leftValue !== null ? `${leftValue}${suffix}` : "-"}
      </span>
      <span
        className="text-xs uppercase tracking-wider"
        style={{ color: "var(--sub-color)" }}
      >
        {label}
      </span>
      <span
        className="text-sm font-medium tabular-nums"
        style={{
          color: rightWins ? "var(--main-color)" : "var(--text-color)",
        }}
      >
        {rightValue !== null ? `${rightValue}${suffix}` : "-"}
      </span>
    </div>
  );
}

/**
 * ChallengeResultComparison shows a side-by-side comparison of two users' results.
 */
export function ChallengeResultComparison({
  challenger,
  challenged,
  challengerResult,
  challengedResult,
  winnerId,
  className,
}: ChallengeResultComparisonProps) {
  const challengerIsWinner = winnerId === challenger?.id;
  const challengedIsWinner = winnerId === challenged?.id;

  const challengerName = challenger?.displayName || challenger?.username || "Challenger";
  const challengedName = challenged?.displayName || challenged?.username || "Challenged";

  // WPM difference
  const wpmDiff =
    challengerResult?.wpm != null && challengedResult?.wpm != null
      ? Math.abs(challengerResult.wpm - challengedResult.wpm)
      : null;

  return (
    <div
      className={cn("rounded-lg p-4", className)}
      style={{ backgroundColor: "var(--bg-color)" }}
    >
      {/* User Headers */}
      <div className="flex items-center justify-between mb-4">
        {/* Challenger */}
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "rounded-full p-0.5",
              challengerIsWinner && "ring-2 ring-main"
            )}
          >
            <Avatar
              src={challenger?.avatarUrl}
              alt={challengerName}
              fallback={challengerName.charAt(0)}
              size="md"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="text-sm font-medium"
              style={{ color: "var(--text-color)" }}
            >
              {challengerName}
            </span>
            {challengerIsWinner && (
              <Crown
                className="w-4 h-4"
                style={{ color: "var(--main-color)" }}
              />
            )}
          </div>
        </div>

        {/* VS / WPM Diff */}
        <div className="flex flex-col items-center">
          <span
            className="text-xs font-bold uppercase"
            style={{ color: "var(--sub-color)" }}
          >
            VS
          </span>
          {wpmDiff !== null && (
            <span
              className="text-xs tabular-nums"
              style={{ color: "var(--sub-color)" }}
            >
              {wpmDiff.toFixed(0)} WPM diff
            </span>
          )}
        </div>

        {/* Challenged */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            {challengedIsWinner && (
              <Crown
                className="w-4 h-4"
                style={{ color: "var(--main-color)" }}
              />
            )}
            <span
              className="text-sm font-medium"
              style={{ color: "var(--text-color)" }}
            >
              {challengedName}
            </span>
          </div>
          <div
            className={cn(
              "rounded-full p-0.5",
              challengedIsWinner && "ring-2 ring-main"
            )}
          >
            <Avatar
              src={challenged?.avatarUrl}
              alt={challengedName}
              fallback={challengedName.charAt(0)}
              size="md"
            />
          </div>
        </div>
      </div>

      {/* Stats Comparison */}
      <div
        className="border-t pt-3 space-y-0.5"
        style={{ borderColor: "var(--sub-color)" }}
      >
        <StatRow
          label="WPM"
          leftValue={challengerResult?.wpm ?? null}
          rightValue={challengedResult?.wpm ?? null}
        />
        <StatRow
          label="Accuracy"
          leftValue={challengerResult?.accuracy ?? null}
          rightValue={challengedResult?.accuracy ?? null}
          suffix="%"
        />
        <StatRow
          label="Consistency"
          leftValue={challengerResult?.consistency ?? null}
          rightValue={challengedResult?.consistency ?? null}
          suffix="%"
        />
        <StatRow
          label="Raw WPM"
          leftValue={challengerResult?.rawWpm ?? null}
          rightValue={challengedResult?.rawWpm ?? null}
        />
      </div>
    </div>
  );
}

export default ChallengeResultComparison;
