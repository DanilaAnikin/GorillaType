import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { RaceRoom } from './race-room';

/**
 * Room data type returned from API
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
  participants: Array<{
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
  }>;
  participantCount: number;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
}

/**
 * Generate metadata for the race room page
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;

  return {
    title: `Race Room ${code.toUpperCase()}`,
    description: `Join the multiplayer typing race in room ${code.toUpperCase()}`,
  };
}

/**
 * Fetch room data from the API
 * In production, this would be a real API call
 */
async function getRoomData(code: string): Promise<RoomData | null> {
  // For server-side rendering, we need the full URL
  // In development, this would be localhost
  // In production, this would be the actual domain
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  try {
    const response = await fetch(`${baseUrl}/api/race?code=${code.toUpperCase()}`, {
      cache: 'no-store', // Always fetch fresh data
    });

    if (!response.ok) {
      if (response.status === 404 || response.status === 410) {
        return null;
      }
      throw new Error('Failed to fetch room data');
    }

    const data = await response.json();
    return data.room;
  } catch (error) {
    console.error('Error fetching room:', error);

    // Return mock data for development/when API is unavailable
    return {
      id: '1',
      code: code.toUpperCase(),
      status: 'waiting',
      mode: 'time',
      timeLimit: 60,
      language: 'english',
      punctuation: false,
      numbers: false,
      maxParticipants: 5,
      isPrivate: false,
      host: {
        id: 'host-1',
        username: 'speedtyper',
        level: 15,
      },
      participants: [
        {
          userId: 'host-1',
          username: 'speedtyper',
          level: 15,
          status: 'ready',
          progress: 0,
        },
        {
          userId: 'user-2',
          username: 'keyboardwizard',
          level: 22,
          status: 'ready',
          progress: 0,
        },
      ],
      participantCount: 2,
      createdAt: new Date().toISOString(),
    };
  }
}

/**
 * Race Room Page
 * Server component that fetches room data and renders the appropriate view
 */
export default async function RaceRoomPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const room = await getRoomData(code);

  // Handle room not found
  if (!room) {
    notFound();
  }

  // Handle cancelled/expired room
  if (room.status === 'cancelled') {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-16rem)] text-center">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-text mb-4">Room Cancelled</h1>
            <div className="w-24 h-1 bg-error mx-auto rounded-full" />
          </div>
          <p className="text-sub max-w-md mb-8">
            This race room has been cancelled by the host.
          </p>
          <Link
            href="/multiplayer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-main text-bg rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Back to Lobby
          </Link>
        </div>
      </div>
    );
  }

  // Render the race room client component with initial data
  return <RaceRoom initialRoom={room} roomCode={code.toUpperCase()} />;
}
