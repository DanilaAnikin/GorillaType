'use client';

import { useMemo, useState, useCallback, useRef, useEffect } from 'react';

/**
 * Timeline range options for the heatmap.
 */
const TIMELINE_OPTIONS = [
  { label: 'Week', days: 7 },
  { label: 'Month', days: 30 },
  { label: 'Year', days: 365 },
  { label: '500 Days', days: 500 },
  { label: 'Max', days: 0 },
] as const;

type TimelineDays = (typeof TIMELINE_OPTIONS)[number]['days'];

interface ActivityHeatmapProps {
  data: { date: string; count: number; avg_wpm: number }[];
  className?: string;
  /** Controlled: which timeline is currently selected. */
  selectedDays?: TimelineDays | number;
  /** Called when the user selects a different timeline range. */
  onTimelineChange?: (days: number) => void;
  /** Whether the parent is currently refetching data. */
  isRefetching?: boolean;
}

/**
 * Activity heatmap showing test activity.
 * Supports configurable timeline ranges via a selector.
 *
 * Display modes:
 * - Week (7 days): Horizontal day cards with bar chart-style counts.
 * - Month (30 days): Calendar-style grid with larger cells.
 * - Year / 500 Days / Max: GitHub-style contribution grid filling full width.
 */
export function ActivityHeatmap({
  data,
  className,
  selectedDays: controlledDays,
  onTimelineChange,
  isRefetching,
}: ActivityHeatmapProps) {
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  // Use controlled value from parent if provided, otherwise manage internally
  const [internalDays, setInternalDays] = useState<number>(controlledDays ?? 500);
  const selectedDays = controlledDays ?? internalDays;

  const handleTimelineChange = useCallback((days: number) => {
    setInternalDays(days);
    onTimelineChange?.(days);
  }, [onTimelineChange]);

  // Ref for measuring grid container width
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const el = gridContainerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  /**
   * Determine the effective number of days to render.
   * For "Max", use all available data span.
   */
  const effectiveDays = useMemo(() => {
    if (selectedDays === 0) {
      if (data.length === 0) return 90;
      const dates = data.map(d => new Date(d.date).getTime());
      const minDate = Math.min(...dates);
      const now = new Date().getTime();
      return Math.max(Math.ceil((now - minDate) / (24 * 60 * 60 * 1000)) + 1, 7);
    }
    return selectedDays;
  }, [selectedDays, data]);

  /**
   * Build an array of day objects for the selected range.
   */
  const { days: allDays, maxCount } = useMemo(() => {
    const now = new Date();
    const dayMap = new Map<string, { count: number; avg_wpm: number }>();

    data.forEach(d => {
      dayMap.set(d.date, { count: d.count, avg_wpm: d.avg_wpm });
    });

    const days: { date: string; count: number; avg_wpm: number; dayOfWeek: number; dayName: string; dayNum: number; monthName: string }[] = [];
    let max = 0;

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = effectiveDays - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const entry = dayMap.get(dateStr) || { count: 0, avg_wpm: 0 };
      max = Math.max(max, entry.count);
      days.push({
        date: dateStr,
        count: entry.count,
        avg_wpm: entry.avg_wpm,
        dayOfWeek: date.getDay(),
        dayName: dayNames[date.getDay()],
        dayNum: date.getDate(),
        monthName: monthNames[date.getMonth()],
      });
    }

    return { days, maxCount: max };
  }, [data, effectiveDays]);

  /**
   * Returns opacity level based on count relative to max.
   */
  function getOpacity(count: number): number {
    if (count <= 0) return 0.08;
    if (maxCount === 0) return 0.08;
    const ratio = count / maxCount;
    if (ratio <= 0.25) return 0.25;
    if (ratio <= 0.5) return 0.5;
    if (ratio <= 0.75) return 0.75;
    return 1;
  }

  /** Build the timeline label for the header. */
  const timelineLabel = useMemo(() => {
    const option = TIMELINE_OPTIONS.find(o => o.days === selectedDays);
    if (selectedDays === 0) return `Activity (All Time)`;
    return `Activity (Last ${option?.label || `${selectedDays} Days`})`;
  }, [selectedDays]);

  // Determine display mode
  const displayMode: 'week' | 'month' | 'grid' = useMemo(() => {
    if (effectiveDays <= 7) return 'week';
    if (effectiveDays <= 31) return 'month';
    return 'grid';
  }, [effectiveDays]);

  // ==================== WEEK VIEW (Day cards with bars) ====================
  function renderWeekView() {
    return (
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${allDays.length}, 1fr)` }}>
        {allDays.map((day) => {
          const barHeight = maxCount > 0 ? Math.max(8, (day.count / maxCount) * 100) : 8;
          const opacity = getOpacity(day.count);
          return (
            <div
              key={day.date}
              className="flex flex-col items-center gap-2 rounded-lg p-3 transition-all duration-150"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--sub-color) 10%, transparent)',
                border: '1px solid color-mix(in srgb, var(--sub-color) 20%, transparent)',
              }}
              onMouseEnter={(e) => handleDayMouseEnter(e, day)}
              onMouseLeave={handleMouseLeave}
            >
              {/* Day name */}
              <span
                className="text-[11px] font-mono font-medium"
                style={{ color: 'var(--sub-color)' }}
              >
                {day.dayName}
              </span>

              {/* Day number */}
              <span
                className="text-lg font-mono font-bold"
                style={{ color: 'var(--text-color)' }}
              >
                {day.dayNum}
              </span>

              {/* Bar */}
              <div
                className="w-full rounded-sm flex items-end justify-center"
                style={{ height: '80px' }}
              >
                <div
                  className="w-full rounded-sm transition-all duration-300"
                  style={{
                    height: `${barHeight}%`,
                    backgroundColor: `color-mix(in srgb, var(--main-color) ${Math.round(opacity * 100)}%, var(--sub-alt-color))`,
                    minHeight: '4px',
                  }}
                />
              </div>

              {/* Count */}
              <span
                className="text-xs font-mono"
                style={{ color: day.count > 0 ? 'var(--main-color)' : 'var(--sub-color)' }}
              >
                {day.count} test{day.count !== 1 ? 's' : ''}
              </span>

              {/* Avg WPM if available */}
              {day.avg_wpm > 0 && (
                <span
                  className="text-[10px] font-mono"
                  style={{ color: 'var(--sub-color)' }}
                >
                  {day.avg_wpm} wpm
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // ==================== MONTH VIEW (Calendar-style grid) ====================
  function renderMonthView() {
    // Group days into weeks for a calendar layout
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const calendarWeeks: (typeof allDays[number] | null)[][] = [];
    let currentWeek: (typeof allDays[number] | null)[] = [];

    // Pad start of first week
    if (allDays.length > 0) {
      const firstDow = allDays[0].dayOfWeek;
      for (let i = 0; i < firstDow; i++) {
        currentWeek.push(null);
      }
    }

    allDays.forEach(day => {
      currentWeek.push(day);
      if (day.dayOfWeek === 6) {
        calendarWeeks.push(currentWeek);
        currentWeek = [];
      }
    });

    // Pad end of last week
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      calendarWeeks.push(currentWeek);
    }

    return (
      <div className="w-full">
        {/* Day of week headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {dayLabels.map(label => (
            <div
              key={label}
              className="text-center text-[10px] font-mono py-1"
              style={{ color: 'var(--sub-color)' }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Calendar rows */}
        <div className="grid gap-1">
          {calendarWeeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1">
              {week.map((day, di) => {
                if (!day) {
                  return <div key={`empty-${wi}-${di}`} />;
                }
                const opacity = getOpacity(day.count);
                return (
                  <div
                    key={day.date}
                    className="relative rounded-md flex flex-col items-center justify-center cursor-pointer transition-all duration-150 aspect-square"
                    style={{
                      backgroundColor: `color-mix(in srgb, var(--main-color) ${Math.round(opacity * 100)}%, var(--sub-alt-color))`,
                      minHeight: '36px',
                    }}
                    onMouseEnter={(e) => handleDayMouseEnter(e, day)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <span
                      className="text-xs font-mono font-medium"
                      style={{
                        color: opacity >= 0.5 ? 'var(--bg-color)' : 'var(--sub-color)',
                      }}
                    >
                      {day.dayNum}
                    </span>
                    {day.count > 0 && (
                      <span
                        className="text-[9px] font-mono"
                        style={{
                          color: opacity >= 0.5 ? 'var(--bg-color)' : 'var(--main-color)',
                        }}
                      >
                        {day.count}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ==================== GRID VIEW (GitHub-style, full width) ====================
  function renderGridView() {
    // Group days into weeks (columns)
    const weekGroups: typeof allDays[] = [];
    let currentWeek: typeof allDays = [];

    // Pad the first week with empty cells if needed
    if (allDays.length > 0) {
      const firstDayOfWeek = allDays[0].dayOfWeek;
      for (let i = 0; i < firstDayOfWeek; i++) {
        currentWeek.push({
          date: '',
          count: -1,
          avg_wpm: 0,
          dayOfWeek: i,
          dayName: '',
          dayNum: 0,
          monthName: '',
        });
      }
    }

    allDays.forEach(day => {
      currentWeek.push(day);
      if (day.dayOfWeek === 6) {
        weekGroups.push(currentWeek);
        currentWeek = [];
      }
    });

    if (currentWeek.length > 0) {
      weekGroups.push(currentWeek);
    }

    const numWeeks = weekGroups.length;

    // Calculate cell size to fill container width
    // Layout: [label column ~24px] [gap 4px] [grid area]
    // Grid area = numWeeks columns with gap between them
    const labelColumnWidth = 28;
    const labelGap = 4;
    const gapSize = 2;
    const availableWidth = containerWidth - labelColumnWidth - labelGap;
    // availableWidth = numWeeks * cellSize + (numWeeks - 1) * gapSize
    const computedCellSize = numWeeks > 0
      ? Math.max(2, Math.floor((availableWidth - (numWeeks - 1) * gapSize) / numWeeks))
      : 8;
    // Cap cell size so it doesn't get absurdly large
    const cellSize = Math.min(computedCellSize, 16);

    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="flex w-full" style={{ gap: `${labelGap}px` }}>
        {/* Day labels column */}
        <div className="flex flex-col flex-shrink-0" style={{ gap: `${gapSize}px`, width: `${labelColumnWidth}px` }}>
          {dayLabels.map((label, i) => (
            <div
              key={label}
              className="flex items-center text-[9px] font-mono leading-none"
              style={{
                height: `${cellSize}px`,
                color: 'var(--sub-color)',
                visibility: i % 2 === 1 ? 'visible' : 'hidden',
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Heatmap grid - use CSS grid with 1fr to fill width */}
        <div
          className="flex-1 min-w-0"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${numWeeks}, 1fr)`,
            gap: `${gapSize}px`,
          }}
        >
          {weekGroups.map((week, wi) => (
            <div key={wi} className="flex flex-col" style={{ gap: `${gapSize}px` }}>
              {week.map((day, di) => (
                <div
                  key={`${wi}-${di}`}
                  className="rounded-[2px] transition-all duration-150 w-full"
                  style={{
                    height: `${cellSize}px`,
                    backgroundColor: day.count < 0
                      ? 'transparent'
                      : `color-mix(in srgb, var(--main-color) ${Math.round(getOpacity(day.count) * 100)}%, var(--sub-alt-color))`,
                    cursor: day.count >= 0 ? 'pointer' : 'default',
                  }}
                  onMouseEnter={(e) => {
                    if (day.count < 0) return;
                    handleDayMouseEnter(e, day);
                  }}
                  onMouseLeave={handleMouseLeave}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ==================== Tooltip helpers ====================
  function handleDayMouseEnter(
    e: React.MouseEvent<HTMLDivElement>,
    day: { date: string; count: number; avg_wpm: number }
  ) {
    const rect = e.currentTarget.getBoundingClientRect();
    const parentRect = e.currentTarget.closest('[data-heatmap-container]')?.getBoundingClientRect();
    if (!parentRect) return;

    const text = day.count === 0
      ? `${day.date}: No tests`
      : `${day.date}: ${day.count} test${day.count !== 1 ? 's' : ''} (avg ${day.avg_wpm} wpm)`;

    setTooltip({
      text,
      x: rect.left - parentRect.left + rect.width / 2,
      y: rect.top - parentRect.top - 8,
    });
  }

  function handleMouseLeave() {
    setTooltip(null);
  }

  // ==================== Legend ====================
  function renderLegend() {
    const legendCellSize = displayMode === 'grid' ? 10 : 12;
    return (
      <div className="flex items-center justify-end mt-3" style={{ gap: '4px' }}>
        <span
          className="text-[10px] font-mono mr-1"
          style={{ color: 'var(--sub-color)' }}
        >
          Less
        </span>
        {[0.08, 0.25, 0.5, 0.75, 1].map((opacity, i) => (
          <div
            key={i}
            className="rounded-[2px]"
            style={{
              width: `${legendCellSize}px`,
              height: `${legendCellSize}px`,
              backgroundColor: `color-mix(in srgb, var(--main-color) ${Math.round(opacity * 100)}%, var(--sub-alt-color))`,
            }}
          />
        ))}
        <span
          className="text-[10px] font-mono ml-1"
          style={{ color: 'var(--sub-color)' }}
        >
          More
        </span>
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg border p-4 w-full ${className || ''}`}
      style={{
        backgroundColor: 'var(--sub-alt-color)',
        borderColor: 'color-mix(in srgb, var(--sub-color) 30%, transparent)',
        opacity: isRefetching ? 0.6 : 1,
        transition: 'opacity 200ms ease',
      }}
    >
      {/* Header with title and timeline selector */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3
          className="text-sm font-medium"
          style={{ color: 'var(--text-color)' }}
        >
          {timelineLabel}
        </h3>

        {/* Timeline selector buttons */}
        <div className="flex gap-1">
          {TIMELINE_OPTIONS.map(option => {
            const isSelected = selectedDays === option.days;
            return (
              <button
                key={option.label}
                onClick={() => handleTimelineChange(option.days)}
                className="px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-all duration-150"
                style={{
                  backgroundColor: isSelected
                    ? 'var(--main-color)'
                    : 'transparent',
                  color: isSelected
                    ? 'var(--bg-color)'
                    : 'var(--sub-color)',
                  border: isSelected
                    ? '1px solid var(--main-color)'
                    : '1px solid color-mix(in srgb, var(--sub-color) 40%, transparent)',
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative w-full" data-heatmap-container ref={gridContainerRef}>
        {/* Tooltip */}
        {tooltip && (
          <div
            className="absolute z-10 pointer-events-none px-2 py-1 rounded text-xs font-mono whitespace-nowrap"
            style={{
              left: tooltip.x,
              top: tooltip.y,
              transform: 'translate(-50%, -100%)',
              backgroundColor: 'var(--bg-color)',
              color: 'var(--text-color)',
              border: '1px solid var(--sub-color)',
            }}
          >
            {tooltip.text}
          </div>
        )}

        {/* Render based on display mode */}
        {displayMode === 'week' && renderWeekView()}
        {displayMode === 'month' && renderMonthView()}
        {displayMode === 'grid' && containerWidth > 0 && renderGridView()}
      </div>

      {/* Legend */}
      {renderLegend()}
    </div>
  );
}
