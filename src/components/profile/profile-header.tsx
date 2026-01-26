"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/formatting";
import { Github, Twitter, Globe, Calendar, Star, UserPlus, Check, Loader2, UserCheck } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";

/**
 * User profile data structure.
 */
export interface UserProfile {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  country?: string;
  countryCode?: string;
  joinedAt: Date | string;
  socialLinks?: {
    github?: string;
    twitter?: string;
    website?: string;
  };
  xp: number;
  level: number;
}

/**
 * Friendship status for the profile being viewed.
 */
export type FriendshipState =
  | 'none'           // No friendship exists
  | 'pending_sent'   // Current user sent a request
  | 'pending_received' // Current user received a request
  | 'friends';       // Already friends

/**
 * Props for the ProfileHeader component.
 */
export interface ProfileHeaderProps {
  /** User profile data */
  user: UserProfile;
  /** Whether this is the current user's own profile */
  isOwnProfile?: boolean;
  /** Whether the viewer is logged in */
  isLoggedIn?: boolean;
  /** Current friendship status with this user */
  friendshipStatus?: FriendshipState;
  /** Additional CSS classes */
  className?: string;
  /** Callback when edit profile is clicked */
  onEditProfile?: () => void;
}

/**
 * Calculate XP required to reach a given level.
 * Formula: XP = 100 * (level - 1)^2
 * This is derived from the database formula: level = floor(sqrt(xp / 100)) + 1
 */
function getXPForLevel(level: number): number {
  return 100 * Math.pow(level - 1, 2);
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
 * ProfileHeader displays user avatar, name, bio, social links, and level info.
 *
 * @example
 * <ProfileHeader
 *   user={{
 *     id: "1",
 *     username: "speedtyper",
 *     displayName: "Speed Typer",
 *     avatarUrl: "/avatar.png",
 *     bio: "I love typing fast!",
 *     country: "United States",
 *     countryCode: "US",
 *     joinedAt: new Date("2024-01-15"),
 *     socialLinks: { github: "speedtyper", twitter: "speedtyper" },
 *     xp: 2500,
 *     level: 12
 *   }}
 *   isOwnProfile={true}
 * />
 */
export function ProfileHeader({
  user,
  isOwnProfile = false,
  isLoggedIn = false,
  friendshipStatus = 'none',
  className,
  onEditProfile
}: ProfileHeaderProps) {
  const [friendState, setFriendState] = useState<FriendshipState>(friendshipStatus);
  const [isAddingFriend, setIsAddingFriend] = useState(false);
  const [friendError, setFriendError] = useState<string | null>(null);

  const currentLevelXP = getXPForLevel(user.level);
  const nextLevelXP = getXPForLevel(user.level + 1);
  const xpProgress = user.xp - currentLevelXP;
  const xpNeeded = nextLevelXP - currentLevelXP;
  const progressPercent = Math.min(100, (xpProgress / xpNeeded) * 100);

  /**
   * Handle sending a friend request.
   */
  const handleAddFriend = async () => {
    setIsAddingFriend(true);
    setFriendError(null);

    try {
      const response = await fetch('/api/friends', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        setFriendError(data.error || 'Failed to send friend request');
        return;
      }

      // Update state based on the action
      if (data.action === 'accepted') {
        setFriendState('friends');
      } else {
        setFriendState('pending_sent');
      }
    } catch {
      setFriendError('Failed to send friend request');
    } finally {
      setIsAddingFriend(false);
    }
  };

  return (
    <div
      className={cn(
        "rounded-lg bg-sub-alt border border-sub p-6 transition-all duration-125",
        className
      )}
    >
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="relative">
            <Avatar
              src={user.avatarUrl}
              alt={`${user.username}'s avatar`}
              fallback={user.username.charAt(0)}
              size="2xl"
              bordered
              className="w-24 h-24 sm:w-32 sm:h-32 ring-4 ring-sub"
            />
            {/* Level badge */}
            <div className="absolute -bottom-2 -right-2 bg-main text-bg font-bold text-sm px-2 py-1 rounded-full flex items-center gap-1 transition-all duration-125">
              <Star className="w-3 h-3" />
              {user.level}
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              {/* Username and Display Name */}
              <h1 className="text-2xl sm:text-3xl font-bold text-text transition-all duration-125">
                {user.displayName || user.username}
              </h1>
              {user.displayName && (
                <p className="text-sub text-lg transition-all duration-125">@{user.username}</p>
              )}

              {/* Bio */}
              {user.bio && (
                <p className="mt-2 text-text max-w-lg transition-all duration-125">{user.bio}</p>
              )}

              {/* Meta info */}
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-sub transition-all duration-125">
                {user.countryCode && (
                  <span className="flex items-center gap-1">
                    <span className="text-lg">{getCountryFlag(user.countryCode)}</span>
                    {user.country}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Joined {formatDate(user.joinedAt)}
                </span>
              </div>

              {/* Social Links */}
              {user.socialLinks && (
                <div className="mt-3 flex items-center gap-3">
                  {user.socialLinks.github && (
                    <a
                      href={`https://github.com/${user.socialLinks.github}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sub hover:text-text transition-all duration-125"
                      aria-label="GitHub profile"
                    >
                      <Github className="w-5 h-5" />
                    </a>
                  )}
                  {user.socialLinks.twitter && (
                    <a
                      href={`https://twitter.com/${user.socialLinks.twitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sub hover:text-text transition-all duration-125"
                      aria-label="Twitter profile"
                    >
                      <Twitter className="w-5 h-5" />
                    </a>
                  )}
                  {user.socialLinks.website && (
                    <a
                      href={user.socialLinks.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sub hover:text-text transition-all duration-125"
                      aria-label="Personal website"
                    >
                      <Globe className="w-5 h-5" />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Profile Actions */}
            <div className="flex flex-col items-start sm:items-end gap-2">
              {/* Own Profile Indicator */}
              {isOwnProfile && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-main/10 text-main text-sm font-medium rounded-lg border border-main/20">
                  <Check className="w-4 h-4" />
                  This is your profile
                </span>
              )}

              {/* Edit Profile Button */}
              {isOwnProfile && onEditProfile && (
                <button
                  onClick={onEditProfile}
                  className="px-4 py-2 bg-sub-alt hover:bg-sub/20 text-text text-sm font-medium rounded-lg transition-all duration-125"
                >
                  Edit Profile
                </button>
              )}

              {/* Add Friend Button (only show if not own profile and logged in) */}
              {!isOwnProfile && isLoggedIn && (
                <div className="flex flex-col items-start sm:items-end gap-1">
                  {friendState === 'none' && (
                    <button
                      onClick={handleAddFriend}
                      disabled={isAddingFriend}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-main hover:bg-main/90 text-bg text-sm font-medium rounded-lg transition-all duration-125 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isAddingFriend ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          Add Friend
                        </>
                      )}
                    </button>
                  )}

                  {friendState === 'pending_sent' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sub-alt text-sub text-sm font-medium rounded-lg border border-sub/30">
                      <Loader2 className="w-4 h-4" />
                      Request Pending
                    </span>
                  )}

                  {friendState === 'pending_received' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-main/10 text-main text-sm font-medium rounded-lg border border-main/20">
                      <UserPlus className="w-4 h-4" />
                      Wants to be friends
                    </span>
                  )}

                  {friendState === 'friends' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-main/10 text-main text-sm font-medium rounded-lg border border-main/20">
                      <UserCheck className="w-4 h-4" />
                      Friends
                    </span>
                  )}

                  {friendError && (
                    <p className="text-xs text-error">{friendError}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* XP Progress */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-sub transition-all duration-125">
                Level {user.level}
              </span>
              <span className="text-sub transition-all duration-125">
                {xpProgress.toLocaleString()} / {xpNeeded.toLocaleString()} XP
              </span>
            </div>
            <div className="h-2 bg-sub-alt rounded-full overflow-hidden transition-all duration-125">
              <div
                className="h-full bg-main transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-sub mt-1 transition-all duration-125">
              Total XP: {user.xp.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileHeader;
