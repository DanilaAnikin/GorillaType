"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Trophy,
  Activity,
  Calendar,
  ArrowLeft,
  Settings,
  LogOut,
  LogIn,
  Loader2,
  Crown,
  Shield,
} from "lucide-react";
import { ClanMembersList, ClanSettings } from "@/components/clans";
import type { ClanDetails, ClanMember, ClanRole } from "@/components/clans";
import { useUserStore } from "@/store/user-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Tab type for the clan detail page.
 */
type ClanTab = "members" | "settings";

/**
 * Clan detail page - View clan info, members, and manage clan.
 */
export default function ClanDetailPage() {
  const router = useRouter();
  const params = useParams();
  const clanId = params.id as string;

  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const currentUser = useUserStore((state) => state.user);

  // Tab state
  const [activeTab, setActiveTab] = useState<ClanTab>("members");

  // Clan data
  const [clan, setClan] = useState<ClanDetails | null>(null);
  const [members, setMembers] = useState<ClanMember[]>([]);
  const [userRole, setUserRole] = useState<ClanRole | null>(null);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [actionMemberId, setActionMemberId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch clan details
  const fetchClanDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/clans/${clanId}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError("Clan not found");
        } else {
          throw new Error("Failed to fetch clan");
        }
        return;
      }

      const data = await response.json();
      setClan(data.clan);
      setMembers(data.members || []);
      setUserRole(data.userMembership?.role || null);
    } catch (err) {
      console.error("Error fetching clan:", err);
      setError("Failed to load clan details");
    } finally {
      setIsLoading(false);
    }
  }, [clanId]);

  // Initial load
  useEffect(() => {
    fetchClanDetails();
  }, [fetchClanDetails]);

  // Join clan
  const handleJoinClan = async () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    setIsJoining(true);
    try {
      const response = await fetch(`/api/clans/${clanId}/join`, {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to join clan");
      }

      await fetchClanDetails();
    } catch (err) {
      console.error("Error joining clan:", err);
      setError(err instanceof Error ? err.message : "Failed to join clan");
    } finally {
      setIsJoining(false);
    }
  };

  // Leave clan
  const handleLeaveClan = async () => {
    setIsLeaving(true);
    try {
      const response = await fetch(`/api/clans/${clanId}/leave`, {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to leave clan");
      }

      await fetchClanDetails();
    } catch (err) {
      console.error("Error leaving clan:", err);
      setError(err instanceof Error ? err.message : "Failed to leave clan");
    } finally {
      setIsLeaving(false);
    }
  };

  // Promote member to admin
  const handlePromoteMember = async (memberId: string) => {
    setActionMemberId(memberId);
    try {
      const response = await fetch(`/api/clans/${clanId}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "admin" }),
      });

      if (!response.ok) {
        throw new Error("Failed to promote member");
      }

      await fetchClanDetails();
    } catch (err) {
      console.error("Error promoting member:", err);
    } finally {
      setActionMemberId(null);
    }
  };

  // Demote admin to member
  const handleDemoteMember = async (memberId: string) => {
    setActionMemberId(memberId);
    try {
      const response = await fetch(`/api/clans/${clanId}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "member" }),
      });

      if (!response.ok) {
        throw new Error("Failed to demote member");
      }

      await fetchClanDetails();
    } catch (err) {
      console.error("Error demoting member:", err);
    } finally {
      setActionMemberId(null);
    }
  };

  // Kick member
  const handleKickMember = async (memberId: string) => {
    setActionMemberId(memberId);
    try {
      const response = await fetch(`/api/clans/${clanId}/members/${memberId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to kick member");
      }

      await fetchClanDetails();
    } catch (err) {
      console.error("Error kicking member:", err);
    } finally {
      setActionMemberId(null);
    }
  };

  // Update clan settings
  const handleUpdateSettings = async (data: {
    name?: string;
    description?: string;
    isPublic?: boolean;
  }) => {
    const response = await fetch(`/api/clans/${clanId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update settings");
    }

    await fetchClanDetails();
  };

  // Delete clan
  const handleDeleteClan = async () => {
    const response = await fetch(`/api/clans/${clanId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to delete clan");
    }

    router.push("/clans");
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-main" />
        </div>
      </div>
    );
  }

  // Error state
  if (error && !clan) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-error" />
          </div>
          <h2 className="text-xl font-medium text-text mb-2">{error}</h2>
          <p className="text-sub mb-4">The clan you&apos;re looking for doesn&apos;t exist or has been deleted.</p>
          <Link href="/clans">
            <Button variant="active" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Clans
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!clan) return null;

  const isMember = userRole !== null;
  const isAdmin = userRole === "owner" || userRole === "admin";
  const isOwner = userRole === "owner";

  // Tabs configuration
  const tabs: { id: ClanTab; label: string; icon: React.ReactNode; show: boolean }[] = [
    { id: "members", label: "Members", icon: <Users className="w-4 h-4" />, show: true },
    { id: "settings", label: "Settings", icon: <Settings className="w-4 h-4" />, show: isAdmin },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Link */}
      <Link
        href="/clans"
        className="inline-flex items-center gap-2 text-sub hover:text-main transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Clans</span>
      </Link>

      {/* Clan Header */}
      <div className="rounded-lg border border-sub bg-sub-alt p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          {/* Clan Info */}
          <div className="flex items-start gap-4">
            {/* Banner/Avatar */}
            <div className="flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg bg-sub flex items-center justify-center overflow-hidden">
              {clan.bannerUrl ? (
                <img
                  src={clan.bannerUrl}
                  alt={clan.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Users className="w-8 h-8 md:w-10 md:h-10 text-sub" />
              )}
            </div>

            {/* Name, Tag, Description */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold text-text">{clan.name}</h1>
                <Badge variant="secondary" size="md">
                  [{clan.tag}]
                </Badge>
                {!clan.isPublic && (
                  <Badge variant="outline" size="sm">
                    Private
                  </Badge>
                )}
              </div>
              {clan.description && (
                <p className="text-sub mt-2 max-w-xl">{clan.description}</p>
              )}
              <div className="flex items-center gap-2 mt-2 text-sm text-sub">
                <Calendar className="w-4 h-4" />
                <span>Created {formatDate(clan.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {isMember ? (
              <>
                {/* User's role badge */}
                {userRole === "owner" && (
                  <Badge variant="default" size="md" icon={<Crown className="w-3 h-3" />}>
                    Owner
                  </Badge>
                )}
                {userRole === "admin" && (
                  <Badge variant="secondary" size="md" icon={<Shield className="w-3 h-3" />}>
                    Admin
                  </Badge>
                )}
                {/* Leave button (can't leave as owner) */}
                {!isOwner && (
                  <Button
                    variant="outline"
                    leftIcon={<LogOut className="w-4 h-4" />}
                    onClick={handleLeaveClan}
                    loading={isLeaving}
                    disabled={isLeaving}
                  >
                    Leave Clan
                  </Button>
                )}
              </>
            ) : (
              <Button
                variant="active"
                leftIcon={<LogIn className="w-4 h-4" />}
                onClick={handleJoinClan}
                loading={isJoining}
                disabled={isJoining || (!clan.isPublic && !isAuthenticated)}
              >
                {isAuthenticated ? "Join Clan" : "Log in to Join"}
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-sub">
          {/* Members */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-sub mb-1">
              <Users className="w-4 h-4" />
              <span className="text-sm">Members</span>
            </div>
            <p className="text-2xl font-bold text-text">
              {clan.memberCount}
              <span className="text-sm font-normal text-sub">/{clan.maxMembers}</span>
            </p>
          </div>

          {/* Average WPM */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-sub mb-1">
              <Trophy className="w-4 h-4 text-main" />
              <span className="text-sm">Avg WPM</span>
            </div>
            <p className="text-2xl font-bold text-main">{Math.round(clan.averageWpm)}</p>
          </div>

          {/* Total Tests */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-sub mb-1">
              <Activity className="w-4 h-4" />
              <span className="text-sm">Total Tests</span>
            </div>
            <p className="text-2xl font-bold text-text">{clan.totalTests.toLocaleString()}</p>
          </div>

          {/* Visibility */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-sub mb-1">
              <span className="text-sm">Visibility</span>
            </div>
            <p className="text-2xl font-bold text-text">{clan.isPublic ? "Public" : "Private"}</p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-lg bg-error/10 border border-error/20 mb-6">
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-sub pb-4">
        {tabs
          .filter((tab) => tab.show)
          .map((tab) => (
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
              {tab.id === "members" && (
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-xs",
                    activeTab === tab.id ? "bg-bg/20 text-bg" : "bg-sub-alt text-sub"
                  )}
                >
                  {members.length}
                </span>
              )}
            </button>
          ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {/* Members Tab */}
        {activeTab === "members" && (
          <ClanMembersList
            members={members}
            userRole={userRole}
            currentUserId={currentUser?.id}
            ownerId={clan.ownerId}
            onPromote={handlePromoteMember}
            onDemote={handleDemoteMember}
            onKick={handleKickMember}
            isLoading={actionMemberId !== null}
            actionMemberId={actionMemberId}
          />
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && isAdmin && (
          <ClanSettings
            clan={clan}
            userRole={userRole!}
            onUpdateSettings={handleUpdateSettings}
            onDeleteClan={handleDeleteClan}
          />
        )}
      </div>
    </div>
  );
}
