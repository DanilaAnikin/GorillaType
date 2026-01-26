// Type definitions barrel export

// Test types
export type {
  TestMode,
  QuoteLength,
  Difficulty,
  TestConfig,
  CharacterStatus,
  CharacterState,
  WordState,
  TestStatus,
  TestState,
  TestResult,
} from './test';

// User types
export type {
  Profile,
  UserConfig,
  PersonalBest,
  Achievement,
  UserAchievement,
  Friendship,
  FriendshipWithProfile,
} from './user';

// Config types
export type {
  ThemeColors,
  ThemeConfig,
  CaretStyle,
  CaretConfig,
  SoundPack,
  SoundConfig,
  FontConfig,
  LayoutConfig,
  AppConfig,
} from './config';

// Database types
export type {
  Tables,
  ProfileRow,
  UserConfigRow,
  TestResultRow,
  PersonalBestRow,
  AchievementRow,
  UserAchievementRow,
  FriendshipRow,
  LeaderboardEntryRow,
  QuoteRow,
  ThemeRow,
  LanguageRow,
  WordListRow,
  Database,
  TableRow,
  DbResult,
  DbResultOk,
} from './database';
