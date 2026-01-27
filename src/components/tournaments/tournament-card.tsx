'use client';

import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  Users,
  Clock,
  Zap,
  Calendar,
  Globe,
} from 'lucide-react';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

/**
 * Tournament data shape used by the card
 */
export interface TournamentCardData {
  id: string;
  name: string;
  description?: string | null;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  testMode: 'time' | 'words';
  testDuration?: number | null;
  testWordCount?: number | null;
  testLanguage: string;
  maxParticipants?: number | null;
  totalRounds: number;
  startTime: string;
  creator: {
    id?: string;
    username: string;
    avatarUrl?: string | null;
  };
  participantCount: number;
}

/**
 * Status badge color configuration
 */
const statusConfig: Record<
  TournamentCardData['status'],
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

export interface TournamentCardProps {
  tournament: TournamentCardData;
  onJoin?: (id: string) => void;
  isJoining?: boolean;
}

/**
 * TournamentCard
 * Displays a summary card for a tournament in the list view.
 */
export function TournamentCard({
  tournament,
  onJoin,
  isJoining,
}: TournamentCardProps) {
  const router = useRouter();
  const status = statusConfig[tournament.status];
  const isFull =
    tournament.maxParticipants !== null &&
    tournament.maxParticipants !== undefined &&
    tournament.participantCount >= tournament.maxParticipants;
  const canJoin = tournament.status === 'upcoming' && !isFull;

  const handleCardClick = () => {
    router.push(`/tournaments/${tournament.id}`);
  };

  const handleJoinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onJoin?.(tournament.id);
  };

  return (
    <Card
      hoverable
      className="cursor-pointer transition-all hover:border-main/50"
      onClick={handleCardClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Name + Status */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h3 className="text-lg font-semibold text-text truncate">
                {tournament.name}
              </h3>
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border',
                  status.className
                )}
              >
                {status.label}
              </span>
            </div>

            {/* Test config */}
            <div className="flex items-center gap-3 text-sm text-sub mb-2 flex-wrap">
              <span className="flex items-center gap-1">
                {tournament.testMode === 'time' ? (
                  <>
                    <Clock className="w-3.5 h-3.5" />
                    {tournament.testDuration}s
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    {tournament.testWordCount} words
                  </>
                )}
              </span>
              <span className="flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" />
                {tournament.testLanguage}
              </span>
              <Badge variant="secondary" size="sm">
                {tournament.totalRounds} round{tournament.totalRounds !== 1 ? 's' : ''}
              </Badge>
            </div>

            {/* Participants + Start time */}
            <div className="flex items-center gap-4 text-sm text-sub">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {tournament.participantCount}
                {tournament.maxParticipants ? `/${tournament.maxParticipants}` : ''}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {format(new Date(tournament.startTime), 'MMM d, yyyy h:mm a')}
              </span>
            </div>

            {/* Creator */}
            <div className="mt-2 text-sm">
              <span className="text-sub">Created by </span>
              <span className="text-text">{tournament.creator.username}</span>
            </div>
          </div>

          {/* Join button */}
          {canJoin && onJoin && (
            <Button
              size="sm"
              onClick={handleJoinClick}
              loading={isJoining}
              disabled={isJoining}
            >
              Join
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
