"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils/cn";
import { formatDate, formatRelativeTime, formatPercentage } from "@/lib/utils/formatting";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Type,
  Quote,
  Filter,
  History
} from "lucide-react";

/**
 * Test result record.
 */
export interface TestResult {
  id: string;
  date: Date | string;
  mode: "time" | "words" | "quote";
  modeValue: number | string; // e.g., 30 for time, 50 for words, "short" for quote
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;
  characters: {
    correct: number;
    incorrect: number;
    extra: number;
    missed: number;
  };
}

/**
 * Props for the TestHistory component.
 */
export interface TestHistoryProps {
  /** Array of test results */
  results: TestResult[];
  /** Number of results per page */
  pageSize?: number;
  /** Whether to use infinite scroll instead of pagination */
  useInfiniteScroll?: boolean;
  /** Callback when load more is triggered (for infinite scroll) */
  onLoadMore?: () => void;
  /** Whether more results are available */
  hasMore?: boolean;
  /** Whether loading more results */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Mode filter options.
 */
type ModeFilter = "all" | "time" | "words" | "quote";

/**
 * Get mode icon component.
 */
function getModeIcon(mode: string) {
  switch (mode) {
    case "time":
      return <Clock className="w-4 h-4" />;
    case "words":
      return <Type className="w-4 h-4" />;
    case "quote":
      return <Quote className="w-4 h-4" />;
    default:
      return null;
  }
}

/**
 * Format mode display text.
 */
function formatMode(mode: string, value: number | string): string {
  switch (mode) {
    case "time":
      return `${value}s`;
    case "words":
      return `${value} words`;
    case "quote":
      return `${value}`;
    default:
      return String(value);
  }
}

/**
 * TestHistory displays a table of recent typing test results with filtering and pagination.
 *
 * @example
 * <TestHistory
 *   results={[
 *     {
 *       id: "1",
 *       date: new Date(),
 *       mode: "time",
 *       modeValue: 30,
 *       wpm: 95,
 *       rawWpm: 102,
 *       accuracy: 96.5,
 *       consistency: 85.2,
 *       characters: { correct: 280, incorrect: 8, extra: 2, missed: 1 }
 *     }
 *   ]}
 *   pageSize={10}
 * />
 */
export function TestHistory({
  results,
  pageSize = 10,
  useInfiniteScroll = false,
  onLoadMore,
  hasMore = false,
  isLoading = false,
  className
}: TestHistoryProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [modeFilter, setModeFilter] = useState<ModeFilter>("all");

  // Filter results by mode
  const filteredResults = useMemo(() => {
    if (modeFilter === "all") return results;
    return results.filter((result) => result.mode === modeFilter);
  }, [results, modeFilter]);

  // Paginate results
  const totalPages = Math.ceil(filteredResults.length / pageSize);
  const paginatedResults = useMemo(() => {
    if (useInfiniteScroll) return filteredResults;
    const start = (currentPage - 1) * pageSize;
    return filteredResults.slice(start, start + pageSize);
  }, [filteredResults, currentPage, pageSize, useInfiniteScroll]);

  // Handle page changes
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <div
      className={cn(
        "rounded-lg bg-sub-alt border border-sub p-6 transition-all duration-125",
        className
      )}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-sub" />
          <h2 className="text-xl font-semibold text-text">Test History</h2>
          <span className="text-sm text-sub">
            ({filteredResults.length} tests)
          </span>
        </div>

        {/* Mode Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-sub" />
          <div className="flex bg-bg rounded-lg p-1 transition-all duration-125">
            {(["all", "time", "words", "quote"] as ModeFilter[]).map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  setModeFilter(mode);
                  setCurrentPage(1);
                }}
                className={cn(
                  "px-3 py-1 text-sm rounded-md transition-all duration-125 capitalize",
                  modeFilter === mode
                    ? "bg-sub-alt text-text"
                    : "text-sub hover:text-text"
                )}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      {paginatedResults.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-sub border-b border-sub/30">
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">Mode</th>
                <th className="pb-3 font-medium text-right">WPM</th>
                <th className="pb-3 font-medium text-right">Raw</th>
                <th className="pb-3 font-medium text-right">Accuracy</th>
                <th className="pb-3 font-medium text-right">Consistency</th>
                <th className="pb-3 font-medium text-right">Chars</th>
              </tr>
            </thead>
            <tbody>
              {paginatedResults.map((result) => (
                <tr
                  key={result.id}
                  className="border-b border-sub/20 hover:bg-bg/30 transition-all duration-125"
                >
                  <td className="py-3">
                    <div>
                      <p className="text-sm text-text">
                        {formatDate(result.date, { month: "short", day: "numeric" })}
                      </p>
                      <p className="text-xs text-sub">
                        {formatRelativeTime(result.date)}
                      </p>
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sub">
                        {getModeIcon(result.mode)}
                      </span>
                      <span className="text-sm text-text">
                        {formatMode(result.mode, result.modeValue)}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 text-right">
                    <span className="font-bold text-main">
                      {Math.round(result.wpm)}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <span className="text-sm text-sub">
                      {Math.round(result.rawWpm)}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <span className={cn(
                      "text-sm",
                      result.accuracy >= 95 ? "text-main" : "text-error"
                    )}>
                      {formatPercentage(result.accuracy, { decimals: 1 })}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <span className="text-sm text-sub">
                      {formatPercentage(result.consistency, { decimals: 1 })}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <span className="text-xs text-sub">
                      <span className="text-main">{result.characters.correct}</span>
                      /
                      <span className="text-error">{result.characters.incorrect}</span>
                      /
                      <span className="text-sub">{result.characters.extra}</span>
                      /
                      <span className="text-sub">{result.characters.missed}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 text-sub">
          <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No test history found.</p>
          {modeFilter !== "all" && (
            <button
              onClick={() => setModeFilter("all")}
              className="text-sm text-main hover:underline mt-2 transition-all duration-125"
            >
              Clear filter
            </button>
          )}
        </div>
      )}

      {/* Pagination */}
      {!useInfiniteScroll && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-sub/30">
          <p className="text-sm text-sub">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className={cn(
                "p-2 rounded-lg transition-all duration-125",
                currentPage === 1
                  ? "text-sub/40 cursor-not-allowed"
                  : "text-sub hover:bg-bg hover:text-text"
              )}
              aria-label="Previous page"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={cn(
                "p-2 rounded-lg transition-all duration-125",
                currentPage === totalPages
                  ? "text-sub/40 cursor-not-allowed"
                  : "text-sub hover:bg-bg hover:text-text"
              )}
              aria-label="Next page"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Infinite Scroll Load More */}
      {useInfiniteScroll && hasMore && (
        <div className="mt-4 text-center">
          <button
            onClick={onLoadMore}
            disabled={isLoading}
            className={cn(
              "px-4 py-2 bg-sub-alt hover:bg-sub/20 text-text text-sm font-medium rounded-lg transition-all duration-125",
              isLoading && "opacity-50 cursor-not-allowed"
            )}
          >
            {isLoading ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}

export default TestHistory;
