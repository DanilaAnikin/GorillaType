"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlayerList, type Player, PlayerCountBadge } from "./player-list";
import {
  Copy,
  Check,
  Play,
  LogOut,
  Settings,
  Clock,
  Hash,
  Globe,
  Zap,
} from "lucide-react";

/* ============================================
   RACE LOBBY COMPONENT
   Waiting room before a multiplayer race starts
   ============================================ */

export interface RoomSettings {
  /** Test mode (time/words/quote) */
  mode: "time" | "words" | "quote";
  /** Time limit in seconds (for time mode) */
  timeLimit?: number;
  /** Word count (for words mode) */
  wordCount?: number;
  /** Language for word generation */
  language: string;
  /** Include punctuation */
  punctuation: boolean;
  /** Include numbers */
  numbers: boolean;
  /** Maximum players allowed */
  maxPlayers: number;
}

export interface RaceLobbyProps {
  /** Room code for joining */
  roomCode: string;
  /** List of players in the room */
  players: Player[];
  /** Current room settings */
  settings: RoomSettings;
  /** Whether the current user is the host */
  isHost: boolean;
  /** Whether the current user is ready */
  isReady: boolean;
  /** Whether all players are ready */
  allReady: boolean;
  /** Callback when ready button is toggled */
  onToggleReady: () => void;
  /** Callback when host starts the race */
  onStartRace: () => void;
  /** Callback when player leaves the room */
  onLeaveRoom: () => void;
  /** Callback when host kicks a player */
  onKickPlayer?: (playerId: string) => void;
  /** Callback when host changes settings */
  onChangeSettings?: () => void;
  /** Whether actions are loading */
  isLoading?: boolean;
  /** Additional class names */
  className?: string;
}

export const RaceLobby = React.memo(function RaceLobby({
  roomCode,
  players,
  settings,
  isHost,
  isReady,
  allReady,
  onToggleReady,
  onStartRace,
  onLeaveRoom,
  onKickPlayer,
  onChangeSettings,
  isLoading = false,
  className,
}: RaceLobbyProps) {
  const [copied, setCopied] = React.useState(false);

  // Copy room code to clipboard
  const handleCopyCode = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy room code:", err);
    }
  }, [roomCode]);

  // Check if can start (host, all ready, minimum players)
  const canStart = isHost && allReady && players.length >= 2;
  const notEnoughPlayers = players.length < 2;

  return (
    <div className={cn("w-full max-w-2xl mx-auto space-y-6", className)}>
      {/* Room Code Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <p className="text-sm text-sub mb-1">Room Code</p>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-mono font-bold text-main tracking-widest">
                  {roomCode}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyCode}
                  className="flex-shrink-0"
                  aria-label={copied ? "Copied!" : "Copy room code"}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-1.5 text-main" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-1.5" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>
            <PlayerCountBadge
              current={players.length}
              max={settings.maxPlayers}
            />
          </div>
        </CardContent>
      </Card>

      {/* Room Settings Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Room Settings
            </CardTitle>
            {isHost && onChangeSettings && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onChangeSettings}
                disabled={isLoading}
              >
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Mode */}
            <SettingItem
              icon={<Zap className="w-4 h-4" />}
              label="Mode"
              value={settings.mode}
            />

            {/* Time/Words */}
            {settings.mode === "time" && settings.timeLimit && (
              <SettingItem
                icon={<Clock className="w-4 h-4" />}
                label="Time"
                value={`${settings.timeLimit}s`}
              />
            )}
            {settings.mode === "words" && settings.wordCount && (
              <SettingItem
                icon={<Hash className="w-4 h-4" />}
                label="Words"
                value={`${settings.wordCount}`}
              />
            )}

            {/* Language */}
            <SettingItem
              icon={<Globe className="w-4 h-4" />}
              label="Language"
              value={settings.language}
            />

            {/* Options */}
            <div className="flex flex-wrap gap-1.5">
              {settings.punctuation && (
                <Badge variant="outline" size="sm">
                  @ punctuation
                </Badge>
              )}
              {settings.numbers && (
                <Badge variant="outline" size="sm">
                  # numbers
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Players Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Players</CardTitle>
        </CardHeader>
        <CardContent>
          <PlayerList
            players={players}
            isHost={isHost}
            onKickPlayer={onKickPlayer}
            kickDisabled={isLoading}
            showReadyStatus={true}
          />
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Ready Toggle Button */}
        {!isHost && (
          <Button
            variant={isReady ? "outline" : "default"}
            size="lg"
            onClick={onToggleReady}
            disabled={isLoading}
            className={cn(
              "flex-1 transition-all duration-125",
              isReady && "border-main text-main hover:bg-main/10"
            )}
          >
            {isReady ? (
              <>
                <Check className="w-5 h-5 mr-2" />
                Ready
              </>
            ) : (
              "Ready Up"
            )}
          </Button>
        )}

        {/* Start Race Button (Host only) */}
        {isHost && (
          <Button
            variant="default"
            size="lg"
            onClick={onStartRace}
            disabled={!canStart || isLoading}
            loading={isLoading}
            className="flex-1"
          >
            <Play className="w-5 h-5 mr-2" />
            {notEnoughPlayers
              ? "Need more players"
              : !allReady
              ? "Waiting for players"
              : "Start Race"}
          </Button>
        )}

        {/* Leave Room Button */}
        <Button
          variant="ghost"
          size="lg"
          onClick={onLeaveRoom}
          disabled={isLoading}
          className="text-error hover:text-error hover:bg-error/10"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Leave
        </Button>
      </div>

      {/* Status message */}
      {!canStart && isHost && (
        <p className="text-center text-sm text-sub">
          {notEnoughPlayers
            ? "Waiting for at least 2 players to join..."
            : "Waiting for all players to ready up..."}
        </p>
      )}
    </div>
  );
});

/* ============================================
   SETTING ITEM
   Individual setting display
   ============================================ */

interface SettingItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

const SettingItem = React.memo(function SettingItem({
  icon,
  label,
  value,
}: SettingItemProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-sub">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <span className="text-sm font-medium text-text capitalize">{value}</span>
    </div>
  );
});

export default RaceLobby;
