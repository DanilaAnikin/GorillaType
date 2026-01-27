"use client";

import * as React from "react";
import Link from "next/link";
import { Users, Trophy, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { ClanSummary } from "./types";

/**
 * Props for the ClanCard component.
 */
export interface ClanCardProps {
  /** Clan data to display */
  clan: ClanSummary;
  /** Whether this is the user's current clan */
  isUserClan?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * ClanCard displays a clan summary for list views.
 */
export function ClanCard({
  clan,
  isUserClan = false,
  className,
}: ClanCardProps) {
  return (
    <Link
      href={`/clans/${clan.id}`}
      className={cn(
        "flex items-center justify-between p-4 rounded-lg bg-sub-alt border border-sub transition-all duration-125",
        "hover:border-main/50 hover:-translate-y-0.5",
        isUserClan && "ring-2 ring-main/30",
        className
      )}
    >
      {/* Clan Info */}
      <div className="flex items-center gap-4 min-w-0">
        {/* Banner/Avatar */}
        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-sub flex items-center justify-center overflow-hidden">
          {clan.bannerUrl ? (
            <img
              src={clan.bannerUrl}
              alt={clan.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Users className="w-6 h-6 text-sub" />
          )}
        </div>

        {/* Name and Tag */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-text truncate">{clan.name}</h3>
            <Badge variant="secondary" size="sm">
              [{clan.tag}]
            </Badge>
            {isUserClan && (
              <Badge variant="default" size="sm">
                Your Clan
              </Badge>
            )}
          </div>
          {clan.description && (
            <p className="text-sm text-sub truncate mt-0.5">
              {clan.description}
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6 flex-shrink-0 ml-4">
        {/* Members */}
        <div className="flex items-center gap-1.5 text-sm">
          <Users className="w-4 h-4 text-sub" />
          <span className="text-text font-medium">{clan.memberCount}</span>
          <span className="text-sub hidden sm:inline">members</span>
        </div>

        {/* Average WPM */}
        <div className="flex items-center gap-1.5 text-sm">
          <Trophy className="w-4 h-4 text-main" />
          <span className="text-text font-medium">{Math.round(clan.averageWpm)}</span>
          <span className="text-sub hidden sm:inline">avg WPM</span>
        </div>

        {/* Total Tests */}
        <div className="flex items-center gap-1.5 text-sm hidden md:flex">
          <Activity className="w-4 h-4 text-sub" />
          <span className="text-text font-medium">{clan.totalTests.toLocaleString()}</span>
          <span className="text-sub">tests</span>
        </div>
      </div>
    </Link>
  );
}

export default ClanCard;
