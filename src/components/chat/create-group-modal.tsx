"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { Users, Loader2, Check, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import {
  Modal,
  ModalTrigger,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  ModalClose,
} from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import type { Friend, FriendsApiResponse } from "@/components/friends/types";

/**
 * Props for the CreateGroupModal component.
 */
export interface CreateGroupModalProps {
  /** Whether the modal is open */
  open?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Trigger element (optional, can control externally) */
  trigger?: React.ReactNode;
  /** Callback when group is created successfully */
  onGroupCreated?: (roomId: string) => void;
}

/**
 * Friend item for selection
 */
interface FriendItem {
  id: string;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
}

/**
 * CreateGroupModal allows users to create a new group chat with friends.
 */
export function CreateGroupModal({
  open,
  onOpenChange,
  trigger,
  onGroupCreated,
}: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState("");
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch friends when modal opens
  const fetchFriends = useCallback(async () => {
    setIsLoadingFriends(true);
    setError(null);

    try {
      const response = await fetch("/api/friends?status=accepted");
      if (!response.ok) {
        throw new Error("Failed to fetch friends");
      }

      const data: FriendsApiResponse = await response.json();
      const friendItems: FriendItem[] = data.friends.map((f: Friend) => ({
        id: f.friend.id,
        username: f.friend.username,
        displayName: f.friend.displayName,
        avatarUrl: f.friend.avatarUrl,
      }));

      setFriends(friendItems);
    } catch (err) {
      console.error("Error fetching friends:", err);
      setError("Failed to load friends");
    } finally {
      setIsLoadingFriends(false);
    }
  }, []);

  // Fetch friends when modal opens
  useEffect(() => {
    if (open) {
      fetchFriends();
    }
  }, [open, fetchFriends]);

  // Filter friends by search query
  const filteredFriends = friends.filter((friend) => {
    const query = searchQuery.toLowerCase();
    return (
      friend.username.toLowerCase().includes(query) ||
      (friend.displayName?.toLowerCase().includes(query) ?? false)
    );
  });

  // Toggle friend selection
  const toggleFriend = (friendId: string) => {
    setSelectedFriends((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId]
    );
  };

  // Get selected friend objects
  const selectedFriendObjects = friends.filter((f) =>
    selectedFriends.includes(f.id)
  );

  // Validation
  const nameError =
    groupName.length > 0 && (groupName.length < 2 || groupName.length > 50);
  const isValid =
    groupName.length >= 2 &&
    groupName.length <= 50 &&
    selectedFriends.length >= 1;

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isCreating) return;

    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "group",
          name: groupName.trim(),
          participantIds: selectedFriends,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create group");
      }

      const data = await response.json();

      // Reset form on success
      setGroupName("");
      setSelectedFriends([]);
      setSearchQuery("");
      onOpenChange?.(false);
      onGroupCreated?.(data.room.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create group");
    } finally {
      setIsCreating(false);
    }
  };

  // Handle modal close
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing
      setGroupName("");
      setSelectedFriends([]);
      setSearchQuery("");
      setError(null);
    }
    onOpenChange?.(newOpen);
  };

  return (
    <Modal open={open} onOpenChange={handleOpenChange}>
      {trigger && <ModalTrigger asChild>{trigger}</ModalTrigger>}
      <ModalContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <ModalHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-lg bg-main/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-main" />
              </div>
              <ModalTitle>Create Group Chat</ModalTitle>
            </div>
            <ModalDescription>
              Create a group chat to message multiple friends at once.
            </ModalDescription>
          </ModalHeader>

          <div className="space-y-4 py-4">
            {/* Group Name */}
            <div>
              <label
                htmlFor="group-name"
                className="block text-sm font-medium text-text mb-1.5"
              >
                Group Name
              </label>
              <Input
                id="group-name"
                type="text"
                placeholder="Enter group name..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                error={nameError}
                errorMessage={
                  nameError ? "Name must be 2-50 characters" : undefined
                }
                disabled={isCreating}
                maxLength={50}
              />
            </div>

            {/* Selected Friends Preview */}
            {selectedFriendObjects.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">
                  Selected ({selectedFriendObjects.length})
                </label>
                <div className="flex flex-wrap gap-2">
                  {selectedFriendObjects.map((friend) => (
                    <div
                      key={friend.id}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-main/10 border border-main/20"
                    >
                      <Avatar
                        src={friend.avatarUrl}
                        alt={friend.username}
                        fallback={friend.username?.charAt(0) || "?"}
                        size="xs"
                      />
                      <span className="text-xs text-text">
                        {friend.displayName || friend.username}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleFriend(friend.id)}
                        className="text-sub hover:text-text transition-colors"
                        aria-label={`Remove ${friend.username}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Friends Search */}
            <div>
              <label
                htmlFor="friend-search"
                className="block text-sm font-medium text-text mb-1.5"
              >
                Add Friends
              </label>
              <Input
                id="friend-search"
                type="text"
                placeholder="Search friends..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={isCreating || isLoadingFriends}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>

            {/* Friends List */}
            <div className="max-h-48 overflow-y-auto rounded-lg border border-sub bg-bg">
              {isLoadingFriends ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="w-5 h-5 text-sub animate-spin" />
                </div>
              ) : friends.length === 0 ? (
                <div className="text-center p-4 text-sub text-sm">
                  No friends found. Add some friends first!
                </div>
              ) : filteredFriends.length === 0 ? (
                <div className="text-center p-4 text-sub text-sm">
                  No friends match your search.
                </div>
              ) : (
                <div className="divide-y divide-sub">
                  {filteredFriends.map((friend) => {
                    const isSelected = selectedFriends.includes(friend.id);
                    return (
                      <button
                        key={friend.id}
                        type="button"
                        onClick={() => toggleFriend(friend.id)}
                        disabled={isCreating}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 transition-colors",
                          "hover:bg-sub-alt",
                          isSelected && "bg-main/5"
                        )}
                      >
                        <Avatar
                          src={friend.avatarUrl}
                          alt={friend.username}
                          fallback={friend.username?.charAt(0) || "?"}
                          size="sm"
                        />
                        <div className="flex-1 text-left min-w-0">
                          <p className="text-sm font-medium text-text truncate">
                            {friend.displayName || friend.username}
                          </p>
                          <p className="text-xs text-sub truncate">
                            @{friend.username}
                          </p>
                        </div>
                        <div
                          className={cn(
                            "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                            isSelected
                              ? "bg-main border-main"
                              : "border-sub hover:border-text"
                          )}
                        >
                          {isSelected && (
                            <Check className="w-3 h-3 text-bg" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Validation Message */}
            {selectedFriends.length === 0 && (
              <p className="text-xs text-sub">
                Select at least 1 friend to create a group.
              </p>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-lg bg-error/10 border border-error/20">
                <p className="text-sm text-error">{error}</p>
              </div>
            )}
          </div>

          <ModalFooter>
            <ModalClose asChild>
              <Button type="button" variant="ghost" disabled={isCreating}>
                Cancel
              </Button>
            </ModalClose>
            <Button
              type="submit"
              variant="active"
              disabled={!isValid || isCreating}
              loading={isCreating}
            >
              {isCreating ? "Creating..." : "Create Group"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}

export default CreateGroupModal;
