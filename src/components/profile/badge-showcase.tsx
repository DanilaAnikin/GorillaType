"use client";

import { cn } from "@/lib/utils/cn";
import {
  Trophy,
  Zap,
  Target,
  Clock,
  Users,
  Crown,
  Star,
  Award,
  Flame,
  TrendingUp,
  Calendar,
  Medal,
  Sparkles,
  Shield,
  Heart,
  Rocket,
  type LucideIcon,
} from "lucide-react";

/**
 * Badge data representing an achievement with progress tracking.
 */
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: number; // 1=bronze, 2=silver, 3=gold
  isCompleted: boolean;
  progress: number;
  target: number;
  unlockedAt?: string;
}

/**
 * Props for the BadgeShowcase component.
 */
export interface BadgeShowcaseProps {
  /** Array of badges to display */
  badges: Badge[];
  /** Additional CSS classes */
  className?: string;
  /** Whether to use compact layout (icons only) */
  compact?: boolean;
}

/**
 * Tier color configuration.
 * Each tier has background, border, and text theme colors.
 */
const TIER_CONFIG: Record<number, { label: string; bgClass: string; borderClass: string; textClass: string }> = {
  1: { label: "Bronze", bgClass: "bg-[#CD7F32]/10", borderClass: "border-[#CD7F32]/60", textClass: "text-[#CD7F32]" },
  2: { label: "Silver", bgClass: "bg-[#C0C0C0]/10", borderClass: "border-[#C0C0C0]/60", textClass: "text-[#C0C0C0]" },
  3: { label: "Gold", bgClass: "bg-[#FFD700]/10", borderClass: "border-[#FFD700]/60", textClass: "text-[#FFD700]" },
};

/**
 * Icon mapping for badge icons.
 */
const ICON_MAP: Record<string, LucideIcon> = {
  trophy: Trophy,
  zap: Zap,
  target: Target,
  clock: Clock,
  users: Users,
  crown: Crown,
  star: Star,
  award: Award,
  flame: Flame,
  trending: TrendingUp,
  calendar: Calendar,
  medal: Medal,
  sparkles: Sparkles,
  shield: Shield,
  heart: Heart,
  rocket: Rocket,
};

/**
 * BadgeShowcase displays a grid of achievement badges with tier indicators
 * and progress tracking. Completed badges are shown first, followed by
 * in-progress badges with progress bars.
 *
 * @example
 * <BadgeShowcase
 *   badges={[
 *     {
 *       id: "1",
 *       name: "Speed Demon",
 *       description: "Reach 100 WPM",
 *       icon: "zap",
 *       tier: 3,
 *       isCompleted: true,
 *       progress: 100,
 *       target: 100,
 *       unlockedAt: "2024-01-15T12:00:00Z",
 *     },
 *   ]}
 * />
 */
export function BadgeShowcase({ badges, className, compact = false }: BadgeShowcaseProps) {
  const completedBadges = badges.filter((b) => b.isCompleted);
  const inProgressBadges = badges.filter((b) => !b.isCompleted);

  return (
    <div
      className={cn(
        "rounded-lg bg-sub-alt border border-sub p-6 transition-all duration-125",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-main" />
          <h2 className="text-xl font-semibold text-text">Badge Showcase</h2>
          <span className="text-sm text-sub">
            ({completedBadges.length}/{badges.length})
          </span>
        </div>
      </div>

      {/* Badges Grid */}
      {badges.length > 0 ? (
        <div
          className={cn(
            "grid gap-3",
            compact
              ? "grid-cols-4 sm:grid-cols-6 md:grid-cols-8"
              : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
          )}
        >
          {completedBadges.map((badge) => (
            <BadgeItem key={badge.id} badge={badge} compact={compact} />
          ))}
          {!compact &&
            inProgressBadges.slice(0, 4).map((badge) => (
              <BadgeItem key={badge.id} badge={badge} compact={compact} />
            ))}
        </div>
      ) : (
        <div className="text-center py-12 text-sub">
          <Award className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No badges earned yet. Keep typing to unlock achievements!</p>
        </div>
      )}
    </div>
  );
}

/**
 * Individual badge item component.
 */
function BadgeItem({ badge, compact }: { badge: Badge; compact: boolean }) {
  const tierConfig = TIER_CONFIG[badge.tier] || TIER_CONFIG[1];
  const Icon = ICON_MAP[badge.icon] || Award;
  const progressPercent = badge.target > 0 ? Math.min(100, (badge.progress / badge.target) * 100) : 0;

  return (
    <div
      className={cn(
        "relative rounded-lg border-2 p-3 transition-all duration-125 hover:scale-105",
        badge.isCompleted
          ? cn(tierConfig.bgClass, tierConfig.borderClass)
          : "bg-sub-alt/30 border-sub/30 opacity-60",
        compact ? "flex items-center justify-center" : ""
      )}
      title={`${badge.name}: ${badge.description}${
        badge.isCompleted
          ? ` (${tierConfig.label})`
          : ` (${badge.progress}/${badge.target})`
      }`}
    >
      <div className={compact ? "" : "flex flex-col items-center text-center gap-1"}>
        {/* Icon */}
        <div
          className={cn(
            "flex items-center justify-center rounded-full transition-all duration-125",
            compact ? "w-8 h-8" : "w-12 h-12 mb-1",
            badge.isCompleted ? tierConfig.bgClass : "bg-sub-alt"
          )}
        >
          <Icon
            className={cn(
              "transition-all duration-125",
              compact ? "w-4 h-4" : "w-6 h-6",
              badge.isCompleted ? tierConfig.textClass : "text-sub/50"
            )}
          />
        </div>

        {!compact && (
          <>
            {/* Name */}
            <span
              className={cn(
                "text-xs font-medium truncate w-full transition-all duration-125",
                badge.isCompleted ? "text-text" : "text-sub"
              )}
            >
              {badge.name}
            </span>

            {/* Tier label for completed badges */}
            {badge.isCompleted && (
              <span
                className={cn(
                  "text-[10px] font-medium transition-all duration-125",
                  tierConfig.textClass
                )}
              >
                {tierConfig.label}
              </span>
            )}

            {/* Progress bar for incomplete badges */}
            {!badge.isCompleted && (
              <div className="w-full mt-1">
                <div className="h-1 bg-sub/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-main transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="text-[10px] text-sub mt-0.5">
                  {badge.progress}/{badge.target}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default BadgeShowcase;
