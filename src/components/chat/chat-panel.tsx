"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";
import { useUserStore } from "@/store/user-store";
import { ChatMessage, type ChatMessageData } from "./chat-message";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Send, MessageSquare, AlertCircle, Loader2, Menu, ArrowLeft, Globe, User, Users, UserPlus } from "lucide-react";
import { Avatar, AvatarGroup } from "@/components/ui/avatar";
import { ChatSidebar } from "./chat-sidebar";
import { AddMemberModal } from './add-member-modal';

// Constants
const GLOBAL_ROOM_NAME = "Global Chat";
const POLL_INTERVAL = 4000; // 4 seconds

interface ChatRoom {
  id: string;
  name: string | null;
  type: "global" | "clan" | "race" | "direct";
  isGroup?: boolean;
  participantCount?: number;
  participants?: {
    id: string;
    username: string | null;
    displayName: string | null;
    avatarUrl: string | null;
  }[];
}

/**
 * Main chat panel component
 * Collapsible panel that slides in from the right side
 */
export function ChatPanel() {
  const isChatOpen = useUIStore((state) => state.isChatOpen);
  const chatRoomId = useUIStore((state) => state.chatRoomId);
  const chatRoomType = useUIStore((state) => state.chatRoomType);
  const chatRoomName = useUIStore((state) => state.chatRoomName);
  const toggleChat = useUIStore((state) => state.toggleChat);
  const setChatRoom = useUIStore((state) => state.setChatRoom);

  const user = useUserStore((state) => state.user);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);

  // State
  const [messages, setMessages] = React.useState<ChatMessageData[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [inputValue, setInputValue] = React.useState("");
  const [isSending, setIsSending] = React.useState(false);
  const [deletingMessageId, setDeletingMessageId] = React.useState<string | null>(null);
  const [globalRoom, setGlobalRoom] = React.useState<ChatRoom | null>(null);
  const [showSidebar, setShowSidebar] = React.useState(false);
  const [currentRoomParticipant, setCurrentRoomParticipant] = React.useState<{
    id: string;
    username: string | null;
    displayName: string | null;
    avatarUrl: string | null;
  } | null>(null);
  const [currentRoomParticipants, setCurrentRoomParticipants] = React.useState<{
    id: string;
    username: string | null;
    displayName: string | null;
    avatarUrl: string | null;
  }[]>([]);
  const [currentRoomIsGroup, setCurrentRoomIsGroup] = React.useState(false);
  const [currentRoomParticipantCount, setCurrentRoomParticipantCount] = React.useState(0);
  const [addMemberOpen, setAddMemberOpen] = React.useState(false);

  // Refs
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const messagesContainerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = React.useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Fetch global chat room (only when no room is selected)
  const fetchGlobalRoom = React.useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const response = await fetch("/api/chat?type=global");
      if (!response.ok) throw new Error("Failed to fetch chat rooms");

      const data = await response.json();
      if (data.rooms && data.rooms.length > 0) {
        const room = data.rooms[0];
        setGlobalRoom(room);
        // Only set room if no room is currently selected
        if (!chatRoomId) {
          setChatRoom(room.id, 'global', room.name || GLOBAL_ROOM_NAME);
        }
      }
    } catch (err) {
      console.error("Error fetching global room:", err);
      setError("Failed to connect to chat");
    }
  }, [isAuthenticated, setChatRoom, chatRoomId]);

  // Fetch room details when room changes (for DMs and groups, get participant info)
  const fetchRoomDetails = React.useCallback(async () => {
    if (!chatRoomId || !isAuthenticated) {
      setCurrentRoomParticipant(null);
      setCurrentRoomParticipants([]);
      setCurrentRoomIsGroup(false);
      setCurrentRoomParticipantCount(0);
      return;
    }

    // Skip for global rooms
    if (chatRoomType === 'global') {
      setCurrentRoomParticipant(null);
      setCurrentRoomParticipants([]);
      setCurrentRoomIsGroup(false);
      setCurrentRoomParticipantCount(0);
      return;
    }

    try {
      // Fetch all direct/group rooms (they're stored as 'direct' in DB)
      const response = await fetch(`/api/chat`);
      if (!response.ok) return;

      const data = await response.json();
      const room = data.rooms?.find((r: ChatRoom & { isGroup?: boolean }) => r.id === chatRoomId);
      if (room && room.participants) {
        setCurrentRoomParticipants(room.participants);
        setCurrentRoomIsGroup(room.isGroup || false);
        setCurrentRoomParticipantCount(room.participantCount || room.participants.length + 1);

        // For DMs, set the single participant
        if (!room.isGroup && room.participants.length > 0) {
          setCurrentRoomParticipant(room.participants[0]);
        } else {
          setCurrentRoomParticipant(null);
        }
      }
    } catch (err) {
      console.error("Error fetching room details:", err);
    }
  }, [chatRoomId, chatRoomType, isAuthenticated]);

  // Fetch room details when room changes
  React.useEffect(() => {
    fetchRoomDetails();
  }, [fetchRoomDetails]);

  // Fetch messages for current room
  const fetchMessages = React.useCallback(async () => {
    if (!chatRoomId || !isAuthenticated) return;

    try {
      const response = await fetch(`/api/chat/messages?roomId=${chatRoomId}`);
      if (!response.ok) throw new Error("Failed to fetch messages");

      const data = await response.json();
      setMessages(data.messages || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError("Failed to load messages");
    }
  }, [chatRoomId, isAuthenticated]);

  // Initial fetch of global room
  React.useEffect(() => {
    if (isChatOpen && isAuthenticated && !globalRoom) {
      fetchGlobalRoom();
    }
  }, [isChatOpen, isAuthenticated, globalRoom, fetchGlobalRoom]);

  // Initial fetch and polling for messages
  React.useEffect(() => {
    if (!isChatOpen || !chatRoomId || !isAuthenticated) return;

    // Initial fetch
    setIsLoading(true);
    fetchMessages().finally(() => setIsLoading(false));

    // Set up polling
    const pollInterval = setInterval(fetchMessages, POLL_INTERVAL);

    return () => clearInterval(pollInterval);
  }, [isChatOpen, chatRoomId, isAuthenticated, fetchMessages]);

  // Scroll to bottom when messages change
  React.useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Focus input when panel opens
  React.useEffect(() => {
    if (isChatOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isChatOpen]);

  // Send message handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    const content = inputValue.trim();
    if (!content || !chatRoomId || isSending) return;

    setIsSending(true);
    setInputValue("");

    try {
      const response = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: chatRoomId,
          content,
          messageType: "text",
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to send message");
      }

      const data = await response.json();
      setMessages((prev) => [...prev, data.message]);
    } catch (err) {
      console.error("Error sending message:", err);
      setError(err instanceof Error ? err.message : "Failed to send message");
      // Restore the input value on error
      setInputValue(content);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  // Delete message handler
  const handleDeleteMessage = async (messageId: string) => {
    if (deletingMessageId) return;

    setDeletingMessageId(messageId);

    try {
      const response = await fetch(`/api/chat/messages?messageId=${messageId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete message");
      }

      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch (err) {
      console.error("Error deleting message:", err);
      setError(err instanceof Error ? err.message : "Failed to delete message");
    } finally {
      setDeletingMessageId(null);
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      toggleChat();
    }
  };

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      {isChatOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={toggleChat}
        />
      )}

      {/* Panel */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-full md:w-96 bg-bg border-l border-sub-alt z-50",
          "transform transition-transform duration-300 ease-out",
          "flex flex-col",
          isChatOpen ? "translate-x-0" : "translate-x-full"
        )}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-sub-alt">
          <div className="flex items-center gap-2">
            {/* Menu button to show sidebar */}
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-1.5 rounded-md text-sub hover:text-text hover:bg-sub-alt transition-colors"
              title="Show conversations"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Room info */}
            {chatRoomType === 'group' || currentRoomIsGroup ? (
              // Group chat header
              <>
                {currentRoomParticipants.length > 0 ? (
                  <AvatarGroup
                    avatars={currentRoomParticipants.slice(0, 3).map((p) => ({
                      src: p.avatarUrl,
                      alt: p.displayName || p.username || "User",
                      fallback: (p.displayName || p.username || "U").charAt(0),
                    }))}
                    max={3}
                    size="sm"
                  />
                ) : (
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-sub-alt">
                    <Users className="h-4 w-4 text-main" />
                  </div>
                )}
                <div className="flex flex-col min-w-0">
                  <h2 className="font-medium text-text leading-tight truncate">
                    {chatRoomName || "Group Chat"}
                  </h2>
                  <span className="text-xs text-sub">
                    {currentRoomParticipantCount} members
                  </span>
                </div>
                <button
                  onClick={() => setAddMemberOpen(true)}
                  className="p-1.5 rounded-md text-sub hover:text-main hover:bg-sub-alt transition-colors"
                  title="Add member"
                >
                  <UserPlus className="h-4 w-4" />
                </button>
              </>
            ) : chatRoomType === 'direct' && currentRoomParticipant ? (
              // Direct message header
              <>
                <Avatar
                  src={currentRoomParticipant.avatarUrl}
                  alt={currentRoomParticipant.displayName || currentRoomParticipant.username || "User"}
                  fallback={(currentRoomParticipant.displayName || currentRoomParticipant.username || "U").charAt(0)}
                  size="sm"
                />
                <div className="flex flex-col">
                  <h2 className="font-medium text-text leading-tight">
                    {chatRoomName || currentRoomParticipant.displayName || currentRoomParticipant.username}
                  </h2>
                  <span className="text-xs text-sub">Direct Message</span>
                </div>
              </>
            ) : (
              // Global/other room header
              <>
                {chatRoomType === 'global' ? (
                  <Globe className="h-5 w-5 text-main" />
                ) : (
                  <MessageSquare className="h-5 w-5 text-main" />
                )}
                <h2 className="font-medium text-text">
                  {chatRoomName || globalRoom?.name || GLOBAL_ROOM_NAME}
                </h2>
              </>
            )}
          </div>
          <button
            onClick={toggleChat}
            className="p-1.5 rounded-md text-sub hover:text-text hover:bg-sub-alt transition-colors"
            title="Close chat (Esc)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sidebar overlay */}
        {showSidebar && (
          <div className="absolute inset-0 z-10 bg-bg flex flex-col">
            <ChatSidebar
              onSelectRoom={() => setShowSidebar(false)}
              onBack={() => setShowSidebar(false)}
            />
          </div>
        )}

        {/* Messages area */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-2 py-2"
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 text-sub animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <AlertCircle className="h-8 w-8 text-error mb-2" />
              <p className="text-sm text-error">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  fetchMessages();
                }}
                className="mt-2 text-sm text-main hover:underline"
              >
                Try again
              </button>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <MessageSquare className="h-8 w-8 text-sub mb-2" />
              <p className="text-sm text-sub">No messages yet</p>
              <p className="text-xs text-sub mt-1">Be the first to say something!</p>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  currentUserId={user?.id || null}
                  onDelete={handleDeleteMessage}
                  isDeleting={deletingMessageId === message.id}
                />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input area */}
        <form
          onSubmit={handleSendMessage}
          className="border-t border-sub-alt px-3 py-3"
        >
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type a message..."
              maxLength={500}
              disabled={isSending || !chatRoomId}
              className="flex-1"
            />
            <Button
              type="submit"
              variant="active"
              size="icon"
              disabled={!inputValue.trim() || isSending || !chatRoomId}
              loading={isSending}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>

      {/* Add Member Modal for group chats */}
      {currentRoomIsGroup && chatRoomId && (
        <AddMemberModal
          open={addMemberOpen}
          onOpenChange={setAddMemberOpen}
          roomId={chatRoomId}
          existingParticipantIds={currentRoomParticipants.map((p) => p.id)}
          onMembersAdded={() => {
            fetchRoomDetails();
          }}
        />
      )}
    </>
  );
}

export default ChatPanel;
