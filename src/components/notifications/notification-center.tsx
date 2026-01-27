"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, LoaderCircle, Inbox } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useNotificationsStore } from "@/store/notifications-store";
import { useUserStore, selectIsLoggedIn } from "@/store/user-store";
import { NotificationItem } from "./notification-item";
import type { InboxNotification } from "@/store/notifications-store";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

/* ============================================
   NOTIFICATION CENTER COMPONENT
   Popover panel triggered from the header bell icon.
   Displays in-app notifications with read/unread state.
   ============================================ */

export function NotificationCenter() {
  const router = useRouter();
  const isLoggedIn = useUserStore(selectIsLoggedIn);

  const notifications = useNotificationsStore((s) => s.notifications);
  const unreadCount = useNotificationsStore((s) => s.unreadCount);
  const isLoading = useNotificationsStore((s) => s.isLoading);
  const isOpen = useNotificationsStore((s) => s.isOpen);
  const setIsOpen = useNotificationsStore((s) => s.setIsOpen);
  const fetchNotifications = useNotificationsStore((s) => s.fetchNotifications);
  const markAsRead = useNotificationsStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationsStore((s) => s.markAllAsRead);
  const removeNotification = useNotificationsStore((s) => s.removeNotification);

  // Fetch notifications on mount when logged in
  React.useEffect(() => {
    if (isLoggedIn) {
      fetchNotifications();
    }
  }, [isLoggedIn, fetchNotifications]);

  const handleNotificationClick = (notification: InboxNotification) => {
    // Mark as read on click (ensures it always fires, even if the child
    // component's onRead call was skipped or the notification was already read)
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    // Navigate using the Next.js router so we stay in the SPA and
    // don't abort the in-flight PATCH request that markAsRead fires
    if (notification.link) {
      router.push(notification.link);
    }

    setIsOpen(false);
  };

  // Don't render anything if not logged in
  if (!isLoggedIn) return null;

  return (
    <PopoverPrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverPrimitive.Trigger asChild>
            <button
              className={cn(
                "relative inline-flex items-center justify-center h-9 w-9 rounded-lg transition-all duration-[125ms]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
                isOpen
                  ? "text-main bg-sub-alt"
                  : "text-sub hover:text-text hover:bg-sub-alt/50"
              )}
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />

              {/* Unread badge */}
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold leading-none text-bg">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}

              <span className="sr-only">Notifications</span>
            </button>
          </PopoverPrimitive.Trigger>
        </TooltipTrigger>
        <TooltipContent>Notifications</TooltipContent>
      </Tooltip>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="end"
          sideOffset={8}
          className={cn(
            "z-50 w-[360px] max-h-[480px] overflow-hidden",
            "rounded-lg border border-sub/20 bg-bg shadow-lg",
            "data-[state=open]:animate-fade-in-up",
            "data-[state=closed]:animate-fade-out",
            "data-[side=bottom]:slide-in-from-top-2",
            "data-[side=top]:slide-in-from-bottom-2"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-sub/20 px-4 py-3">
            <h3 className="text-sm font-semibold text-text">Notifications</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className={cn(
                  "inline-flex items-center gap-1.5 text-xs font-medium transition-all duration-[125ms]",
                  "text-sub hover:text-main",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main rounded-md px-1.5 py-0.5"
                )}
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all as read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="overflow-y-auto max-h-[400px] p-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <LoaderCircle className="h-5 w-5 animate-spin text-sub" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-sub">
                <Inbox className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="flex flex-col gap-0.5">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onRead={markAsRead}
                    onDelete={removeNotification}
                    onClick={handleNotificationClick}
                  />
                ))}
              </div>
            )}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
