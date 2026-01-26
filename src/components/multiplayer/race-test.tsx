"use client";

import * as React from "react";
import { useEffect, useCallback, useRef, useState, memo } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { PlayerProgressList } from "./player-progress";
import { WordDisplay } from "@/components/typing/word-display";
import { useTypingStore } from "@/store/typing-store";
import { useConfigStore } from "@/store/config-store";
import { generateWords } from "@/lib/utils/word-generator";

/* ============================================
   RACE TEST COMPONENT
   Main racing component for multiplayer mode
   ============================================ */

export interface RacePlayer {
  playerId: string;
  username: string;
  avatarUrl?: string | null;
  progress: number;
  wpm: number;
  finishPosition?: number | null;
  isCurrentUser?: boolean;
}

export interface RaceTestProps {
  /** Room ID for Supabase channel */
  roomId: string;
  /** Current user's ID */
  currentUserId: string;
  /** Current user's username */
  currentUsername: string;
  /** Current user's avatar URL */
  currentAvatarUrl?: string | null;
  /** Words to type (shared across all players) */
  words: string[];
  /** Time limit in seconds (0 for no limit) */
  timeLimit?: number;
  /** Initial list of players in the race */
  initialPlayers: RacePlayer[];
  /** Callback when race finishes for current user */
  onFinish?: (results: {
    wpm: number;
    accuracy: number;
    finishPosition: number;
  }) => void;
  /** Callback when all players finish */
  onRaceComplete?: (finalResults: RacePlayer[]) => void;
  /** Additional class names */
  className?: string;
}

// Progress broadcast interval in ms
const BROADCAST_INTERVAL = 100;

export const RaceTest = memo(function RaceTest({
  roomId,
  currentUserId,
  currentUsername,
  currentAvatarUrl,
  words,
  timeLimit = 0,
  initialPlayers,
  onFinish,
  onRaceComplete,
  className,
}: RaceTestProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [players, setPlayers] = useState<RacePlayer[]>(initialPlayers);
  const [finishOrder, setFinishOrder] = useState<string[]>([]);
  const [hasFinished, setHasFinished] = useState(false);
  const lastBroadcast = useRef<number>(0);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  // Typing store state
  const status = useTypingStore((state) => state.status);
  const stats = useTypingStore((state) => state.stats);
  const timeElapsed = useTypingStore((state) => state.timeElapsed);
  const currentWordIndex = useTypingStore((state) => state.currentWordIndex);
  const currentCharIndex = useTypingStore((state) => state.currentCharIndex);
  const initializeTest = useTypingStore((state) => state.initializeTest);
  const handleKeyPress = useTypingStore((state) => state.handleKeyPress);
  const handleBackspace = useTypingStore((state) => state.handleBackspace);
  const handleSpace = useTypingStore((state) => state.handleSpace);

  // Config store state
  const showAllLines = useConfigStore((state) => state.visual.showAllLines);

  // Calculate current progress (0-100)
  const calculateProgress = useCallback(() => {
    const totalChars = words.join(" ").length;
    const charsTyped = words.slice(0, currentWordIndex).join(" ").length + currentCharIndex;
    return Math.min(100, (charsTyped / totalChars) * 100);
  }, [words, currentWordIndex, currentCharIndex]);

  // Initialize the test
  useEffect(() => {
    queueMicrotask(() => setIsMounted(true));
    initializeTest(words, timeLimit, timeLimit > 0 ? "time" : "words", words.length);
  }, [words, timeLimit, initializeTest]);

  // Set up Supabase Realtime channel
  useEffect(() => {
    if (!isMounted) return;

    const supabase = createClient();
    const channel = supabase.channel(`race:${roomId}`, {
      config: {
        broadcast: {
          self: false,
        },
      },
    });

    // Subscribe to progress updates from other players
    channel
      .on("broadcast", { event: "progress" }, ({ payload }) => {
        const { playerId, progress, wpm, finished, finishPosition } = payload;

        setPlayers((prev) =>
          prev.map((player) =>
            player.playerId === playerId
              ? { ...player, progress, wpm, finishPosition: finished ? finishPosition : null }
              : player
          )
        );

        // Track finish order
        if (finished && !finishOrder.includes(playerId)) {
          setFinishOrder((prev) => [...prev, playerId]);
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [roomId, isMounted, finishOrder]);

  // Broadcast own progress periodically
  useEffect(() => {
    if (!isMounted || status !== "running" || hasFinished) return;

    const broadcastProgress = () => {
      const now = Date.now();
      if (now - lastBroadcast.current < BROADCAST_INTERVAL) return;

      const progress = calculateProgress();
      const channel = channelRef.current;

      if (channel) {
        channel.send({
          type: "broadcast",
          event: "progress",
          payload: {
            playerId: currentUserId,
            progress,
            wpm: stats.wpm,
            finished: false,
          },
        });
      }

      // Update own progress in players list
      setPlayers((prev) =>
        prev.map((player) =>
          player.isCurrentUser
            ? { ...player, progress, wpm: stats.wpm }
            : player
        )
      );

      lastBroadcast.current = now;
    };

    const interval = setInterval(broadcastProgress, BROADCAST_INTERVAL);
    return () => clearInterval(interval);
  }, [
    isMounted,
    status,
    hasFinished,
    calculateProgress,
    currentUserId,
    stats.wpm,
  ]);

  // Handle test completion
  useEffect(() => {
    if (status === "finished" && !hasFinished) {
      queueMicrotask(() => setHasFinished(true));

      const finishPosition = finishOrder.length + 1;
      const progress = 100;

      // Broadcast completion
      const channel = channelRef.current;
      if (channel) {
        channel.send({
          type: "broadcast",
          event: "progress",
          payload: {
            playerId: currentUserId,
            progress,
            wpm: stats.wpm,
            finished: true,
            finishPosition,
          },
        });
      }

      // Update own player state
      queueMicrotask(() =>
        setPlayers((prev) =>
          prev.map((player) =>
            player.isCurrentUser
              ? { ...player, progress, wpm: stats.wpm, finishPosition }
              : player
          )
        )
      );

      // Callback
      onFinish?.({
        wpm: stats.wpm,
        accuracy: stats.accuracy,
        finishPosition,
      });
    }
  }, [
    status,
    hasFinished,
    finishOrder,
    currentUserId,
    stats.wpm,
    stats.accuracy,
    onFinish,
  ]);

  // Check if all players finished
  useEffect(() => {
    const allFinished = players.every(
      (p) => p.finishPosition !== null && p.finishPosition !== undefined
    );
    if (allFinished && players.length > 0 && hasFinished) {
      onRaceComplete?.(players);
    }
  }, [players, hasFinished, onRaceComplete]);

  // Handle keyboard input
  useEffect(() => {
    if (!isMounted) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if typing in an input field
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // Don't process input if test is finished
      if (status === "finished") {
        return;
      }

      // Handle backspace
      if (event.key === "Backspace") {
        event.preventDefault();
        handleBackspace();
        return;
      }

      // Handle space
      if (event.key === " ") {
        event.preventDefault();
        handleSpace();
        return;
      }

      // Handle printable characters
      if (
        event.key.length === 1 &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        event.preventDefault();
        handleKeyPress(event.key);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMounted, status, handleKeyPress, handleBackspace, handleSpace]);

  // Ensure current user is in the players list
  const playersWithCurrentUser = React.useMemo(() => {
    const hasCurrentUser = players.some((p) => p.playerId === currentUserId);
    if (hasCurrentUser) return players;

    return [
      ...players,
      {
        playerId: currentUserId,
        username: currentUsername,
        avatarUrl: currentAvatarUrl,
        progress: 0,
        wpm: 0,
        finishPosition: null,
        isCurrentUser: true,
      },
    ];
  }, [players, currentUserId, currentUsername, currentAvatarUrl]);

  const isActive = status === "running";
  const isFinished = status === "finished";

  return (
    <div className={cn("w-full max-w-4xl mx-auto space-y-6", className)}>
      {/* Player Progress Bars */}
      <div className="bg-sub-alt/30 rounded-xl p-4">
        <PlayerProgressList players={playersWithCurrentUser} />
      </div>

      {/* Live Stats */}
      <div className="flex items-center justify-between text-sm text-sub">
        <div className="flex items-center gap-4">
          <span>
            <span className="text-main font-mono">{stats.wpm}</span> wpm
          </span>
          <span>
            <span className="text-main font-mono">{stats.accuracy}</span>% acc
          </span>
        </div>
        {timeLimit > 0 && (
          <div className="font-mono text-main">
            {Math.max(0, timeLimit - timeElapsed)}s
          </div>
        )}
      </div>

      {/* Word Display */}
      <div className="relative">
        <WordDisplay showAllLines={showAllLines} />

        {/* Status Overlay */}
        {!isActive && !isFinished && (
          <div className="absolute inset-0 flex items-center justify-center bg-bg/80 backdrop-blur-sm">
            <p className="text-sub text-lg animate-pulse">
              Get ready to race! Start typing when you see the words.
            </p>
          </div>
        )}

        {isFinished && (
          <div className="absolute inset-0 flex items-center justify-center bg-bg/80 backdrop-blur-sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-main mb-2">
                You finished {getOrdinal(players.find((p) => p.isCurrentUser)?.finishPosition || 0)}!
              </p>
              <p className="text-sub">
                {stats.wpm} WPM with {stats.accuracy}% accuracy
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Race Status */}
      <div className="text-center text-sm text-sub">
        {isFinished
          ? "Waiting for other players to finish..."
          : isActive
          ? "Race in progress!"
          : "Starting soon..."}
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

export default RaceTest;
