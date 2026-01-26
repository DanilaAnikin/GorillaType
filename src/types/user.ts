// User-related type definitions

import type { TestMode, QuoteLength, Difficulty } from './test';

/**
 * User profile information
 */
export interface Profile {
  /** Unique user identifier */
  id: string;
  /** User's email address */
  email: string;
  /** Display name */
  username: string;
  /** Optional display name override */
  displayName: string | null;
  /** URL to avatar image */
  avatarUrl: string | null;
  /** User biography */
  bio: string | null;
  /** User's country code */
  country: string | null;
  /** User's keyboard layout */
  keyboard: string | null;
  /** GitHub profile URL */
  githubUrl: string | null;
  /** Twitter/X profile URL */
  twitterUrl: string | null;
  /** Personal website URL */
  websiteUrl: string | null;
  /** Whether profile is public */
  isPublic: boolean;
  /** Total tests completed */
  testsCompleted: number;
  /** Total time spent typing (seconds) */
  timeTyping: number;
  /** Account creation date */
  createdAt: string;
  /** Last profile update date */
  updatedAt: string;
  /** Last activity date */
  lastSeenAt: string | null;
  /** Whether email is verified */
  emailVerified: boolean;
  /** User's current streak (days) */
  streak: number;
  /** Maximum streak achieved */
  maxStreak: number;
  /** Experience points */
  xp: number;
  /** Current level */
  level: number;
}

/**
 * User configuration/preferences
 */
export interface UserConfig {
  /** User ID this config belongs to */
  userId: string;
  /** Current theme ID */
  theme: string;
  /** Custom theme colors (if custom theme) */
  customTheme: Record<string, string> | null;
  /** Default test mode */
  defaultMode: TestMode;
  /** Default time limit */
  defaultTimeLimit: number;
  /** Default word limit */
  defaultWordLimit: number;
  /** Default quote length */
  defaultQuoteLength: QuoteLength;
  /** Default language */
  defaultLanguage: string;
  /** Default difficulty */
  defaultDifficulty: Difficulty;
  /** Enable punctuation by default */
  defaultPunctuation: boolean;
  /** Enable numbers by default */
  defaultNumbers: boolean;
  /** Font family for typing */
  fontFamily: string;
  /** Font size in pixels */
  fontSize: number;
  /** Enable smooth caret */
  smoothCaret: boolean;
  /** Caret style */
  caretStyle: 'line' | 'block' | 'underline' | 'outline';
  /** Enable sound effects */
  soundEnabled: boolean;
  /** Sound effect volume (0-1) */
  soundVolume: number;
  /** Sound effect pack */
  soundPack: string;
  /** Enable keyboard sounds */
  keyboardSounds: boolean;
  /** Show live WPM */
  showLiveWpm: boolean;
  /** Show live accuracy */
  showLiveAccuracy: boolean;
  /** Show timer */
  showTimer: boolean;
  /** Show progress bar */
  showProgressBar: boolean;
  /** Flip test colors */
  flipTestColors: boolean;
  /** Colorful mode */
  colorfulMode: boolean;
  /** Enable smooth scrolling */
  smoothScrolling: boolean;
  /** Words to show ahead */
  wordsAhead: number;
  /** Highlight mode */
  highlightMode: 'letter' | 'word' | 'off';
  /** Typing freedom mode */
  freedomMode: boolean;
  /** Strict space handling */
  strictSpace: boolean;
  /** Quick restart enabled */
  quickRestart: 'off' | 'tab' | 'esc';
  /** Show key tips */
  showKeyTips: boolean;
  /** Show caps lock warning */
  capsLockWarning: boolean;
  /** Show out of focus warning */
  outOfFocusWarning: boolean;
  /** Enable confetti on personal best */
  confettiOnPb: boolean;
  /** Config last updated */
  updatedAt: string;
}

/**
 * Personal best record
 */
export interface PersonalBest {
  /** Unique identifier */
  id: string;
  /** User ID */
  userId: string;
  /** Test mode */
  mode: TestMode;
  /** Time limit (for time mode) */
  timeLimit: number | null;
  /** Word limit (for words mode) */
  wordLimit: number | null;
  /** Language */
  language: string;
  /** Punctuation enabled */
  punctuation: boolean;
  /** Numbers enabled */
  numbers: boolean;
  /** Best WPM achieved */
  wpm: number;
  /** Accuracy for this record */
  accuracy: number;
  /** Consistency for this record */
  consistency: number;
  /** Raw WPM for this record */
  rawWpm: number;
  /** Test result ID reference */
  testResultId: string;
  /** When this record was achieved */
  achievedAt: string;
}

/**
 * Achievement definition and user progress
 */
export interface Achievement {
  /** Unique identifier */
  id: string;
  /** Achievement name */
  name: string;
  /** Achievement description */
  description: string;
  /** Icon identifier */
  icon: string;
  /** Achievement category */
  category: 'speed' | 'accuracy' | 'consistency' | 'endurance' | 'special' | 'social';
  /** Rarity level */
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  /** XP reward for unlocking */
  xpReward: number;
  /** Requirement to unlock (JSON) */
  requirement: {
    type: string;
    value: number;
    conditions?: Record<string, unknown>;
  };
  /** Whether achievement is hidden until unlocked */
  hidden: boolean;
  /** Sort order */
  order: number;
}

/**
 * User's progress on an achievement
 */
export interface UserAchievement {
  /** User ID */
  userId: string;
  /** Achievement ID */
  achievementId: string;
  /** Current progress value */
  progress: number;
  /** Whether achievement is unlocked */
  unlocked: boolean;
  /** When achievement was unlocked */
  unlockedAt: string | null;
}

/**
 * Friendship between users
 */
export interface Friendship {
  /** Unique identifier */
  id: string;
  /** User who sent the request */
  requesterId: string;
  /** User who received the request */
  addresseeId: string;
  /** Friendship status */
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  /** When request was created */
  createdAt: string;
  /** When status was last updated */
  updatedAt: string;
}

/**
 * Friendship with user profile data
 */
export interface FriendshipWithProfile extends Friendship {
  /** Profile of the friend (either requester or addressee) */
  friend: Profile;
}
