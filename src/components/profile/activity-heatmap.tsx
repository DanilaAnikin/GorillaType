"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils/cn";
import { formatDate, formatNumber } from "@/lib/utils/formatting";
import { Activity } from "lucide-react";

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
  /** Number of weeks to display (default: 52) */
  weeks?: number;
  /** Additional CSS classes */
  className?: string;
  /** Callback when a day is clicked */
  onDayClick?: (activity: DayActivity | null, date: string) => void;
}

/**
 * Get color intensity based on activity count.
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
 *
 * @example
 * <ActivityHeatmap
 *   activities={[
 *     { date: "2024-01-15", count: 5, totalWPM: 450, totalTime: 900 },
 *     { date: "2024-01-16", count: 3, totalWPM: 270, totalTime: 540 },
 *   ]}
 *   weeks={52}
 * />
 */
export function ActivityHeatmap({
  activities,
  weeks = 52,
  className,
  onDayClick
}: ActivityHeatmapProps) {
  // Create activity map for quick lookup
  const activityMap = useMemo(() => {
    const map = new Map<string, DayActivity>();
    activities.forEach((activity) => {
      map.set(activity.date, activity);
    });
    return map;
  }, [activities]);

  // Calculate max count for color scaling
  const maxCount = useMemo(() => {
    if (activities.length === 0) return 1;
    return Math.max(...activities.map((a) => a.count), 1);
  }, [activities]);

  // Generate calendar grid
  const { grid, monthLabels, totalTests, activeDays } = useMemo(() => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (weeks * 7) + 1);

    // Adjust to start on Sunday
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);

    const grid: (DayActivity | null)[][] = [];
    const monthLabels: { month: string; weekIndex: number }[] = [];
    let totalTests = 0;
    let activeDays = 0;
    let currentMonth = -1;

    for (let week = 0; week < weeks; week++) {
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
  }, [activityMap, weeks]);

  return (
    <div
      className={cn(
        "rounded-lg bg-sub-alt border border-sub p-6 transition-all duration-125",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-main" />
          <h2 className="text-xl font-semibold text-text">Activity</h2>
        </div>
        <div className="text-sm text-sub">
          <span className="text-main font-medium">{formatNumber(totalTests)}</span>
          {" tests in "}
          <span className="text-main font-medium">{activeDays}</span>
          {" days this year"}
        </div>
      </div>

      {/* Heatmap */}
      <div className="overflow-x-auto">
        <div className="min-w-fit">
          {/* Month labels */}
          <div className="flex mb-2 ml-8">
            {monthLabels.map(({ month, weekIndex }, index) => (
              <span
                key={`${month}-${index}`}
                className="text-xs text-sub"
                style={{
                  marginLeft: index === 0 ? weekIndex * 14 : undefined,
                  width: index < monthLabels.length - 1
                    ? (monthLabels[index + 1].weekIndex - weekIndex) * 14
                    : undefined
                }}
              >
                {month}
              </span>
            ))}
          </div>

          {/* Grid */}
          <div className="flex">
            {/* Day labels */}
            <div className="flex flex-col gap-[3px] mr-2 text-xs text-sub">
              {DAYS.map((day, index) => (
                <div
                  key={day}
                  className="h-[11px] flex items-center"
                  style={{ visibility: index % 2 === 1 ? "visible" : "hidden" }}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Activity grid */}
            <div className="flex gap-[3px]">
              {grid.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-[3px]">
                  {week.map((activity, dayIndex) => {
                    if (activity === null) {
                      return (
                        <div
                          key={`${weekIndex}-${dayIndex}`}
                          className="w-[11px] h-[11px]"
                        />
                      );
                    }

                    const color = getActivityColor(activity.count, maxCount);

                    return (
                      <div
                        key={`${weekIndex}-${dayIndex}`}
                        className={cn(
                          "w-[11px] h-[11px] rounded-sm cursor-pointer transition-all duration-125 hover:ring-1 hover:ring-sub",
                          color
                        )}
                        title={`${formatDate(activity.date)}: ${activity.count} tests`}
                        onClick={() => onDayClick?.(activity.count > 0 ? activity : null, activity.date)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-2 mt-4 text-xs text-sub">
            <span>Less</span>
            <div className="flex gap-[3px]">
              <div className="w-[11px] h-[11px] rounded-sm bg-sub-alt transition-all duration-125" />
              <div className="w-[11px] h-[11px] rounded-sm bg-main/20 transition-all duration-125" />
              <div className="w-[11px] h-[11px] rounded-sm bg-main/40 transition-all duration-125" />
              <div className="w-[11px] h-[11px] rounded-sm bg-main/60 transition-all duration-125" />
              <div className="w-[11px] h-[11px] rounded-sm bg-main/80 transition-all duration-125" />
              <div className="w-[11px] h-[11px] rounded-sm bg-main transition-all duration-125" />
            </div>
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ActivityHeatmap;
