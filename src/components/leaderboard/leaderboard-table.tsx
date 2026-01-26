"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { formatDate, formatPercentage, formatOrdinal } from "@/lib/utils/formatting";
import { ChevronLeft, ChevronRight, Trophy } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";

/**
 * Leaderboard entry structure.
 */
export interface LeaderboardEntry {
  id: string;
  rank: number;
  userId: string;
  username: string;
  avatarUrl?: string;
  wpm: number;
  accuracy: number;
  consistency: number;
  date: Date | string;
}

/**
 * Props for the LeaderboardTable component.
 */
export interface LeaderboardTableProps {
  /** Array of leaderboard entries */
  entries: LeaderboardEntry[];
  /** Current user's ID (to highlight their row) */
  currentUserId?: string;
  /** Number of entries per page */
  pageSize?: number;
  /** Total number of entries (for server-side pagination) */
  totalEntries?: number;
  /** Current page (1-indexed, for controlled pagination) */
  currentPage?: number;
  /** Callback when page changes */
  onPageChange?: (page: number) => void;
  /** Whether the data is loading */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Loading skeleton for table rows.
 */
function TableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b border-sub/50">
          <td className="py-4 px-4">
            <div className="h-5 w-8 bg-sub-alt rounded animate-pulse" />
          </td>
          <td className="py-4 px-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-sub-alt animate-pulse" />
              <div className="h-5 w-24 bg-sub-alt rounded animate-pulse" />
            </div>
          </td>
          <td className="py-4 px-4 text-right">
            <div className="h-5 w-12 bg-sub-alt rounded animate-pulse ml-auto" />
          </td>
          <td className="py-4 px-4 text-right">
            <div className="h-5 w-14 bg-sub-alt rounded animate-pulse ml-auto" />
          </td>
          <td className="py-4 px-4 text-right">
            <div className="h-5 w-14 bg-sub-alt rounded animate-pulse ml-auto" />
          </td>
          <td className="py-4 px-4 text-right">
            <div className="h-5 w-20 bg-sub-alt rounded animate-pulse ml-auto" />
          </td>
        </tr>
      ))}
    </>
  );
}

/**
 * Get rank badge styling based on position.
 */
function getRankBadge(rank: number): { icon: React.ReactNode; className: string } | null {
  if (rank === 1) {
    return {
      icon: <Trophy className="w-4 h-4" />,
      className: "bg-main/10 text-main border border-main/30"
    };
  }
  if (rank === 2) {
    return {
      icon: <Trophy className="w-4 h-4" />,
      className: "bg-sub-alt text-text border border-sub/30"
    };
  }
  if (rank === 3) {
    return {
      icon: <Trophy className="w-4 h-4" />,
      className: "bg-sub-alt text-text border border-sub/30"
    };
  }
  return null;
}

/**
 * Get color class based on WPM value.
 */
function getWPMColor(wpm: number): string {
  if (wpm >= 120) return "text-main";
  return "text-text";
}

/**
 * Get color class based on accuracy value.
 */
function getAccuracyColor(accuracy: number): string {
  if (accuracy >= 98) return "text-main";
  if (accuracy >= 90) return "text-text";
  return "text-error";
}

/**
 * LeaderboardTable displays a ranked table of typing test results.
 *
 * @example
 * <LeaderboardTable
 *   entries={[
 *     {
 *       id: "1",
 *       rank: 1,
 *       userId: "user1",
 *       username: "speedtyper",
 *       wpm: 150,
 *       accuracy: 98.5,
 *       consistency: 92.3,
 *       date: new Date()
 *     }
 *   ]}
 *   currentUserId="user2"
 *   pageSize={25}
 * />
 */
export function LeaderboardTable({
  entries,
  currentUserId,
  pageSize = 25,
  totalEntries,
  currentPage: controlledPage,
  onPageChange,
  isLoading = false,
  className
}: LeaderboardTableProps) {
  const [internalPage, setInternalPage] = useState(1);

  // Use controlled or internal pagination
  const isControlled = controlledPage !== undefined && onPageChange !== undefined;
  const currentPage = isControlled ? controlledPage : internalPage;

  // Calculate total pages
  const total = totalEntries ?? entries.length;
  const totalPages = Math.ceil(total / pageSize);

  // Paginate entries (only for uncontrolled mode)
  const displayedEntries = useMemo(() => {
    if (isControlled || isLoading) return entries;
    const start = (currentPage - 1) * pageSize;
    return entries.slice(start, start + pageSize);
  }, [entries, currentPage, pageSize, isControlled, isLoading]);

  // Handle page changes
  const goToPage = (page: number) => {
    const newPage = Math.max(1, Math.min(page, totalPages));
    if (isControlled) {
      onPageChange!(newPage);
    } else {
      setInternalPage(newPage);
    }
  };

  return (
    <div
      className={cn(
        "rounded-lg bg-bg border border-sub transition-all duration-125",
        className
      )}
    >
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-sub border-b border-sub">
              <th className="py-4 px-4 font-medium w-16">Rank</th>
              <th className="py-4 px-4 font-medium">User</th>
              <th className="py-4 px-4 font-medium text-right">WPM</th>
              <th className="py-4 px-4 font-medium text-right">Accuracy</th>
              <th className="py-4 px-4 font-medium text-right">Consistency</th>
              <th className="py-4 px-4 font-medium text-right">Date</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <TableSkeleton rows={pageSize} />
            ) : displayedEntries.length > 0 ? (
              displayedEntries.map((entry) => {
                const isCurrentUser = entry.userId === currentUserId;
                const rankBadge = getRankBadge(entry.rank);

                return (
                  <tr
                    key={entry.id}
                    className={cn(
                      "border-b border-sub/50 transition-all duration-125",
                      isCurrentUser
                        ? "bg-main/10 hover:bg-main/15"
                        : "hover:bg-sub-alt/30"
                    )}
                  >
                    {/* Rank */}
                    <td className="py-4 px-4">
                      {rankBadge ? (
                        <div
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-sm font-bold transition-all duration-125",
                            rankBadge.className
                          )}
                        >
                          {rankBadge.icon}
                          {entry.rank}
                        </div>
                      ) : (
                        <span className="text-sub font-medium pl-2">
                          {formatOrdinal(entry.rank)}
                        </span>
                      )}
                    </td>

                    {/* User */}
                    <td className="py-4 px-4">
                      <Link
                        href={`/profile/${entry.username}`}
                        className="flex items-center gap-3 group"
                      >
                        <Avatar
                          src={entry.avatarUrl}
                          alt={`${entry.username || 'User'}'s avatar`}
                          fallback={entry.username?.charAt(0) || '?'}
                          size="md"
                          bordered
                          className="group-hover:ring-main transition-all duration-125"
                        />
                        <span
                          className={cn(
                            "font-medium transition-all duration-125 group-hover:text-main",
                            isCurrentUser ? "text-main" : "text-text"
                          )}
                        >
                          {entry.username || 'Unknown'}
                          {isCurrentUser && (
                            <span className="ml-2 text-xs text-main">(you)</span>
                          )}
                        </span>
                      </Link>
                    </td>

                    {/* WPM */}
                    <td className="py-4 px-4 text-right">
                      <span className={cn("font-bold text-lg transition-all duration-125", getWPMColor(entry.wpm))}>
                        {Math.round(entry.wpm)}
                      </span>
                    </td>

                    {/* Accuracy */}
                    <td className="py-4 px-4 text-right">
                      <span className={cn("text-sm transition-all duration-125", getAccuracyColor(entry.accuracy))}>
                        {formatPercentage(entry.accuracy, { decimals: 1 })}
                      </span>
                    </td>

                    {/* Consistency */}
                    <td className="py-4 px-4 text-right">
                      <span className="text-sm text-sub transition-all duration-125">
                        {formatPercentage(entry.consistency, { decimals: 1 })}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-4 px-4 text-right">
                      <span className="text-sm text-sub transition-all duration-125">
                        {formatDate(entry.date, { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="py-12 text-center text-sub">
                  <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No entries found.</p>
                  <p className="text-sm mt-1">Be the first to set a record!</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && !isLoading && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-sub">
          <p className="text-sm text-sub">
            Showing {((currentPage - 1) * pageSize) + 1}-
            {Math.min(currentPage * pageSize, total)} of {total.toLocaleString()} entries
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className={cn(
                "p-2 rounded-lg transition-all duration-125",
                currentPage === 1
                  ? "text-sub/50 cursor-not-allowed"
                  : "text-sub hover:bg-sub-alt hover:text-text"
              )}
              aria-label="Previous page"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let page: number;
                if (totalPages <= 5) {
                  page = i + 1;
                } else if (currentPage <= 3) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i;
                } else {
                  page = currentPage - 2 + i;
                }

                return (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={cn(
                      "w-8 h-8 text-sm rounded-lg transition-all duration-125",
                      currentPage === page
                        ? "bg-main text-bg font-bold"
                        : "text-sub hover:bg-sub-alt hover:text-text"
                    )}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={cn(
                "p-2 rounded-lg transition-all duration-125",
                currentPage === totalPages
                  ? "text-sub/50 cursor-not-allowed"
                  : "text-sub hover:bg-sub-alt hover:text-text"
              )}
              aria-label="Next page"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default LeaderboardTable;
