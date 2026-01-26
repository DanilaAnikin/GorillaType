import { create } from 'zustand';

// Types
export interface User {
  id: string;
  email: string;
  username: string;
  createdAt: string;
  emailVerified: boolean;
}

export interface UserProfile {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  country: string | null;

  // Typing stats
  totalTests: number;
  totalTime: number; // seconds
  totalWords: number;
  totalChars: number;

  // Best scores
  bestWpm: number;
  bestAccuracy: number;
  averageWpm: number;
  averageAccuracy: number;

  // Streaks
  currentStreak: number;
  longestStreak: number;
  lastTestAt: string | null;

  // Gamification
  xp: number;
  level: number;

  // Preferences stored on server
  isPublic: boolean;
  showCountry: boolean;
  showStats: boolean;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface UserState {
  // State
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // Session
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiresAt: number | null;

  // Actions
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setTokens: (accessToken: string, refreshToken: string, expiresIn: number) => void;
  clearTokens: () => void;

  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;

  clearUser: () => void;

  updateProfile: (updates: Partial<UserProfile>) => void;
  updateUser: (updates: Partial<User>) => void;

  // Computed helpers
  isTokenExpired: () => boolean;
}

const initialState = {
  user: null,
  profile: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,
  accessToken: null,
  refreshToken: null,
  tokenExpiresAt: null,
};

export const useUserStore = create<UserState>((set, get) => ({
  ...initialState,

  // Actions
  setUser: (user) => set({
    user,
    isAuthenticated: user !== null,
    error: null,
  }),

  setProfile: (profile) => set({ profile }),

  setTokens: (accessToken, refreshToken, expiresIn) => set({
    accessToken,
    refreshToken,
    tokenExpiresAt: Date.now() + expiresIn * 1000,
  }),

  clearTokens: () => set({
    accessToken: null,
    refreshToken: null,
    tokenExpiresAt: null,
  }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  clearUser: () => set({ ...initialState }),

  updateProfile: (updates) => set((state) => ({
    profile: state.profile
      ? { ...state.profile, ...updates, updatedAt: new Date().toISOString() }
      : null,
  })),

  updateUser: (updates) => set((state) => ({
    user: state.user
      ? { ...state.user, ...updates }
      : null,
  })),

  // Computed helpers
  isTokenExpired: () => {
    const { tokenExpiresAt } = get();
    if (!tokenExpiresAt) return true;
    // Consider token expired 60 seconds before actual expiry for safety
    return Date.now() >= tokenExpiresAt - 60000;
  },
}));

// Selectors for common derived state
export const selectIsLoggedIn = (state: UserState) => state.isAuthenticated && state.user !== null;
export const selectUsername = (state: UserState) => state.user?.username ?? state.profile?.username ?? null;
export const selectDisplayName = (state: UserState) => state.profile?.displayName ?? state.user?.username ?? 'Guest';
export const selectAvatarUrl = (state: UserState) => state.profile?.avatarUrl ?? null;
