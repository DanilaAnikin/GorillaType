"use client";

import * as React from "react";
import Link from "next/link";
import { Crown, Shield, Star, MoreVertical, UserMinus, ShieldPlus, ShieldMinus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
} from "@/components/ui/dropdown";
import type { ClanMember, ClanRole } from "./types";

/**
 * Props for the ClanMembersList component.
 */
export interface ClanMembersListProps {
  /** List of clan members */
  members: ClanMember[];
  /** Current user's role in the clan (for showing admin controls) */
  userRole?: ClanRole | null;
  /** Current user's ID */
  currentUserId?: string;
  /** Clan owner's ID */
  ownerId: string;
  /** Callback when promoting a member to admin */
  onPromote?: (memberId: string) => void;
  /** Callback when demoting an admin to member */
  onDemote?: (memberId: string) => void;
  /** Callback when kicking a member */
  onKick?: (memberId: string) => void;
  /** Whether an action is in progress */
  isLoading?: boolean;
  /** ID of member being acted upon (for loading state) */
  actionMemberId?: string | null;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Get country flag emoji from country code.
 */
function getCountryFlag(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

/**
 * Get role badge for a member.
 */
function RoleBadge({ role }: { role: ClanRole }) {
  if (role === "owner") {
    return (
      <Badge variant="default" size="sm" icon={<Crown className="w-3 h-3" />}>
        Owner
      </Badge>
    );
  }
  if (role === "admin") {
    return (
      <Badge variant="secondary" size="sm" icon={<Shield className="w-3 h-3" />}>
        Admin
      </Badge>
    );
  }
  return null;
}

/**
 * ClanMembersList displays clan members with roles and admin controls.
 */
export function ClanMembersList({
  members,
  userRole,
  currentUserId,
  ownerId,
  onPromote,
  onDemote,
  onKick,
  isLoading = false,
  actionMemberId,
  className,
}: ClanMembersListProps) {
  const canManageMembers = userRole === "owner" || userRole === "admin";
  const isOwner = userRole === "owner";

  // Sort members: owner first, then admins, then regular members
  const sortedMembers = [...members].sort((a, b) => {
    const roleOrder: Record<ClanRole, number> = { owner: 0, admin: 1, member: 2 };
    return roleOrder[a.role] - roleOrder[b.role];
  });

  if (members.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center p-8 rounded-lg bg-sub-alt border border-sub text-center",
          className
        )}
      >
        <p className="text-sub">No members found.</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {sortedMembers.map((member) => {
        const isActioning = actionMemberId === member.id;
        const isSelf = member.id === currentUserId;
        const isMemberOwner = member.id === ownerId;
        const canManageMember = canManageMembers && !isSelf && !isMemberOwner;
        const canPromote = isOwner && member.role === "member";
        const canDemote = isOwner && member.role === "admin";
        const canKick = canManageMember && (isOwner || member.role === "member");

        return (
          <div
            key={member.id}
            className={cn(
              "flex items-center justify-between p-4 rounded-lg bg-sub-alt border border-sub transition-all duration-125",
              "hover:border-main/50",
              isActioning && "opacity-50"
            )}
          >
            {/* Member Info */}
            <div className="flex items-center gap-3 min-w-0">
              {/* Avatar */}
              <Link href={`/profile/${member.username}`} className="flex-shrink-0">
                <Avatar
                  src={member.avatarUrl}
                  alt={member.username}
                  fallback={member.username?.charAt(0) || "?"}
                  size="lg"
                  bordered
                  className="hover:ring-main transition-all"
                />
              </Link>

              {/* Name and Stats */}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/profile/${member.username}`}
                    className="font-medium text-text hover:text-main transition-colors truncate"
                  >
                    {member.displayName || member.username}
                  </Link>
                  <RoleBadge role={member.role} />
                </div>
                <div className="flex items-center gap-2 text-sm text-sub">
                  <span>@{member.username}</span>
                  {member.country && (
                    <span>{getCountryFlag(member.country)}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-sub mt-0.5">
                  {member.level && (
                    <span className="flex items-center gap-0.5 text-main">
                      <Star className="w-3 h-3" />
                      Level {member.level}
                    </span>
                  )}
                  {member.averageWpm !== undefined && (
                    <span>{Math.round(member.averageWpm)} WPM</span>
                  )}
                  {member.testsCompleted !== undefined && (
                    <span>{member.testsCompleted} tests</span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0 ml-4">
              {/* View Profile */}
              <Link
                href={`/profile/${member.username}`}
                className="inline-flex items-center justify-center h-8 px-3 text-xs rounded-md bg-transparent text-sub hover:text-text transition-all duration-125"
              >
                View Profile
              </Link>

              {/* Admin Controls */}
              {canManageMember && (canPromote || canDemote || canKick) && (
                <Dropdown>
                  <DropdownTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={isLoading || isActioning}
                      aria-label="Member options"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownTrigger>
                  <DropdownContent align="end" className="w-40 bg-sub-alt border-sub/20">
                    {canPromote && onPromote && (
                      <DropdownItem
                        onSelect={() => onPromote(member.id)}
                        className="flex items-center gap-2 text-text hover:bg-bg hover:text-main focus:bg-bg focus:text-main transition-all duration-125"
                      >
                        <ShieldPlus className="w-4 h-4" />
                        <span>Promote to Admin</span>
                      </DropdownItem>
                    )}
                    {canDemote && onDemote && (
                      <DropdownItem
                        onSelect={() => onDemote(member.id)}
                        className="flex items-center gap-2 text-text hover:bg-bg hover:text-main focus:bg-bg focus:text-main transition-all duration-125"
                      >
                        <ShieldMinus className="w-4 h-4" />
                        <span>Demote to Member</span>
                      </DropdownItem>
                    )}
                    {(canPromote || canDemote) && canKick && (
                      <DropdownSeparator className="bg-sub/20" />
                    )}
                    {canKick && onKick && (
                      <DropdownItem
                        onSelect={() => onKick(member.id)}
                        className="flex items-center gap-2 text-error hover:bg-bg hover:text-error focus:bg-bg focus:text-error transition-all duration-125"
                      >
                        <UserMinus className="w-4 h-4" />
                        <span>Kick Member</span>
                      </DropdownItem>
                    )}
                  </DropdownContent>
                </Dropdown>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ClanMembersList;
