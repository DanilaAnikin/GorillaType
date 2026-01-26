"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Crown, UserX, Check, Clock } from "lucide-react";

/* ============================================
   PLAYER LIST COMPONENT
   Shows list of players in a multiplayer room
   ============================================ */

export interface Player {
  /** Player's unique ID */
  id: string;
  /** Player's display name */
  username: string;
  /** Player's avatar URL */
  avatarUrl?: string | null;
  /** Whether the player is ready */
  isReady: boolean;
  /** Whether this player is the host */
  isHost: boolean;
  /** Whether this is the current user */
  isCurrentUser?: boolean;
}

export interface PlayerListProps {
  /** Array of players in the room */
  players: Player[];
  /** Whether the current user is the host (can kick players) */
  isHost?: boolean;
  /** Callback when kick button is clicked */
  onKickPlayer?: (playerId: string) => void;
  /** Whether kick functionality is disabled */
  kickDisabled?: boolean;
  /** Show ready status indicators */
  showReadyStatus?: boolean;
  /** Additional class names */
  className?: string;
}

export const PlayerList = React.memo(function PlayerList({
  players,
  isHost = false,
  onKickPlayer,
  kickDisabled = false,
  showReadyStatus = true,
  className,
}: PlayerListProps) {
  // Sort players: host first, then by username
  const sortedPlayers = React.useMemo(() => {
    return [...players].sort((a, b) => {
      if (a.isHost && !b.isHost) return -1;
      if (!a.isHost && b.isHost) return 1;
      return a.username.localeCompare(b.username);
    });
  }, [players]);

  return (
    <div className={cn("space-y-2", className)}>
      {sortedPlayers.map((player) => (
        <PlayerListItem
          key={player.id}
          player={player}
          canKick={isHost && !player.isHost && !player.isCurrentUser}
          onKick={onKickPlayer}
          kickDisabled={kickDisabled}
          showReadyStatus={showReadyStatus}
        />
      ))}

      {players.length === 0 && (
        <div className="text-center text-sub py-8">
          <p>No players yet</p>
          <p className="text-sm mt-1">Waiting for players to join...</p>
        </div>
      )}
    </div>
  );
});

/* ============================================
   PLAYER LIST ITEM
   Individual player row in the list
   ============================================ */

interface PlayerListItemProps {
  player: Player;
  canKick: boolean;
  onKick?: (playerId: string) => void;
  kickDisabled?: boolean;
  showReadyStatus?: boolean;
}

const PlayerListItem = React.memo(function PlayerListItem({
  player,
  canKick,
  onKick,
  kickDisabled,
  showReadyStatus,
}: PlayerListItemProps) {
  const handleKick = React.useCallback(() => {
    onKick?.(player.id);
  }, [onKick, player.id]);

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg transition-all duration-125",
        player.isCurrentUser
          ? "bg-sub-alt/50 border border-main/20"
          : "bg-sub-alt/30 hover:bg-sub-alt/50"
      )}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <Avatar
          src={player.avatarUrl}
          alt={player.username}
          fallback={player.username.charAt(0)}
          size="md"
          bordered
        />
        {/* Host crown badge */}
        {player.isHost && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-main/20 rounded-full flex items-center justify-center transition-all duration-125">
            <Crown className="w-3 h-3 text-main" />
          </div>
        )}
      </div>

      {/* Player info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "font-medium truncate",
              player.isCurrentUser ? "text-main" : "text-text"
            )}
          >
            {player.username}
          </span>
          {player.isHost && (
            <Badge variant="secondary" size="sm">
              Host
            </Badge>
          )}
          {player.isCurrentUser && !player.isHost && (
            <Badge variant="outline" size="sm">
              You
            </Badge>
          )}
        </div>
      </div>

      {/* Ready status */}
      {showReadyStatus && (
        <div className="flex-shrink-0">
          {player.isReady ? (
            <div className="flex items-center gap-1.5 text-main transition-all duration-125">
              <Check className="w-4 h-4" />
              <span className="text-sm font-medium">Ready</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-sub transition-all duration-125">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Waiting</span>
            </div>
          )}
        </div>
      )}

      {/* Kick button */}
      {canKick && onKick && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleKick}
          disabled={kickDisabled}
          className="flex-shrink-0 text-error hover:text-error hover:bg-error/10"
          aria-label={`Kick ${player.username}`}
        >
          <UserX className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
});

/* ============================================
   PLAYER COUNT BADGE
   Shows current/max players count
   ============================================ */

export interface PlayerCountBadgeProps {
  /** Current number of players */
  current: number;
  /** Maximum number of players */
  max: number;
  /** Additional class names */
  className?: string;
}

export const PlayerCountBadge = React.memo(function PlayerCountBadge({
  current,
  max,
  className,
}: PlayerCountBadgeProps) {
  const isFull = current >= max;

  return (
    <Badge
      variant={isFull ? "destructive" : "secondary"}
      className={className}
    >
      {current}/{max} Players
    </Badge>
  );
});

export default PlayerList;
