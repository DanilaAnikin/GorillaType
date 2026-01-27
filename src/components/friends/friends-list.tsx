"use client";

import * as React from "react";
import Link from "next/link";
import { UserMinus, MessageCircle, Trophy, Star, Swords } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { useUIStore } from "@/store/ui-store";
import { SendChallengeModal, type ChallengedUser } from "@/components/challenges/send-challenge-modal";
import type { Friend } from "./types";

/**
 * Props for the FriendsList component.
 */
export interface FriendsListProps {
  /** List of friends to display */
  friends: Friend[];
  /** Callback when removing a friend */
  onRemoveFriend?: (friendshipId: string) => void;
  /** Whether an action is in progress */
  isLoading?: boolean;
  /** ID of friend being removed (for loading state) */
  removingFriendId?: string | null;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Get country flag emoji from country code.
 */
function getCountryFlag(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

/**
 * FriendsList displays a list of accepted friends.
 */
export function FriendsList({
  friends,
  onRemoveFriend,
  isLoading = false,
  removingFriendId,
  className,
}: FriendsListProps) {
  const openDirectMessage = useUIStore((state) => state.openDirectMessage);
  const [creatingDMForFriend, setCreatingDMForFriend] = React.useState<string | null>(null);
  const [challengeTarget, setChallengeTarget] = React.useState<ChallengedUser | null>(null);

  // Handle starting a DM with a friend
  const handleStartDM = async (friendship: Friend) => {
    const friend = friendship.friend;
    setCreatingDMForFriend(friend.id);

    try {
      // Create or get existing DM room
      const requestBody = {
        type: "direct",
        participantId: friend.id,
      };
      console.log("[DM] Creating chat room with request:", requestBody);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log("[DM] API response:", { status: response.status, data });

      if (!response.ok) {
        const errorMessage = data.details || data.error || "Failed to create chat room";
        console.error("[DM] API error:", errorMessage);
        throw new Error(errorMessage);
      }

      if (!data.room?.id) {
        console.error("[DM] Invalid response - missing room.id:", data);
        throw new Error("Invalid response from server - missing room data");
      }

      const friendName = friend.displayName || friend.username || "Friend";
      openDirectMessage(data.room.id, friendName);
    } catch (err) {
      console.error("[DM] Error creating DM:", err);
      // Could add a notification here
    } finally {
      setCreatingDMForFriend(null);
    }
  };

  if (friends.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center p-8 rounded-lg bg-sub-alt border border-sub text-center",
          className
        )}
      >
        <div className="w-16 h-16 rounded-full bg-sub/30 flex items-center justify-center mb-4">
          <Trophy className="w-8 h-8 text-sub" />
        </div>
        <h3 className="text-lg font-medium text-text mb-2">No friends yet</h3>
        <p className="text-sub text-sm max-w-sm">
          Search for users to add as friends and start competing together!
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Challenge Modal */}
      {challengeTarget && (
        <SendChallengeModal
          isOpen={!!challengeTarget}
          onClose={() => setChallengeTarget(null)}
          challengedUser={challengeTarget}
        />
      )}

      {friends.map((friendship) => {
        const friend = friendship.friend;
        const isRemoving = removingFriendId === friendship.id;

        return (
          <div
            key={friendship.id}
            className={cn(
              "flex items-center justify-between p-4 rounded-lg bg-sub-alt border border-sub transition-all duration-125",
              "hover:border-main/50",
              isRemoving && "opacity-50"
            )}
          >
            {/* User Info */}
            <div className="flex items-center gap-3 min-w-0">
              {/* Avatar */}
              <Link href={`/profile/${friend.username}`} className="flex-shrink-0">
                <Avatar
                  src={friend.avatarUrl}
                  alt={friend.username}
                  fallback={friend.username?.charAt(0) || "?"}
                  size="lg"
                  bordered
                  className="hover:ring-main transition-all"
                />
              </Link>

              {/* Name and Stats */}
              <div className="min-w-0">
                <Link
                  href={`/profile/${friend.username}`}
                  className="font-medium text-text hover:text-main transition-colors truncate block"
                >
                  {friend.displayName || friend.username}
                </Link>
                <div className="flex items-center gap-2 text-sm text-sub">
                  <span>@{friend.username}</span>
                  {friend.country && (
                    <span>{getCountryFlag(friend.country)}</span>
                  )}
                </div>
                {friend.level && (
                  <div className="flex items-center gap-1 text-xs text-main mt-0.5">
                    <Star className="w-3 h-3" />
                    Level {friend.level}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0 ml-4">
              {/* Challenge */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setChallengeTarget({
                    id: friend.id,
                    username: friend.username,
                    avatarUrl: friend.avatarUrl,
                    displayName: friend.displayName,
                  })
                }
                disabled={isLoading}
                leftIcon={<Swords className="w-4 h-4" />}
                className="text-main hover:text-main"
                aria-label="Challenge friend"
              >
                Challenge
              </Button>

              {/* Message */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleStartDM(friendship)}
                disabled={isLoading || creatingDMForFriend === friend.id}
                loading={creatingDMForFriend === friend.id}
                leftIcon={<MessageCircle className="w-4 h-4" />}
                className="text-main hover:text-main"
                aria-label="Send message"
              >
                Message
              </Button>

              {/* View Profile */}
              <Link
                href={`/profile/${friend.username}`}
                className="inline-flex items-center justify-center h-8 px-3 text-xs rounded-md bg-transparent text-sub hover:text-text transition-all duration-125"
              >
                View Profile
              </Link>

              {/* Remove Friend */}
              {onRemoveFriend && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveFriend(friendship.id)}
                  disabled={isLoading || isRemoving}
                  loading={isRemoving}
                  leftIcon={<UserMinus className="w-4 h-4" />}
                  className="text-error hover:text-error"
                  aria-label="Remove friend"
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default FriendsList;
