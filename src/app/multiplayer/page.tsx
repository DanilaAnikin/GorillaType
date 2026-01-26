'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Plus,
  LogIn,
  Clock,
  Trophy,
  Zap,
  Globe,
  Lock,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from '@/components/ui/modal';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useUserStore } from '@/store/user-store';

/**
 * Room data type
 */
interface RoomData {
  id: string;
  code: string;
  host: {
    username: string;
    avatarUrl?: string;
    level: number;
  };
  participantCount: number;
  maxParticipants: number;
  mode: 'time' | 'words';
  timeLimit?: number;
  wordLimit?: number;
  status: 'waiting' | 'countdown' | 'racing' | 'finished';
  isPrivate: boolean;
  createdAt: string;
}

/**
 * Race history entry type
 */
interface RaceHistoryEntry {
  id: string;
  roomCode: string;
  date: Date;
  position: number;
  totalRacers: number;
  wpm: number;
  accuracy: number;
  mode: 'time' | 'words';
  modeValue: number;
}

/**
 * Create Room Modal Component
 */
function CreateRoomModal({
  isOpen,
  onClose,
  onCreateRoom,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (config: {
    mode: 'time' | 'words';
    timeLimit: number;
    wordLimit: number;
    maxParticipants: number;
    isPrivate: boolean;
  }) => void;
}) {
  const [mode, setMode] = useState<'time' | 'words'>('time');
  const [timeLimit, setTimeLimit] = useState(60);
  const [wordLimit, setWordLimit] = useState(50);
  const [maxParticipants, setMaxParticipants] = useState(5);
  const [isPrivate, setIsPrivate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    setIsLoading(true);
    await onCreateRoom({
      mode,
      timeLimit,
      wordLimit,
      maxParticipants,
      isPrivate,
    });
    setIsLoading(false);
  };

  return (
    <Modal open={isOpen} onOpenChange={onClose}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Create Race Room</ModalTitle>
          <ModalDescription>
            Configure your multiplayer race settings
          </ModalDescription>
        </ModalHeader>

        <div className="space-y-6 py-4">
          {/* Mode Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-text">Mode</label>
            <Select value={mode} onValueChange={(v) => setMode(v as 'time' | 'words')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="time">Time</SelectItem>
                <SelectItem value="words">Words</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Time/Word Limit */}
          {mode === 'time' ? (
            <div className="space-y-2">
              <label className="text-sm font-medium text-text">Time Limit</label>
              <Select value={String(timeLimit)} onValueChange={(v) => setTimeLimit(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 seconds</SelectItem>
                  <SelectItem value="30">30 seconds</SelectItem>
                  <SelectItem value="60">60 seconds</SelectItem>
                  <SelectItem value="120">120 seconds</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium text-text">Word Count</label>
              <Select value={String(wordLimit)} onValueChange={(v) => setWordLimit(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 words</SelectItem>
                  <SelectItem value="25">25 words</SelectItem>
                  <SelectItem value="50">50 words</SelectItem>
                  <SelectItem value="100">100 words</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Max Participants */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-text">Max Participants</label>
            <Select value={String(maxParticipants)} onValueChange={(v) => setMaxParticipants(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 players</SelectItem>
                <SelectItem value="3">3 players</SelectItem>
                <SelectItem value="4">4 players</SelectItem>
                <SelectItem value="5">5 players</SelectItem>
                <SelectItem value="6">6 players</SelectItem>
                <SelectItem value="8">8 players</SelectItem>
                <SelectItem value="10">10 players</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Private Room Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-text">Private Room</label>
              <p className="text-xs text-sub">Only players with the code can join</p>
            </div>
            <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
          </div>
        </div>

        <ModalFooter>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleCreate} loading={isLoading} leftIcon={<Plus className="w-4 h-4" />}>
            Create Room
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/**
 * Join Room Modal Component
 */
function JoinRoomModal({
  isOpen,
  onClose,
  onJoinRoom,
}: {
  isOpen: boolean;
  onClose: () => void;
  onJoinRoom: (code: string) => void;
}) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleJoin = async () => {
    if (!code.trim()) {
      setError('Please enter a room code');
      return;
    }

    if (code.length < 6) {
      setError('Room code must be 6 characters');
      return;
    }

    setError('');
    setIsLoading(true);
    await onJoinRoom(code.toUpperCase());
    setIsLoading(false);
  };

  const handleCodeChange = (value: string) => {
    setCode(value.toUpperCase().slice(0, 6));
    setError('');
  };

  return (
    <Modal open={isOpen} onOpenChange={onClose}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Join Race Room</ModalTitle>
          <ModalDescription>
            Enter the 6-character room code to join
          </ModalDescription>
        </ModalHeader>

        <div className="py-4">
          <Input
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            placeholder="ENTER CODE"
            className="text-center text-2xl font-mono tracking-widest uppercase"
            maxLength={6}
            error={!!error}
            errorMessage={error}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleJoin();
            }}
          />
        </div>

        <ModalFooter>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleJoin} loading={isLoading} leftIcon={<LogIn className="w-4 h-4" />}>
            Join Room
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/**
 * Room Card Component
 */
function RoomCard({ room, onJoin }: { room: RoomData; onJoin: () => void }) {
  const timeAgo = getTimeAgo(new Date(room.createdAt));

  return (
    <Card hoverable className="transition-all hover:border-main/50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-lg font-bold text-main">{room.code}</span>
              {room.isPrivate ? (
                <Badge variant="outline" size="sm" icon={<Lock className="w-3 h-3" />}>
                  Private
                </Badge>
              ) : (
                <Badge variant="secondary" size="sm" icon={<Globe className="w-3 h-3" />}>
                  Public
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-sub">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {room.participantCount}/{room.maxParticipants}
              </span>
              <span className="flex items-center gap-1">
                {room.mode === 'time' ? (
                  <>
                    <Clock className="w-4 h-4" />
                    {room.timeLimit}s
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    {room.wordLimit} words
                  </>
                )}
              </span>
              <span className="text-xs">{timeAgo}</span>
            </div>

            <div className="mt-2 text-sm">
              <span className="text-sub">Host: </span>
              <span className="text-text">{room.host.username}</span>
              <span className="text-sub ml-1">Lv.{room.host.level}</span>
            </div>
          </div>

          <Button size="sm" onClick={onJoin} leftIcon={<LogIn className="w-4 h-4" />}>
            Join
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Race History Card Component
 */
function RaceHistoryCard({ entry }: { entry: RaceHistoryEntry }) {
  const positionColors: Record<number, string> = {
    1: 'text-main',
    2: 'text-text',
    3: 'text-text',
  };

  return (
    <div className="flex items-center justify-between py-3 border-b border-sub-alt last:border-0 transition-all duration-125">
      <div className="flex items-center gap-4">
        <div className={`text-2xl font-bold ${positionColors[entry.position] || 'text-sub'}`}>
          #{entry.position}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-main">{entry.roomCode}</span>
            <span className="text-xs text-sub">
              {entry.mode === 'time' ? `${entry.modeValue}s` : `${entry.modeValue} words`}
            </span>
          </div>
          <div className="text-xs text-sub">
            {entry.totalRacers} racers - {formatDate(entry.date)}
          </div>
        </div>
      </div>

      <div className="text-right">
        <div className="text-lg font-bold text-main">{entry.wpm} WPM</div>
        <div className="text-xs text-sub">{entry.accuracy}% acc</div>
      </div>
    </div>
  );
}

/**
 * Helper function to get time ago string
 */
function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

/**
 * Helper function to format date
 */
function formatDate(date: Date): string {
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString();
}

/**
 * Multiplayer Lobby Page
 * Main hub for creating/joining multiplayer race rooms
 */
export default function MultiplayerPage() {
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [publicRooms, setPublicRooms] = useState<RoomData[]>([]);
  const [raceHistory, setRaceHistory] = useState<RaceHistoryEntry[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [roomsError, setRoomsError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const isAuthenticated = useUserStore((state) => state.isAuthenticated);

  // Fetch public rooms
  const fetchRooms = async () => {
    setIsLoadingRooms(true);
    setRoomsError(null);
    try {
      const response = await fetch('/api/race?action=list');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch rooms');
      }
      const data = await response.json();
      setPublicRooms(data.rooms || []);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
      setRoomsError(error instanceof Error ? error.message : 'Failed to fetch rooms');
      setPublicRooms([]);
    } finally {
      setIsLoadingRooms(false);
    }
  };

  // Fetch race history for authenticated users
  const fetchRaceHistory = useCallback(async () => {
    if (!isAuthenticated) {
      setRaceHistory([]);
      return;
    }

    setIsLoadingHistory(true);
    setHistoryError(null);
    try {
      const response = await fetch('/api/race?action=history');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch race history');
      }
      const data = await response.json();
      // Transform API response to match RaceHistoryEntry type
      const history: RaceHistoryEntry[] = (data.history || []).map((entry: {
        id: string;
        roomCode: string;
        finishedAt: string;
        position: number;
        totalRacers: number;
        wpm: number;
        accuracy: number;
        mode: 'time' | 'words';
        timeLimit?: number;
        wordLimit?: number;
      }) => ({
        id: entry.id,
        roomCode: entry.roomCode,
        date: new Date(entry.finishedAt),
        position: entry.position,
        totalRacers: entry.totalRacers,
        wpm: entry.wpm,
        accuracy: entry.accuracy,
        mode: entry.mode,
        modeValue: entry.mode === 'time' ? entry.timeLimit : entry.wordLimit,
      }));
      setRaceHistory(history);
    } catch (error) {
      console.error('Failed to fetch race history:', error);
      setHistoryError(error instanceof Error ? error.message : 'Failed to fetch race history');
      setRaceHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [isAuthenticated]);

  // Fetch data on mount and when authentication changes
  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    fetchRaceHistory();
  }, [isAuthenticated, fetchRaceHistory]);

  // Handle room creation
  const handleCreateRoom = async (config: {
    mode: 'time' | 'words';
    timeLimit: number;
    wordLimit: number;
    maxParticipants: number;
    isPrivate: boolean;
  }) => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/multiplayer');
      return;
    }

    try {
      const response = await fetch('/api/race', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error('Failed to create room');
      }

      const data = await response.json();
      setIsCreateModalOpen(false);
      router.push(`/multiplayer/${data.room.code}`);
    } catch (error) {
      console.error('Error creating room:', error);
      // In production, show error toast
    }
  };

  // Handle room join
  const handleJoinRoom = async (code: string) => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/multiplayer/${code}`);
      return;
    }

    try {
      // Check if room exists
      const response = await fetch(`/api/race?code=${code}`);

      if (!response.ok) {
        throw new Error('Room not found');
      }

      setIsJoinModalOpen(false);
      router.push(`/multiplayer/${code}`);
    } catch (error) {
      console.error('Error joining room:', error);
      // In production, show error toast
    }
  };

  // Handle quick join from room list
  const handleQuickJoin = (room: RoomData) => {
    router.push(`/multiplayer/${room.code}`);
  };

  // Refresh rooms
  const handleRefreshRooms = async () => {
    await fetchRooms();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Users className="w-8 h-8 text-main" />
          <h1 className="text-3xl font-bold text-text">Multiplayer</h1>
        </div>
        <p className="text-sub">
          Race against other typists in real-time. Create a room or join an existing one.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mb-8">
        <Button
          size="lg"
          onClick={() => setIsCreateModalOpen(true)}
          leftIcon={<Plus className="w-5 h-5" />}
        >
          Create Room
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={() => setIsJoinModalOpen(true)}
          leftIcon={<LogIn className="w-5 h-5" />}
        >
          Join with Code
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Public Rooms List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Active Rooms
                  </CardTitle>
                  <CardDescription>Public rooms waiting for players</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefreshRooms}
                  loading={isLoadingRooms}
                  leftIcon={<RefreshCw className="w-4 h-4" />}
                >
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingRooms ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-24 bg-sub-alt rounded-lg animate-pulse"
                    />
                  ))}
                </div>
              ) : roomsError ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-error mx-auto mb-4" />
                  <p className="text-error mb-2">Failed to load rooms</p>
                  <p className="text-sub text-sm mb-4">{roomsError}</p>
                  <Button onClick={handleRefreshRooms} leftIcon={<RefreshCw className="w-4 h-4" />}>
                    Try Again
                  </Button>
                </div>
              ) : publicRooms.length > 0 ? (
                <div className="space-y-4">
                  {publicRooms.map((room) => (
                    <RoomCard
                      key={room.id}
                      room={room}
                      onJoin={() => handleQuickJoin(room)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-sub mx-auto mb-4" />
                  <p className="text-sub mb-4">No active rooms at the moment</p>
                  <Button onClick={() => setIsCreateModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
                    Create the first room
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Race History */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Recent Races
              </CardTitle>
              <CardDescription>Your multiplayer race history</CardDescription>
            </CardHeader>
            <CardContent>
              {isAuthenticated ? (
                isLoadingHistory ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-16 bg-sub-alt rounded animate-pulse"
                      />
                    ))}
                  </div>
                ) : historyError ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-10 h-10 text-error mx-auto mb-3" />
                    <p className="text-error text-sm mb-2">Failed to load history</p>
                    <p className="text-sub text-xs mb-3">{historyError}</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={fetchRaceHistory}
                      leftIcon={<RefreshCw className="w-3 h-3" />}
                    >
                      Retry
                    </Button>
                  </div>
                ) : raceHistory.length > 0 ? (
                  <div>
                    {raceHistory.map((entry) => (
                      <RaceHistoryCard key={entry.id} entry={entry} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Trophy className="w-10 h-10 text-sub mx-auto mb-3" />
                    <p className="text-sub text-sm">No races yet</p>
                    <p className="text-sub text-xs">Join a race to get started!</p>
                  </div>
                )
              ) : (
                <div className="text-center py-8">
                  <Trophy className="w-10 h-10 text-sub mx-auto mb-3" />
                  <p className="text-sub text-sm mb-4">Sign in to track your races</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push('/login?redirect=/multiplayer')}
                  >
                    Sign In
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          {isAuthenticated && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-sm">Your Multiplayer Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-main">12</div>
                    <div className="text-xs text-sub">Races</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-main">5</div>
                    <div className="text-xs text-sub">Wins</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-main">98</div>
                    <div className="text-xs text-sub">Avg WPM</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-main">42%</div>
                    <div className="text-xs text-sub">Win Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateRoom={handleCreateRoom}
      />
      <JoinRoomModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onJoinRoom={handleJoinRoom}
      />
    </div>
  );
}
