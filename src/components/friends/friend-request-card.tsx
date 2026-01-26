"use client";

import * as React from "react";
import Link from "next/link";
import { Check, X, Clock, UserMinus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import type { FriendRequest } from "./types";

/**
 * Props for the FriendRequestCard component.
 */
export interface FriendRequestCardProps {
  /** The friend request data */
  request: FriendRequest;
  /** Whether this is an incoming or outgoing request */
  type: "incoming" | "outgoing";
  /** Callback when accepting a request */
  onAccept?: (friendshipId: string) => void;
  /** Callback when rejecting a request */
  onReject?: (friendshipId: string) => void;
  /** Callback when canceling a sent request */
  onCancel?: (friendshipId: string) => void;
  /** Whether an action is in progress */
  isLoading?: boolean;
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
 * Format relative time from a date string.
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

/**
 * FriendRequestCard displays a pending friend request with accept/reject actions.
 */
export function FriendRequestCard({
  request,
  type,
  onAccept,
  onReject,
  onCancel,
  isLoading = false,
  className,
}: FriendRequestCardProps) {
  const friend = request.friend;
  const isIncoming = type === "incoming";

  return (
    <div
      className={cn(
        "flex items-center justify-between p-4 rounded-lg bg-sub-alt border border-sub transition-all duration-125",
        "hover:border-main/50",
        className
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
            size="md"
            bordered
          />
        </Link>

        {/* Name and Meta */}
        <div className="min-w-0">
          <Link
            href={`/profile/${friend.username}`}
            className="font-medium text-text hover:text-main transition-colors truncate block"
          >
            {friend.displayName || friend.username}
          </Link>
          <div className="flex items-center gap-2 text-xs text-sub">
            <span>@{friend.username}</span>
            {friend.country && (
              <span>{getCountryFlag(friend.country)}</span>
            )}
            {friend.level && (
              <span className="text-main">Lv.{friend.level}</span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
        {isIncoming ? (
          <>
            {/* Accept Button */}
            <Button
              variant="active"
              size="sm"
              onClick={() => onAccept?.(request.id)}
              disabled={isLoading}
              leftIcon={<Check className="w-4 h-4" />}
              aria-label="Accept friend request"
            >
              Accept
            </Button>
            {/* Reject Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReject?.(request.id)}
              disabled={isLoading}
              leftIcon={<X className="w-4 h-4" />}
              aria-label="Reject friend request"
            >
              Decline
            </Button>
          </>
        ) : (
          <>
            {/* Pending indicator */}
            <span className="flex items-center gap-1 text-sm text-sub">
              <Clock className="w-4 h-4" />
              Pending
            </span>
            {/* Cancel Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCancel?.(request.id)}
              disabled={isLoading}
              leftIcon={<X className="w-4 h-4" />}
              aria-label="Cancel friend request"
            >
              Cancel
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default FriendRequestCard;
