import Link from 'next/link';
import { Users, ArrowLeft, Search } from 'lucide-react';

/**
 * 404 Not Found page for race rooms.
 * Displayed when a user navigates to a non-existent room code.
 */
export default function RoomNotFound() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-16rem)] text-center">
        {/* 404 Display */}
        <div className="mb-8">
          <Users className="w-20 h-20 text-main mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold text-text mb-4">
            Room Not Found
          </h1>
          <div className="w-24 h-1 bg-main mx-auto rounded-full" />
        </div>

        {/* Message */}
        <p className="text-sub max-w-md mb-8">
          The race room you are looking for does not exist, has expired, or has been cancelled.
          Room codes are valid for 1 hour after creation.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/multiplayer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-main text-bg rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            <Users className="w-5 h-5" />
            Go to Multiplayer Lobby
          </Link>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-sub-alt text-text rounded-lg font-medium hover:bg-sub/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </Link>
        </div>

        {/* Helpful Tips */}
        <div className="mt-12 pt-8 border-t border-sub-alt max-w-md">
          <p className="text-sm text-sub mb-4">Possible reasons:</p>
          <ul className="text-sm text-sub text-left space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-main">-</span>
              The room code was entered incorrectly
            </li>
            <li className="flex items-start gap-2">
              <span className="text-main">-</span>
              The room has expired (older than 1 hour)
            </li>
            <li className="flex items-start gap-2">
              <span className="text-main">-</span>
              The host cancelled the room
            </li>
            <li className="flex items-start gap-2">
              <span className="text-main">-</span>
              The room was a private room and is no longer available
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
