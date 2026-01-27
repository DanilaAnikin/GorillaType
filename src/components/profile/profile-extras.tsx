"use client";

import { useState, useEffect, useCallback } from "react";
import { ActivityHeatmap } from "@/components/analytics/activity-heatmap";
import { BadgeShowcase, type Badge } from "./badge-showcase";
import { SocialShareCard, type ShareCardData } from "./social-share-card";

/**
 * Activity API response shape.
 */
interface ActivityResponse {
  activity: Array<{ date: string; count: number }>;
  badges: Array<{
    id: string;
    achievement_key: string;
    achievement_name: string;
    achievement_description: string;
    achievement_icon: string;
    tier: number;
    is_completed: boolean;
    progress: number;
    target: number;
    unlocked_at: string | null;
  }>;
}

/**
 * Props for the ProfileExtras component.
 */
export interface ProfileExtrasProps {
  /** Username of the profile being viewed */
  username: string;
  /** Share card data for the social share card */
  shareCardData: ShareCardData;
  /** The profile URL to use for sharing */
  profileUrl: string;
}

/**
 * ProfileExtras is a client component that fetches and displays
 * the activity heatmap, badge showcase, and social share card
 * sections on the profile page.
 *
 * Uses the same ActivityHeatmap component as the analytics page
 * for consistent display (week cards, month calendar, GitHub-style grid).
 *
 * @example
 * <ProfileExtras
 *   username="speedtyper"
 *   shareCardData={{
 *     username: "speedtyper",
 *     level: 15,
 *     averageWPM: 95,
 *     averageAccuracy: 97.5,
 *     testsCompleted: 523,
 *     currentStreak: 7,
 *   }}
 *   profileUrl="/profile/speedtyper"
 * />
 */
export function ProfileExtras({ username, shareCardData, profileUrl }: ProfileExtrasProps) {
  const [data, setData] = useState<ActivityResponse | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);
  const [heatmapDays, setHeatmapDays] = useState<number>(500);

  const fetchActivityData = useCallback(async (days: number, isInitial: boolean) => {
    try {
      if (!isInitial) {
        setIsRefetching(true);
      }
      const res = await fetch(`/api/users/${encodeURIComponent(username)}/activity?days=${days}`);
      if (!res.ok) {
        setData(null);
        return;
      }
      const json: ActivityResponse = await res.json();
      setData(json);
    } catch {
      // Silently fail - the sections just won't render
      setData(null);
    } finally {
      setInitialLoading(false);
      setIsRefetching(false);
    }
  }, [username]);

  useEffect(() => {
    fetchActivityData(heatmapDays, data === null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchActivityData, heatmapDays]);

  const handleTimelineChange = useCallback((days: number) => {
    setHeatmapDays(days);
  }, []);

  // Only show full skeletons on initial load (before any data has arrived).
  // During subsequent refetches (timeline changes), keep the heatmap mounted
  // so its internal timeline selection state is preserved.
  if (initialLoading) {
    return (
      <div className="space-y-6 mt-6">
        {/* Activity Heatmap skeleton */}
        <div
          className="h-48 rounded-lg animate-pulse bg-sub-alt border border-sub"
        />
        {/* Badge Showcase skeleton */}
        <div
          className="h-40 rounded-lg animate-pulse bg-sub-alt border border-sub"
        />
        {/* Share Card skeleton */}
        <div
          className="h-64 rounded-lg animate-pulse bg-sub-alt border border-sub"
        />
      </div>
    );
  }

  // Transform profile API data to the format expected by the analytics ActivityHeatmap.
  // The profile API returns { date, count } but the analytics heatmap expects { date, count, avg_wpm }.
  // Since the profile API doesn't provide avg_wpm, we default it to 0.
  const heatmapData = (data?.activity ?? []).map((a) => ({
    date: a.date,
    count: a.count,
    avg_wpm: 0,
  }));

  // Map API badges data to Badge format expected by BadgeShowcase
  const badges: Badge[] = (data?.badges ?? []).map((b) => ({
    id: b.id,
    name: b.achievement_name,
    description: b.achievement_description,
    icon: b.achievement_icon,
    tier: b.tier,
    isCompleted: b.is_completed,
    progress: b.progress,
    target: b.target,
    unlockedAt: b.unlocked_at || undefined,
  }));

  return (
    <div className="space-y-6 mt-6">
      {/* Activity Heatmap - reuses the analytics heatmap component */}
      <ActivityHeatmap
        data={heatmapData}
        selectedDays={heatmapDays}
        onTimelineChange={handleTimelineChange}
        isRefetching={isRefetching}
      />

      {/* Badge Showcase */}
      {badges.length > 0 && <BadgeShowcase badges={badges} />}

      {/* Social Share Card */}
      <SocialShareCard data={shareCardData} profileUrl={profileUrl} />
    </div>
  );
}

export default ProfileExtras;
