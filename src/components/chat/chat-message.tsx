"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils/formatting";
import { Avatar } from "@/components/ui/avatar";
import { Trash2 } from "lucide-react";

/**
 * Types for message data matching the API response
 */
export interface ChatMessageSender {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  level: number;
}

export interface ChatMessageResult {
  id: string;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  testDuration: number;
  testMode: string;
  createdAt: string;
}

export interface ChatMessageData {
  id: string;
  roomId: string;
  content: string;
  messageType: "text" | "result_share" | "system";
  isDeleted: boolean;
  editedAt: string | null;
  createdAt: string;
  sender: ChatMessageSender;
  result: ChatMessageResult | null;
}

interface ChatMessageProps {
  message: ChatMessageData;
  currentUserId: string | null;
  onDelete?: (messageId: string) => void;
  isDeleting?: boolean;
}

/**
 * Mini result card for result_share messages
 */
function MiniResultCard({ result }: { result: ChatMessageResult }) {
  return (
    <div className="mt-2 rounded-md bg-sub-alt p-3 border border-sub/30">
      <div className="flex items-center gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-main">{Math.round(result.wpm)}</div>
          <div className="text-xs text-sub">WPM</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-medium text-text">{result.accuracy.toFixed(1)}%</div>
          <div className="text-xs text-sub">Accuracy</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-sub">{result.testDuration}s</div>
          <div className="text-xs text-sub">{result.testMode}</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Individual chat message component
 */
export function ChatMessage({
  message,
  currentUserId,
  onDelete,
  isDeleting = false,
}: ChatMessageProps) {
  const isOwnMessage = currentUserId === message.sender.id;
  const isSystem = message.messageType === "system";
  const displayName =
    message.sender.displayName || message.sender.username || "Anonymous";

  // System messages have a different appearance
  if (isSystem) {
    return (
      <div className="flex justify-center py-2">
        <span className="text-xs text-sub italic">{message.content}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group flex gap-3 py-2 px-2 rounded-md transition-colors hover:bg-sub-alt/30",
        isOwnMessage && "flex-row-reverse"
      )}
    >
      {/* Avatar */}
      <Avatar
        src={message.sender.avatarUrl}
        alt={displayName}
        fallback={displayName.charAt(0)}
        size="sm"
      />

      {/* Message content */}
      <div
        className={cn(
          "flex flex-col flex-1 min-w-0",
          isOwnMessage && "items-end"
        )}
      >
        {/* Header: username and timestamp */}
        <div
          className={cn(
            "flex items-center gap-2 mb-0.5",
            isOwnMessage && "flex-row-reverse"
          )}
        >
          <span className="text-sm font-medium text-text truncate max-w-[150px]">
            {displayName}
          </span>
          <span className="text-xs text-sub">
            {formatRelativeTime(message.createdAt)}
          </span>
          {message.editedAt && (
            <span className="text-xs text-sub italic">(edited)</span>
          )}
        </div>

        {/* Message body */}
        <div
          className={cn(
            "text-sm text-text break-words max-w-full",
            isOwnMessage && "text-right"
          )}
        >
          {message.content}
        </div>

        {/* Result card for result_share messages */}
        {message.messageType === "result_share" && message.result && (
          <MiniResultCard result={message.result} />
        )}

        {/* Delete button for own messages */}
        {isOwnMessage && onDelete && (
          <button
            onClick={() => onDelete(message.id)}
            disabled={isDeleting}
            className={cn(
              "opacity-0 group-hover:opacity-100 transition-opacity mt-1",
              "text-sub hover:text-error p-1 rounded",
              isDeleting && "cursor-not-allowed opacity-50"
            )}
            title="Delete message"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}

export default ChatMessage;
