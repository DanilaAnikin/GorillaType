"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Users, Search, Plus, Trophy, Loader2 } from "lucide-react";
import { ClanCard, CreateClanModal } from "@/components/clans";
import type { ClanSummary, UserClanMembership } from "@/components/clans";
import { useUserStore } from "@/store/user-store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Tab type for the clans page.
 */
type ClansTab = "browse" | "top";

/**
 * Clans page - Browse and search clans, view top clans, create new clan.
 */
export default function ClansPage() {
  const router = useRouter();
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const currentUser = useUserStore((state) => state.user);

  // Tab state
  const [activeTab, setActiveTab] = useState<ClansTab>("browse");

  // Clans data
  const [clans, setClans] = useState<ClanSummary[]>([]);
  const [topClans, setTopClans] = useState<ClanSummary[]>([]);
  const [userClan, setUserClan] = useState<UserClanMembership | null>(null);
  const [totalClans, setTotalClans] = useState(0);

  // Loading states
  const [isLoadingClans, setIsLoadingClans] = useState(true);
  const [isLoadingTop, setIsLoadingTop] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch clans list
  const fetchClans = useCallback(async (query?: string) => {
    try {
      setIsLoadingClans(true);
      const params = new URLSearchParams({ limit: "20" });
      if (query) {
        params.set("q", query);
      }

      const response = await fetch(`/api/clans?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch clans");
      }

      const data = await response.json();
      setClans(data.clans || []);
      setTotalClans(data.total || 0);
    } catch (error) {
      console.error("Error fetching clans:", error);
    } finally {
      setIsLoadingClans(false);
    }
  }, []);

  // Fetch top clans
  const fetchTopClans = useCallback(async () => {
    try {
      setIsLoadingTop(true);
      const response = await fetch("/api/clans?sort=averageWpm&limit=10");
      if (!response.ok) {
        throw new Error("Failed to fetch top clans");
      }

      const data = await response.json();
      setTopClans(data.clans || []);
    } catch (error) {
      console.error("Error fetching top clans:", error);
    } finally {
      setIsLoadingTop(false);
    }
  }, []);

  // Fetch user's clan
  const fetchUserClan = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const response = await fetch("/api/clans/me");
      if (response.ok) {
        const data = await response.json();
        setUserClan(data.membership || null);
      }
    } catch (error) {
      console.error("Error fetching user clan:", error);
    }
  }, [isAuthenticated]);

  // Initial load
  useEffect(() => {
    fetchClans();
    fetchTopClans();
    fetchUserClan();
  }, [fetchClans, fetchTopClans, fetchUserClan]);

  // Search for clans
  const handleSearch = async () => {
    if (searchQuery.length < 2) return;

    setIsSearching(true);
    setHasSearched(true);
    await fetchClans(searchQuery);
    setIsSearching(false);
  };

  // Handle search on Enter key
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery("");
    setHasSearched(false);
    fetchClans();
  };

  // Create clan
  const handleCreateClan = async (data: {
    name: string;
    tag: string;
    description: string;
    isPublic: boolean;
  }) => {
    const response = await fetch("/api/clans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create clan");
    }

    const result = await response.json();

    // Refresh data and navigate to new clan
    await Promise.all([fetchClans(), fetchUserClan()]);
    router.push(`/clans/${result.clan.id}`);
  };

  // Tab buttons
  const tabs: { id: ClansTab; label: string; icon: React.ReactNode }[] = [
    { id: "browse", label: "Browse Clans", icon: <Users className="w-4 h-4" /> },
    { id: "top", label: "Top Clans", icon: <Trophy className="w-4 h-4" /> },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-main" />
            <h1 className="text-3xl font-bold text-text">Clans</h1>
          </div>
          {isAuthenticated && !userClan && (
            <CreateClanModal
              open={showCreateModal}
              onOpenChange={setShowCreateModal}
              onCreateClan={handleCreateClan}
              trigger={
                <Button variant="active" leftIcon={<Plus className="w-4 h-4" />}>
                  Create Clan
                </Button>
              }
            />
          )}
        </div>
        <p className="text-sub">
          Join a clan to compete with others and track your collective progress.
        </p>
      </div>

      {/* User's Current Clan */}
      {userClan && (
        <div className="mb-8">
          <h2 className="text-lg font-medium text-text mb-4">Your Clan</h2>
          <ClanCard clan={userClan.clan} isUserClan />
        </div>
      )}

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
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {/* Browse Tab */}
        {activeTab === "browse" && (
          <div>
            {/* Search Input */}
            <div className="flex gap-2 mb-6">
              <Input
                type="text"
                placeholder="Search clans by name or tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                leftIcon={<Search className="w-4 h-4" />}
                className="flex-1"
              />
              <Button
                onClick={handleSearch}
                disabled={searchQuery.length < 2 || isSearching}
                loading={isSearching}
              >
                Search
              </Button>
              {hasSearched && (
                <Button variant="ghost" onClick={handleClearSearch}>
                  Clear
                </Button>
              )}
            </div>

            {/* Clans List */}
            {isLoadingClans ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-main" />
              </div>
            ) : clans.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-sub/30 flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-sub" />
                </div>
                <h3 className="text-lg font-medium text-text mb-2">
                  {hasSearched ? "No clans found" : "No clans yet"}
                </h3>
                <p className="text-sub text-sm max-w-sm">
                  {hasSearched
                    ? `No clans matching "${searchQuery}". Try a different search term.`
                    : "Be the first to create a clan and start building your community!"}
                </p>
                {isAuthenticated && !userClan && !hasSearched && (
                  <Button
                    variant="active"
                    className="mt-4"
                    leftIcon={<Plus className="w-4 h-4" />}
                    onClick={() => setShowCreateModal(true)}
                  >
                    Create Clan
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {clans.map((clan) => (
                  <ClanCard
                    key={clan.id}
                    clan={clan}
                    isUserClan={userClan?.clanId === clan.id}
                  />
                ))}
              </div>
            )}

            {/* Total count */}
            {!isLoadingClans && clans.length > 0 && (
              <p className="text-sm text-sub mt-4 text-center">
                Showing {clans.length} of {totalClans} clans
              </p>
            )}
          </div>
        )}

        {/* Top Clans Tab */}
        {activeTab === "top" && (
          <div>
            <p className="text-sub text-sm mb-6">
              Top clans ranked by average WPM across all members.
            </p>

            {isLoadingTop ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-main" />
              </div>
            ) : topClans.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-sub/30 flex items-center justify-center mb-4">
                  <Trophy className="w-8 h-8 text-sub" />
                </div>
                <h3 className="text-lg font-medium text-text mb-2">No clans yet</h3>
                <p className="text-sub text-sm max-w-sm">
                  The leaderboard will populate once clans are created.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {topClans.map((clan, index) => (
                  <div key={clan.id} className="flex items-center gap-4">
                    {/* Rank */}
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0",
                        index === 0 && "bg-yellow-500/20 text-yellow-500",
                        index === 1 && "bg-gray-400/20 text-gray-400",
                        index === 2 && "bg-orange-600/20 text-orange-600",
                        index > 2 && "bg-sub-alt text-sub"
                      )}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <ClanCard
                        clan={clan}
                        isUserClan={userClan?.clanId === clan.id}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
