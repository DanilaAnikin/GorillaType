"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";
import { useUserStore } from "@/store/user-store";
import { MessageSquare } from "lucide-react";

interface ChatToggleProps {
  className?: string;
}

/**
 * Fixed position button to toggle the chat panel
 * Shows unread count badge when there are unread messages
 */
export function ChatToggle({ className }: ChatToggleProps) {
  const isChatOpen = useUIStore((state) => state.isChatOpen);
  const toggleChat = useUIStore((state) => state.toggleChat);
  const isFocusMode = useUIStore((state) => state.isFocusMode);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const isLoading = useUserStore((state) => state.isLoading);

  // State for unread count
  const [unreadCount, setUnreadCount] = React.useState(0);

  // Reset unread count when chat is opened
  React.useEffect(() => {
    if (isChatOpen) {
      setUnreadCount(0);
    }
  }, [isChatOpen]);

  // Don't render if not authenticated or still loading
  if (!isAuthenticated || isLoading) {
    return null;
  }

  // Hide in focus mode
  if (isFocusMode) {
    return null;
  }

  return (
    <button
      onClick={toggleChat}
      className={cn(
        "fixed bottom-6 right-6 z-30",
        "flex items-center justify-center",
        "h-12 w-12 rounded-full",
        "bg-sub-alt text-sub shadow-lg",
        "hover:bg-main hover:text-bg",
        "transition-all duration-200 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        isChatOpen && "bg-main text-bg",
        className
      )}
      title={isChatOpen ? "Close chat" : "Open chat"}
      aria-label={isChatOpen ? "Close chat" : "Open chat"}
      aria-expanded={isChatOpen}
    >
      <MessageSquare className="h-5 w-5" />

      {/* Unread badge */}
      {unreadCount > 0 && !isChatOpen && (
        <span
          className={cn(
            "absolute -top-1 -right-1",
            "flex items-center justify-center",
            "min-w-[20px] h-5 px-1.5",
            "rounded-full bg-error text-bg",
            "text-xs font-medium"
          )}
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );
}

export default ChatToggle;
