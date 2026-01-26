"use client";

import { cn } from "@/lib/utils/cn";
import { Lock, User } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";

/**
 * Props for the PrivateProfileView component.
 */
export interface PrivateProfileViewProps {
  /** Username of the private profile */
  username: string;
  /** Avatar URL (if available) */
  avatarUrl?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * PrivateProfileView displays a message when viewing a private profile.
 * Shows only basic info (username and avatar) with a privacy notice.
 *
 * @example
 * <PrivateProfileView
 *   username="secretuser"
 *   avatarUrl="/avatar.png"
 * />
 */
export function PrivateProfileView({
  username,
  avatarUrl,
  className
}: PrivateProfileViewProps) {
  return (
    <div
      className={cn(
        "rounded-lg bg-sub-alt border border-sub p-8 transition-all duration-125",
        className
      )}
    >
      <div className="flex flex-col items-center text-center max-w-md mx-auto">
        {/* Avatar */}
        <div className="relative mb-6">
          <Avatar
            src={avatarUrl}
            alt={`${username}'s avatar`}
            fallback={username.charAt(0)}
            size="2xl"
            bordered
            className="opacity-75 ring-4 ring-sub"
          />
          {/* Lock badge */}
          <div className="absolute -bottom-1 -right-1 bg-sub text-sub-alt p-2 rounded-full border-2 border-sub-alt">
            <Lock className="w-4 h-4" />
          </div>
        </div>

        {/* Username */}
        <h1 className="text-2xl font-bold text-text mb-2">
          @{username}
        </h1>

        {/* Privacy notice */}
        <div className="flex items-center gap-2 text-sub mb-4">
          <Lock className="w-4 h-4" />
          <span>This profile is private</span>
        </div>

        {/* Description */}
        <p className="text-sub text-sm leading-relaxed">
          This user has chosen to keep their profile private.
          Their typing statistics, achievements, and test history are not visible to other users.
        </p>
      </div>
    </div>
  );
}

export default PrivateProfileView;
