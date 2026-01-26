"use client";

import * as React from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { AddFriendButton } from "./add-friend-button";
import { Avatar } from "@/components/ui/avatar";
import type { SearchUser } from "./types";

/**
 * Props for the UserSearchCard component.
 */
export interface UserSearchCardProps {
  /** User data to display */
  user: SearchUser;
  /** Whether this user is the current user (hide add button) */
  isCurrentUser?: boolean;
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
 * UserSearchCard displays a user from search results with add friend action.
 */
export function UserSearchCard({
  user,
  isCurrentUser = false,
  className,
}: UserSearchCardProps) {
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
        <Link href={`/profile/${user.username}`} className="flex-shrink-0">
          <Avatar
            src={user.avatarUrl}
            alt={user.username}
            fallback={user.username?.charAt(0) || "?"}
            size="md"
            bordered
            className="hover:ring-main transition-all"
          />
        </Link>

        {/* Name and Meta */}
        <div className="min-w-0">
          <Link
            href={`/profile/${user.username}`}
            className="font-medium text-text hover:text-main transition-colors truncate block"
          >
            {user.displayName || user.username}
          </Link>
          <div className="flex items-center gap-2 text-xs text-sub">
            <span>@{user.username}</span>
            {user.country && <span>{getCountryFlag(user.country)}</span>}
            {user.level && (
              <span className="flex items-center gap-0.5 text-main">
                <Star className="w-3 h-3" />
                {user.level}
              </span>
            )}
            {user.testsCompleted !== undefined && (
              <span>{user.testsCompleted} tests</span>
            )}
          </div>
        </div>
      </div>

      {/* Action */}
      {!isCurrentUser && (
        <div className="flex-shrink-0 ml-4">
          <AddFriendButton
            userId={user.id}
            username={user.username}
            compactOnMobile
          />
        </div>
      )}
    </div>
  );
}

export default UserSearchCard;
