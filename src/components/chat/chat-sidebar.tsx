"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";
import { useUserStore } from "@/store/user-store";
import { Avatar, AvatarGroup } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Globe, Users, MessageCircle, Loader2, ChevronLeft, Plus } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils/formatting";
import { CreateGroupModal } from "./create-group-modal";

// Types for chat room data
interface ChatParticipant {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
}

interface ChatRoomLatestMessage {
  content: string;
  createdAt: string;
  sender: {
    id: string;
    username: string | null;
    displayName: string | null;
  };
}

interface ChatRoom {
  id: string;
  type: "global" | "direct" | "clan" | "race";
  virtualType?: "direct" | "group"; // 'direct' for DMs, 'group' for group chats
  isGroup?: boolean;
  name: string | null;
  isActive: boolean;
  createdAt: string;
  isMuted: boolean;
  lastReadAt: string | null;
  participantCount?: number;
  participants: ChatParticipant[];
  latestMessage: ChatRoomLatestMessage | null;
  unreadCount: number;
}

interface ChatSidebarProps {
  className?: string;
  onSelectRoom?: (room: ChatRoom) => void;
  onBack?: () => void;
}

/**
 * Chat sidebar component that displays a list of chat conversations
 * organized by tabs: Global, Friends (DMs), and Groups
 */
export function ChatSidebar({ className, onSelectRoom, onBack }: ChatSidebarProps) {
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const chatRoomId = useUIStore((state) => state.chatRoomId);
  const setChatRoom = useUIStore((state) => state.setChatRoom);

  // State
  const [rooms, setRooms] = React.useState<ChatRoom[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<"global" | "friends" | "groups">("global");
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = React.useState(false);

  // Fetch all chat rooms
  const fetchRooms = React.useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);
      // Fetch all room types
      const response = await fetch("/api/chat");
      if (!response.ok) throw new Error("Failed to fetch chat rooms");

      const data = await response.json();
      setRooms(data.rooms || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching chat rooms:", err);
      setError("Failed to load conversations");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Fetch rooms on mount and periodically
  React.useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchRooms]);

  // Filter rooms by type
  // Global rooms
  const globalRooms = rooms.filter((r) => r.type === "global");
  // Direct messages: type is 'direct' and virtualType is 'direct' (not a group)
  const directRooms = rooms.filter((r) => r.type === "direct" && !r.isGroup);
  // Group chats: type is 'direct' but isGroup is true, OR type is 'clan' or 'race'
  const groupRooms = rooms.filter(
    (r) => r.isGroup || r.type === "clan" || r.type === "race"
  );

  // Calculate unread counts per tab
  const globalUnread = globalRooms.reduce((sum, r) => sum + r.unreadCount, 0);
  const directUnread = directRooms.reduce((sum, r) => sum + r.unreadCount, 0);
  const groupUnread = groupRooms.reduce((sum, r) => sum + r.unreadCount, 0);

  // Handle room selection
  const handleSelectRoom = (room: ChatRoom) => {
    // Determine room type for display purposes
    let roomType: "direct" | "global" | "group" = "group";
    if (room.type === "global") {
      roomType = "global";
    } else if (room.type === "direct") {
      roomType = room.isGroup ? "group" : "direct";
    }
    setChatRoom(room.id, roomType, room.name);
    onSelectRoom?.(room);
  };

  // Handle group creation success
  const handleGroupCreated = (roomId: string) => {
    // Refresh rooms to include the new group
    fetchRooms();
    // Select the new room
    setChatRoom(roomId, "group", null);
    onSelectRoom?.({
      id: roomId,
      type: "direct",
      virtualType: "group",
      isGroup: true,
      name: null,
      isActive: true,
      createdAt: new Date().toISOString(),
      isMuted: false,
      lastReadAt: null,
      participants: [],
      latestMessage: null,
      unreadCount: 0,
    });
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header with back button */}
      {onBack && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-sub-alt">
          <button
            onClick={onBack}
            className="p-1.5 rounded-md text-sub hover:text-text hover:bg-sub-alt transition-colors"
            title="Back to chat"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="font-medium text-text">Conversations</span>
        </div>
      )}

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as typeof activeTab)}
        className="flex-1 flex flex-col"
      >
        <TabsList className="mx-2 mt-2">
          <TabsTrigger value="global" className="flex-1 gap-1.5">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Global</span>
            {globalUnread > 0 && (
              <Badge size="sm" variant="destructive">
                {globalUnread > 99 ? "99+" : globalUnread}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="friends" className="flex-1 gap-1.5">
            <MessageCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Friends</span>
            {directUnread > 0 && (
              <Badge size="sm" variant="destructive">
                {directUnread > 99 ? "99+" : directUnread}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="groups" className="flex-1 gap-1.5">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Groups</span>
            {groupUnread > 0 && (
              <Badge size="sm" variant="destructive">
                {groupUnread > 99 ? "99+" : groupUnread}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Loading state */}
        {isLoading && (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-sub animate-spin" />
          </div>
        )}

        {/* Error state */}
        {!isLoading && error && (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
            <p className="text-sm text-error">{error}</p>
            <button
              onClick={fetchRooms}
              className="mt-2 text-sm text-main hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Content */}
        {!isLoading && !error && (
          <>
            <TabsContent value="global" className="flex-1 overflow-y-auto px-2">
              <RoomList
                rooms={globalRooms}
                selectedRoomId={chatRoomId}
                onSelectRoom={handleSelectRoom}
                emptyMessage="No global chat rooms available"
              />
            </TabsContent>

            <TabsContent value="friends" className="flex-1 overflow-y-auto px-2">
              <RoomList
                rooms={directRooms}
                selectedRoomId={chatRoomId}
                onSelectRoom={handleSelectRoom}
                emptyMessage="No direct messages yet. Message a friend to start chatting!"
                showAvatar
              />
            </TabsContent>

            <TabsContent value="groups" className="flex-1 overflow-y-auto px-2">
              {/* Create Group Button */}
              <div className="py-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setIsCreateGroupModalOpen(true)}
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  Create Group
                </Button>
              </div>
              <RoomList
                rooms={groupRooms}
                selectedRoomId={chatRoomId}
                onSelectRoom={handleSelectRoom}
                emptyMessage="No group chats yet. Create one to start chatting with friends!"
                showGroupAvatar
              />
            </TabsContent>
          </>
        )}
      </Tabs>

      {/* Create Group Modal */}
      <CreateGroupModal
        open={isCreateGroupModalOpen}
        onOpenChange={setIsCreateGroupModalOpen}
        onGroupCreated={handleGroupCreated}
      />
    </div>
  );
}

// Room list component
interface RoomListProps {
  rooms: ChatRoom[];
  selectedRoomId: string | null;
  onSelectRoom: (room: ChatRoom) => void;
  emptyMessage: string;
  showAvatar?: boolean;
  showGroupAvatar?: boolean;
}

function RoomList({
  rooms,
  selectedRoomId,
  onSelectRoom,
  emptyMessage,
  showAvatar = false,
  showGroupAvatar = false,
}: RoomListProps) {
  if (rooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-center">
        <p className="text-sm text-sub">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-1 py-2">
      {rooms.map((room) => (
        <RoomItem
          key={room.id}
          room={room}
          isSelected={room.id === selectedRoomId}
          onClick={() => onSelectRoom(room)}
          showAvatar={showAvatar}
          showGroupAvatar={showGroupAvatar}
        />
      ))}
    </div>
  );
}

// Room item component
interface RoomItemProps {
  room: ChatRoom;
  isSelected: boolean;
  onClick: () => void;
  showAvatar?: boolean;
  showGroupAvatar?: boolean;
}

function RoomItem({
  room,
  isSelected,
  onClick,
  showAvatar = false,
  showGroupAvatar = false,
}: RoomItemProps) {
  const participant = room.participants[0];
  const displayName = room.name || "Unknown";
  const latestMessage = room.latestMessage;
  const isGroup = room.isGroup || room.type === "clan" || room.type === "race";

  // For groups, show participant count
  const participantCount = room.participantCount || room.participants.length + 1; // +1 for self

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
        "hover:bg-sub-alt/50",
        isSelected && "bg-sub-alt"
      )}
    >
      {/* Avatar (for DMs) */}
      {showAvatar && participant && (
        <Avatar
          src={participant.avatarUrl}
          alt={displayName}
          fallback={displayName.charAt(0)}
          size="md"
        />
      )}

      {/* Group avatar (for groups) */}
      {showGroupAvatar && isGroup && (
        <>
          {room.participants.length > 0 ? (
            <AvatarGroup
              avatars={room.participants.slice(0, 3).map((p) => ({
                src: p.avatarUrl,
                alt: p.displayName || p.username || "User",
                fallback: (p.displayName || p.username || "U").charAt(0),
              }))}
              max={3}
              size="sm"
            />
          ) : (
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-sub-alt">
              <Users className="h-5 w-5 text-main" />
            </div>
          )}
        </>
      )}

      {/* Icon (for non-DMs, non-groups) */}
      {!showAvatar && !showGroupAvatar && (
        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-sub-alt">
          {room.type === "global" ? (
            <Globe className="h-5 w-5 text-main" />
          ) : (
            <Users className="h-5 w-5 text-main" />
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-medium text-text truncate">{displayName}</span>
            {isGroup && participantCount > 0 && (
              <span className="text-xs text-sub flex-shrink-0">
                ({participantCount})
              </span>
            )}
          </div>
          {latestMessage && (
            <span className="text-xs text-sub flex-shrink-0">
              {formatRelativeTime(latestMessage.createdAt)}
            </span>
          )}
        </div>
        {latestMessage && (
          <p className="text-sm text-sub truncate">
            {latestMessage.sender.displayName || latestMessage.sender.username}:{" "}
            {latestMessage.content}
          </p>
        )}
      </div>

      {/* Unread badge */}
      {room.unreadCount > 0 && (
        <Badge size="sm" variant="destructive" className="flex-shrink-0">
          {room.unreadCount > 99 ? "99+" : room.unreadCount}
        </Badge>
      )}
    </button>
  );
}

export default ChatSidebar;
