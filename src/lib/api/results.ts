import { TestResult as TypesTestResult } from '@/types/test';
import { TestResult as StoreTestResult } from '@/store/results-store';

// API response types
export interface SaveResultResponse {
  result?: TypesTestResult;
  isPb: boolean;
  message?: string;
  error?: string;
  reason?: string;
}

export interface GetResultsResponse {
  results: TypesTestResult[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: string;
}

export interface ApiError {
  error: string;
  reason?: string;
}

/**
 * Save a test result to the API
 * Requires user to be authenticated
 */
export async function saveResult(result: StoreTestResult): Promise<SaveResultResponse> {
  try {
    // Transform store result format to API format
    const apiResult = {
      mode: result.mode,
      timeLimit: result.mode === 'time' ? result.duration : null,
      wordLimit: result.mode === 'words' ? result.duration : null,
      quoteId: result.quoteId || null,
      language: result.language,
      punctuation: result.punctuation,
      numbers: result.numbers,
      wpm: result.wpm,
      rawWpm: result.rawWpm,
      accuracy: result.accuracy,
      consistency: result.consistency,
      totalCharacters: result.totalChars,
      correctCharacters: result.correctChars,
      incorrectCharacters: result.incorrectChars,
      extraCharacters: result.extraChars,
      missedCharacters: result.missedChars,
      duration: result.testDuration,
      wpmHistory: result.wpmHistory.map((s) => s.wpm),
      rawWpmHistory: result.wpmHistory.map((s) => s.raw),
      accuracyHistory: [], // TODO: track accuracy history
    };

    const response = await fetch('/api/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apiResult),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        isPb: false,
        error: data.error || `Failed to save result (${response.status})`,
        reason: data.reason,
      };
    }

    return {
      result: data.result,
      isPb: data.isPb || false,
      message: data.message,
    };
  } catch (error) {
    console.error('Error saving result to API:', error);
    return {
      isPb: false,
      error: error instanceof Error ? error.message : 'Network error occurred',
    };
  }
}

/**
 * Get test results from the API
 * Requires user to be authenticated
 */
export async function getResults(options?: {
  page?: number;
  limit?: number;
  mode?: string;
  language?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<GetResultsResponse> {
  try {
    const params = new URLSearchParams();
    if (options?.page) params.set('page', String(options.page));
    if (options?.limit) params.set('limit', String(options.limit));
    if (options?.mode) params.set('mode', options.mode);
    if (options?.language) params.set('language', options.language);
    if (options?.sortBy) params.set('sortBy', options.sortBy);
    if (options?.sortOrder) params.set('sortOrder', options.sortOrder);

    const response = await fetch(`/api/results?${params}`);
    const data = await response.json();

    if (!response.ok) {
      return {
        results: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        error: data.error || `Failed to fetch results (${response.status})`,
      };
    }

    return data;
  } catch (error) {
    console.error('Error fetching results from API:', error);
    return {
      results: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      error: error instanceof Error ? error.message : 'Network error occurred',
    };
  }
}

/**
 * Sync multiple pending results to the API
 * Used for batch syncing when user logs in
 */
export async function syncResults(results: StoreTestResult[]): Promise<{
  synced: string[];
  failed: string[];
  errors: Record<string, string>;
}> {
  const synced: string[] = [];
  const failed: string[] = [];
  const errors: Record<string, string> = {};

  for (const result of results) {
    const response = await saveResult(result);

    if (response.error) {
      failed.push(result.id);
      errors[result.id] = response.error;
    } else {
      synced.push(result.id);
    }
  }

  return { synced, failed, errors };
}
