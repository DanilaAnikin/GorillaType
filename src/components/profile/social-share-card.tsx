"use client";

import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils/cn";
import { formatNumber, formatPercentage } from "@/lib/utils/formatting";
import {
  Share2,
  Copy,
  Check,
  Download,
  Twitter,
  Link as LinkIcon,
  Zap,
  Target,
  Flame,
  Trophy,
} from "lucide-react";

/**
 * Data required to render the social share card.
 */
export interface ShareCardData {
  username: string;
  displayName?: string;
  level: number;
  averageWPM: number;
  averageAccuracy: number;
  testsCompleted: number;
  currentStreak: number;
  bestWPM?: number;
}

/**
 * Props for the SocialShareCard component.
 */
export interface SocialShareCardProps {
  /** Data to render on the share card */
  data: ShareCardData;
  /** The profile URL to share */
  profileUrl: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * SocialShareCard provides a shareable profile card with stats,
 * along with buttons to copy the link, share on social media,
 * or download the card as an image.
 *
 * @example
 * <SocialShareCard
 *   data={{
 *     username: "speedtyper",
 *     level: 15,
 *     averageWPM: 95,
 *     averageAccuracy: 97.5,
 *     testsCompleted: 523,
 *     currentStreak: 7,
 *     bestWPM: 142,
 *   }}
 *   profileUrl="https://gorilla-type.com/profile/speedtyper"
 * />
 */
export function SocialShareCard({ data, profileUrl, className }: SocialShareCardProps) {
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  /**
   * Copy profile URL to clipboard.
   */
  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = profileUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [profileUrl]);

  /**
   * Share on Twitter/X.
   */
  const handleShareTwitter = useCallback(() => {
    const text = `Check out my typing stats on Gorilla Type! ${data.averageWPM} WPM avg | ${formatPercentage(data.averageAccuracy, { decimals: 1 })} accuracy | Level ${data.level}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(profileUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }, [data, profileUrl]);

  /**
   * Use Web Share API if available.
   */
  const handleNativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${data.displayName || data.username}'s Typing Profile`,
          text: `${data.averageWPM} WPM avg | ${formatPercentage(data.averageAccuracy, { decimals: 1 })} accuracy | Level ${data.level}`,
          url: profileUrl,
        });
      } catch {
        // User cancelled or error - do nothing
      }
    } else {
      setShareOpen(!shareOpen);
    }
  }, [data, profileUrl, shareOpen]);

  /**
   * Download the share card as a PNG image using canvas.
   */
  const handleDownload = useCallback(async () => {
    if (!cardRef.current) return;

    try {
      // Dynamically import html2canvas if available, otherwise generate a simple text image
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const width = 600;
      const height = 340;
      canvas.width = width;
      canvas.height = height;

      // Get computed styles from the card
      const computedStyle = getComputedStyle(cardRef.current);
      const bgColor = computedStyle.getPropertyValue("--bg-color").trim() || "#1e1e2e";
      const textColor = computedStyle.getPropertyValue("--text-color").trim() || "#cdd6f4";
      const mainColor = computedStyle.getPropertyValue("--main-color").trim() || "#89b4fa";
      const subColor = computedStyle.getPropertyValue("--sub-color").trim() || "#6c7086";

      // Background
      ctx.fillStyle = bgColor;
      ctx.beginPath();
      ctx.roundRect(0, 0, width, height, 16);
      ctx.fill();

      // Border
      ctx.strokeStyle = subColor + "40";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(1, 1, width - 2, height - 2, 16);
      ctx.stroke();

      // Header
      ctx.fillStyle = mainColor;
      ctx.font = "bold 24px system-ui, sans-serif";
      ctx.fillText(data.displayName || data.username, 32, 48);

      ctx.fillStyle = subColor;
      ctx.font = "14px system-ui, sans-serif";
      ctx.fillText(`Level ${data.level}`, 32, 72);

      // Divider
      ctx.fillStyle = subColor + "30";
      ctx.fillRect(32, 88, width - 64, 1);

      // Stats grid
      const stats = [
        { label: "AVG WPM", value: `${Math.round(data.averageWPM)}` },
        { label: "ACCURACY", value: formatPercentage(data.averageAccuracy, { decimals: 1 }) },
        { label: "TESTS", value: formatNumber(data.testsCompleted) },
        { label: "STREAK", value: `${data.currentStreak}d` },
      ];

      if (data.bestWPM) {
        stats.push({ label: "BEST WPM", value: `${Math.round(data.bestWPM)}` });
      }

      const colWidth = (width - 64) / Math.min(stats.length, 3);
      stats.forEach((stat, i) => {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const x = 32 + col * colWidth;
        const y = 116 + row * 90;

        ctx.fillStyle = textColor;
        ctx.font = "bold 32px system-ui, sans-serif";
        ctx.fillText(stat.value, x, y + 30);

        ctx.fillStyle = subColor;
        ctx.font = "12px system-ui, sans-serif";
        ctx.fillText(stat.label, x, y + 50);
      });

      // Footer
      ctx.fillStyle = subColor;
      ctx.font = "12px system-ui, sans-serif";
      ctx.fillText("gorilla-type.com", 32, height - 20);

      // Download
      const link = document.createElement("a");
      link.download = `gorilla-type-${data.username}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      // Fallback: just copy the link
      handleCopyLink();
    }
  }, [data, handleCopyLink]);

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
          <Share2 className="w-5 h-5 text-main" />
          <h2 className="text-xl font-semibold text-text">Share Profile</h2>
        </div>

        {/* Share buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-125",
              copied
                ? "bg-main/10 text-main border border-main/20"
                : "bg-sub-alt hover:bg-sub/20 text-sub hover:text-text border border-sub/30"
            )}
            title="Copy profile link"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied
              </>
            ) : (
              <>
                <LinkIcon className="w-4 h-4" />
                Copy Link
              </>
            )}
          </button>

          <button
            onClick={handleShareTwitter}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-sub-alt hover:bg-sub/20 text-sub hover:text-text border border-sub/30 transition-all duration-125"
            title="Share on Twitter/X"
          >
            <Twitter className="w-4 h-4" />
          </button>

          <button
            onClick={handleNativeShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-sub-alt hover:bg-sub/20 text-sub hover:text-text border border-sub/30 transition-all duration-125"
            title="Share"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-sub-alt hover:bg-sub/20 text-sub hover:text-text border border-sub/30 transition-all duration-125"
            title="Download card image"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preview Card */}
      <div
        ref={cardRef}
        className="rounded-lg border border-sub p-6 bg-bg transition-all duration-125"
        style={{
          // Expose CSS custom properties for canvas rendering
          "--bg-color": "var(--bg-color)",
          "--text-color": "var(--text-color)",
          "--main-color": "var(--main-color)",
          "--sub-color": "var(--sub-color)",
        } as React.CSSProperties}
      >
        {/* Card Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-main">
              {data.displayName || data.username}
            </h3>
            {data.displayName && (
              <p className="text-sm text-sub">@{data.username}</p>
            )}
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 bg-main/10 text-main text-sm font-medium rounded-full border border-main/20">
            <Trophy className="w-3.5 h-3.5" />
            Level {data.level}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-sub/30 mb-4" />

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 mb-1">
              <Zap className="w-4 h-4 text-main" />
              <span className="text-xs text-sub uppercase tracking-wide">Avg WPM</span>
            </div>
            <span className="text-2xl font-bold text-text">
              {Math.round(data.averageWPM)}
            </span>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 mb-1">
              <Target className="w-4 h-4 text-main" />
              <span className="text-xs text-sub uppercase tracking-wide">Accuracy</span>
            </div>
            <span className="text-2xl font-bold text-text">
              {formatPercentage(data.averageAccuracy, { decimals: 1 })}
            </span>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 mb-1">
              <Flame className="w-4 h-4 text-main" />
              <span className="text-xs text-sub uppercase tracking-wide">Streak</span>
            </div>
            <span className="text-2xl font-bold text-text">
              {data.currentStreak}d
            </span>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 mb-1">
              <Trophy className="w-4 h-4 text-main" />
              <span className="text-xs text-sub uppercase tracking-wide">Tests</span>
            </div>
            <span className="text-2xl font-bold text-text">
              {formatNumber(data.testsCompleted)}
            </span>
          </div>
        </div>

        {/* Best WPM callout */}
        {data.bestWPM && (
          <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-main/5 border border-main/10">
            <Zap className="w-4 h-4 text-main" />
            <span className="text-sm text-sub">Personal Best:</span>
            <span className="text-sm font-bold text-main">{Math.round(data.bestWPM)} WPM</span>
          </div>
        )}

        {/* Footer branding */}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-sub/60">gorilla-type.com</span>
          <span className="text-xs text-sub/60">
            {data.displayName || data.username}&apos;s profile
          </span>
        </div>
      </div>
    </div>
  );
}

export default SocialShareCard;
