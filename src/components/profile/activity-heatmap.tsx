"use client";

import { Fragment, useMemo, useState, useCallback } from "react";
import { cn } from "@/lib/utils/cn";
import { formatDate, formatNumber } from "@/lib/utils/formatting";
import { Activity } from "lucide-react";

/**
 * Timeline range options for the heatmap.
 */
const TIMELINE_OPTIONS = [
  { label: "Week", days: 7 },
  { label: "Month", days: 30 },
  { label: "Year", days: 365 },
  { label: "500 Days", days: 500 },
  { label: "Max", days: 0 },
] as const;

type TimelineDays = (typeof TIMELINE_OPTIONS)[number]["days"];

/**
 * Activity data for a single day.
 */
export interface DayActivity {
  date: string; // ISO date string (YYYY-MM-DD)
  count: number;
  totalWPM?: number;
  totalTime?: number; // in seconds
}

/**
 * Props for the ActivityHeatmap component.
 */
export interface ActivityHeatmapProps {
  /** Activity data array */
  activities: DayActivity[];
  /** Number of weeks to display (legacy prop, overridden by defaultDays) */
  weeks?: number;
  /** Default number of days to display (default: 500). Pass 0 for max. */
  defaultDays?: TimelineDays | number;
  /** Additional CSS classes */
  className?: string;
  /** Callback when a day is clicked */
  onDayClick?: (activity: DayActivity | null, date: string) => void;
  /** Called when the user selects a different timeline range. */
  onTimelineChange?: (days: number) => void;
}

/**
 * Get color intensity class based on activity count.
 */
function getActivityColor(count: number, maxCount: number): string {
  if (count === 0) return "bg-sub-alt";

  const intensity = count / maxCount;

  if (intensity >= 0.8) return "bg-main";
  if (intensity >= 0.6) return "bg-main/80";
  if (intensity >= 0.4) return "bg-main/60";
  if (intensity >= 0.2) return "bg-main/40";
  return "bg-main/20";
}

/**
 * Get day of week names.
 */
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Get month names.
 */
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

/**
 * ActivityHeatmap displays a GitHub-style contribution heatmap showing daily test activity.
 * Supports configurable timeline ranges via a selector row.
 *
 * @example
 * <ActivityHeatmap
 *   activities={[
 *     { date: "2024-01-15", count: 5, totalWPM: 450, totalTime: 900 },
 *     { date: "2024-01-16", count: 3, totalWPM: 270, totalTime: 540 },
 *   ]}
 *   defaultDays={500}
 * />
 */
export function ActivityHeatmap({
  activities,
  weeks: weeksProp,
  defaultDays = 500,
  className,
  onDayClick,
  onTimelineChange,
}: ActivityHeatmapProps) {
  const [selectedDays, setSelectedDays] = useState<number>(defaultDays);

  const handleTimelineChange = useCallback((days: number) => {
    setSelectedDays(days);
    onTimelineChange?.(days);
  }, [onTimelineChange]);

  // Create activity map for quick lookup
  const activityMap = useMemo(() => {
    const map = new Map<string, DayActivity>();
    activities.forEach((activity) => {
      map.set(activity.date, activity);
    });
    return map;
  }, [activities]);

  /**
   * Determine the effective number of days to render.
   * For "Max", use all available data span.
   */
  const effectiveDays = useMemo(() => {
    if (selectedDays === 0) {
      // Max: determine span from data
      if (activities.length === 0) return 90;
      const dates = activities.map(a => new Date(a.date).getTime());
      const minDate = Math.min(...dates);
      const now = new Date().getTime();
      return Math.max(Math.ceil((now - minDate) / (24 * 60 * 60 * 1000)) + 1, 7);
    }
    return selectedDays;
  }, [selectedDays, activities]);

  /**
   * Convert days to weeks for the grid.
   */
  const effectiveWeeks = useMemo(() => {
    return Math.ceil(effectiveDays / 7);
  }, [effectiveDays]);

  /**
   * Compute minimum cell size based on the number of days to display.
   * Larger ranges get smaller minimum cells; actual size stretches to fill the container.
   */
  const minCellSize = useMemo(() => {
    if (effectiveDays <= 30) return 14;
    if (effectiveDays <= 90) return 12;
    if (effectiveDays <= 365) return 11;
    return 8;
  }, [effectiveDays]);

  const gapSize = minCellSize <= 8 ? 2 : 3;

  // Calculate max count for color scaling
  const maxCount = useMemo(() => {
    if (activities.length === 0) return 1;
    return Math.max(...activities.map((a) => a.count), 1);
  }, [activities]);

  // Generate calendar grid
  const { grid, monthLabels, totalTests, activeDays } = useMemo(() => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (effectiveWeeks * 7) + 1);

    // Adjust to start on Sunday
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);

    const grid: (DayActivity | null)[][] = [];
    const monthLabels: { month: string; weekIndex: number }[] = [];
    let totalTests = 0;
    let activeDays = 0;
    let currentMonth = -1;

    for (let week = 0; week < effectiveWeeks; week++) {
      const weekData: (DayActivity | null)[] = [];

      for (let day = 0; day < 7; day++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + (week * 7) + day);

        // Check if this day is in the future
        if (date > today) {
          weekData.push(null);
          continue;
        }

        const dateStr = date.toISOString().split("T")[0];
        const activity = activityMap.get(dateStr) || { date: dateStr, count: 0 };

        // Track month labels
        const month = date.getMonth();
        if (month !== currentMonth && day === 0) {
          monthLabels.push({ month: MONTHS[month], weekIndex: week });
          currentMonth = month;
        }

        // Track totals
        totalTests += activity.count;
        if (activity.count > 0) activeDays++;

        weekData.push(activity);
      }

      grid.push(weekData);
    }

    return { grid, monthLabels, totalTests, activeDays };
  }, [activityMap, effectiveWeeks]);

  /** Build the timeline summary label. */
  const timelineSummaryLabel = useMemo(() => {
    if (selectedDays === 0) return "all time";
    if (selectedDays === 365) return "this year";
    const option = TIMELINE_OPTIONS.find(o => o.days === selectedDays);
    if (option) {
      if (selectedDays <= 30) return `last ${option.label.toLowerCase()}`;
      return `last ${selectedDays} days`;
    }
    return `last ${selectedDays} days`;
  }, [selectedDays]);

  return (
    <div
      className={cn(
        "w-full rounded-lg bg-sub-alt border border-sub p-6 transition-all duration-125",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-main" />
          <h2 className="text-xl font-semibold text-text">Activity</h2>
        </div>
        <div className="text-sm text-sub">
          <span className="text-main font-medium">{formatNumber(totalTests)}</span>
          {" tests in "}
          <span className="text-main font-medium">{activeDays}</span>
          {` days ${timelineSummaryLabel}`}
        </div>
      </div>

      {/* Timeline selector */}
      <div className="flex gap-1 mb-4">
        {TIMELINE_OPTIONS.map(option => {
          const isSelected = selectedDays === option.days;
          return (
            <button
              key={option.label}
              onClick={() => handleTimelineChange(option.days)}
              className={cn(
                "px-2.5 py-1 rounded text-xs font-mono font-medium transition-all duration-125 border",
                isSelected
                  ? "bg-main text-bg border-main"
                  : "bg-transparent text-sub border-sub/40 hover:text-text hover:border-sub"
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {/* Heatmap */}
      <div className="w-full overflow-x-auto">
        <div className="w-full">
          {/* Month labels row - uses CSS grid matching the activity grid below */}
          <div
            className="w-full mb-2"
            style={{
              display: "grid",
              gridTemplateColumns: `24px repeat(${effectiveWeeks}, 1fr)`,
              gap: `${gapSize}px`,
            }}
          >
            {/* Spacer for the day-label column */}
            <div />
            {Array.from({ length: effectiveWeeks }, (_, weekIndex) => {
              const label = monthLabels.find(ml => ml.weekIndex === weekIndex);
              return (
                <span key={weekIndex} className="text-xs text-sub truncate">
                  {label ? label.month : ""}
                </span>
              );
            })}
          </div>

          {/* Grid: day labels (fixed) + activity cells (stretch to fill) */}
          <div
            className="w-full"
            style={{
              display: "grid",
              gridTemplateColumns: `24px repeat(${effectiveWeeks}, 1fr)`,
              gap: `${gapSize}px`,
            }}
          >
            {/* Day labels column (7 rows) + Activity cells */}
            {DAYS.map((day, dayIndex) => (
              <Fragment key={day}>
                {/* Day label */}
                <div
                  className="flex items-center text-xs text-sub"
                  style={{
                    visibility: dayIndex % 2 === 1 ? "visible" : "hidden",
                  }}
                >
                  {day}
                </div>
                {/* Activity cells for this day across all weeks */}
                {grid.map((week, weekIndex) => {
                  const activity = week[dayIndex];
                  if (activity === null) {
                    return (
                      <div
                        key={`${weekIndex}-${dayIndex}`}
                        className="aspect-square"
                        style={{ minWidth: `${minCellSize}px`, minHeight: `${minCellSize}px` }}
                      />
                    );
                  }
                  const color = getActivityColor(activity.count, maxCount);
                  return (
                    <div
                      key={`${weekIndex}-${dayIndex}`}
                      className={cn(
                        "aspect-square rounded-sm cursor-pointer transition-all duration-125 hover:ring-1 hover:ring-sub",
                        color
                      )}
                      style={{ minWidth: `${minCellSize}px`, minHeight: `${minCellSize}px` }}
                      title={`${formatDate(activity.date)}: ${activity.count} tests`}
                      onClick={() => onDayClick?.(activity.count > 0 ? activity : null, activity.date)}
                    />
                  );
                })}
              </Fragment>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end mt-4 text-xs text-sub" style={{ gap: `${gapSize + 1}px` }}>
            <span>Less</span>
            <div className="flex" style={{ gap: `${gapSize}px` }}>
              <div
                className="rounded-sm bg-sub-alt border border-sub/30 transition-all duration-125"
                style={{ width: `${minCellSize}px`, height: `${minCellSize}px` }}
              />
              <div
                className="rounded-sm bg-main/20 transition-all duration-125"
                style={{ width: `${minCellSize}px`, height: `${minCellSize}px` }}
              />
              <div
                className="rounded-sm bg-main/40 transition-all duration-125"
                style={{ width: `${minCellSize}px`, height: `${minCellSize}px` }}
              />
              <div
                className="rounded-sm bg-main/60 transition-all duration-125"
                style={{ width: `${minCellSize}px`, height: `${minCellSize}px` }}
              />
              <div
                className="rounded-sm bg-main/80 transition-all duration-125"
                style={{ width: `${minCellSize}px`, height: `${minCellSize}px` }}
              />
              <div
                className="rounded-sm bg-main transition-all duration-125"
                style={{ width: `${minCellSize}px`, height: `${minCellSize}px` }}
              />
            </div>
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ActivityHeatmap;
