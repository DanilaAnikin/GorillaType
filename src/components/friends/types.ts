/**
 * Friendship status types.
 */
export type FriendshipStatus = 'pending' | 'accepted' | 'declined' | 'blocked';

/**
 * Direction of a friend request.
 */
export type FriendshipDirection = 'sent' | 'received';

/**
 * Basic friend profile info.
 */
export interface FriendProfile {
  id: string;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  country?: string | null;
  level?: number | null;
  lastSeenAt?: string | null;
}

/**
 * Friend data structure from API.
 */
export interface Friend {
  id: string;
  status: FriendshipStatus;
  direction: FriendshipDirection;
  createdAt: string;
  updatedAt: string;
  friend: FriendProfile;
}

/**
 * Alias for Friend when dealing with pending requests.
 */
export type FriendRequest = Friend;

/**
 * API response for friends list.
 */
export interface FriendsApiResponse {
  friends: Friend[];
  pendingReceived: FriendRequest[];
  pendingSent: FriendRequest[];
  counts: {
    friends: number;
    pendingReceived: number;
    pendingSent: number;
  };
}

/**
 * Search result user type.
 */
export interface SearchUser {
  id: string;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  country?: string | null;
  level?: number | null;
  testsCompleted?: number;
  joinedAt?: string;
}
