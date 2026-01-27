'use client';

import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils/cn';

/**
 * Participant data for the leaderboard
 */
export interface LeaderboardParticipant {
  id: string;
  userId: string;
  username: string;
  avatarUrl?: string | null;
  totalScore: number;
  roundsCompleted: number;
  avgWpm: number;
  avgAccuracy: number;
}

/**
 * Round result data for computing leaderboard stats
 */
export interface RoundData {
  participantId: string;
  roundNumber: number;
  wpm: number;
  accuracy: number;
  score: number;
}

export interface TournamentLeaderboardProps {
  participants: LeaderboardParticipant[];
  currentUserId?: string | null;
  totalRounds: number;
}

/**
 * Medal styles for top 3
 */
const rankStyles: Record<number, string> = {
  1: 'text-yellow-400',
  2: 'text-gray-300',
  3: 'text-amber-600',
};

/**
 * TournamentLeaderboard
 * Displays a ranked table of tournament participants sorted by total score.
 */
export function TournamentLeaderboard({
  participants,
  currentUserId,
  totalRounds,
}: TournamentLeaderboardProps) {
  if (participants.length === 0) {
    return (
      <div className="text-center py-8 text-sub">
        No participants yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-sub/20">
            <th className="text-left py-3 px-3 text-sub font-medium w-12">
              #
            </th>
            <th className="text-left py-3 px-3 text-sub font-medium">
              Player
            </th>
            <th className="text-right py-3 px-3 text-sub font-medium">
              Avg WPM
            </th>
            <th className="text-right py-3 px-3 text-sub font-medium">
              Avg Acc
            </th>
            <th className="text-right py-3 px-3 text-sub font-medium">
              Score
            </th>
            <th className="text-right py-3 px-3 text-sub font-medium">
              Rounds
            </th>
          </tr>
        </thead>
        <tbody>
          {participants.map((participant, index) => {
            const rank = index + 1;
            const isCurrentUser = participant.userId === currentUserId;

            return (
              <tr
                key={participant.id}
                className={cn(
                  'border-b border-sub/10 transition-colors duration-125',
                  isCurrentUser && 'bg-main/5',
                  rank <= 3 && 'font-medium'
                )}
              >
                {/* Rank */}
                <td className="py-3 px-3">
                  <span
                    className={cn(
                      'text-base font-bold',
                      rankStyles[rank] || 'text-sub'
                    )}
                  >
                    {rank}
                  </span>
                </td>

                {/* Player */}
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <Avatar
                      src={participant.avatarUrl}
                      alt={participant.username}
                      fallback={participant.username.charAt(0)}
                      size="sm"
                    />
                    <span
                      className={cn(
                        'text-text',
                        isCurrentUser && 'text-main font-semibold'
                      )}
                    >
                      {participant.username}
                      {isCurrentUser && (
                        <span className="text-xs text-sub ml-1">(you)</span>
                      )}
                    </span>
                  </div>
                </td>

                {/* Avg WPM */}
                <td className="py-3 px-3 text-right text-text tabular-nums">
                  {participant.avgWpm > 0
                    ? Math.round(participant.avgWpm)
                    : '-'}
                </td>

                {/* Avg Accuracy */}
                <td className="py-3 px-3 text-right text-text tabular-nums">
                  {participant.avgAccuracy > 0
                    ? `${participant.avgAccuracy.toFixed(1)}%`
                    : '-'}
                </td>

                {/* Score */}
                <td className="py-3 px-3 text-right">
                  <span className="text-main font-semibold tabular-nums">
                    {participant.totalScore.toFixed(1)}
                  </span>
                </td>

                {/* Rounds Completed */}
                <td className="py-3 px-3 text-right text-sub tabular-nums">
                  {participant.roundsCompleted}/{totalRounds}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
