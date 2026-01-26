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

export { ActivityHeatmap } from "./activity-heatmap";
export type { ActivityHeatmapProps, DayActivity } from "./activity-heatmap";

export { AchievementBadges } from "./achievement-badges";
export type {
  AchievementBadgesProps,
  Achievement,
  AchievementCategory
} from "./achievement-badges";
