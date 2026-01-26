"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { UserPlus, UserMinus, UserCheck, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * Friendship state between current user and target user.
 */
export type FriendshipState =
  | "none"
  | "pending_sent"
  | "pending_received"
  | "friends"
  | "blocked";

/**
 * Props for the AddFriendButton component.
 */
export interface AddFriendButtonProps {
  /** The target user's ID */
  userId: string;
  /** The target user's username (alternative to userId) */
  username?: string;
  /** Current friendship state (if known) */
  initialState?: FriendshipState;
  /** Friendship ID if one exists */
  friendshipId?: string;
  /** Whether to show as icon only on mobile */
  compactOnMobile?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Callback when friendship state changes */
  onStateChange?: (newState: FriendshipState) => void;
}

/**
 * AddFriendButton handles friend requests and relationship management.
 */
export function AddFriendButton({
  userId,
  username,
  initialState = "none",
  friendshipId: initialFriendshipId,
  compactOnMobile = false,
  className,
  onStateChange,
}: AddFriendButtonProps) {
  const [state, setState] = useState<FriendshipState>(initialState);
  const [friendshipId, setFriendshipId] = useState<string | undefined>(
    initialFriendshipId
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingState, setIsCheckingState] = useState(true);

  // Check initial friendship state when component mounts
  useEffect(() => {
    const checkFriendshipState = async () => {
      try {
        const response = await fetch("/api/friends");
        if (!response.ok) {
          setIsCheckingState(false);
          return;
        }

        const data = await response.json();

        // Check if already friends
        const existingFriend = data.friends?.find(
          (f: { friend: { id: string } }) => f.friend.id === userId
        );
        if (existingFriend) {
          setState("friends");
          setFriendshipId(existingFriend.id);
          setIsCheckingState(false);
          return;
        }

        // Check pending sent
        const pendingSent = data.pendingSent?.find(
          (f: { friend: { id: string } }) => f.friend.id === userId
        );
        if (pendingSent) {
          setState("pending_sent");
          setFriendshipId(pendingSent.id);
          setIsCheckingState(false);
          return;
        }

        // Check pending received
        const pendingReceived = data.pendingReceived?.find(
          (f: { friend: { id: string } }) => f.friend.id === userId
        );
        if (pendingReceived) {
          setState("pending_received");
          setFriendshipId(pendingReceived.id);
          setIsCheckingState(false);
          return;
        }

        // No existing relationship
        setState("none");
        setIsCheckingState(false);
      } catch (error) {
        console.error("Error checking friendship state:", error);
        setIsCheckingState(false);
      }
    };

    if (initialState === "none" && !initialFriendshipId) {
      checkFriendshipState();
    } else {
      setIsCheckingState(false);
    }
  }, [userId, initialState, initialFriendshipId]);

  const handleSendRequest = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, username }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.action === "accepted") {
          setState("friends");
        } else {
          setState("pending_sent");
        }
        setFriendshipId(data.friendship?.id);
        onStateChange?.(data.action === "accepted" ? "friends" : "pending_sent");
      } else {
        console.error("Failed to send friend request:", data.error);
      }
    } catch (error) {
      console.error("Error sending friend request:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    if (!friendshipId) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/friends", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendshipId, action: "accept" }),
      });

      if (response.ok) {
        setState("friends");
        onStateChange?.("friends");
      }
    } catch (error) {
      console.error("Error accepting friend request:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelOrRemove = async () => {
    if (!friendshipId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/friends?friendshipId=${friendshipId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setState("none");
        setFriendshipId(undefined);
        onStateChange?.("none");
      }
    } catch (error) {
      console.error("Error removing friendship:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingState) {
    return (
      <Button
        variant="ghost"
        size="sm"
        disabled
        className={cn("min-w-[100px]", className)}
      >
        <Loader2 className="w-4 h-4 animate-spin" />
      </Button>
    );
  }

  switch (state) {
    case "none":
      return (
        <Button
          variant="active"
          size="sm"
          onClick={handleSendRequest}
          disabled={isLoading}
          loading={isLoading}
          leftIcon={<UserPlus className="w-4 h-4" />}
          className={className}
        >
          <span className={compactOnMobile ? "hidden sm:inline" : ""}>
            Add Friend
          </span>
        </Button>
      );

    case "pending_sent":
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={handleCancelOrRemove}
          disabled={isLoading}
          loading={isLoading}
          leftIcon={<Clock className="w-4 h-4" />}
          className={className}
        >
          <span className={compactOnMobile ? "hidden sm:inline" : ""}>
            Pending
          </span>
        </Button>
      );

    case "pending_received":
      return (
        <Button
          variant="active"
          size="sm"
          onClick={handleAcceptRequest}
          disabled={isLoading}
          loading={isLoading}
          leftIcon={<UserCheck className="w-4 h-4" />}
          className={className}
        >
          <span className={compactOnMobile ? "hidden sm:inline" : ""}>
            Accept
          </span>
        </Button>
      );

    case "friends":
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancelOrRemove}
          disabled={isLoading}
          loading={isLoading}
          leftIcon={<UserCheck className="w-4 h-4 text-main" />}
          className={cn("text-main hover:text-error", className)}
        >
          <span className={compactOnMobile ? "hidden sm:inline" : ""}>
            Friends
          </span>
        </Button>
      );

    default:
      return null;
  }
}

export default AddFriendButton;
