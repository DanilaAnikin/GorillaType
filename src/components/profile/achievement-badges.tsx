"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/formatting";
import {
  Award,
  Zap,
  Target,
  TrendingUp,
  Calendar,
  Clock,
  Flame,
  Trophy,
  Star,
  Crown,
  Medal,
  Sparkles,
  Shield,
  Heart,
  Rocket,
  type LucideIcon
} from "lucide-react";

/**
 * Achievement category types.
 */
export type AchievementCategory = "speed" | "accuracy" | "consistency" | "dedication";

/**
 * Achievement data structure.
 */
export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  icon: string;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  unlockedAt?: Date | string;
  progress?: number; // 0-100 for locked achievements
}

/**
 * Props for the AchievementBadges component.
 */
export interface AchievementBadgesProps {
  /** Array of achievements */
  achievements: Achievement[];
  /** Whether to show locked achievements */
  showLocked?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Icon mapping for achievements.
 */
const ICON_MAP: Record<string, LucideIcon> = {
  zap: Zap,
  target: Target,
  trending: TrendingUp,
  calendar: Calendar,
  clock: Clock,
  flame: Flame,
  trophy: Trophy,
  star: Star,
  crown: Crown,
  medal: Medal,
  sparkles: Sparkles,
  shield: Shield,
  heart: Heart,
  rocket: Rocket,
  award: Award
};

/**
 * Category display configuration.
 */
const CATEGORY_CONFIG: Record<AchievementCategory, { label: string; icon: LucideIcon }> = {
  speed: { label: "Speed", icon: Zap },
  accuracy: { label: "Accuracy", icon: Target },
  consistency: { label: "Consistency", icon: TrendingUp },
  dedication: { label: "Dedication", icon: Flame }
};

/**
 * Rarity color configuration using theme colors.
 */
const RARITY_CONFIG: Record<string, { bg: string; border: string; text: string }> = {
  common: {
    bg: "bg-sub-alt",
    border: "border-sub",
    text: "text-sub"
  },
  uncommon: {
    bg: "bg-sub-alt",
    border: "border-sub",
    text: "text-text"
  },
  rare: {
    bg: "bg-sub-alt",
    border: "border-sub",
    text: "text-text"
  },
  epic: {
    bg: "bg-main/10",
    border: "border-main/50",
    text: "text-main"
  },
  legendary: {
    bg: "bg-main/10",
    border: "border-main",
    text: "text-main"
  }
};

/**
 * Individual achievement badge component.
 */
interface BadgeProps {
  achievement: Achievement;
  onClick?: () => void;
}

function Badge({ achievement, onClick }: BadgeProps) {
  const isUnlocked = achievement.unlockedAt !== undefined;
  const rarity = RARITY_CONFIG[achievement.rarity];
  const IconComponent = ICON_MAP[achievement.icon] || Award;

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative p-4 rounded-lg border-2 transition-all duration-125",
        "hover:scale-105 focus:outline-none focus:ring-2 focus:ring-sub",
        isUnlocked
          ? cn(rarity.bg, rarity.border)
          : "bg-sub-alt/30 border-sub/30 opacity-50"
      )}
      aria-label={`${achievement.name}: ${achievement.description}`}
    >
      {/* Icon */}
      <div
        className={cn(
          "w-12 h-12 mx-auto mb-2 flex items-center justify-center rounded-full transition-all duration-125",
          isUnlocked ? rarity.bg : "bg-sub-alt"
        )}
      >
        <IconComponent
          className={cn(
            "w-6 h-6 transition-all duration-125",
            isUnlocked ? rarity.text : "text-sub/50"
          )}
        />
      </div>

      {/* Name */}
      <p
        className={cn(
          "text-sm font-medium text-center truncate transition-all duration-125",
          isUnlocked ? "text-text" : "text-sub"
        )}
      >
        {achievement.name}
      </p>

      {/* Progress bar for locked achievements */}
      {!isUnlocked && achievement.progress !== undefined && (
        <div className="mt-2 h-1 bg-sub/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-sub transition-all duration-125"
            style={{ width: `${achievement.progress}%` }}
          />
        </div>
      )}

      {/* Rarity indicator */}
      {isUnlocked && (
        <div
          className={cn(
            "absolute top-2 right-2 w-2 h-2 rounded-full transition-all duration-125",
            achievement.rarity === "legendary" || achievement.rarity === "epic"
              ? "bg-main"
              : "bg-sub"
          )}
        />
      )}
    </button>
  );
}

/**
 * Achievement detail tooltip/modal.
 */
interface AchievementDetailProps {
  achievement: Achievement;
  onClose: () => void;
}

function AchievementDetail({ achievement, onClose }: AchievementDetailProps) {
  const isUnlocked = achievement.unlockedAt !== undefined;
  const rarity = RARITY_CONFIG[achievement.rarity];
  const categoryConfig = CATEGORY_CONFIG[achievement.category];
  const IconComponent = ICON_MAP[achievement.icon] || Award;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className={cn(
          "bg-bg border-2 rounded-xl p-6 max-w-sm w-full transition-all duration-125",
          rarity.border
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon and Name */}
        <div className="flex items-center gap-4 mb-4">
          <div
            className={cn(
              "w-16 h-16 flex items-center justify-center rounded-full transition-all duration-125",
              rarity.bg
            )}
          >
            <IconComponent className={cn("w-8 h-8 transition-all duration-125", rarity.text)} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-text">{achievement.name}</h3>
            <p className={cn("text-sm capitalize transition-all duration-125", rarity.text)}>
              {achievement.rarity}
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="text-text mb-4">{achievement.description}</p>

        {/* Category */}
        <div className="flex items-center gap-2 mb-4">
          <categoryConfig.icon className="w-4 h-4 text-main" />
          <span className="text-sm text-main">
            {categoryConfig.label}
          </span>
        </div>

        {/* Unlock status */}
        {isUnlocked ? (
          <div className="flex items-center gap-2 text-main text-sm">
            <Award className="w-4 h-4" />
            <span>Unlocked on {formatDate(achievement.unlockedAt!)}</span>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between text-sm text-sub mb-1">
              <span>Progress</span>
              <span>{achievement.progress || 0}%</span>
            </div>
            <div className="h-2 bg-sub-alt rounded-full overflow-hidden">
              <div
                className="h-full bg-main transition-all duration-125"
                style={{ width: `${achievement.progress || 0}%` }}
              />
            </div>
          </div>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="mt-4 w-full py-2 bg-sub-alt hover:bg-sub/20 text-text text-sm font-medium rounded-lg transition-all duration-125"
        >
          Close
        </button>
      </div>
    </div>
  );
}

/**
 * AchievementBadges displays a grid of achievement badges organized by category.
 *
 * @example
 * <AchievementBadges
 *   achievements={[
 *     {
 *       id: "1",
 *       name: "Speed Demon",
 *       description: "Reach 100 WPM",
 *       category: "speed",
 *       icon: "zap",
 *       rarity: "rare",
 *       unlockedAt: new Date()
 *     }
 *   ]}
 *   showLocked={true}
 * />
 */
export function AchievementBadges({
  achievements,
  showLocked = true,
  className
}: AchievementBadgesProps) {
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | "all">("all");

  // Filter achievements
  const filteredAchievements = achievements.filter((achievement) => {
    const isUnlocked = achievement.unlockedAt !== undefined;
    if (!showLocked && !isUnlocked) return false;
    if (selectedCategory !== "all" && achievement.category !== selectedCategory) return false;
    return true;
  });

  // Sort: unlocked first, then by rarity
  const sortedAchievements = [...filteredAchievements].sort((a, b) => {
    const aUnlocked = a.unlockedAt !== undefined;
    const bUnlocked = b.unlockedAt !== undefined;
    if (aUnlocked !== bUnlocked) return aUnlocked ? -1 : 1;

    const rarityOrder = ["legendary", "epic", "rare", "uncommon", "common"];
    return rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity);
  });

  // Count unlocked achievements
  const unlockedCount = achievements.filter((a) => a.unlockedAt !== undefined).length;

  return (
    <div
      className={cn(
        "rounded-lg bg-sub-alt border border-sub p-6 transition-all duration-125",
        className
      )}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-main" />
          <h2 className="text-xl font-semibold text-text">Achievements</h2>
          <span className="text-sm text-sub">
            ({unlockedCount}/{achievements.length})
          </span>
        </div>

        {/* Category Filter */}
        <div className="flex bg-bg rounded-lg p-1 overflow-x-auto transition-all duration-125">
          <button
            onClick={() => setSelectedCategory("all")}
            className={cn(
              "px-3 py-1 text-sm rounded-md transition-all duration-125 whitespace-nowrap",
              selectedCategory === "all"
                ? "bg-sub-alt text-text"
                : "text-sub hover:text-text"
            )}
          >
            All
          </button>
          {(Object.keys(CATEGORY_CONFIG) as AchievementCategory[]).map((category) => {
            const config = CATEGORY_CONFIG[category];
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "px-3 py-1 text-sm rounded-md transition-all duration-125 whitespace-nowrap flex items-center gap-1",
                  selectedCategory === category
                    ? "bg-sub-alt text-text"
                    : "text-sub hover:text-text"
                )}
              >
                <config.icon className="w-3 h-3" />
                {config.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Achievement Grid */}
      {sortedAchievements.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {sortedAchievements.map((achievement) => (
            <Badge
              key={achievement.id}
              achievement={achievement}
              onClick={() => setSelectedAchievement(achievement)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-sub">
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No achievements found.</p>
          {selectedCategory !== "all" && (
            <button
              onClick={() => setSelectedCategory("all")}
              className="text-sm text-main hover:underline mt-2 transition-all duration-125"
            >
              Show all categories
            </button>
          )}
        </div>
      )}

      {/* Achievement Detail Modal */}
      {selectedAchievement && (
        <AchievementDetail
          achievement={selectedAchievement}
          onClose={() => setSelectedAchievement(null)}
        />
      )}
    </div>
  );
}

export default AchievementBadges;
