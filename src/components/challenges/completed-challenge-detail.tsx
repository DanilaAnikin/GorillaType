"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Crown,
  Loader2,
  AlertCircle,
  Timer,
  Type,
  Globe,
  Calendar,
  Trophy,
  XCircle,
  Clock,
  Swords,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { ChallengeResultComparison } from "./challenge-result-comparison";
import type { Challenge, ChallengeUser } from "./challenge-card";

/**
 * Status badge style mapping
 */
const statusConfig: Record<
  string,
  { icon: React.ReactNode; label: string; color: string; bg: string }
> = {
  completed: {
    icon: <Trophy className="w-4 h-4" />,
    label: "Completed",
    color: "var(--main-color)",
    bg: "rgba(var(--success-rgb, 34, 197, 94), 0.15)",
  },
  declined: {
    icon: <XCircle className="w-4 h-4" />,
    label: "Declined",
    color: "var(--sub-color)",
    bg: "rgba(var(--sub-rgb, 128, 128, 128), 0.15)",
  },
  expired: {
    icon: <Clock className="w-4 h-4" />,
    label: "Expired",
    color: "var(--error-color)",
    bg: "rgba(var(--error-rgb, 239, 68, 68), 0.15)",
  },
  pending: {
    icon: <Clock className="w-4 h-4" />,
    label: "Pending",
    color: "var(--sub-color)",
    bg: "rgba(var(--warning-rgb, 234, 179, 8), 0.15)",
  },
  accepted: {
    icon: <Swords className="w-4 h-4" />,
    label: "Accepted",
    color: "var(--main-color)",
    bg: "rgba(var(--main-rgb, 59, 130, 246), 0.15)",
  },
  in_progress: {
    icon: <Swords className="w-4 h-4" />,
    label: "In Progress",
    color: "var(--main-color)",
    bg: "rgba(var(--main-rgb, 59, 130, 246), 0.15)",
  },
};

/**
 * Props for CompletedChallengeDetail
 */
interface CompletedChallengeDetailProps {
  challengeId: string;
}

/**
 * CompletedChallengeDetail displays the full details of a completed, declined,
 * or expired challenge. Fetches challenge data from the API and renders
 * participant info, config, results comparison, and timestamps.
 */
export function CompletedChallengeDetail({
  challengeId,
}: CompletedChallengeDetailProps) {
  const router = useRouter();
  const [challenge, setChallenge] = React.useState<Challenge | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchChallenge() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/challenges/${challengeId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load challenge");
        }

        setChallenge(data.challenge);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load challenge"
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchChallenge();
  }, [challengeId]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2
          className="w-8 h-8 animate-spin mb-3"
          style={{ color: "var(--main-color)" }}
        />
        <p className="text-sm" style={{ color: "var(--sub-color)" }}>
          Loading challenge details...
        </p>
      </div>
    );
  }

  // Error state
  if (error || !challenge) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <AlertCircle
          className="w-10 h-10 mb-3"
          style={{ color: "var(--error-color)" }}
        />
        <p
          className="text-sm mb-4"
          style={{ color: "var(--error-color)" }}
        >
          {error || "Challenge not found"}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/challenges")}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Back to Challenges
        </Button>
      </div>
    );
  }

  const status = statusConfig[challenge.status] || statusConfig.completed;
  const challengerName =
    challenge.challenger?.displayName ||
    challenge.challenger?.username ||
    "Challenger";
  const challengedName =
    challenge.challenged?.displayName ||
    challenge.challenged?.username ||
    "Challenged";

  // Winner info
  const winner: ChallengeUser | null =
    challenge.winnerId === challenge.challenger?.id
      ? challenge.challenger
      : challenge.winnerId === challenge.challenged?.id
        ? challenge.challenged
        : null;
  const winnerName =
    winner?.displayName || winner?.username || null;

  // Test config label
  const testConfigParts: string[] = [];
  if (challenge.testMode === "time" && challenge.testDuration) {
    testConfigParts.push(`${challenge.testDuration}s`);
  } else if (challenge.testMode === "words" && challenge.testWordCount) {
    testConfigParts.push(`${challenge.testWordCount} words`);
  }
  testConfigParts.push(challenge.testMode);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/challenges")}
        leftIcon={<ArrowLeft className="w-4 h-4" />}
      >
        Back to Challenges
      </Button>

      {/* Main card */}
      <div
        className="rounded-lg border"
        style={{
          backgroundColor: "var(--bg-color)",
          borderColor: "var(--sub-color)",
        }}
      >
        {/* Header: Status + Title */}
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <h1
              className="text-xl font-bold"
              style={{ color: "var(--text-color)" }}
            >
              Challenge Details
            </h1>
            {/* Status badge */}
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
              style={{
                backgroundColor: status.bg,
                color: status.color,
              }}
            >
              {status.icon}
              {status.label}
            </div>
          </div>

          {/* Challenger vs Challenged header */}
          <div className="flex items-center justify-between">
            {/* Challenger */}
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "rounded-full p-0.5",
                  challenge.winnerId === challenge.challenger?.id &&
                    "ring-2 ring-main"
                )}
              >
                <Avatar
                  src={challenge.challenger?.avatarUrl}
                  alt={challengerName}
                  fallback={challengerName.charAt(0)}
                  size="xl"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="font-semibold"
                    style={{ color: "var(--text-color)" }}
                  >
                    {challengerName}
                  </span>
                  {challenge.winnerId === challenge.challenger?.id && (
                    <Crown
                      className="w-5 h-5"
                      style={{ color: "var(--main-color)" }}
                    />
                  )}
                </div>
                <span
                  className="text-xs"
                  style={{ color: "var(--sub-color)" }}
                >
                  @{challenge.challenger?.username || "unknown"}
                </span>
              </div>
            </div>

            {/* VS separator */}
            <div
              className="flex flex-col items-center px-4"
            >
              <Swords
                className="w-6 h-6 mb-1"
                style={{ color: "var(--sub-color)" }}
              />
              <span
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: "var(--sub-color)" }}
              >
                VS
              </span>
            </div>

            {/* Challenged */}
            <div className="flex items-center gap-3">
              <div>
                <div className="flex items-center gap-1.5 justify-end">
                  {challenge.winnerId === challenge.challenged?.id && (
                    <Crown
                      className="w-5 h-5"
                      style={{ color: "var(--main-color)" }}
                    />
                  )}
                  <span
                    className="font-semibold"
                    style={{ color: "var(--text-color)" }}
                  >
                    {challengedName}
                  </span>
                </div>
                <span
                  className="text-xs text-right block"
                  style={{ color: "var(--sub-color)" }}
                >
                  @{challenge.challenged?.username || "unknown"}
                </span>
              </div>
              <div
                className={cn(
                  "rounded-full p-0.5",
                  challenge.winnerId === challenge.challenged?.id &&
                    "ring-2 ring-main"
                )}
              >
                <Avatar
                  src={challenge.challenged?.avatarUrl}
                  alt={challengedName}
                  fallback={challengedName.charAt(0)}
                  size="xl"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Winner announcement (only for completed challenges with a winner) */}
        {challenge.status === "completed" && winnerName && (
          <div
            className="mx-6 mb-4 flex items-center justify-center gap-2 rounded-lg py-3 px-4"
            style={{
              backgroundColor:
                "color-mix(in srgb, var(--main-color) 10%, var(--bg-color))",
              border: "1px solid color-mix(in srgb, var(--main-color) 30%, var(--bg-color))",
            }}
          >
            <Crown
              className="w-5 h-5"
              style={{ color: "var(--main-color)" }}
            />
            <span
              className="font-semibold"
              style={{ color: "var(--main-color)" }}
            >
              {winnerName} wins!
            </span>
          </div>
        )}

        {/* Challenge message */}
        {challenge.message && (
          <div className="px-6 mb-4">
            <p
              className="text-sm italic"
              style={{ color: "var(--sub-color)" }}
            >
              &ldquo;{challenge.message}&rdquo;
            </p>
          </div>
        )}

        {/* Test configuration */}
        <div
          className="mx-6 mb-4 flex items-center gap-4 rounded-lg p-3"
          style={{
            backgroundColor:
              "color-mix(in srgb, var(--sub-color) 8%, var(--bg-color))",
          }}
        >
          <div
            className="flex items-center gap-1.5 text-sm"
            style={{ color: "var(--sub-color)" }}
          >
            {challenge.testMode === "time" ? (
              <Timer className="w-4 h-4" />
            ) : (
              <Type className="w-4 h-4" />
            )}
            <span>{testConfigParts.join(" | ")}</span>
          </div>
          {challenge.testLanguage && (
            <div
              className="flex items-center gap-1.5 text-sm"
              style={{ color: "var(--sub-color)" }}
            >
              <Globe className="w-4 h-4" />
              <span>{challenge.testLanguage}</span>
            </div>
          )}
        </div>

        {/* Result comparison */}
        {challenge.status === "completed" &&
          (challenge.challengerResult || challenge.challengedResult) && (
            <div
              className="mx-6 mb-4 border-t pt-4"
              style={{ borderColor: "var(--sub-color)" }}
            >
              <h2
                className="text-sm font-medium uppercase tracking-wider mb-3"
                style={{ color: "var(--sub-color)" }}
              >
                Results
              </h2>
              <ChallengeResultComparison
                challenger={challenge.challenger}
                challenged={challenge.challenged}
                challengerResult={challenge.challengerResult}
                challengedResult={challenge.challengedResult}
                winnerId={challenge.winnerId}
              />
            </div>
          )}

        {/* Timestamps */}
        <div
          className="px-6 py-4 border-t"
          style={{ borderColor: "var(--sub-color)" }}
        >
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <div
              className="flex items-center gap-1.5 text-xs"
              style={{ color: "var(--sub-color)" }}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>
                Created{" "}
                {format(new Date(challenge.createdAt), "MMM d, yyyy 'at' h:mm a")}
                {" "}({formatDistanceToNow(new Date(challenge.createdAt), { addSuffix: true })})
              </span>
            </div>
            {challenge.status === "completed" && challenge.updatedAt && (
              <div
                className="flex items-center gap-1.5 text-xs"
                style={{ color: "var(--sub-color)" }}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>
                  Completed{" "}
                  {format(new Date(challenge.updatedAt), "MMM d, yyyy 'at' h:mm a")}
                  {" "}({formatDistanceToNow(new Date(challenge.updatedAt), { addSuffix: true })})
                </span>
              </div>
            )}
            {challenge.status === "expired" && (
              <div
                className="flex items-center gap-1.5 text-xs"
                style={{ color: "var(--error-color)" }}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>
                  Expired{" "}
                  {format(new Date(challenge.expiresAt), "MMM d, yyyy 'at' h:mm a")}
                  {" "}({formatDistanceToNow(new Date(challenge.expiresAt), { addSuffix: true })})
                </span>
              </div>
            )}
            {challenge.status === "declined" && challenge.updatedAt && (
              <div
                className="flex items-center gap-1.5 text-xs"
                style={{ color: "var(--sub-color)" }}
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>
                  Declined{" "}
                  {format(new Date(challenge.updatedAt), "MMM d, yyyy 'at' h:mm a")}
                  {" "}({formatDistanceToNow(new Date(challenge.updatedAt), { addSuffix: true })})
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CompletedChallengeDetail;
