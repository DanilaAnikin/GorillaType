"use client";

import * as React from "react";
import {
  Bell,
  Users,
  Shield,
  Trophy,
  Swords,
  Target,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatRelativeTime } from "@/lib/utils";
import type { InboxNotification, InboxNotificationType } from "@/store/notifications-store";

/* ============================================
   NOTIFICATION ITEM COMPONENT
   Individual notification row in the notification center
   ============================================ */

/**
 * Returns the icon component for a given notification type.
 */
function getNotificationIcon(type: InboxNotificationType): React.ReactNode {
  switch (type) {
    case 'friend_request':
      return <Users className="h-4 w-4" />;
    case 'clan_invite':
      return <Shield className="h-4 w-4" />;
    case 'pb_achieved':
    case 'tournament_start':
      return <Trophy className="h-4 w-4" />;
    case 'challenge_received':
      return <Swords className="h-4 w-4" />;
    case 'challenge_result':
      return <Target className="h-4 w-4" />;
    case 'system':
    default:
      return <Bell className="h-4 w-4" />;
  }
}

/**
 * Returns the accent color class for a given notification type.
 */
function getNotificationColor(type: InboxNotificationType): string {
  switch (type) {
    case 'friend_request':
      return 'text-main';
    case 'clan_invite':
      return 'text-main';
    case 'pb_achieved':
      return 'text-main';
    case 'tournament_start':
      return 'text-main';
    case 'challenge_received':
      return 'text-error';
    case 'challenge_result':
      return 'text-main';
    case 'system':
    default:
      return 'text-sub';
  }
}

interface NotificationItemProps {
  notification: InboxNotification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClick: (notification: InboxNotification) => void;
}

export function NotificationItem({
  notification,
  onRead,
  onDelete,
  onClick,
}: NotificationItemProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  const handleClick = () => {
    if (!notification.is_read) {
      onRead(notification.id);
    }
    onClick(notification);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(notification.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "group relative flex w-full cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-[125ms]",
        "hover:bg-sub-alt/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        !notification.is_read && "bg-sub-alt/30"
      )}
    >
      {/* Unread indicator dot */}
      {!notification.is_read && (
        <span className="absolute left-1 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-main" />
      )}

      {/* Type icon */}
      <div
        className={cn(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sub-alt/50",
          getNotificationColor(notification.type)
        )}
      >
        {getNotificationIcon(notification.type)}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm font-medium leading-tight",
            notification.is_read ? "text-sub" : "text-text"
          )}
        >
          {notification.title}
        </p>
        {notification.message && (
          <p className="mt-0.5 text-xs text-sub line-clamp-2">
            {notification.message}
          </p>
        )}
        <p className="mt-1 text-xs text-sub/70">
          {formatRelativeTime(notification.created_at)}
        </p>
      </div>

      {/* Delete button (visible on hover) */}
      <button
        type="button"
        onClick={handleDelete}
        className={cn(
          "shrink-0 mt-0.5 inline-flex items-center justify-center h-6 w-6 rounded-md transition-all duration-[125ms]",
          "text-sub hover:text-error hover:bg-error/10",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main",
          isHovered ? "opacity-100" : "opacity-0"
        )}
        aria-label="Delete notification"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
