'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Crown,
  Clock,
  Zap,
  Play,
  LogOut,
  Copy,
  Check,
  Trophy,
  Medal,
  ArrowLeft,
  RefreshCw,
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
import { useUserStore } from '@/store/user-store';
import { generateWords } from '@/lib/utils/word-generator';

/**
 * Room data type
 */
interface RoomData {
  id: string;
  code: string;
  status: 'waiting' | 'countdown' | 'racing' | 'finished' | 'cancelled';
  mode: 'time' | 'words';
  timeLimit?: number;
  wordLimit?: number;
  language: string;
  punctuation: boolean;
  numbers: boolean;
  text?: string;
  maxParticipants: number;
  isPrivate: boolean;
  host: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
    level: number;
  };
  participants: Participant[];
  participantCount: number;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
}

interface Participant {
  userId: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  level: number;
  status: 'ready' | 'racing' | 'finished';
  wpm?: number;
  accuracy?: number;
  progress: number;
  finishedAt?: string;
}

interface RaceRoomProps {
  initialRoom: RoomData;
  roomCode: string;
}

/**
 * Race Lobby Component - Waiting for players
 */
function RaceLobby({
  room,
  isHost,
  onStart,
  onLeave,
  isStarting,
}: {
  room: RoomData;
  isHost: boolean;
  onStart: () => void;
  onLeave: () => void;
  isStarting: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const canStart = room.participants.length >= 2;

  return (
    <div className="space-y-6">
      {/* Room Info Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-text">Race Room</h1>
            <Badge variant="secondary" size="md">
              {room.mode === 'time' ? `${room.timeLimit}s` : `${room.wordLimit} words`}
            </Badge>
          </div>
          <p className="text-sub">Waiting for players to join...</p>
        </div>

        {/* Room Code */}
        <div className="flex items-center gap-2">
          <div className="bg-sub-alt rounded-lg px-4 py-2">
            <span className="text-xs text-sub block mb-1">Room Code</span>
            <span className="font-mono text-2xl font-bold text-main tracking-widest">
              {room.code}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={copyCode}
            leftIcon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          >
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>
      </div>

      {/* Participants List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Players ({room.participants.length}/{room.maxParticipants})
          </CardTitle>
          <CardDescription>
            {canStart
              ? 'Ready to start the race!'
              : 'Waiting for at least 2 players to start'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {room.participants.map((participant, index) => (
              <div
                key={participant.userId}
                className="flex items-center justify-between p-3 rounded-lg bg-sub-alt"
              >
                <div className="flex items-center gap-3">
                  {/* Avatar placeholder */}
                  <div className="w-10 h-10 rounded-full bg-main/20 flex items-center justify-center">
                    <span className="text-main font-bold">
                      {participant.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-text">
                        {participant.displayName || participant.username}
                      </span>
                      {participant.userId === room.host.id && (
                        <Crown className="w-4 h-4 text-main" />
                      )}
                    </div>
                    <span className="text-xs text-sub">Lv.{participant.level}</span>
                  </div>
                </div>
                <Badge variant="outline" size="sm">
                  Ready
                </Badge>
              </div>
            ))}

            {/* Empty slots */}
            {Array.from({ length: room.maxParticipants - room.participants.length }).map(
              (_, i) => (
                <div
                  key={`empty-${i}`}
                  className="flex items-center justify-center p-3 rounded-lg border-2 border-dashed border-sub-alt"
                >
                  <span className="text-sub text-sm">Waiting for player...</span>
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-4">
        {isHost && (
          <Button
            size="lg"
            onClick={onStart}
            disabled={!canStart}
            loading={isStarting}
            leftIcon={<Play className="w-5 h-5" />}
          >
            {canStart ? 'Start Race' : 'Need 2+ Players'}
          </Button>
        )}
        <Button
          size="lg"
          variant="outline"
          onClick={onLeave}
          leftIcon={<LogOut className="w-5 h-5" />}
        >
          Leave Room
        </Button>
      </div>

      {!isHost && (
        <p className="text-sub text-sm">
          Waiting for the host to start the race...
        </p>
      )}
    </div>
  );
}

/**
 * Race Test Component - Active typing race
 */
function RaceTest({
  room,
  text,
  onProgress,
  onFinish,
}: {
  room: RoomData;
  text: string;
  onProgress: (progress: number, wpm: number, accuracy: number) => void;
  onFinish: (wpm: number, accuracy: number) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [errors, setErrors] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(room.timeLimit || 60);
  const [isFinished, setIsFinished] = useState(false);

  const words = text.split(' ');
  const totalChars = text.length;

  // Timer for time mode
  useEffect(() => {
    if (room.mode !== 'time' || !startTime || isFinished) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, (room.timeLimit || 60) - elapsed);
      setTimeLeft(remaining);

      if (remaining === 0) {
        // Time's up
        const correctChars = currentIndex;
        const totalTyped = typedText.length;
        const accuracy = totalTyped > 0 ? Math.round((correctChars / totalTyped) * 100) : 0;
        const minutes = (room.timeLimit || 60) / 60;
        const wpm = Math.round(correctChars / 5 / minutes);

        setIsFinished(true);
        onFinish(wpm, accuracy);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [room.mode, room.timeLimit, startTime, isFinished, currentIndex, typedText, onFinish]);

  // Handle keyboard input
  useEffect(() => {
    if (isFinished) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore modifiers
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      // Start timer on first keystroke
      if (!startTime) {
        setStartTime(Date.now());
      }

      const expectedChar = text[currentIndex];

      if (e.key === 'Backspace') {
        e.preventDefault();
        if (typedText.length > 0) {
          setTypedText((prev) => prev.slice(0, -1));
          if (currentIndex > 0) {
            setCurrentIndex((prev) => prev - 1);
          }
        }
        return;
      }

      if (e.key.length === 1) {
        e.preventDefault();

        setTypedText((prev) => prev + e.key);

        if (e.key === expectedChar) {
          const newIndex = currentIndex + 1;
          setCurrentIndex(newIndex);

          // Calculate progress
          const progress = Math.round((newIndex / totalChars) * 100);
          const elapsed = startTime ? (Date.now() - startTime) / 1000 / 60 : 0.01;
          const wpm = Math.round(newIndex / 5 / elapsed);
          const accuracy = Math.round(((typedText.length + 1 - errors) / (typedText.length + 1)) * 100);

          onProgress(progress, wpm, accuracy);

          // Check if finished (words mode or completed text)
          if (newIndex === totalChars) {
            const finalAccuracy = Math.round(((typedText.length + 1 - errors) / (typedText.length + 1)) * 100);
            setIsFinished(true);
            onFinish(wpm, finalAccuracy);
          }
        } else {
          setErrors((prev) => prev + 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, text, typedText, errors, startTime, totalChars, isFinished, onProgress, onFinish]);

  // Calculate current stats
  // eslint-disable-next-line react-hooks/purity
  const elapsed = startTime ? (Date.now() - startTime) / 1000 / 60 : 0;
  const currentWpm = elapsed > 0 ? Math.round(currentIndex / 5 / elapsed) : 0;
  const currentAccuracy = typedText.length > 0
    ? Math.round(((typedText.length - errors) / typedText.length) * 100)
    : 100;

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-main">{currentWpm}</div>
            <div className="text-xs text-sub">WPM</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-text">{currentAccuracy}%</div>
            <div className="text-xs text-sub">Accuracy</div>
          </div>
        </div>
        {room.mode === 'time' && (
          <div className="text-center">
            <div className="text-4xl font-bold text-main">{timeLeft}</div>
            <div className="text-xs text-sub">seconds</div>
          </div>
        )}
      </div>

      {/* Progress Bars */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            {room.participants.map((participant) => (
              <div key={participant.userId} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text">{participant.username}</span>
                  <span className="text-sub">
                    {participant.wpm || 0} WPM - {participant.progress}%
                  </span>
                </div>
                <div className="h-2 bg-sub-alt rounded-full overflow-hidden">
                  <div
                    className="h-full bg-main transition-all duration-300"
                    style={{ width: `${participant.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Text Display */}
      <Card>
        <CardContent className="p-6">
          <div className="font-mono text-lg leading-relaxed">
            {text.split('').map((char, index) => {
              let className = 'text-sub';
              if (index < currentIndex) {
                className = typedText[index] === char ? 'text-text' : 'text-error bg-error/20';
              } else if (index === currentIndex) {
                className = 'text-main border-l-2 border-main animate-pulse';
              }
              return (
                <span key={index} className={className}>
                  {char}
                </span>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-sub text-sm">
        Start typing to begin the race...
      </p>
    </div>
  );
}

/**
 * Race Results Component - Show final standings
 */
function RaceResults({
  room,
  onPlayAgain,
  onLeave,
}: {
  room: RoomData;
  onPlayAgain: () => void;
  onLeave: () => void;
}) {
  // Sort participants by WPM
  const sortedParticipants = [...room.participants].sort(
    (a, b) => (b.wpm || 0) - (a.wpm || 0)
  );

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="w-6 h-6 text-main" />;
      case 2:
        return <Medal className="w-6 h-6 text-text" />;
      case 3:
        return <Medal className="w-6 h-6 text-text" />;
      default:
        return <span className="text-lg font-bold text-sub">#{position}</span>;
    }
  };

  const getPositionBg = (position: number) => {
    switch (position) {
      case 1:
        return 'bg-main/10 border-main/30';
      case 2:
        return 'bg-sub-alt border-sub/30';
      case 3:
        return 'bg-sub-alt border-sub/30';
      default:
        return 'bg-sub-alt border-sub-alt';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-main mb-2">Race Complete!</h1>
        <p className="text-sub">
          {room.mode === 'time'
            ? `${room.timeLimit} second race`
            : `${room.wordLimit} word race`}
        </p>
      </div>

      {/* Standings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Final Standings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sortedParticipants.map((participant, index) => (
              <div
                key={participant.userId}
                className={`flex items-center justify-between p-4 rounded-lg border ${getPositionBg(index + 1)}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 flex justify-center">
                    {getPositionIcon(index + 1)}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-main/20 flex items-center justify-center">
                    <span className="text-main font-bold">
                      {participant.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-text">
                      {participant.displayName || participant.username}
                    </div>
                    <span className="text-xs text-sub">Lv.{participant.level}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-main">
                    {participant.wpm || 0} WPM
                  </div>
                  <div className="text-sm text-sub">
                    {participant.accuracy || 0}% accuracy
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap justify-center gap-4">
        <Button
          size="lg"
          onClick={onPlayAgain}
          leftIcon={<RefreshCw className="w-5 h-5" />}
        >
          Play Again
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={onLeave}
          leftIcon={<ArrowLeft className="w-5 h-5" />}
        >
          Back to Lobby
        </Button>
      </div>
    </div>
  );
}

/**
 * Countdown Component
 */
function Countdown({ seconds, onComplete }: { seconds: number; onComplete: () => void }) {
  const [count, setCount] = useState(seconds);

  useEffect(() => {
    if (count <= 0) {
      onComplete();
      return;
    }

    const timer = setTimeout(() => setCount(count - 1), 1000);
    return () => clearTimeout(timer);
  }, [count, onComplete]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <div className="text-9xl font-bold text-main animate-pulse">{count}</div>
      <p className="text-xl text-sub mt-4">Get ready to type!</p>
    </div>
  );
}

/**
 * Main Race Room Component
 */
export function RaceRoom({ initialRoom, roomCode }: RaceRoomProps) {
  const router = useRouter();
  const [room, setRoom] = useState<RoomData>(initialRoom);
  const [raceText, setRaceText] = useState<string>('');
  const [isStarting, setIsStarting] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);

  const user = useUserStore((state) => state.user);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);

  const isHost = user?.id === room.host.id;
  const currentParticipant = room.participants.find((p) => p.userId === user?.id);

  // Poll for room updates (in production, use WebSocket)
  useEffect(() => {
    if (room.status === 'finished' || room.status === 'cancelled') return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/race?code=${roomCode}`);
        if (response.ok) {
          const data = await response.json();
          setRoom(data.room);

          // Handle countdown start
          if (data.room.status === 'countdown' && !showCountdown) {
            setShowCountdown(true);
            // Use the server-provided text, or generate fallback
            if (data.room.text) {
              setRaceText(data.room.text);
            } else {
              const lang = (data.room.language || 'english') as 'english' | 'programming' | 'custom';
              const words = generateWords(lang, data.room.wordLimit || 50, {
                punctuation: data.room.punctuation,
                numbers: data.room.numbers,
              });
              setRaceText(words.join(' '));
            }
          }
        }
      } catch (error) {
        console.error('Error polling room:', error);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [roomCode, room.status, showCountdown]);

  // Join room on mount if authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/multiplayer/${roomCode}`);
      return;
    }

    const joinRoom = async () => {
      try {
        await fetch('/api/race', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: roomCode, action: 'join' }),
        });
      } catch (error) {
        console.error('Error joining room:', error);
      }
    };

    if (!currentParticipant) {
      joinRoom();
    }
  }, [isAuthenticated, roomCode, currentParticipant, router]);

  // Handle start race
  const handleStartRace = async () => {
    setIsStarting(true);

    try {
      // Generate race text using the room's configured language
      const lang = (room.language || 'english') as 'english' | 'programming' | 'custom';
      const words = generateWords(lang, room.wordLimit || 50, {
        punctuation: room.punctuation,
        numbers: room.numbers,
      });
      const text = words.join(' ');

      await fetch('/api/race', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: roomCode,
          action: 'start',
          text,
        }),
      });

      setRaceText(text);
      setShowCountdown(true);
    } catch (error) {
      console.error('Error starting race:', error);
    } finally {
      setIsStarting(false);
    }
  };

  // Handle leave room
  const handleLeaveRoom = async () => {
    try {
      await fetch('/api/race', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: roomCode, action: 'leave' }),
      });
    } catch (error) {
      console.error('Error leaving room:', error);
    }

    router.push('/multiplayer');
  };

  // Handle progress update
  const handleProgress = useCallback(
    async (progress: number, wpm: number, accuracy: number) => {
      // Update local state
      setRoom((prev) => ({
        ...prev,
        participants: prev.participants.map((p) =>
          p.userId === user?.id ? { ...p, progress, wpm, accuracy } : p
        ),
      }));

      // In production, send to server via WebSocket
    },
    [user?.id]
  );

  // Handle race finish
  const handleFinish = useCallback(
    async (wpm: number, accuracy: number) => {
      // Update local state
      setRoom((prev) => ({
        ...prev,
        participants: prev.participants.map((p) =>
          p.userId === user?.id
            ? { ...p, status: 'finished', wpm, accuracy, progress: 100 }
            : p
        ),
      }));

      // Only the host can transition the room to finished
      // Individual participant completion is tracked via local state + polling
      if (isHost) {
        // Wait a moment for other participants, then finish the room
        setTimeout(async () => {
          try {
            await fetch('/api/race', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                code: roomCode,
                action: 'finish',
              }),
            });
          } catch (error) {
            console.error('Error finishing race:', error);
          }
        }, 3000);
      }

      // Mark room as finished after a delay (polling will also pick this up)
      setTimeout(() => {
        setRoom((prev) => ({ ...prev, status: 'finished' }));
      }, 5000);
    },
    [user?.id, roomCode, isHost]
  );

  // Handle countdown complete
  const handleCountdownComplete = useCallback(() => {
    setShowCountdown(false);
    setRoom((prev) => ({ ...prev, status: 'racing' }));
  }, []);

  // Handle play again
  const handlePlayAgain = () => {
    setRoom((prev) => ({
      ...prev,
      status: 'waiting',
      participants: prev.participants.map((p) => ({
        ...p,
        status: 'ready',
        wpm: undefined,
        accuracy: undefined,
        progress: 0,
      })),
    }));
    setRaceText('');
  };

  // Render based on room status
  return (
    <div className="container mx-auto px-4 py-8">
      {showCountdown ? (
        <Countdown seconds={3} onComplete={handleCountdownComplete} />
      ) : room.status === 'waiting' ? (
        <RaceLobby
          room={room}
          isHost={isHost}
          onStart={handleStartRace}
          onLeave={handleLeaveRoom}
          isStarting={isStarting}
        />
      ) : room.status === 'racing' ? (
        <RaceTest
          room={room}
          text={raceText || room.text || ''}
          onProgress={handleProgress}
          onFinish={handleFinish}
        />
      ) : room.status === 'finished' ? (
        <RaceResults
          room={room}
          onPlayAgain={handlePlayAgain}
          onLeave={handleLeaveRoom}
        />
      ) : null}
    </div>
  );
}
