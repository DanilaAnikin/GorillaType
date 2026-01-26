"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Users, Search, UserPlus, Clock, Loader2 } from "lucide-react";
import { FriendsList, FriendRequestCard, UserSearchCard } from "@/components/friends";
import type { Friend, FriendRequest, SearchUser, FriendsApiResponse } from "@/components/friends/types";
import { useUserStore } from "@/store/user-store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Tab type for the friends page.
 */
type FriendsTab = "friends" | "requests" | "search";

/**
 * Friends page - Manage friendships, view requests, and search for users.
 */
export default function FriendsPage() {
  const router = useRouter();
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const currentUser = useUserStore((state) => state.user);

  // Tab state
  const [activeTab, setActiveTab] = useState<FriendsTab>("friends");

  // Friends data
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingReceived, setPendingReceived] = useState<FriendRequest[]>([]);
  const [pendingSent, setPendingSent] = useState<FriendRequest[]>([]);
  const [counts, setCounts] = useState({
    friends: 0,
    pendingReceived: 0,
    pendingSent: 0,
  });

  // Loading states
  const [isLoadingFriends, setIsLoadingFriends] = useState(true);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Fetch friends data
  const fetchFriends = useCallback(async () => {
    try {
      setIsLoadingFriends(true);
      const response = await fetch("/api/friends");

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Failed to fetch friends");
      }

      const data: FriendsApiResponse = await response.json();
      setFriends(data.friends || []);
      setPendingReceived(data.pendingReceived || []);
      setPendingSent(data.pendingSent || []);
      setCounts(data.counts || { friends: 0, pendingReceived: 0, pendingSent: 0 });
    } catch (error) {
      console.error("Error fetching friends:", error);
    } finally {
      setIsLoadingFriends(false);
    }
  }, [router]);

  // Initial load
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    fetchFriends();
  }, [isAuthenticated, fetchFriends, router]);

  // Search for users
  const handleSearch = async () => {
    if (searchQuery.length < 2) return;

    setIsLoadingSearch(true);
    setHasSearched(true);
    try {
      const response = await fetch(`/api/users?q=${encodeURIComponent(searchQuery)}&limit=20`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.users || []);
      }
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setIsLoadingSearch(false);
    }
  };

  // Handle search on Enter key
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Accept friend request
  const handleAcceptRequest = async (friendshipId: string) => {
    setActionInProgress(friendshipId);
    try {
      const response = await fetch("/api/friends", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendshipId, action: "accept" }),
      });

      if (response.ok) {
        await fetchFriends();
      }
    } catch (error) {
      console.error("Error accepting request:", error);
    } finally {
      setActionInProgress(null);
    }
  };

  // Reject friend request
  const handleRejectRequest = async (friendshipId: string) => {
    setActionInProgress(friendshipId);
    try {
      const response = await fetch("/api/friends", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendshipId, action: "reject" }),
      });

      if (response.ok) {
        await fetchFriends();
      }
    } catch (error) {
      console.error("Error rejecting request:", error);
    } finally {
      setActionInProgress(null);
    }
  };

  // Cancel sent request
  const handleCancelRequest = async (friendshipId: string) => {
    setActionInProgress(friendshipId);
    try {
      const response = await fetch(`/api/friends?friendshipId=${friendshipId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchFriends();
      }
    } catch (error) {
      console.error("Error canceling request:", error);
    } finally {
      setActionInProgress(null);
    }
  };

  // Remove friend
  const handleRemoveFriend = async (friendshipId: string) => {
    setActionInProgress(friendshipId);
    try {
      const response = await fetch(`/api/friends?friendshipId=${friendshipId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchFriends();
      }
    } catch (error) {
      console.error("Error removing friend:", error);
    } finally {
      setActionInProgress(null);
    }
  };

  // Tab buttons
  const tabs: { id: FriendsTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: "friends", label: "Friends", icon: <Users className="w-4 h-4" />, count: counts.friends },
    {
      id: "requests",
      label: "Requests",
      icon: <Clock className="w-4 h-4" />,
      count: counts.pendingReceived + counts.pendingSent,
    },
    { id: "search", label: "Find Friends", icon: <Search className="w-4 h-4" /> },
  ];

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Users className="w-8 h-8 text-main" />
          <h1 className="text-3xl font-bold text-text">Friends</h1>
        </div>
        <p className="text-sub">
          Connect with other typists, compete together, and track each other&apos;s progress.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-sub pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-125",
              activeTab === tab.id
                ? "bg-main text-bg"
                : "text-sub hover:text-text hover:bg-sub-alt"
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-xs",
                  activeTab === tab.id
                    ? "bg-bg/20 text-bg"
                    : "bg-sub-alt text-sub"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {/* Friends Tab */}
        {activeTab === "friends" && (
          <div>
            {isLoadingFriends ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-main" />
              </div>
            ) : (
              <FriendsList
                friends={friends}
                onRemoveFriend={handleRemoveFriend}
                isLoading={actionInProgress !== null}
                removingFriendId={actionInProgress}
              />
            )}
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === "requests" && (
          <div className="space-y-8">
            {/* Incoming Requests */}
            <div>
              <h2 className="text-lg font-medium text-text mb-4 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-main" />
                Incoming Requests
                {counts.pendingReceived > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-main text-bg">
                    {counts.pendingReceived}
                  </span>
                )}
              </h2>
              {isLoadingFriends ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-main" />
                </div>
              ) : pendingReceived.length === 0 ? (
                <p className="text-sub text-sm py-4">No incoming friend requests.</p>
              ) : (
                <div className="space-y-2">
                  {pendingReceived.map((request) => (
                    <FriendRequestCard
                      key={request.id}
                      request={request}
                      type="incoming"
                      onAccept={handleAcceptRequest}
                      onReject={handleRejectRequest}
                      isLoading={actionInProgress === request.id}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Outgoing Requests */}
            <div>
              <h2 className="text-lg font-medium text-text mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-sub" />
                Sent Requests
                {counts.pendingSent > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-sub-alt text-sub">
                    {counts.pendingSent}
                  </span>
                )}
              </h2>
              {isLoadingFriends ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-main" />
                </div>
              ) : pendingSent.length === 0 ? (
                <p className="text-sub text-sm py-4">No pending friend requests.</p>
              ) : (
                <div className="space-y-2">
                  {pendingSent.map((request) => (
                    <FriendRequestCard
                      key={request.id}
                      request={request}
                      type="outgoing"
                      onCancel={handleCancelRequest}
                      isLoading={actionInProgress === request.id}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Search Tab */}
        {activeTab === "search" && (
          <div>
            {/* Search Input */}
            <div className="flex gap-2 mb-6">
              <Input
                type="text"
                placeholder="Search by username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                leftIcon={<Search className="w-4 h-4" />}
                className="flex-1"
              />
              <Button
                onClick={handleSearch}
                disabled={searchQuery.length < 2 || isLoadingSearch}
                loading={isLoadingSearch}
              >
                Search
              </Button>
            </div>

            {/* Search Results */}
            {isLoadingSearch ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-main" />
              </div>
            ) : hasSearched ? (
              searchResults.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sub">
                    No users found matching &quot;{searchQuery}&quot;
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {searchResults.map((user) => (
                    <UserSearchCard
                      key={user.id}
                      user={user}
                      isCurrentUser={user.id === currentUser?.id}
                    />
                  ))}
                </div>
              )
            ) : (
              <div className="text-center py-12">
                <Search className="w-12 h-12 mx-auto text-sub mb-4" />
                <p className="text-sub">
                  Enter a username to search for other typists.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
