'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Trophy,
  Plus,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserStore } from '@/store/user-store';
import { TournamentCard, type TournamentCardData } from './tournament-card';
import { CreateTournamentModal } from './create-tournament-modal';

/**
 * TournamentList
 * Client component that fetches and displays tournaments with tab navigation.
 */
export function TournamentList() {
  const router = useRouter();
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);

  const [tournaments, setTournaments] = useState<TournamentCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTournaments = useCallback(
    async (status: string, pageNum: number = 1) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/tournaments?status=${status}&page=${pageNum}&limit=10`
        );
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to fetch tournaments');
        }
        const data = await response.json();
        setTournaments(data.tournaments || []);
        setTotalPages(data.pagination?.totalPages || 1);
      } catch (err) {
        console.error('Failed to fetch tournaments:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to fetch tournaments'
        );
        setTournaments([]);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Fetch when tab or page changes
  useEffect(() => {
    setPage(1);
    fetchTournaments(activeTab, 1);
  }, [activeTab, fetchTournaments]);

  const handleRefresh = () => {
    fetchTournaments(activeTab, page);
  };

  const handleJoin = async (tournamentId: string) => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/tournaments`);
      return;
    }

    setJoiningId(tournamentId);
    try {
      const response = await fetch(
        `/api/tournaments/${tournamentId}/join`,
        { method: 'POST' }
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to join tournament');
      }
      // Navigate to tournament detail
      router.push(`/tournaments/${tournamentId}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to join tournament'
      );
    } finally {
      setJoiningId(null);
    }
  };

  const handleCreated = (tournament: { id: string }) => {
    router.push(`/tournaments/${tournament.id}`);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchTournaments(activeTab, newPage);
  };

  return (
    <div>
      {/* Page header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-8 h-8 text-main" />
            <h1 className="text-3xl font-bold text-text">Tournaments</h1>
          </div>
          <p className="text-sub">
            Compete in multi-round typing tournaments against other players.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            loading={isLoading}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Refresh
          </Button>
          {isAuthenticated && (
            <Button
              onClick={() => setIsCreateOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Create Tournament
            </Button>
          )}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <TournamentGrid
            tournaments={tournaments}
            isLoading={isLoading}
            onJoin={handleJoin}
            joiningId={joiningId}
            emptyMessage="No upcoming tournaments. Create one to get started!"
          />
        </TabsContent>

        <TabsContent value="active">
          <TournamentGrid
            tournaments={tournaments}
            isLoading={isLoading}
            onJoin={handleJoin}
            joiningId={joiningId}
            emptyMessage="No active tournaments right now."
          />
        </TabsContent>

        <TabsContent value="completed">
          <TournamentGrid
            tournaments={tournaments}
            isLoading={isLoading}
            onJoin={handleJoin}
            joiningId={joiningId}
            emptyMessage="No completed tournaments yet."
          />
        </TabsContent>
      </Tabs>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button
            variant="ghost"
            size="sm"
            disabled={page <= 1}
            onClick={() => handlePageChange(page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-sub">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => handlePageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Create tournament modal */}
      <CreateTournamentModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}

/**
 * Tournament grid sub-component
 */
function TournamentGrid({
  tournaments,
  isLoading,
  onJoin,
  joiningId,
  emptyMessage,
}: {
  tournaments: TournamentCardData[];
  isLoading: boolean;
  onJoin: (id: string) => void;
  joiningId: string | null;
  emptyMessage: string;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton
            key={i}
            variant="rectangular"
            className="w-full"
            height={160}
          />
        ))}
      </div>
    );
  }

  if (tournaments.length === 0) {
    return (
      <div className="text-center py-16">
        <Trophy className="w-12 h-12 text-sub mx-auto mb-4" />
        <p className="text-sub">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {tournaments.map((tournament) => (
        <TournamentCard
          key={tournament.id}
          tournament={tournament}
          onJoin={onJoin}
          isJoining={joiningId === tournament.id}
        />
      ))}
    </div>
  );
}
