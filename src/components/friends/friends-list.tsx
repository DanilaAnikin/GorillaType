"use client";

import * as React from "react";
import Link from "next/link";
import { UserMinus, MessageCircle, Trophy, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
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
