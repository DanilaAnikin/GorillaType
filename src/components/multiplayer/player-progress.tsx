"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";

/* ============================================
   PLAYER PROGRESS COMPONENT
   Shows individual player's progress in a race
   ============================================ */

export interface PlayerProgressProps {
  /** Player's unique ID */
  playerId: string;
  /** Player's display name */
  username: string;
  /** Player's avatar URL */
  avatarUrl?: string | null;
  /** Current progress (0-100) */
  progress: number;
  /** Current WPM */
  wpm: number;
  /** Finish position (1st, 2nd, 3rd, etc.) - null if not finished */
  finishPosition?: number | null;
  /** Whether this is the current user */
  isCurrentUser?: boolean;
  /** Player color for the progress bar */
  color?: "primary" | "secondary" | "accent" | "yellow" | "green" | "blue" | "purple" | "orange";
  /** Additional class names */
  className?: string;
}

const colorVariants = {
  primary: "bg-main",
  secondary: "bg-sub",
  accent: "bg-main/80",
  yellow: "bg-main",
  green: "bg-main/90",
  blue: "bg-main/85",
  purple: "bg-main/75",
  orange: "bg-main/70",
};

const borderVariants = {
  primary: "border-main",
  secondary: "border-sub",
  accent: "border-main/80",
  yellow: "border-main",
  green: "border-main/90",
  blue: "border-main/85",
  purple: "border-main/75",
  orange: "border-main/70",
};

export const PlayerProgress = React.memo(function PlayerProgress({
  playerId,
  username,
  avatarUrl,
  progress,
  wpm,
  finishPosition,
  isCurrentUser = false,
  color = "primary",
  className,
}: PlayerProgressProps) {
  const isFinished = finishPosition !== null && finishPosition !== undefined;

  // Get position badge content
  const getPositionBadge = () => {
    if (!isFinished) return null;

    const badges: Record<number, { text: string; className: string }> = {
      1: { text: "1st", className: "bg-main/10 text-main" },
      2: { text: "2nd", className: "bg-sub-alt text-text" },
      3: { text: "3rd", className: "bg-sub-alt text-text" },
    };

    const badge = badges[finishPosition!] || {
      text: `${finishPosition}th`,
      className: "bg-sub text-sub-alt",
    };

    return (
      <span
        className={cn(
          "inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-bold transition-all duration-125",
          badge.className
        )}
      >
        {badge.text}
      </span>
    );
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-2 rounded-lg transition-all duration-125",
        isCurrentUser && "bg-sub-alt/50",
        className
      )}
      data-player-id={playerId}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <Avatar
          src={avatarUrl}
          alt={username}
          fallback={username.charAt(0)}
          size="md"
          bordered
          className={cn("ring-2 transition-all duration-125", borderVariants[color])}
        />
        {isCurrentUser && (
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-main rounded-full border-2 border-bg transition-all duration-125" />
        )}
      </div>

      {/* Player info and progress */}
      <div className="flex-1 min-w-0">
        {/* Name and stats row */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={cn(
                "font-medium truncate",
                isCurrentUser ? "text-main" : "text-text"
              )}
            >
              {username}
            </span>
            {getPositionBadge()}
          </div>
          <span className="text-sm font-mono text-sub flex-shrink-0">
            {wpm} <span className="text-xs">wpm</span>
          </span>
        </div>

        {/* Progress bar */}
        <div className="relative h-2 bg-sub-alt rounded-full overflow-hidden">
          <div
            className={cn(
              "absolute inset-y-0 left-0 rounded-full transition-all duration-125 ease-out",
              colorVariants[color],
              isFinished && "animate-pulse"
            )}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      </div>

      {/* Progress percentage */}
      <div className="flex-shrink-0 w-12 text-right">
        <span
          className={cn(
            "text-sm font-mono",
            isFinished ? "text-main" : "text-sub"
          )}
        >
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
});

/* ============================================
   PLAYER PROGRESS LIST
   Container for multiple player progress bars
   ============================================ */

export interface PlayerProgressListProps {
  /** Array of players with their progress data */
  players: Array<{
    playerId: string;
    username: string;
    avatarUrl?: string | null;
    progress: number;
    wpm: number;
    finishPosition?: number | null;
    isCurrentUser?: boolean;
  }>;
  /** Color assignment map (playerId -> color) */
  colorMap?: Record<string, PlayerProgressProps["color"]>;
  /** Additional class names */
  className?: string;
}

const defaultColors: PlayerProgressProps["color"][] = [
  "primary",
  "green",
  "blue",
  "purple",
  "orange",
  "yellow",
  "accent",
  "secondary",
];

export const PlayerProgressList = React.memo(function PlayerProgressList({
  players,
  colorMap,
  className,
}: PlayerProgressListProps) {
  // Sort players: finished first (by position), then by progress
  const sortedPlayers = React.useMemo(() => {
    return [...players].sort((a, b) => {
      // Finished players come first
      if (a.finishPosition && !b.finishPosition) return -1;
      if (!a.finishPosition && b.finishPosition) return 1;
      // Among finished, sort by position
      if (a.finishPosition && b.finishPosition) {
        return a.finishPosition - b.finishPosition;
      }
      // Among unfinished, sort by progress
      return b.progress - a.progress;
    });
  }, [players]);

  // Generate color map if not provided
  const finalColorMap = React.useMemo(() => {
    if (colorMap) return colorMap;

    const map: Record<string, PlayerProgressProps["color"]> = {};
    players.forEach((player, index) => {
      map[player.playerId] = defaultColors[index % defaultColors.length];
    });
    return map;
  }, [players, colorMap]);

  return (
    <div className={cn("space-y-2", className)}>
      {sortedPlayers.map((player) => (
        <PlayerProgress
          key={player.playerId}
          {...player}
          color={finalColorMap[player.playerId]}
        />
      ))}
    </div>
  );
});

export default PlayerProgress;
