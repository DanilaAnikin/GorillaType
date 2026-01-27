"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  X,
  Swords,
  Clock,
  Trophy,
  Crown,
  Timer,
  Type,
  Globe,
  ExternalLink,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { ChallengeResultComparison } from "./challenge-result-comparison";

/**
 * Profile info for a challenge participant
 */
export interface ChallengeUser {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
}

/**
 * Result info for a challenge participant
 */
export interface ChallengeResult {
  id: string;
  wpm: number | null;
  accuracy: number | null;
  consistency: number | null;
  rawWpm: number | null;
}

/**
 * Full challenge data from the API
 */
export interface Challenge {
  id: string;
  challengerId: string;
  challengedId: string;
  status: string;
  direction: "sent" | "received";
  testMode: string;
  testDuration: number | null;
  testWordCount: number | null;
  testLanguage: string | null;
  testText: string | null;
  message: string | null;
  winnerId: string | null;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  challenger: ChallengeUser | null;
  challenged: ChallengeUser | null;
  challengerResult: ChallengeResult | null;
  challengedResult: ChallengeResult | null;
}

/**
 * Props for ChallengeCard
 */
export interface ChallengeCardProps {
  challenge: Challenge;
  currentUserId: string;
  onAccept?: (challengeId: string) => void;
  onDecline?: (challengeId: string) => void;
  onCancel?: (challengeId: string) => void;
  onTakeChallenge?: (challenge: Challenge) => void;
  isLoading?: boolean;
  loadingAction?: string | null;
  className?: string;
}

/**
 * Status badge color mapping
 */
const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: "rgba(var(--warning-rgb, 234, 179, 8), 0.15)", text: "var(--sub-color)", label: "Pending" },
  accepted: { bg: "rgba(var(--main-rgb, 59, 130, 246), 0.15)", text: "var(--main-color)", label: "Accepted" },
  in_progress: { bg: "rgba(var(--main-rgb, 59, 130, 246), 0.15)", text: "var(--main-color)", label: "In Progress" },
  completed: { bg: "rgba(var(--success-rgb, 34, 197, 94), 0.15)", text: "var(--main-color)", label: "Completed" },
  declined: { bg: "rgba(var(--sub-rgb, 128, 128, 128), 0.15)", text: "var(--sub-color)", label: "Declined" },
  expired: { bg: "rgba(var(--error-rgb, 239, 68, 68), 0.15)", text: "var(--error-color)", label: "Expired" },
};

/**
 * ChallengeCard displays a single challenge with actions based on status and user role.
 */
export function ChallengeCard({
  challenge,
  currentUserId,
  onAccept,
  onDecline,
  onCancel,
  onTakeChallenge,
  isLoading = false,
  loadingAction,
  className,
}: ChallengeCardProps) {
  const router = useRouter();
  const [showResults, setShowResults] = React.useState(false);

  const isChallenger = challenge.challengerId === currentUserId;
  const opponent = isChallenger ? challenge.challenged : challenge.challenger;
  const opponentName = opponent?.displayName || opponent?.username || "Unknown";
  const statusInfo = statusStyles[challenge.status] || statusStyles.pending;

  // Check if current user has submitted their result
  const myResultSubmitted = isChallenger
    ? challenge.challengerResult !== null
    : challenge.challengedResult !== null;

  // Expiry countdown for pending challenges
  const expiresAt = new Date(challenge.expiresAt);
  const isExpired = expiresAt < new Date();
  const expiresIn = !isExpired
    ? formatDistanceToNow(expiresAt, { addSuffix: true })
    : "Expired";

  // Created time
  const createdAgo = formatDistanceToNow(new Date(challenge.createdAt), { addSuffix: true });

  // Test config label
  const testConfigLabel = React.useMemo(() => {
    const parts: string[] = [];
    if (challenge.testMode === "time" && challenge.testDuration) {
      parts.push(`${challenge.testDuration}s`);
    } else if (challenge.testMode === "words" && challenge.testWordCount) {
      parts.push(`${challenge.testWordCount} words`);
    }
    parts.push(challenge.testMode);
    if (challenge.testLanguage) {
      parts.push(challenge.testLanguage);
    }
    return parts.join(" | ");
  }, [challenge.testMode, challenge.testDuration, challenge.testWordCount, challenge.testLanguage]);

  // Winner check
  const isWinner = challenge.winnerId === currentUserId;

  return (
    <div
      className={cn(
        "rounded-lg border transition-all duration-125",
        "hover:border-opacity-80",
        className
      )}
      style={{
        backgroundColor: "var(--bg-color)",
        borderColor: "var(--sub-color)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center gap-3 min-w-0">
          {/* Opponent Avatar */}
          <Avatar
            src={opponent?.avatarUrl}
            alt={opponentName}
            fallback={opponentName.charAt(0)}
            size="lg"
            bordered
          />

          {/* Opponent Info */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className="font-medium truncate"
                style={{ color: "var(--text-color)" }}
              >
                {opponentName}
              </span>
              {challenge.status === "completed" && isWinner && (
                <Crown
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: "var(--main-color)" }}
                />
              )}
            </div>
            <span
              className="text-xs"
              style={{ color: "var(--sub-color)" }}
            >
              @{opponent?.username || "unknown"}
            </span>
          </div>
        </div>

        {/* Status Badge */}
        <div
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0"
          style={{
            backgroundColor: statusInfo.bg,
            color: statusInfo.text,
          }}
        >
          {challenge.status === "completed" ? (
            <Trophy className="w-3 h-3" />
          ) : challenge.status === "pending" ? (
            <Clock className="w-3 h-3" />
          ) : (
            <Swords className="w-3 h-3" />
          )}
          {statusInfo.label}
        </div>
      </div>

      {/* Test Config + Message */}
      <div className="px-4 pb-3">
        {/* Test config */}
        <div
          className="flex items-center gap-3 text-xs mt-1"
          style={{ color: "var(--sub-color)" }}
        >
          <span className="inline-flex items-center gap-1">
            {challenge.testMode === "time" ? (
              <Timer className="w-3 h-3" />
            ) : (
              <Type className="w-3 h-3" />
            )}
            {testConfigLabel}
          </span>
          {challenge.testLanguage && (
            <span className="inline-flex items-center gap-1">
              <Globe className="w-3 h-3" />
              {challenge.testLanguage}
            </span>
          )}
          <span>{createdAgo}</span>
        </div>

        {/* Optional message */}
        {challenge.message && (
          <p
            className="text-sm mt-2 italic"
            style={{ color: "var(--sub-color)" }}
          >
            &ldquo;{challenge.message}&rdquo;
          </p>
        )}

        {/* Expiry countdown for pending challenges */}
        {challenge.status === "pending" && (
          <div
            className="text-xs mt-2"
            style={{ color: isExpired ? "var(--error-color)" : "var(--sub-color)" }}
          >
            {isExpired ? "This challenge has expired" : `Expires ${expiresIn}`}
          </div>
        )}
      </div>

      {/* Actions */}
      <div
        className="flex items-center gap-2 px-4 py-3 border-t"
        style={{ borderColor: "var(--sub-color)" }}
      >
        {/* Received + Pending: Accept / Decline */}
        {challenge.direction === "received" && challenge.status === "pending" && !isExpired && (
          <>
            <Button
              variant="active"
              size="sm"
              onClick={() => onAccept?.(challenge.id)}
              disabled={isLoading}
              loading={loadingAction === `accept-${challenge.id}`}
              leftIcon={<Check className="w-4 h-4" />}
            >
              Accept
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDecline?.(challenge.id)}
              disabled={isLoading}
              loading={loadingAction === `decline-${challenge.id}`}
              leftIcon={<X className="w-4 h-4" />}
              className="text-error hover:text-error"
            >
              Decline
            </Button>
          </>
        )}

        {/* Sent + Pending: Cancel */}
        {challenge.direction === "sent" && challenge.status === "pending" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCancel?.(challenge.id)}
            disabled={isLoading}
            loading={loadingAction === `cancel-${challenge.id}`}
            leftIcon={<X className="w-4 h-4" />}
            className="text-error hover:text-error"
          >
            Cancel Challenge
          </Button>
        )}

        {/* Accepted / In Progress: Take Challenge */}
        {(challenge.status === "accepted" || challenge.status === "in_progress") && !myResultSubmitted && (
          <Button
            variant="active"
            size="sm"
            onClick={() => onTakeChallenge?.(challenge)}
            disabled={isLoading}
            leftIcon={<Swords className="w-4 h-4" />}
          >
            Take Challenge
          </Button>
        )}

        {/* Already submitted, waiting for opponent */}
        {(challenge.status === "accepted" || challenge.status === "in_progress") && myResultSubmitted && (
          <span
            className="text-sm"
            style={{ color: "var(--sub-color)" }}
          >
            Waiting for opponent...
          </span>
        )}

        {/* Completed: View Results (inline toggle) */}
        {challenge.status === "completed" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowResults(!showResults)}
            leftIcon={<Trophy className="w-4 h-4" />}
          >
            {showResults ? "Hide Results" : "View Results"}
          </Button>
        )}

        {/* Completed / Declined / Expired: View Details page */}
        {(challenge.status === "completed" ||
          challenge.status === "declined" ||
          challenge.status === "expired") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              router.push(`/challenges/completed/${challenge.id}`)
            }
            leftIcon={<ExternalLink className="w-4 h-4" />}
          >
            View Details
          </Button>
        )}

        {/* Winner / Loser indicator for completed */}
        {challenge.status === "completed" && (
          <span
            className="text-sm font-medium ml-auto"
            style={{
              color: isWinner ? "var(--main-color)" : "var(--error-color)",
            }}
          >
            {isWinner ? "You Won!" : "You Lost"}
          </span>
        )}
      </div>

      {/* Results Comparison (expanded) */}
      {showResults && challenge.status === "completed" && (
        <div
          className="px-4 pb-4 border-t"
          style={{ borderColor: "var(--sub-color)" }}
        >
          <ChallengeResultComparison
            challenger={challenge.challenger}
            challenged={challenge.challenged}
            challengerResult={challenge.challengerResult}
            challengedResult={challenge.challengedResult}
            winnerId={challenge.winnerId}
            className="mt-4"
          />
        </div>
      )}
    </div>
  );
}

export default ChallengeCard;
