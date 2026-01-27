/**
 * Profile components for user profile pages.
 *
 * @module components/profile
 */

export { ProfileHeader } from "./profile-header";
export type { ProfileHeaderProps, UserProfile } from "./profile-header";

export { StatsOverview } from "./stats-overview";
export type { StatsOverviewProps, UserStats } from "./stats-overview";

export { PersonalBests } from "./personal-bests";
export type { PersonalBestsProps, PersonalBestsData, PersonalBest } from "./personal-bests";

export { TestHistory } from "./test-history";
export type { TestHistoryProps, TestResult } from "./test-history";

// ActivityHeatmap is now imported directly from @/components/analytics/activity-heatmap
// by profile-extras.tsx. The profile-specific activity-heatmap.tsx is deprecated.

export { AchievementBadges } from "./achievement-badges";
export type {
  AchievementBadgesProps,
  Achievement,
  AchievementCategory
} from "./achievement-badges";

export { BadgeShowcase } from "./badge-showcase";
export type { BadgeShowcaseProps, Badge } from "./badge-showcase";

export { SocialShareCard } from "./social-share-card";
export type { SocialShareCardProps, ShareCardData } from "./social-share-card";

export { ProfileExtras } from "./profile-extras";
export type { ProfileExtrasProps } from "./profile-extras";
