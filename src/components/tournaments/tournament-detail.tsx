'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Globe,
  Users,
  Zap,
  Trophy,
  AlertCircle,
  RefreshCw,
  Play,
  Keyboard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils/cn';
import { useUserStore } from '@/store/user-store';
import {
  TournamentLeaderboard,
  type LeaderboardParticipant,
} from './tournament-leaderboard';

/**
 * Status badge configuration
 */
const statusConfig: Record<
  string,
  { label: string; className: string }
> = {
  upcoming: {
    label: 'Upcoming',
    className: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  active: {
    label: 'Active',
    className: 'bg-green-500/20 text-green-400 border-green-500/30',
  },
  completed: {
    label: 'Completed',
    className: 'bg-sub-alt text-sub border-sub/30',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-red-500/20 text-red-400 border-red-500/30',
  },
};

/**
 * Types for the tournament detail API response
 */
interface TournamentDetailData {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  testMode: string;
  testDuration?: number | null;
  testWordCount?: number | null;
  testLanguage: string;
  maxParticipants?: number | null;
  totalRounds: number;
  isPublic: boolean;
  entryXpCost: number;
  startTime: string;
  createdAt: string;
  creatorId: string;
  creator: {
    id?: string;
    username: string;
    avatarUrl?: string | null;
  };
  participants: {
    id: string;
    userId: string;
    username: string;
    avatarUrl?: string | null;
    totalScore: number;
    joinedAt: string;
  }[];
  participantCount: number;
  rounds: {
    id: string;
    participantId: string;
    roundNumber: number;
    resultId?: string | null;
    wpm: number;
    accuracy: number;
    score: number;
    completedAt: string;
  }[];
}

export interface TournamentDetailProps {
  tournamentId: string;
}

/**
 * TournamentDetail
 * Full tournament detail page showing info, participants, leaderboard, and rounds.
 */
export function TournamentDetail({ tournamentId }: TournamentDetailProps) {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);

  const [tournament, setTournament] = useState<TournamentDetailData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const fetchTournament = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}`);
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to load tournament');
      }
      const data = await response.json();
      setTournament(data.tournament);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load tournament'
      );
    } finally {
      setIsLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    fetchTournament();
  }, [fetchTournament]);

  const handleJoin = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/tournaments/${tournamentId}`);
      return;
    }

    setIsJoining(true);
    try {
      const response = await fetch(
        `/api/tournaments/${tournamentId}/join`,
        { method: 'POST' }
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to join tournament');
      }
      // Refresh data
      await fetchTournament();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to join tournament'
      );
    } finally {
      setIsJoining(false);
    }
  };

  const handleStart = async () => {
    setIsStarting(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/tournaments/${tournamentId}/start`,
        { method: 'POST' }
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to start tournament');
      }
      // Refresh data to show new status
      await fetchTournament();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to start tournament'
      );
    } finally {
      setIsStarting(false);
    }
  };

  const handlePlayRound = () => {
    router.push(`/tournaments/play/${tournamentId}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="rectangular" className="w-full" height={48} />
        <Skeleton variant="rectangular" className="w-full" height={200} />
        <Skeleton variant="rectangular" className="w-full" height={300} />
      </div>
    );
  }

  // Error state
  if (error && !tournament) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-12 h-12 text-error mx-auto mb-4" />
        <p className="text-error mb-2">{error}</p>
        <div className="flex items-center justify-center gap-3 mt-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/tournaments')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Tournaments
          </Button>
          <Button
            onClick={fetchTournament}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!tournament) return null;

  const status = statusConfig[tournament.status] || statusConfig.upcoming;
  const isParticipant = tournament.participants.some(
    (p) => p.userId === user?.id
  );
  const isFull =
    tournament.maxParticipants !== null &&
    tournament.maxParticipants !== undefined &&
    tournament.participantCount >= tournament.maxParticipants;
  const canJoin =
    tournament.status === 'upcoming' && !isFull && !isParticipant;
  const isCreator = tournament.creatorId === user?.id;

  // Determine if the participant can play a round
  const currentParticipant = tournament.participants.find(
    (p) => p.userId === user?.id
  );
  const myCompletedRounds = currentParticipant
    ? tournament.rounds.filter(
        (r) => r.participantId === currentParticipant.id
      ).length
    : 0;
  const hasRoundsRemaining = myCompletedRounds < tournament.totalRounds;
  const canPlayRound =
    tournament.status === 'active' && isParticipant && hasRoundsRemaining;

  // Creator can start tournament when it is upcoming
  const canStartTournament =
    isCreator && tournament.status === 'upcoming';

  // Build leaderboard data
  const leaderboardParticipants: LeaderboardParticipant[] = tournament.participants
    .map((p) => {
      const participantRounds = tournament.rounds.filter(
        (r) => r.participantId === p.id
      );
      const roundsCompleted = participantRounds.length;
      const avgWpm =
        roundsCompleted > 0
          ? participantRounds.reduce((acc, r) => acc + r.wpm, 0) /
            roundsCompleted
          : 0;
      const avgAccuracy =
        roundsCompleted > 0
          ? participantRounds.reduce((acc, r) => acc + r.accuracy, 0) /
            roundsCompleted
          : 0;

      return {
        id: p.id,
        userId: p.userId,
        username: p.username,
        avatarUrl: p.avatarUrl,
        totalScore: p.totalScore,
        roundsCompleted,
        avgWpm,
        avgAccuracy,
      };
    })
    .sort((a, b) => b.totalScore - a.totalScore);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/tournaments')}
        leftIcon={<ArrowLeft className="w-4 h-4" />}
      >
        Back to Tournaments
      </Button>

      {/* Error banner */}
      {error && (
        <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
          {error}
        </div>
      )}

      {/* Tournament Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <Trophy className="w-6 h-6 text-main" />
                <CardTitle className="text-2xl">{tournament.name}</CardTitle>
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border',
                    status.className
                  )}
                >
                  {status.label}
                </span>
              </div>
              {tournament.description && (
                <CardDescription className="text-base">
                  {tournament.description}
                </CardDescription>
              )}
            </div>
            <div className="flex gap-2 items-center">
              {canStartTournament && (
                <Button
                  onClick={handleStart}
                  loading={isStarting}
                  disabled={isStarting}
                  leftIcon={<Play className="w-4 h-4" />}
                >
                  Start Tournament
                </Button>
              )}
              {canPlayRound && (
                <Button
                  onClick={handlePlayRound}
                  leftIcon={<Keyboard className="w-4 h-4" />}
                >
                  Play Round {myCompletedRounds + 1}
                </Button>
              )}
              {canJoin && (
                <Button
                  onClick={handleJoin}
                  loading={isJoining}
                  disabled={isJoining}
                >
                  Join Tournament
                </Button>
              )}
              {isParticipant && tournament.status === 'upcoming' && (
                <Badge variant="secondary">Joined</Badge>
              )}
              {isParticipant &&
                tournament.status === 'active' &&
                !hasRoundsRemaining && (
                  <Badge variant="secondary">All rounds completed</Badge>
                )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Info grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1">
              <span className="text-xs text-sub flex items-center gap-1">
                {tournament.testMode === 'time' ? (
                  <Clock className="w-3 h-3" />
                ) : (
                  <Zap className="w-3 h-3" />
                )}
                Test
              </span>
              <p className="text-text font-medium">
                {tournament.testMode === 'time'
                  ? `${tournament.testDuration}s`
                  : `${tournament.testWordCount} words`}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-sub flex items-center gap-1">
                <Globe className="w-3 h-3" />
                Language
              </span>
              <p className="text-text font-medium capitalize">
                {tournament.testLanguage}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-sub flex items-center gap-1">
                <Users className="w-3 h-3" />
                Participants
              </span>
              <p className="text-text font-medium">
                {tournament.participantCount}
                {tournament.maxParticipants
                  ? `/${tournament.maxParticipants}`
                  : ''}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-sub flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Start
              </span>
              <p className="text-text font-medium">
                {format(
                  new Date(tournament.startTime),
                  'MMM d, yyyy h:mm a'
                )}
              </p>
            </div>
          </div>

          {/* Creator + Rounds */}
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-sub/10 text-sm text-sub flex-wrap">
            <span>
              Created by{' '}
              <span className="text-text font-medium">
                {tournament.creator.username}
              </span>
            </span>
            <span>
              {tournament.totalRounds} round
              {tournament.totalRounds !== 1 ? 's' : ''}
            </span>
            {isCreator && (
              <Badge variant="outline" size="sm">
                Your tournament
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TournamentLeaderboard
            participants={leaderboardParticipants}
            currentUserId={user?.id || null}
            totalRounds={tournament.totalRounds}
          />
        </CardContent>
      </Card>

      {/* Round Results */}
      {tournament.rounds.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Round Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-sub/20">
                    <th className="text-left py-3 px-3 text-sub font-medium">
                      Round
                    </th>
                    <th className="text-left py-3 px-3 text-sub font-medium">
                      Player
                    </th>
                    <th className="text-right py-3 px-3 text-sub font-medium">
                      WPM
                    </th>
                    <th className="text-right py-3 px-3 text-sub font-medium">
                      Accuracy
                    </th>
                    <th className="text-right py-3 px-3 text-sub font-medium">
                      Score
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tournament.rounds.map((round) => {
                    const participant = tournament.participants.find(
                      (p) => p.id === round.participantId
                    );
                    return (
                      <tr
                        key={round.id}
                        className={cn(
                          'border-b border-sub/10',
                          participant?.userId === user?.id && 'bg-main/5'
                        )}
                      >
                        <td className="py-3 px-3 text-text">
                          Round {round.roundNumber}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <Avatar
                              src={participant?.avatarUrl}
                              alt={participant?.username || 'Unknown'}
                              fallback={(
                                participant?.username || 'U'
                              ).charAt(0)}
                              size="xs"
                            />
                            <span className="text-text">
                              {participant?.username || 'Unknown'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right text-text tabular-nums">
                          {round.wpm}
                        </td>
                        <td className="py-3 px-3 text-right text-text tabular-nums">
                          {round.accuracy.toFixed(1)}%
                        </td>
                        <td className="py-3 px-3 text-right text-main font-semibold tabular-nums">
                          {round.score.toFixed(1)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Participants List (for upcoming tournaments) */}
      {tournament.status === 'upcoming' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Participants ({tournament.participantCount})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tournament.participants.length === 0 ? (
              <p className="text-sub text-center py-4">
                No participants yet. Be the first to join!
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {tournament.participants.map((p) => (
                  <div
                    key={p.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg bg-bg transition-colors',
                      p.userId === user?.id && 'ring-1 ring-main/30'
                    )}
                  >
                    <Avatar
                      src={p.avatarUrl}
                      alt={p.username}
                      fallback={p.username.charAt(0)}
                      size="sm"
                    />
                    <div>
                      <span
                        className={cn(
                          'text-sm font-medium text-text',
                          p.userId === user?.id && 'text-main'
                        )}
                      >
                        {p.username}
                      </span>
                      <p className="text-xs text-sub">
                        Joined{' '}
                        {format(new Date(p.joinedAt), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
