// Zustand stores for Gorilla Type
// Re-export all stores and their types for convenient imports

export { useTypingStore } from './typing-store';
export type {
  Word,
  WpmSnapshot,
  TestStats,
  TestStatus,
  TestState,
} from './typing-store';

export { useConfigStore } from './config-store';
export type {
  TestMode,
  TimeDuration,
  WordCount,
  QuoteLength,
  Difficulty,
  Language,
  Theme,
  FontFamily,
  FontSize,
  CaretStyle,
  SmoothCaret,
  SoundVolume,
  ClickSound,
  ErrorSound,
  TestSettings,
  VisualSettings,
  CaretSettings,
  SoundSettings,
  BehaviorSettings,
  ConfigState,
} from './config-store';

export { useUserStore, selectIsLoggedIn, selectUsername, selectDisplayName, selectAvatarUrl } from './user-store';
export type {
  User,
  UserProfile,
  UserState,
} from './user-store';

export { useResultsStore } from './results-store';
export type {
  TestResult,
  PersonalBest,
  ResultsState,
} from './results-store';

export { useUIStore, notify } from './ui-store';
export type {
  ModalType,
  ModalState,
  NotificationType,
  Notification,
  TooltipState,
  UIState,
} from './ui-store';
