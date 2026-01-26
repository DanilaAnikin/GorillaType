'use client';

import { useState, useEffect, useCallback } from 'react';
import { Trophy } from 'lucide-react';
import {
  FilterControls,
  UserRankCard,
  LeaderboardTable,
  type FilterState,
  type LeaderboardEntry,
  type UserRank,
} from '@/components/leaderboard';
import { useUserStore } from '@/store/user-store';

/**
 * Leaderboards page - Display global rankings and user position.
 */
export default function LeaderboardsPage() {
  const [filters, setFilters] = useState<FilterState>({
    mode: 'time',
    timeValue: 30,
    wordValue: 50,
    timeRange: 'all',
    language: 'english',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<UserRank | null>(null);
  const [totalEntries, setTotalEntries] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const user = useUserStore((state) => state.user);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);

  // Fetch leaderboard data from API
  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        mode: filters.mode,
        language: filters.language,
        period: filters.timeRange,
        page: currentPage.toString(),
        limit: '20',
      });

      // Add mode-specific params
      if (filters.mode === 'time') {
        params.set('timeLimit', filters.timeValue.toString());
      } else if (filters.mode === 'words') {
        params.set('wordLimit', filters.wordValue.toString());
      }

      const response = await fetch(`/api/leaderboards?${params}`);
      if (!response.ok) throw new Error('Failed to fetch leaderboard');

      const data = await response.json();
      setEntries(data.entries || []);
      setTotalEntries(data.total || 0);

      // Handle user rank if authenticated
      if (data.userRank) {
        setUserRank(data.userRank);
      } else if (!isAuthenticated) {
        setUserRank(null);
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
      setError('Failed to load leaderboard data. Please try again.');
      setEntries([]);
      setTotalEntries(0);
    } finally {
      setIsLoading(false);
    }
  }, [filters, currentPage, isAuthenticated]);

  // Fetch data when filters or page changes
  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="w-8 h-8 text-main" />
          <h1 className="text-3xl font-bold text-text">Leaderboards</h1>
        </div>
        <p className="text-sub">
          See how you stack up against the fastest typists in the world.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Filter Controls */}
          <FilterControls
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />

          {/* User Rank Card */}
          <UserRankCard
            userRank={userRank}
            isAuthenticated={isAuthenticated}
          />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {error ? (
            <div className="bg-bg rounded-lg border border-sub/20 p-8 text-center">
              <p className="text-error mb-4">{error}</p>
              <button
                onClick={fetchLeaderboard}
                className="px-4 py-2 bg-main text-bg rounded-lg hover:opacity-90 transition-opacity"
              >
                Try Again
              </button>
            </div>
          ) : (
            <LeaderboardTable
              entries={entries}
              currentPage={currentPage}
              totalEntries={totalEntries}
              isLoading={isLoading}
              onPageChange={handlePageChange}
              currentUserId={user?.id}
            />
          )}
        </div>
      </div>
    </div>
  );
}
