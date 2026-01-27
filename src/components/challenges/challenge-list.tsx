"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Swords, Inbox, Send, Trophy, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/store/user-store";
import { ChallengeCard, type Challenge } from "./challenge-card";

/**
 * Tab definition for challenge list filtering
 */
type TabId = "pending" | "active" | "completed";

interface Tab {
  id: TabId;
  label: string;
  filter: (c: Challenge) => boolean;
}

const TABS: Tab[] = [
  {
    id: "pending",
    label: "Pending",
    filter: (c) => c.status === "pending",
  },
  {
    id: "active",
    label: "Active",
    filter: (c) => c.status === "accepted" || c.status === "in_progress",
  },
  {
    id: "completed",
    label: "Completed",
    filter: (c) =>
      c.status === "completed" ||
      c.status === "declined" ||
      c.status === "expired",
  },
];

/**
 * API response shape
 */
interface ChallengesApiResponse {
  challenges: Challenge[];
  sent: Challenge[];
  received: Challenge[];
  counts: {
    total: number;
    sent: number;
    received: number;
    pending: number;
    active: number;
    completed: number;
  };
}

/**
 * ChallengeList fetches and displays the user's challenges.
 */
export function ChallengeList({ className }: { className?: string }) {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const [challenges, setChallenges] = React.useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<TabId>("pending");
  const [loadingAction, setLoadingAction] = React.useState<string | null>(null);

  // Fetch challenges
  const fetchChallenges = React.useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("/api/challenges");
      const data: ChallengesApiResponse = await response.json();

      if (!response.ok) {
        throw new Error((data as unknown as { error: string }).error || "Failed to fetch challenges");
      }

      setChallenges(data.challenges || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load challenges");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  // Handle accept
  const handleAccept = async (challengeId: string) => {
    setLoadingAction(`accept-${challengeId}`);
    try {
      const response = await fetch(`/api/challenges/${challengeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to accept challenge");
      }

      await fetchChallenges();
    } catch (err) {
      console.error("Error accepting challenge:", err);
    } finally {
      setLoadingAction(null);
    }
  };

  // Handle decline
  const handleDecline = async (challengeId: string) => {
    setLoadingAction(`decline-${challengeId}`);
    try {
      const response = await fetch(`/api/challenges/${challengeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "decline" }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to decline challenge");
      }

      await fetchChallenges();
    } catch (err) {
      console.error("Error declining challenge:", err);
    } finally {
      setLoadingAction(null);
    }
  };

  // Handle cancel
  const handleCancel = async (challengeId: string) => {
    setLoadingAction(`cancel-${challengeId}`);
    try {
      const response = await fetch(`/api/challenges/${challengeId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to cancel challenge");
      }

      await fetchChallenges();
    } catch (err) {
      console.error("Error cancelling challenge:", err);
    } finally {
      setLoadingAction(null);
    }
  };

  // Handle take challenge (navigate to dedicated challenge typing page)
  const handleTakeChallenge = (challenge: Challenge) => {
    router.push(`/challenges/take/${challenge.id}`);
  };

  // Filter challenges based on active tab
  const activeTabDef = TABS.find((t) => t.id === activeTab) || TABS[0];
  const filteredChallenges = challenges.filter(activeTabDef.filter);

  // Separate received and sent
  const receivedChallenges = filteredChallenges.filter(
    (c) => c.direction === "received"
  );
  const sentChallenges = filteredChallenges.filter(
    (c) => c.direction === "sent"
  );

  // Tab counts
  const tabCounts = {
    pending: challenges.filter(TABS[0].filter).length,
    active: challenges.filter(TABS[1].filter).length,
    completed: challenges.filter(TABS[2].filter).length,
  };

  if (isLoading) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center py-16",
          className
        )}
      >
        <Loader2
          className="w-8 h-8 animate-spin mb-3"
          style={{ color: "var(--main-color)" }}
        />
        <p className="text-sm" style={{ color: "var(--sub-color)" }}>
          Loading challenges...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center py-16",
          className
        )}
      >
        <p className="text-sm mb-2" style={{ color: "var(--error-color)" }}>
          {error}
        </p>
        <button
          onClick={() => {
            setIsLoading(true);
            fetchChallenges();
          }}
          className="text-sm underline"
          style={{ color: "var(--main-color)" }}
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Tabs */}
      <div
        className="flex items-center gap-1 p-1 rounded-lg"
        style={{
          backgroundColor: "color-mix(in srgb, var(--sub-color) 10%, var(--bg-color))",
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-125"
            )}
            style={{
              backgroundColor:
                activeTab === tab.id ? "var(--main-color)" : "transparent",
              color:
                activeTab === tab.id ? "var(--bg-color)" : "var(--sub-color)",
            }}
          >
            {tab.label}
            {tabCounts[tab.id] > 0 && (
              <span className="ml-1.5 opacity-75">({tabCounts[tab.id]})</span>
            )}
          </button>
        ))}
      </div>

      {/* Empty State */}
      {filteredChallenges.length === 0 && (
        <EmptyState tab={activeTab} />
      )}

      {/* Received Challenges */}
      {receivedChallenges.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Inbox className="w-4 h-4" style={{ color: "var(--main-color)" }} />
            <h2
              className="text-sm font-medium uppercase tracking-wider"
              style={{ color: "var(--sub-color)" }}
            >
              Received Challenges
            </h2>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: "color-mix(in srgb, var(--main-color) 15%, var(--bg-color))",
                color: "var(--main-color)",
              }}
            >
              {receivedChallenges.length}
            </span>
          </div>
          <div className="space-y-3">
            {receivedChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                currentUserId={user?.id || ""}
                onAccept={handleAccept}
                onDecline={handleDecline}
                onTakeChallenge={handleTakeChallenge}
                isLoading={loadingAction !== null}
                loadingAction={loadingAction}
              />
            ))}
          </div>
        </div>
      )}

      {/* Sent Challenges */}
      {sentChallenges.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Send className="w-4 h-4" style={{ color: "var(--main-color)" }} />
            <h2
              className="text-sm font-medium uppercase tracking-wider"
              style={{ color: "var(--sub-color)" }}
            >
              Sent Challenges
            </h2>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: "color-mix(in srgb, var(--main-color) 15%, var(--bg-color))",
                color: "var(--main-color)",
              }}
            >
              {sentChallenges.length}
            </span>
          </div>
          <div className="space-y-3">
            {sentChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                currentUserId={user?.id || ""}
                onCancel={handleCancel}
                onTakeChallenge={handleTakeChallenge}
                isLoading={loadingAction !== null}
                loadingAction={loadingAction}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Empty state component for each tab
 */
function EmptyState({ tab }: { tab: TabId }) {
  const config: Record<TabId, { icon: React.ReactNode; title: string; desc: string }> = {
    pending: {
      icon: <Swords className="w-8 h-8" style={{ color: "var(--sub-color)" }} />,
      title: "No pending challenges",
      desc: "Challenge a friend from the friends page to get started!",
    },
    active: {
      icon: <Swords className="w-8 h-8" style={{ color: "var(--sub-color)" }} />,
      title: "No active challenges",
      desc: "Accept a pending challenge or wait for one to be accepted.",
    },
    completed: {
      icon: <Trophy className="w-8 h-8" style={{ color: "var(--sub-color)" }} />,
      title: "No completed challenges",
      desc: "Complete a challenge to see your results here.",
    },
  };

  const { icon, title, desc } = config[tab];

  return (
    <div
      className="flex flex-col items-center justify-center py-16 rounded-lg"
      style={{
        backgroundColor: "color-mix(in srgb, var(--sub-color) 8%, var(--bg-color))",
        border: "1px solid var(--sub-color)",
      }}
    >
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
        style={{
          backgroundColor: "color-mix(in srgb, var(--sub-color) 15%, var(--bg-color))",
        }}
      >
        {icon}
      </div>
      <h3
        className="text-lg font-medium mb-2"
        style={{ color: "var(--text-color)" }}
      >
        {title}
      </h3>
      <p className="text-sm max-w-sm text-center" style={{ color: "var(--sub-color)" }}>
        {desc}
      </p>
    </div>
  );
}

export default ChallengeList;
