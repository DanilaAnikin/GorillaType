// Supabase database type definitions

import type { TestMode, QuoteLength, Difficulty } from './test';

/**
 * Database row types
 */
export interface Tables {
  profiles: ProfileRow;
  user_configs: UserConfigRow;
  test_results: TestResultRow;
  personal_bests: PersonalBestRow;
  achievements: AchievementRow;
  user_achievements: UserAchievementRow;
  friendships: FriendshipRow;
  leaderboard_entries: LeaderboardEntryRow;
  quotes: QuoteRow;
  themes: ThemeRow;
  languages: LanguageRow;
  word_lists: WordListRow;
}

/**
 * Profile table row
 */
export interface ProfileRow {
  id: string;
  email: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  country: string | null;
  keyboard: string | null;
  github_url: string | null;
  twitter_url: string | null;
  website_url: string | null;
  is_public: boolean;
  tests_completed: number;
  time_typing: number;
  created_at: string;
  updated_at: string;
  last_seen_at: string | null;
  email_verified: boolean;
  streak: number;
  max_streak: number;
  xp: number;
  level: number;
}

/**
 * User config table row
 */
export interface UserConfigRow {
  user_id: string;
  theme: string;
  custom_theme: Record<string, string> | null;
  default_mode: TestMode;
  default_time_limit: number;
  default_word_limit: number;
  default_quote_length: QuoteLength;
  default_language: string;
  default_difficulty: Difficulty;
  default_punctuation: boolean;
  default_numbers: boolean;
  font_family: string;
  font_size: number;
  smooth_caret: boolean;
  caret_style: 'line' | 'block' | 'underline' | 'outline';
  sound_enabled: boolean;
  sound_volume: number;
  sound_pack: string;
  keyboard_sounds: boolean;
  show_live_wpm: boolean;
  show_live_accuracy: boolean;
  show_timer: boolean;
  show_progress_bar: boolean;
  flip_test_colors: boolean;
  colorful_mode: boolean;
  smooth_scrolling: boolean;
  words_ahead: number;
  highlight_mode: 'letter' | 'word' | 'off';
  freedom_mode: boolean;
  strict_space: boolean;
  quick_restart: 'off' | 'tab' | 'esc';
  show_key_tips: boolean;
  caps_lock_warning: boolean;
  out_of_focus_warning: boolean;
  confetti_on_pb: boolean;
  updated_at: string;
}

/**
 * Test result table row
 */
export interface TestResultRow {
  id: string;
  user_id: string;
  mode: TestMode;
  time_limit: number | null;
  word_limit: number | null;
  quote_id: string | null;
  language: string;
  punctuation: boolean;
  numbers: boolean;
  wpm: number;
  raw_wpm: number;
  accuracy: number;
  consistency: number;
  total_characters: number;
  correct_characters: number;
  incorrect_characters: number;
  extra_characters: number;
  missed_characters: number;
  duration: number;
  wpm_history: number[];
  raw_wpm_history: number[];
  accuracy_history: number[];
  completed_at: string;
  created_at: string;
}

/**
 * Personal best table row
 * Matches the personal_bests table schema in the database
 */
export interface PersonalBestRow {
  id: string;
  user_id: string;
  result_id: string;
  test_mode: TestMode;
  test_duration: number | null;
  test_word_count: number | null;
  test_language: string;
  punctuation_enabled: boolean;
  numbers_enabled: boolean;
  wpm: number;
  accuracy: number;
  achieved_at: string;
  created_at: string;
  updated_at: string;
}

/**
 * Achievement table row
 */
export interface AchievementRow {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'speed' | 'accuracy' | 'consistency' | 'endurance' | 'special' | 'social';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  xp_reward: number;
  requirement: {
    type: string;
    value: number;
    conditions?: Record<string, unknown>;
  };
  hidden: boolean;
  sort_order: number;
}

/**
 * User achievement table row
 */
export interface UserAchievementRow {
  user_id: string;
  achievement_id: string;
  progress: number;
  unlocked: boolean;
  unlocked_at: string | null;
}

/**
 * Friendship table row
 */
export interface FriendshipRow {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  created_at: string;
  updated_at: string;
}

/**
 * Leaderboard entry table row
 */
export interface LeaderboardEntryRow {
  id: string;
  user_id: string;
  mode: TestMode;
  time_limit: number | null;
  word_limit: number | null;
  language: string;
  punctuation: boolean;
  numbers: boolean;
  wpm: number;
  accuracy: number;
  consistency: number;
  rank: number;
  test_result_id: string;
  period: 'all_time' | 'daily' | 'weekly' | 'monthly';
  period_start: string;
  updated_at: string;
}

/**
 * Quote table row
 */
export interface QuoteRow {
  id: string;
  text: string;
  source: string;
  author: string | null;
  length: QuoteLength;
  language: string;
  character_count: number;
  word_count: number;
  difficulty: Difficulty;
  times_used: number;
  average_wpm: number | null;
  created_at: string;
}

/**
 * Theme table row
 */
export interface ThemeRow {
  id: string;
  name: string;
  author: string;
  description: string | null;
  colors: {
    background: string;
    text: string;
    primary: string;
    secondary: string;
    tertiary: string;
    error: string;
    extra: string;
    colorful_error: string;
    caret: string;
    caret_secondary: string;
    sub: string;
    sub_alt: string;
  };
  is_dark: boolean;
  is_custom: boolean;
  creator_id: string | null;
  tags: string[];
  preview_url: string | null;
  usage_count: number;
  created_at: string;
}

/**
 * Language table row
 */
export interface LanguageRow {
  id: string;
  name: string;
  code: string;
  native_name: string;
  flag_emoji: string;
  word_count: number;
  supports_punctuation: boolean;
  supports_numbers: boolean;
  is_rtl: boolean;
  created_at: string;
}

/**
 * Word list table row
 */
export interface WordListRow {
  id: string;
  language_id: string;
  name: string;
  description: string | null;
  words: string[];
  difficulty: Difficulty;
  word_count: number;
  created_at: string;
}

/**
 * Supabase Database type definition
 */
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Omit<ProfileRow, 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<ProfileRow>;
      };
      user_configs: {
        Row: UserConfigRow;
        Insert: Omit<UserConfigRow, 'updated_at'> & { updated_at?: string };
        Update: Partial<UserConfigRow>;
      };
      test_results: {
        Row: TestResultRow;
        Insert: Omit<TestResultRow, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<TestResultRow>;
      };
      personal_bests: {
        Row: PersonalBestRow;
        Insert: Omit<PersonalBestRow, 'id'> & { id?: string };
        Update: Partial<PersonalBestRow>;
      };
      achievements: {
        Row: AchievementRow;
        Insert: AchievementRow;
        Update: Partial<AchievementRow>;
      };
      user_achievements: {
        Row: UserAchievementRow;
        Insert: UserAchievementRow;
        Update: Partial<UserAchievementRow>;
      };
      friendships: {
        Row: FriendshipRow;
        Insert: Omit<FriendshipRow, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<FriendshipRow>;
      };
      leaderboard_entries: {
        Row: LeaderboardEntryRow;
        Insert: Omit<LeaderboardEntryRow, 'id' | 'updated_at'> & {
          id?: string;
          updated_at?: string;
        };
        Update: Partial<LeaderboardEntryRow>;
      };
      quotes: {
        Row: QuoteRow;
        Insert: Omit<QuoteRow, 'id' | 'created_at' | 'times_used'> & {
          id?: string;
          created_at?: string;
          times_used?: number;
        };
        Update: Partial<QuoteRow>;
      };
      themes: {
        Row: ThemeRow;
        Insert: Omit<ThemeRow, 'id' | 'created_at' | 'usage_count'> & {
          id?: string;
          created_at?: string;
          usage_count?: number;
        };
        Update: Partial<ThemeRow>;
      };
      languages: {
        Row: LanguageRow;
        Insert: Omit<LanguageRow, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<LanguageRow>;
      };
      word_lists: {
        Row: WordListRow;
        Insert: Omit<WordListRow, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<WordListRow>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      test_mode: TestMode;
      quote_length: QuoteLength;
      difficulty: Difficulty;
      friendship_status: 'pending' | 'accepted' | 'declined' | 'blocked';
      achievement_category: 'speed' | 'accuracy' | 'consistency' | 'endurance' | 'special' | 'social';
      achievement_rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
      leaderboard_period: 'all_time' | 'daily' | 'weekly' | 'monthly';
    };
  };
}

/**
 * Helper type to get row type from table name
 */
export type TableRow<T extends keyof Tables> = Tables[T];

/**
 * Helper type for Supabase query responses
 */
export type DbResult<T> = T extends PromiseLike<infer U> ? U : never;

/**
 * Helper type for Supabase query data
 */
export type DbResultOk<T> = T extends PromiseLike<{ data: infer U }> ? Exclude<U, null> : never;
