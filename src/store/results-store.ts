import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types
export interface TestResult {
  id: string;
  userId: string | null; // null for guest users

  // Test configuration
  mode: 'time' | 'words' | 'quote' | 'zen';
  duration: number; // seconds for time mode, word count for words mode
  language: string;
  punctuation: boolean;
  numbers: boolean;
  difficulty: string;

  // Results
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;

  // Character stats
  correctChars: number;
  incorrectChars: number;
  extraChars: number;
  missedChars: number;
  totalChars: number;

  // Word stats
  correctWords: number;
  incorrectWords: number;
  totalWords: number;

  // Time stats
  testDuration: number; // actual time taken
  afkTime: number;

  // History data for charts
  wpmHistory: { timestamp: number; wpm: number; raw: number; errors: number }[];

  // Metadata
  createdAt: string;
  syncedAt: string | null; // null if not synced to server

  // Quote specific
  quoteId: string | null;
}

export interface PersonalBest {
  mode: 'time' | 'words' | 'quote';
  duration: number; // 15, 30, 60, 120 for time; 10, 25, 50, 100 for words
  language: string;
  wpm: number;
  accuracy: number;
  consistency: number;
  resultId: string;
  achievedAt: string;
}

export interface ResultsState {
  // Results storage
  results: TestResult[];
  personalBests: PersonalBest[];

  // Sync state
  pendingSync: string[]; // IDs of results not yet synced
  lastSyncAt: string | null;
  isSyncing: boolean;

  // Filters/view state
  filterMode: 'all' | 'time' | 'words' | 'quote';
  filterLanguage: string | null;
  sortBy: 'date' | 'wpm' | 'accuracy';
  sortOrder: 'asc' | 'desc';

  // Actions
  addResult: (result: TestResult) => void;
  removeResult: (id: string) => void;
  clearResults: () => void;

  // Personal bests
  updatePersonalBest: (result: TestResult) => void;
  getPersonalBest: (mode: 'time' | 'words' | 'quote', duration: number, language: string) => PersonalBest | null;

  // Sync actions
  markSynced: (ids: string[]) => void;
  setIsSyncing: (isSyncing: boolean) => void;
  getPendingResults: () => TestResult[];

  // Filter actions
  setFilterMode: (mode: 'all' | 'time' | 'words' | 'quote') => void;
  setFilterLanguage: (language: string | null) => void;
  setSortBy: (sortBy: 'date' | 'wpm' | 'accuracy') => void;
  setSortOrder: (order: 'asc' | 'desc') => void;

  // Computed getters
  getFilteredResults: () => TestResult[];
  getRecentResults: (limit?: number) => TestResult[];
  getAverageWpm: (days?: number) => number;
  getAverageAccuracy: (days?: number) => number;
  getTotalTests: () => number;
  getTotalTime: () => number;
}

const MAX_LOCAL_RESULTS = 100; // Limit local storage to last 100 results

export const useResultsStore = create<ResultsState>()(
  persist(
    (set, get) => ({
      // Initial state
      results: [],
      personalBests: [],
      pendingSync: [],
      lastSyncAt: null,
      isSyncing: false,
      filterMode: 'all',
      filterLanguage: null,
      sortBy: 'date',
      sortOrder: 'desc',

      // Actions
      addResult: (result) => set((state) => {
        const newResults = [result, ...state.results].slice(0, MAX_LOCAL_RESULTS);
        const newPendingSync = result.userId
          ? [...state.pendingSync, result.id]
          : state.pendingSync;

        return {
          results: newResults,
          pendingSync: newPendingSync,
        };
      }),

      removeResult: (id) => set((state) => ({
        results: state.results.filter((r) => r.id !== id),
        pendingSync: state.pendingSync.filter((pid) => pid !== id),
      })),

      clearResults: () => set({
        results: [],
        personalBests: [],
        pendingSync: [],
      }),

      // Personal bests
      updatePersonalBest: (result) => set((state) => {
        if (result.mode === 'zen') return state; // No PBs for zen mode

        const key = `${result.mode}-${result.duration}-${result.language}`;
        const existingIndex = state.personalBests.findIndex(
          (pb) =>
            pb.mode === result.mode &&
            pb.duration === result.duration &&
            pb.language === result.language
        );

        const newPB: PersonalBest = {
          mode: result.mode as 'time' | 'words' | 'quote',
          duration: result.duration,
          language: result.language,
          wpm: result.wpm,
          accuracy: result.accuracy,
          consistency: result.consistency,
          resultId: result.id,
          achievedAt: result.createdAt,
        };

        if (existingIndex === -1) {
          // No existing PB, add new one
          return {
            personalBests: [...state.personalBests, newPB],
          };
        }

        const existing = state.personalBests[existingIndex];
        if (result.wpm > existing.wpm) {
          // New PB!
          const newPersonalBests = [...state.personalBests];
          newPersonalBests[existingIndex] = newPB;
          return { personalBests: newPersonalBests };
        }

        return state; // No change
      }),

      getPersonalBest: (mode, duration, language) => {
        const { personalBests } = get();
        return personalBests.find(
          (pb) => pb.mode === mode && pb.duration === duration && pb.language === language
        ) ?? null;
      },

      // Sync actions
      markSynced: (ids) => set((state) => ({
        pendingSync: state.pendingSync.filter((id) => !ids.includes(id)),
        lastSyncAt: new Date().toISOString(),
        results: state.results.map((r) =>
          ids.includes(r.id)
            ? { ...r, syncedAt: new Date().toISOString() }
            : r
        ),
      })),

      setIsSyncing: (isSyncing) => set({ isSyncing }),

      getPendingResults: () => {
        const { results, pendingSync } = get();
        return results.filter((r) => pendingSync.includes(r.id));
      },

      // Filter actions
      setFilterMode: (filterMode) => set({ filterMode }),
      setFilterLanguage: (filterLanguage) => set({ filterLanguage }),
      setSortBy: (sortBy) => set({ sortBy }),
      setSortOrder: (sortOrder) => set({ sortOrder }),

      // Computed getters
      getFilteredResults: () => {
        const { results, filterMode, filterLanguage, sortBy, sortOrder } = get();

        let filtered = [...results];

        // Apply mode filter
        if (filterMode !== 'all') {
          filtered = filtered.filter((r) => r.mode === filterMode);
        }

        // Apply language filter
        if (filterLanguage) {
          filtered = filtered.filter((r) => r.language === filterLanguage);
        }

        // Apply sorting
        filtered.sort((a, b) => {
          let comparison = 0;
          switch (sortBy) {
            case 'date':
              comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
              break;
            case 'wpm':
              comparison = b.wpm - a.wpm;
              break;
            case 'accuracy':
              comparison = b.accuracy - a.accuracy;
              break;
          }
          return sortOrder === 'desc' ? comparison : -comparison;
        });

        return filtered;
      },

      getRecentResults: (limit = 10) => {
        const { results } = get();
        return results.slice(0, limit);
      },

      getAverageWpm: (days) => {
        const { results } = get();
        let filtered = results;

        if (days) {
          const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
          filtered = results.filter((r) => new Date(r.createdAt).getTime() >= cutoff);
        }

        if (filtered.length === 0) return 0;
        return Math.round(filtered.reduce((sum, r) => sum + r.wpm, 0) / filtered.length);
      },

      getAverageAccuracy: (days) => {
        const { results } = get();
        let filtered = results;

        if (days) {
          const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
          filtered = results.filter((r) => new Date(r.createdAt).getTime() >= cutoff);
        }

        if (filtered.length === 0) return 0;
        return Math.round(filtered.reduce((sum, r) => sum + r.accuracy, 0) / filtered.length);
      },

      getTotalTests: () => get().results.length,

      getTotalTime: () => {
        const { results } = get();
        return results.reduce((sum, r) => sum + r.testDuration, 0);
      },
    }),
    {
      name: 'gorilla-type-results',
      partialize: (state) => ({
        results: state.results,
        personalBests: state.personalBests,
        pendingSync: state.pendingSync,
        lastSyncAt: state.lastSyncAt,
      }),
    }
  )
);
