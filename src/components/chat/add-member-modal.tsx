"use client";

import * as React from "react";
import { useState, useEffect, useCallback, useMemo } from "react";
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
 * Props for the AddMemberModal component.
 */
export interface AddMemberModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** The room ID to add members to */
  roomId: string;
  /** IDs of users already in the group */
  existingParticipantIds: string[];
  /** Callback when members are added successfully */
  onMembersAdded?: (addedCount: number) => void;
  /** Trigger element (optional, can control externally) */
  trigger?: React.ReactNode;
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
 * AddMemberModal allows users to add friends to an existing group chat.
 */
export function AddMemberModal({
  open,
  onOpenChange,
  roomId,
  existingParticipantIds,
  onMembersAdded,
  trigger,
}: AddMemberModalProps) {
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
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

  // Filter out friends who are already in the group
  const availableFriends = useMemo(
    () => friends.filter((friend) => !existingParticipantIds.includes(friend.id)),
    [friends, existingParticipantIds]
  );

  // Filter available friends by search query
  const filteredFriends = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return availableFriends.filter(
      (friend) =>
        friend.username.toLowerCase().includes(query) ||
        (friend.displayName?.toLowerCase().includes(query) ?? false)
    );
  }, [availableFriends, searchQuery]);

  // Toggle friend selection
  const toggleFriend = (friendId: string) => {
    setSelectedFriends((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId]
    );
  };

  // Get selected friend objects
  const selectedFriendObjects = availableFriends.filter((f) =>
    selectedFriends.includes(f.id)
  );

  // Validation
  const isValid = selectedFriends.length >= 1;

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isAdding) return;

    setIsAdding(true);
    setError(null);

    try {
      const response = await fetch(`/api/chat/${roomId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userIds: selectedFriends,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add members");
      }

      const addedCount = selectedFriends.length;

      // Reset form on success
      setSelectedFriends([]);
      setSearchQuery("");
      onOpenChange(false);
      onMembersAdded?.(addedCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add members");
    } finally {
      setIsAdding(false);
    }
  };

  // Handle modal close
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing
      setSelectedFriends([]);
      setSearchQuery("");
      setError(null);
    }
    onOpenChange(newOpen);
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
              <ModalTitle>Add Members</ModalTitle>
            </div>
            <ModalDescription>
              Add friends to this group.
            </ModalDescription>
          </ModalHeader>

          <div className="space-y-4 py-4">
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
                htmlFor="add-member-search"
                className="block text-sm font-medium text-text mb-1.5"
              >
                Add Friends
              </label>
              <Input
                id="add-member-search"
                type="text"
                placeholder="Search friends..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={isAdding || isLoadingFriends}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>

            {/* Friends List */}
            <div className="max-h-48 overflow-y-auto rounded-lg border border-sub bg-bg">
              {isLoadingFriends ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="w-5 h-5 text-sub animate-spin" />
                </div>
              ) : availableFriends.length === 0 ? (
                <div className="text-center p-4 text-sub text-sm">
                  No friends available to add.
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
                        disabled={isAdding}
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
            {selectedFriends.length === 0 && availableFriends.length > 0 && (
              <p className="text-xs text-sub">
                Select at least 1 friend to add to the group.
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
              <Button type="button" variant="ghost" disabled={isAdding}>
                Cancel
              </Button>
            </ModalClose>
            <Button
              type="submit"
              variant="active"
              disabled={!isValid || isAdding}
              loading={isAdding}
            >
              {isAdding ? "Adding..." : "Add Members"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}

export default AddMemberModal;
