"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Trophy, Medal, RotateCcw, LogOut, Crown, Target, Zap } from "lucide-react";

/* ============================================
   RACE RESULTS COMPONENT
   Post-race results display with podium
   ============================================ */

export interface RaceResult {
  /** Player's unique ID */
  playerId: string;
  /** Player's display name */
  username: string;
  /** Player's avatar URL */
  avatarUrl?: string | null;
  /** Final WPM */
  wpm: number;
  /** Final accuracy percentage */
  accuracy: number;
  /** Finish position (1-based) */
  finishPosition: number;
  /** Whether this is the current user */
  isCurrentUser?: boolean;
}

export interface RaceResultsProps {
  /** Array of race results */
  results: RaceResult[];
  /** Callback when rematch button is clicked */
  onRematch?: () => void;
  /** Callback when leave button is clicked */
  onLeave?: () => void;
  /** Whether the current user is the host (shows rematch button) */
  isHost?: boolean;
  /** Whether actions are loading */
  isLoading?: boolean;
  /** Additional class names */
  className?: string;
}

export const RaceResults = React.memo(function RaceResults({
  results,
  onRematch,
  onLeave,
  isHost = false,
  isLoading = false,
  className,
}: RaceResultsProps) {
  // Sort results by finish position
  const sortedResults = React.useMemo(() => {
    return [...results].sort((a, b) => a.finishPosition - b.finishPosition);
  }, [results]);

  // Get top 3 for podium
  const podiumPlayers = sortedResults.slice(0, 3);
  const otherPlayers = sortedResults.slice(3);

  // Find current user's result
  const currentUserResult = sortedResults.find((r) => r.isCurrentUser);

  return (
    <div className={cn("w-full max-w-3xl mx-auto space-y-8", className)}>
      {/* Title */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-main mb-2">Race Complete!</h2>
        {currentUserResult && (
          <p className="text-sub">
            You finished{" "}
            <span className="text-main font-semibold">
              {getOrdinal(currentUserResult.finishPosition)}
            </span>{" "}
            with{" "}
            <span className="text-main font-mono">{currentUserResult.wpm} WPM</span>
          </p>
        )}
      </div>

      {/* Podium Display */}
      {podiumPlayers.length >= 1 && (
        <div className="flex items-end justify-center gap-4 py-8">
          {/* 2nd Place */}
          {podiumPlayers[1] && (
            <PodiumPosition
              player={podiumPlayers[1]}
              position={2}
              height="h-24"
              medalColor="text-text"
              bgColor="bg-sub-alt"
            />
          )}

          {/* 1st Place */}
          {podiumPlayers[0] && (
            <PodiumPosition
              player={podiumPlayers[0]}
              position={1}
              height="h-32"
              medalColor="text-main"
              bgColor="bg-main/10"
            />
          )}

          {/* 3rd Place */}
          {podiumPlayers[2] && (
            <PodiumPosition
              player={podiumPlayers[2]}
              position={3}
              height="h-20"
              medalColor="text-text"
              bgColor="bg-sub-alt"
            />
          )}
        </div>
      )}

      {/* Full Results Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5 text-main" />
            Final Standings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sortedResults.map((result) => (
              <ResultRow key={result.playerId} result={result} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-center gap-3">
        {isHost && onRematch && (
          <Button
            variant="default"
            size="lg"
            onClick={onRematch}
            disabled={isLoading}
            loading={isLoading}
            className="min-w-[160px]"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Rematch
          </Button>
        )}

        {!isHost && (
          <p className="text-sm text-sub text-center py-2">
            Waiting for host to start rematch...
          </p>
        )}

        {onLeave && (
          <Button
            variant="outline"
            size="lg"
            onClick={onLeave}
            disabled={isLoading}
            className="min-w-[160px]"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Leave Room
          </Button>
        )}
      </div>
    </div>
  );
});

/* ============================================
   PODIUM POSITION
   Individual podium display
   ============================================ */

interface PodiumPositionProps {
  player: RaceResult;
  position: 1 | 2 | 3;
  height: string;
  medalColor: string;
  bgColor: string;
}

const PodiumPosition = React.memo(function PodiumPosition({
  player,
  position,
  height,
  medalColor,
  bgColor,
}: PodiumPositionProps) {
  const positionIcons = {
    1: <Crown className="w-8 h-8" />,
    2: <Medal className="w-7 h-7" />,
    3: <Medal className="w-6 h-6" />,
  };

  return (
    <div className="flex flex-col items-center">
      {/* Player info */}
      <div className="flex flex-col items-center mb-2">
        {/* Avatar */}
        <Avatar
          src={player.avatarUrl}
          alt={player.username}
          fallback={player.username.charAt(0)}
          size="xl"
          bordered
          className={cn(
            "mb-2 ring-4 transition-all duration-125",
            position === 1 ? "ring-main" : "ring-sub"
          )}
        />

        {/* Username */}
        <span
          className={cn(
            "font-medium text-sm max-w-[100px] truncate",
            player.isCurrentUser ? "text-main" : "text-text"
          )}
        >
          {player.username}
        </span>

        {/* WPM */}
        <span className="text-xs text-sub">{player.wpm} WPM</span>
      </div>

      {/* Podium block */}
      <div
        className={cn(
          "flex flex-col items-center justify-center w-24 rounded-t-lg transition-all duration-125",
          height,
          bgColor
        )}
      >
        <span className={medalColor}>{positionIcons[position]}</span>
        <span className={cn("font-bold text-lg", medalColor)}>
          {getOrdinal(position)}
        </span>
      </div>
    </div>
  );
});

/* ============================================
   RESULT ROW
   Individual result in the table
   ============================================ */

interface ResultRowProps {
  result: RaceResult;
}

const ResultRow = React.memo(function ResultRow({ result }: ResultRowProps) {
  const getPositionBadge = (position: number) => {
    const badges: Record<number, { variant: "default" | "secondary" | "outline"; className: string }> = {
      1: { variant: "default", className: "bg-main/10 text-main" },
      2: { variant: "secondary", className: "bg-sub-alt text-text" },
      3: { variant: "secondary", className: "bg-sub-alt text-text" },
    };

    const badge = badges[position] || { variant: "outline" as const, className: "" };

    return (
      <Badge variant={badge.variant} className={cn("w-8 justify-center transition-all duration-125", badge.className)}>
        {position}
      </Badge>
    );
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg transition-all duration-125",
        result.isCurrentUser
          ? "bg-main/10 border border-main/20"
          : "bg-sub-alt/30 hover:bg-sub-alt/50"
      )}
    >
      {/* Position */}
      {getPositionBadge(result.finishPosition)}

      {/* Avatar */}
      <Avatar
        src={result.avatarUrl}
        alt={result.username}
        fallback={result.username.charAt(0)}
        size="sm"
        bordered
        className="flex-shrink-0"
      />

      {/* Username */}
      <div className="flex-1 min-w-0">
        <span
          className={cn(
            "font-medium truncate",
            result.isCurrentUser ? "text-main" : "text-text"
          )}
        >
          {result.username}
        </span>
        {result.isCurrentUser && (
          <Badge variant="outline" size="sm" className="ml-2">
            You
          </Badge>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 flex-shrink-0">
        <div className="flex items-center gap-1 text-sm">
          <Zap className="w-4 h-4 text-main" />
          <span className="font-mono text-text">{result.wpm}</span>
          <span className="text-sub text-xs">wpm</span>
        </div>
        <div className="flex items-center gap-1 text-sm">
          <Target className="w-4 h-4 text-main" />
          <span className="font-mono text-text">{result.accuracy}%</span>
          <span className="text-sub text-xs">acc</span>
        </div>
      </div>
    </div>
  );
});

// Helper function to get ordinal suffix
function getOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export default RaceResults;
