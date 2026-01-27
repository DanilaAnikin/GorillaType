"use client";

import * as React from "react";
import { X, Swords, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";

/**
 * User info needed to send a challenge
 */
export interface ChallengedUser {
  id: string;
  username: string | null;
  avatarUrl?: string | null;
  displayName?: string | null;
}

/**
 * Props for SendChallengeModal
 */
export interface SendChallengeModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Close callback */
  onClose: () => void;
  /** User to challenge */
  challengedUser: ChallengedUser;
  /** Optional callback on success */
  onSuccess?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * SendChallengeModal allows users to configure and send a 1v1 typing challenge.
 */
export function SendChallengeModal({
  isOpen,
  onClose,
  challengedUser,
  onSuccess,
  className,
}: SendChallengeModalProps) {
  const [testMode, setTestMode] = React.useState<"time" | "words">("time");
  const [testDuration, setTestDuration] = React.useState(30);
  const [testWordCount, setTestWordCount] = React.useState(25);
  const [testLanguage, setTestLanguage] = React.useState("english");
  const [message, setMessage] = React.useState("");

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  // Reset state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccess(false);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const body: Record<string, unknown> = {
        challengedId: challengedUser.id,
        testMode,
        testLanguage,
      };

      if (testMode === "time") {
        body.testDuration = testDuration;
      } else {
        body.testWordCount = testWordCount;
      }

      if (message.trim()) {
        body.message = message.trim();
      }

      const response = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send challenge");
      }

      setSuccess(true);
      onSuccess?.();

      // Auto-close after success
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send challenge");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const displayName =
    challengedUser.displayName || challengedUser.username || "Unknown";

  const durationOptions = [15, 30, 60, 120];
  const wordCountOptions = [10, 25, 50, 100];
  const languageOptions = ["english", "programming"];

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4",
        className
      )}
      style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Send Challenge"
    >
      <div
        className="w-full max-w-md rounded-lg shadow-xl"
        style={{
          backgroundColor: "var(--bg-color)",
          border: "1px solid var(--sub-color)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: "var(--sub-color)" }}
        >
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5" style={{ color: "var(--main-color)" }} />
            <h2
              className="text-lg font-bold"
              style={{ color: "var(--text-color)" }}
            >
              Send Challenge
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded transition-colors"
            style={{ color: "var(--sub-color)" }}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Challenged User */}
          <div
            className="flex items-center gap-3 p-3 rounded-lg mb-4"
            style={{
              backgroundColor: "color-mix(in srgb, var(--sub-color) 10%, var(--bg-color))",
            }}
          >
            <Avatar
              src={challengedUser.avatarUrl}
              alt={displayName}
              fallback={displayName.charAt(0)}
              size="md"
              bordered
            />
            <div>
              <div
                className="font-medium text-sm"
                style={{ color: "var(--text-color)" }}
              >
                {displayName}
              </div>
              <div className="text-xs" style={{ color: "var(--sub-color)" }}>
                @{challengedUser.username || "unknown"}
              </div>
            </div>
          </div>

          {/* Success State */}
          {success ? (
            <div className="flex flex-col items-center py-6 gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "color-mix(in srgb, var(--main-color) 15%, var(--bg-color))" }}
              >
                <Check className="w-6 h-6" style={{ color: "var(--main-color)" }} />
              </div>
              <p className="text-sm font-medium" style={{ color: "var(--main-color)" }}>
                Challenge sent!
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Error */}
              {error && (
                <div
                  className="flex items-center gap-2 p-3 rounded-lg mb-4 text-sm"
                  style={{
                    backgroundColor: "color-mix(in srgb, var(--error-color) 10%, var(--bg-color))",
                    color: "var(--error-color)",
                  }}
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* Test Mode */}
              <div className="mb-4">
                <label
                  className="block text-xs uppercase tracking-wider mb-2 font-medium"
                  style={{ color: "var(--sub-color)" }}
                >
                  Test Mode
                </label>
                <div className="flex gap-2">
                  {(["time", "words"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setTestMode(mode)}
                      className={cn(
                        "flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-125",
                      )}
                      style={{
                        backgroundColor: testMode === mode
                          ? "var(--main-color)"
                          : "color-mix(in srgb, var(--sub-color) 15%, var(--bg-color))",
                        color: testMode === mode
                          ? "var(--bg-color)"
                          : "var(--sub-color)",
                      }}
                    >
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration / Word Count */}
              <div className="mb-4">
                <label
                  className="block text-xs uppercase tracking-wider mb-2 font-medium"
                  style={{ color: "var(--sub-color)" }}
                >
                  {testMode === "time" ? "Duration" : "Word Count"}
                </label>
                <div className="flex gap-2">
                  {(testMode === "time" ? durationOptions : wordCountOptions).map(
                    (opt) => {
                      const isSelected =
                        testMode === "time"
                          ? testDuration === opt
                          : testWordCount === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() =>
                            testMode === "time"
                              ? setTestDuration(opt)
                              : setTestWordCount(opt)
                          }
                          className="flex-1 px-2 py-2 rounded-md text-sm font-medium transition-all duration-125"
                          style={{
                            backgroundColor: isSelected
                              ? "var(--main-color)"
                              : "color-mix(in srgb, var(--sub-color) 15%, var(--bg-color))",
                            color: isSelected
                              ? "var(--bg-color)"
                              : "var(--sub-color)",
                          }}
                        >
                          {testMode === "time" ? `${opt}s` : opt}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Language */}
              <div className="mb-4">
                <label
                  className="block text-xs uppercase tracking-wider mb-2 font-medium"
                  style={{ color: "var(--sub-color)" }}
                >
                  Language
                </label>
                <div className="flex gap-2">
                  {languageOptions.map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setTestLanguage(lang)}
                      className="flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-125"
                      style={{
                        backgroundColor: testLanguage === lang
                          ? "var(--main-color)"
                          : "color-mix(in srgb, var(--sub-color) 15%, var(--bg-color))",
                        color: testLanguage === lang
                          ? "var(--bg-color)"
                          : "var(--sub-color)",
                      }}
                    >
                      {lang.charAt(0).toUpperCase() + lang.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div className="mb-4">
                <label
                  className="block text-xs uppercase tracking-wider mb-2 font-medium"
                  style={{ color: "var(--sub-color)" }}
                >
                  Message (optional)
                </label>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={256}
                  placeholder="Think you can beat me?"
                  className="w-full px-3 py-2 rounded-md text-sm outline-none transition-all duration-125"
                  style={{
                    backgroundColor: "color-mix(in srgb, var(--sub-color) 15%, var(--bg-color))",
                    color: "var(--text-color)",
                    border: "1px solid var(--sub-color)",
                  }}
                />
              </div>

              {/* Submit */}
              <Button
                type="submit"
                variant="active"
                size="md"
                className="w-full"
                loading={isSubmitting}
                loadingText="Sending..."
                leftIcon={<Swords className="w-4 h-4" />}
                disabled={isSubmitting}
              >
                Send Challenge
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default SendChallengeModal;
