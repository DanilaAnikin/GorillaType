'use client';

import Link from 'next/link';
import { Home, ArrowLeft, Search } from 'lucide-react';

/**
 * 404 Not Found page.
 * Displayed when a user navigates to a non-existent route.
 */
export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-16rem)] text-center">
        {/* 404 Display */}
        <div className="mb-8">
          <h1 className="text-8xl md:text-9xl font-bold text-main mb-4">404</h1>
          <div className="w-24 h-1 bg-main mx-auto rounded-full" />
        </div>

        {/* Message */}
        <h2 className="text-2xl md:text-3xl font-semibold text-text mb-4">
          Page Not Found
        </h2>
        <p className="text-sub max-w-md mb-8">
          Oops! The page you are looking for does not exist or has been moved.
          Perhaps you mistyped the URL?
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-main text-bg rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            <Home className="w-5 h-5" />
            Go to Homepage
          </Link>

          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-sub-alt text-text rounded-lg font-medium hover:bg-sub/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
        </div>

        {/* Helpful Links */}
        <div className="mt-12 pt-8 border-t border-sub-alt">
          <p className="text-sm text-sub mb-4">Looking for something specific?</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link
              href="/"
              className="text-main hover:underline"
            >
              Typing Test
            </Link>
            <Link
              href="/leaderboards"
              className="text-main hover:underline"
            >
              Leaderboards
            </Link>
            <Link
              href="/about"
              className="text-main hover:underline"
            >
              About
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
