/**
 * Clan member role types.
 */
export type ClanRole = 'owner' | 'admin' | 'member';

/**
 * Basic clan info for list views.
 */
export interface ClanSummary {
  id: string;
  name: string;
  tag: string;
  description?: string | null;
  bannerUrl?: string | null;
  memberCount: number;
  averageWpm: number;
  totalTests: number;
  createdAt: string;
}

/**
 * Detailed clan info for clan page.
 */
export interface ClanDetails extends ClanSummary {
  ownerId: string;
  isPublic: boolean;
  maxMembers: number;
}

/**
 * Clan member info.
 */
export interface ClanMember {
  id: string;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  country?: string | null;
  level?: number | null;
  role: ClanRole;
  joinedAt: string;
  averageWpm?: number;
  testsCompleted?: number;
}

/**
 * User's clan membership status.
 */
export interface UserClanMembership {
  clanId: string;
  clan: ClanSummary;
  role: ClanRole;
  joinedAt: string;
}

/**
 * API response for clans list.
 */
export interface ClansListResponse {
  clans: ClanSummary[];
  total: number;
  page: number;
  limit: number;
}

/**
 * API response for clan details.
 */
export interface ClanDetailsResponse {
  clan: ClanDetails;
  members: ClanMember[];
  userMembership?: {
    role: ClanRole;
    joinedAt: string;
  } | null;
}

/**
 * Create clan request body.
 */
export interface CreateClanRequest {
  name: string;
  tag: string;
  description?: string;
  isPublic?: boolean;
}
