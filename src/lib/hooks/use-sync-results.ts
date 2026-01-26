'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useUserStore } from '@/store/user-store';
import { useResultsStore, TestResult } from '@/store/results-store';
import { saveResult, syncResults } from '@/lib/api/results';

interface SyncState {
  isSyncing: boolean;
  lastSyncAt: string | null;
  lastError: string | null;
}

interface UseSyncResultsReturn extends SyncState {
  /** Number of results pending sync */
  pendingCount: number;
  /** Sync a single result to the API */
  syncResult: (result: TestResult) => Promise<{ success: boolean; isPb: boolean; error?: string }>;
  /** Sync all pending results */
  syncAllPending: () => Promise<{ synced: number; failed: number }>;
  /** Reset error state */
  clearError: () => void;
}

/**
 * Hook for syncing test results to the API
 * Automatically syncs results when user is authenticated
 */
export function useSyncResults(): UseSyncResultsReturn {
  const [state, setState] = useState<SyncState>({
    isSyncing: false,
    lastSyncAt: null,
    lastError: null,
  });

  const syncInProgress = useRef(false);

  // Get authentication state
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);

  // Get results store actions and state
  const getPendingResults = useResultsStore((state) => state.getPendingResults);
  const markSynced = useResultsStore((state) => state.markSynced);
  const pendingSync = useResultsStore((state) => state.pendingSync);

  // Derive pending count from store (not state)
  const pendingCount = pendingSync.length;

  /**
   * Sync a single result to the API
   */
  const syncResult = useCallback(
    async (result: TestResult): Promise<{ success: boolean; isPb: boolean; error?: string }> => {
      if (!isAuthenticated) {
        return { success: false, isPb: false, error: 'Not authenticated' };
      }

      setState((prev) => ({ ...prev, isSyncing: true, lastError: null }));

      try {
        const response = await saveResult(result);

        if (response.error) {
          setState((prev) => ({
            ...prev,
            isSyncing: false,
            lastError: response.error || 'Failed to save result',
          }));
          return { success: false, isPb: false, error: response.error };
        }

        // Mark the result as synced
        markSynced([result.id]);

        setState((prev) => ({
          ...prev,
          isSyncing: false,
          lastSyncAt: new Date().toISOString(),
        }));

        return { success: true, isPb: response.isPb };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setState((prev) => ({
          ...prev,
          isSyncing: false,
          lastError: errorMessage,
        }));
        return { success: false, isPb: false, error: errorMessage };
      }
    },
    [isAuthenticated, markSynced]
  );

  /**
   * Sync all pending results to the API
   */
  const syncAllPending = useCallback(async (): Promise<{ synced: number; failed: number }> => {
    if (!isAuthenticated) {
      return { synced: 0, failed: 0 };
    }

    // Prevent concurrent sync operations
    if (syncInProgress.current) {
      return { synced: 0, failed: 0 };
    }

    syncInProgress.current = true;
    setState((prev) => ({ ...prev, isSyncing: true, lastError: null }));

    try {
      const pendingResults = getPendingResults();

      if (pendingResults.length === 0) {
        setState((prev) => ({ ...prev, isSyncing: false }));
        syncInProgress.current = false;
        return { synced: 0, failed: 0 };
      }

      const result = await syncResults(pendingResults);

      // Mark successfully synced results
      if (result.synced.length > 0) {
        markSynced(result.synced);
      }

      const hasErrors = result.failed.length > 0;
      const firstError = hasErrors ? Object.values(result.errors)[0] : null;

      setState((prev) => ({
        ...prev,
        isSyncing: false,
        lastSyncAt: new Date().toISOString(),
        lastError: firstError,
      }));

      syncInProgress.current = false;
      return { synced: result.synced.length, failed: result.failed.length };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState((prev) => ({
        ...prev,
        isSyncing: false,
        lastError: errorMessage,
      }));
      syncInProgress.current = false;
      return { synced: 0, failed: 0 };
    }
  }, [isAuthenticated, getPendingResults, markSynced]);

  /**
   * Clear the error state
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, lastError: null }));
  }, []);

  // Auto-sync pending results when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated && pendingCount > 0 && !syncInProgress.current) {
      // Debounce the sync to avoid rapid consecutive calls
      const timeoutId = setTimeout(() => {
        syncAllPending();
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [isAuthenticated, pendingCount, syncAllPending]);

  return {
    ...state,
    pendingCount,
    syncResult,
    syncAllPending,
    clearError,
  };
}

export default useSyncResults;
