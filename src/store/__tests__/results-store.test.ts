import { describe, it, expect, beforeEach } from 'vitest'
import { useResultsStore, type TestResult } from '@/store/results-store'

function createMockResult(overrides: Partial<TestResult> = {}): TestResult {
  return {
    id: `test-${Date.now()}-${Math.random()}`,
    userId: null,
    mode: 'time',
    duration: 30,
    language: 'english',
    punctuation: false,
    numbers: false,
    difficulty: 'normal',
    wpm: 60,
    rawWpm: 65,
    accuracy: 95,
    consistency: 85,
    correctChars: 250,
    incorrectChars: 10,
    extraChars: 2,
    missedChars: 3,
    totalChars: 265,
    correctWords: 48,
    incorrectWords: 2,
    totalWords: 50,
    testDuration: 30,
    afkTime: 0,
    wpmHistory: [],
    createdAt: new Date().toISOString(),
    syncedAt: null,
    quoteId: null,
    ...overrides,
  }
}

describe('Results Store', () => {
  beforeEach(() => {
    // Clear all results
    useResultsStore.getState().clearResults()
    useResultsStore.getState().resetWeakspotData()
    useResultsStore.getState().setFilterMode('all')
    useResultsStore.getState().setFilterLanguage(null)
    useResultsStore.getState().setSortBy('date')
    useResultsStore.getState().setSortOrder('desc')
  })

  // ===========================================================================
  // Initial state
  // ===========================================================================
  describe('initial state', () => {
    it('should have empty results', () => {
      expect(useResultsStore.getState().results).toEqual([])
    })

    it('should have empty personal bests', () => {
      expect(useResultsStore.getState().personalBests).toEqual([])
    })

    it('should have empty weakspot data', () => {
      expect(useResultsStore.getState().weakspotData).toEqual({})
    })

    it('should have empty pending sync', () => {
      expect(useResultsStore.getState().pendingSync).toEqual([])
    })

    it('should have default filter settings', () => {
      const state = useResultsStore.getState()
      expect(state.filterMode).toBe('all')
      expect(state.filterLanguage).toBeNull()
      expect(state.sortBy).toBe('date')
      expect(state.sortOrder).toBe('desc')
    })
  })

  // ===========================================================================
  // addResult
  // ===========================================================================
  describe('addResult', () => {
    it('should add a result to the store', () => {
      const result = createMockResult()
      useResultsStore.getState().addResult(result)

      expect(useResultsStore.getState().results).toHaveLength(1)
      expect(useResultsStore.getState().results[0].id).toBe(result.id)
    })

    it('should prepend new results (most recent first)', () => {
      const first = createMockResult({ id: 'first' })
      const second = createMockResult({ id: 'second' })

      useResultsStore.getState().addResult(first)
      useResultsStore.getState().addResult(second)

      expect(useResultsStore.getState().results[0].id).toBe('second')
      expect(useResultsStore.getState().results[1].id).toBe('first')
    })

    it('should limit results to 100', () => {
      for (let i = 0; i < 105; i++) {
        useResultsStore.getState().addResult(createMockResult({ id: `result-${i}` }))
      }

      expect(useResultsStore.getState().results).toHaveLength(100)
    })

    it('should add to pendingSync when userId is present', () => {
      const result = createMockResult({ userId: 'user-123', id: 'sync-test' })
      useResultsStore.getState().addResult(result)

      expect(useResultsStore.getState().pendingSync).toContain('sync-test')
    })

    it('should not add to pendingSync for guest users', () => {
      const result = createMockResult({ userId: null })
      useResultsStore.getState().addResult(result)

      expect(useResultsStore.getState().pendingSync).toHaveLength(0)
    })
  })

  // ===========================================================================
  // removeResult
  // ===========================================================================
  describe('removeResult', () => {
    it('should remove a result by id', () => {
      const result = createMockResult({ id: 'to-remove' })
      useResultsStore.getState().addResult(result)

      useResultsStore.getState().removeResult('to-remove')
      expect(useResultsStore.getState().results).toHaveLength(0)
    })

    it('should also remove from pendingSync', () => {
      const result = createMockResult({ id: 'to-remove', userId: 'user-123' })
      useResultsStore.getState().addResult(result)

      useResultsStore.getState().removeResult('to-remove')
      expect(useResultsStore.getState().pendingSync).not.toContain('to-remove')
    })

    it('should not affect other results', () => {
      useResultsStore.getState().addResult(createMockResult({ id: 'keep' }))
      useResultsStore.getState().addResult(createMockResult({ id: 'remove' }))

      useResultsStore.getState().removeResult('remove')

      expect(useResultsStore.getState().results).toHaveLength(1)
      expect(useResultsStore.getState().results[0].id).toBe('keep')
    })
  })

  // ===========================================================================
  // clearResults
  // ===========================================================================
  describe('clearResults', () => {
    it('should remove all results', () => {
      useResultsStore.getState().addResult(createMockResult())
      useResultsStore.getState().addResult(createMockResult())

      useResultsStore.getState().clearResults()

      expect(useResultsStore.getState().results).toEqual([])
      expect(useResultsStore.getState().personalBests).toEqual([])
      expect(useResultsStore.getState().pendingSync).toEqual([])
    })
  })

  // ===========================================================================
  // Personal bests
  // ===========================================================================
  describe('personal bests', () => {
    it('should add a new personal best', () => {
      const result = createMockResult({ wpm: 80, mode: 'time', duration: 30 })
      useResultsStore.getState().updatePersonalBest(result)

      const pb = useResultsStore.getState().getPersonalBest('time', 30, 'english')
      expect(pb).not.toBeNull()
      expect(pb!.wpm).toBe(80)
    })

    it('should update personal best when new result is higher', () => {
      const first = createMockResult({ id: 'first', wpm: 60, mode: 'time', duration: 30 })
      const second = createMockResult({ id: 'second', wpm: 80, mode: 'time', duration: 30 })

      useResultsStore.getState().updatePersonalBest(first)
      useResultsStore.getState().updatePersonalBest(second)

      const pb = useResultsStore.getState().getPersonalBest('time', 30, 'english')
      expect(pb!.wpm).toBe(80)
      expect(pb!.resultId).toBe('second')
    })

    it('should not update personal best when new result is lower', () => {
      const first = createMockResult({ id: 'first', wpm: 80, mode: 'time', duration: 30 })
      const second = createMockResult({ id: 'second', wpm: 60, mode: 'time', duration: 30 })

      useResultsStore.getState().updatePersonalBest(first)
      useResultsStore.getState().updatePersonalBest(second)

      const pb = useResultsStore.getState().getPersonalBest('time', 30, 'english')
      expect(pb!.wpm).toBe(80)
      expect(pb!.resultId).toBe('first')
    })

    it('should not track personal bests for zen mode', () => {
      const result = createMockResult({ mode: 'zen', wpm: 100 })
      useResultsStore.getState().updatePersonalBest(result)

      expect(useResultsStore.getState().personalBests).toHaveLength(0)
    })

    it('should return null for non-existent personal best', () => {
      const pb = useResultsStore.getState().getPersonalBest('time', 60, 'english')
      expect(pb).toBeNull()
    })

    it('should track personal bests separately by mode/duration/language', () => {
      const time30 = createMockResult({ id: 't30', wpm: 60, mode: 'time', duration: 30 })
      const time60 = createMockResult({ id: 't60', wpm: 70, mode: 'time', duration: 60 })

      useResultsStore.getState().updatePersonalBest(time30)
      useResultsStore.getState().updatePersonalBest(time60)

      expect(useResultsStore.getState().getPersonalBest('time', 30, 'english')!.wpm).toBe(60)
      expect(useResultsStore.getState().getPersonalBest('time', 60, 'english')!.wpm).toBe(70)
    })
  })

  // ===========================================================================
  // Weakspot actions
  // ===========================================================================
  describe('weakspot actions', () => {
    it('should update weakspot data', () => {
      useResultsStore.getState().updateWeakspotData({ a: 3, b: 1 })

      expect(useResultsStore.getState().weakspotData).toEqual({ a: 3, b: 1 })
    })

    it('should accumulate weakspot data across calls', () => {
      useResultsStore.getState().updateWeakspotData({ a: 3, b: 1 })
      useResultsStore.getState().updateWeakspotData({ a: 2, c: 5 })

      expect(useResultsStore.getState().weakspotData).toEqual({ a: 5, b: 1, c: 5 })
    })

    it('should return top weakspots sorted by count', () => {
      useResultsStore.getState().updateWeakspotData({ a: 3, b: 10, c: 5, d: 1 })

      const top = useResultsStore.getState().getTopWeakspots(3)
      expect(top).toEqual(['b', 'c', 'a'])
    })

    it('should return fewer than requested if not enough data', () => {
      useResultsStore.getState().updateWeakspotData({ a: 1 })

      const top = useResultsStore.getState().getTopWeakspots(5)
      expect(top).toHaveLength(1)
      expect(top[0]).toBe('a')
    })

    it('should reset weakspot data', () => {
      useResultsStore.getState().updateWeakspotData({ a: 3 })
      useResultsStore.getState().resetWeakspotData()

      expect(useResultsStore.getState().weakspotData).toEqual({})
    })
  })

  // ===========================================================================
  // Sync actions
  // ===========================================================================
  describe('sync actions', () => {
    it('should mark results as synced', () => {
      const result = createMockResult({ id: 'sync-1', userId: 'user-1' })
      useResultsStore.getState().addResult(result)

      useResultsStore.getState().markSynced(['sync-1'])

      expect(useResultsStore.getState().pendingSync).not.toContain('sync-1')
      expect(useResultsStore.getState().lastSyncAt).not.toBeNull()
    })

    it('should update syncedAt on synced results', () => {
      const result = createMockResult({ id: 'sync-1', userId: 'user-1' })
      useResultsStore.getState().addResult(result)

      useResultsStore.getState().markSynced(['sync-1'])

      const syncedResult = useResultsStore.getState().results.find(r => r.id === 'sync-1')
      expect(syncedResult!.syncedAt).not.toBeNull()
    })

    it('should set syncing state', () => {
      useResultsStore.getState().setIsSyncing(true)
      expect(useResultsStore.getState().isSyncing).toBe(true)

      useResultsStore.getState().setIsSyncing(false)
      expect(useResultsStore.getState().isSyncing).toBe(false)
    })

    it('should return pending results', () => {
      const result = createMockResult({ id: 'pending-1', userId: 'user-1' })
      useResultsStore.getState().addResult(result)

      const pending = useResultsStore.getState().getPendingResults()
      expect(pending).toHaveLength(1)
      expect(pending[0].id).toBe('pending-1')
    })
  })

  // ===========================================================================
  // Filter actions
  // ===========================================================================
  describe('filter actions', () => {
    it('should set filter mode', () => {
      useResultsStore.getState().setFilterMode('time')
      expect(useResultsStore.getState().filterMode).toBe('time')
    })

    it('should set filter language', () => {
      useResultsStore.getState().setFilterLanguage('english')
      expect(useResultsStore.getState().filterLanguage).toBe('english')
    })

    it('should set sort by', () => {
      useResultsStore.getState().setSortBy('wpm')
      expect(useResultsStore.getState().sortBy).toBe('wpm')
    })

    it('should set sort order', () => {
      useResultsStore.getState().setSortOrder('asc')
      expect(useResultsStore.getState().sortOrder).toBe('asc')
    })
  })

  // ===========================================================================
  // Computed getters
  // ===========================================================================
  describe('computed getters', () => {
    it('should filter results by mode', () => {
      useResultsStore.getState().addResult(createMockResult({ mode: 'time' }))
      useResultsStore.getState().addResult(createMockResult({ mode: 'words' }))
      useResultsStore.getState().addResult(createMockResult({ mode: 'time' }))

      useResultsStore.getState().setFilterMode('time')
      const filtered = useResultsStore.getState().getFilteredResults()
      expect(filtered).toHaveLength(2)
      filtered.forEach(r => expect(r.mode).toBe('time'))
    })

    it('should filter results by language', () => {
      useResultsStore.getState().addResult(createMockResult({ language: 'english' }))
      useResultsStore.getState().addResult(createMockResult({ language: 'programming' }))

      useResultsStore.getState().setFilterLanguage('english')
      const filtered = useResultsStore.getState().getFilteredResults()
      expect(filtered).toHaveLength(1)
      expect(filtered[0].language).toBe('english')
    })

    it('should sort results by WPM descending', () => {
      useResultsStore.getState().addResult(createMockResult({ wpm: 50 }))
      useResultsStore.getState().addResult(createMockResult({ wpm: 80 }))
      useResultsStore.getState().addResult(createMockResult({ wpm: 60 }))

      useResultsStore.getState().setSortBy('wpm')
      useResultsStore.getState().setSortOrder('desc')
      const sorted = useResultsStore.getState().getFilteredResults()
      expect(sorted[0].wpm).toBe(80)
      expect(sorted[1].wpm).toBe(60)
      expect(sorted[2].wpm).toBe(50)
    })

    it('should sort results by WPM ascending', () => {
      useResultsStore.getState().addResult(createMockResult({ wpm: 50 }))
      useResultsStore.getState().addResult(createMockResult({ wpm: 80 }))

      useResultsStore.getState().setSortBy('wpm')
      useResultsStore.getState().setSortOrder('asc')
      const sorted = useResultsStore.getState().getFilteredResults()
      expect(sorted[0].wpm).toBe(50)
      expect(sorted[1].wpm).toBe(80)
    })

    it('should sort results by accuracy', () => {
      useResultsStore.getState().addResult(createMockResult({ accuracy: 90 }))
      useResultsStore.getState().addResult(createMockResult({ accuracy: 99 }))

      useResultsStore.getState().setSortBy('accuracy')
      useResultsStore.getState().setSortOrder('desc')
      const sorted = useResultsStore.getState().getFilteredResults()
      expect(sorted[0].accuracy).toBe(99)
    })

    it('should get recent results with default limit', () => {
      for (let i = 0; i < 15; i++) {
        useResultsStore.getState().addResult(createMockResult({ id: `r-${i}` }))
      }

      const recent = useResultsStore.getState().getRecentResults()
      expect(recent).toHaveLength(10)
    })

    it('should get recent results with custom limit', () => {
      for (let i = 0; i < 10; i++) {
        useResultsStore.getState().addResult(createMockResult())
      }

      const recent = useResultsStore.getState().getRecentResults(5)
      expect(recent).toHaveLength(5)
    })

    it('should calculate average WPM', () => {
      useResultsStore.getState().addResult(createMockResult({ wpm: 60 }))
      useResultsStore.getState().addResult(createMockResult({ wpm: 80 }))

      expect(useResultsStore.getState().getAverageWpm()).toBe(70)
    })

    it('should return 0 average WPM with no results', () => {
      expect(useResultsStore.getState().getAverageWpm()).toBe(0)
    })

    it('should calculate average accuracy', () => {
      useResultsStore.getState().addResult(createMockResult({ accuracy: 90 }))
      useResultsStore.getState().addResult(createMockResult({ accuracy: 100 }))

      expect(useResultsStore.getState().getAverageAccuracy()).toBe(95)
    })

    it('should return 0 average accuracy with no results', () => {
      expect(useResultsStore.getState().getAverageAccuracy()).toBe(0)
    })

    it('should get total tests count', () => {
      useResultsStore.getState().addResult(createMockResult())
      useResultsStore.getState().addResult(createMockResult())
      useResultsStore.getState().addResult(createMockResult())

      expect(useResultsStore.getState().getTotalTests()).toBe(3)
    })

    it('should get total time', () => {
      useResultsStore.getState().addResult(createMockResult({ testDuration: 30 }))
      useResultsStore.getState().addResult(createMockResult({ testDuration: 60 }))

      expect(useResultsStore.getState().getTotalTime()).toBe(90)
    })

    it('should filter average WPM by days', () => {
      const now = new Date()
      const recent = createMockResult({
        wpm: 80,
        createdAt: now.toISOString(),
      })
      const old = createMockResult({
        wpm: 40,
        createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      })

      useResultsStore.getState().addResult(recent)
      useResultsStore.getState().addResult(old)

      // Only the recent result should count for 7-day window
      expect(useResultsStore.getState().getAverageWpm(7)).toBe(80)
    })
  })
})
