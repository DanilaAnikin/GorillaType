'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import { Trophy, Medal, Award, TrendingUp, TrendingDown, Minus, User } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';

/**
 * User rank data.
 */
export interface UserRank {
  rank: number;
  previousRank?: number;
  username: string;
  avatarUrl?: string;
  wpm: number;
  accuracy: number;
  consistency?: number;
  testCount: number;
  totalEntries?: number;
  percentile?: number;
}

/**
 * Props for UserRankCard component.
 */
export interface UserRankCardProps {
  /** User rank data, null if user has no ranking */
  userRank: UserRank | null;
  /** Whether the user is authenticated */
  isAuthenticated: boolean;
  /** Whether the data is loading */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Get rank change indicator.
 */
function getRankChange(current: number, previous?: number) {
  if (previous === undefined) return null;

  const diff = previous - current;
  if (diff > 0) {
    return {
      icon: <TrendingUp className="w-4 h-4" />,
      text: `+${diff}`,
      color: 'text-main',
    };
  } else if (diff < 0) {
    return {
      icon: <TrendingDown className="w-4 h-4" />,
      text: `${diff}`,
      color: 'text-error',
    };
  }
  return {
    icon: <Minus className="w-4 h-4" />,
    text: '0',
    color: 'text-sub',
  };
}

/**
 * Get rank badge with styling based on position.
 */
function getRankBadge(rank: number): {
  icon: React.ReactNode;
  label: string;
} | null {
  if (rank === 1) {
    return {
      icon: <Trophy className="w-6 h-6" />,
      label: 'Gold',
    };
  }
  if (rank === 2) {
    return {
      icon: <Medal className="w-6 h-6" />,
      label: 'Silver',
    };
  }
  if (rank === 3) {
    return {
      icon: <Award className="w-6 h-6" />,
      label: 'Bronze',
    };
  }
  return null;
}

/**
 * Loading skeleton for the rank card.
 */
function RankCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('bg-sub-alt rounded-lg p-6 animate-pulse transition-all duration-125', className)}>
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-bg" />
        <div className="flex-1">
          <div className="h-6 w-32 bg-bg rounded mb-2" />
          <div className="h-4 w-24 bg-bg rounded" />
        </div>
        <div className="text-right">
          <div className="h-8 w-16 bg-bg rounded mb-2" />
          <div className="h-4 w-20 bg-bg rounded" />
        </div>
      </div>
    </div>
  );
}

/**
 * UserRankCard displays the current user's ranking position.
 */
export function UserRankCard({
  userRank,
  isAuthenticated,
  isLoading = false,
  className,
}: UserRankCardProps) {
  if (isLoading) {
    return <RankCardSkeleton className={className} />;
  }

  if (!isAuthenticated) {
    return (
      <div
        className={cn(
          'bg-sub-alt rounded-lg p-6 text-center transition-all duration-125',
          className
        )}
      >
        <User className="w-12 h-12 mx-auto mb-3 text-sub" />
        <h3 className="text-lg font-medium text-text mb-2">Your Ranking</h3>
        <p className="text-sm text-sub mb-4">
          Sign in to see your position on the leaderboard and compete with others.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center px-4 py-2 bg-main text-bg rounded-lg text-sm font-medium hover:opacity-90 transition-all duration-125"
        >
          Sign In to Compete
        </Link>
      </div>
    );
  }

  if (!userRank) {
    return (
      <div
        className={cn(
          'bg-sub-alt rounded-lg p-6 text-center transition-all duration-125',
          className
        )}
      >
        <Trophy className="w-12 h-12 mx-auto mb-3 text-sub" />
        <h3 className="text-lg font-medium text-text mb-2">You are not ranked</h3>
        <p className="text-sm text-sub mb-4">
          Complete a typing test with the current filters to appear on the leaderboard!
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 bg-main text-bg rounded-lg text-sm font-medium hover:opacity-90 transition-all duration-125"
        >
          Start Typing
        </Link>
      </div>
    );
  }

  const rankChange = getRankChange(userRank.rank, userRank.previousRank);
  const rankBadge = getRankBadge(userRank.rank);
  const isTopThree = userRank.rank <= 3;

  return (
    <div
      className={cn(
        'rounded-lg p-6 border transition-all duration-125',
        isTopThree
          ? 'bg-main/10 border-main'
          : 'bg-sub-alt border-sub',
        className
      )}
    >
      <h3 className="text-sm font-medium text-sub mb-4 uppercase tracking-wider">
        Your Ranking
      </h3>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Avatar with Badge */}
        <div className="relative flex-shrink-0">
          <Avatar
            src={userRank.avatarUrl}
            alt={`${userRank.username}'s avatar`}
            fallback={userRank.username.charAt(0)}
            size="xl"
            bordered
            className={cn(
              'ring-4 transition-all duration-125',
              isTopThree ? 'ring-main' : 'ring-sub'
            )}
          />

          {/* Top 3 Badge */}
          {rankBadge && (
            <div
              className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center bg-main text-bg transition-all duration-125"
              title={rankBadge.label}
            >
              {rankBadge.icon}
            </div>
          )}
        </div>

        {/* Rank and User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            {!isTopThree && (
              <Trophy className="w-6 h-6 text-sub flex-shrink-0" />
            )}
            <span
              className={cn(
                'text-3xl font-bold transition-all duration-125 flex-shrink-0',
                isTopThree ? 'text-main' : 'text-text'
              )}
            >
              #{userRank.rank}
            </span>
            {userRank.totalEntries && (
              <span className="text-sm text-sub flex-shrink-0">
                of {userRank.totalEntries.toLocaleString()}
              </span>
            )}
            {rankChange && (
              <div className={cn('flex items-center gap-1 text-sm transition-all duration-125 flex-shrink-0', rankChange.color)}>
                {rankChange.icon}
                <span>{rankChange.text}</span>
              </div>
            )}
          </div>

          <Link
            href={`/profile/${userRank.username}`}
            className="block text-lg font-medium text-text hover:text-main transition-all duration-125 truncate max-w-full"
            title={userRank.username}
          >
            {userRank.username}
          </Link>

          {userRank.percentile !== undefined && (
            <p className="text-sm text-sub mt-1 truncate">
              Top {(100 - userRank.percentile).toFixed(1)}% of all players
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="flex gap-6 sm:gap-8 flex-shrink-0">
          <div className="text-center">
            <p className="text-2xl font-bold text-text">{userRank.wpm}</p>
            <p className="text-xs text-sub uppercase tracking-wide">WPM</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-text">{userRank.accuracy}%</p>
            <p className="text-xs text-sub uppercase tracking-wide">Accuracy</p>
          </div>
          {userRank.consistency !== undefined && (
            <div className="text-center hidden sm:block">
              <p className="text-2xl font-bold text-text">{userRank.consistency}%</p>
              <p className="text-xs text-sub uppercase tracking-wide">Consistency</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserRankCard;
