import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProfileHeader, type UserProfile, type FriendshipState } from '@/components/profile/profile-header';
import { StatsOverview, type UserStats } from '@/components/profile/stats-overview';
import { PersonalBests, type PersonalBestsData } from '@/components/profile/personal-bests';
import { AchievementBadges, type Achievement } from '@/components/profile/achievement-badges';
import { TestHistory, type TestResult } from '@/components/profile/test-history';
import { PrivateProfileView } from '@/components/profile/private-profile-view';
import { ProfileExtras } from '@/components/profile/profile-extras';

/**
 * Social links structure stored in JSONB
 */
interface SocialLinks {
  twitter?: string;
  github?: string;
  discord?: string;
  website?: string;
}

/**
 * Generate metadata for the profile page.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;

  return {
    title: `${username}'s Profile`,
    description: `View ${username}'s typing statistics, personal bests, and achievements on gorilla-type.`,
  };
}

/**
 * Profile data type returned from database queries.
 */
type ProfileData = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  country_code: string | null;
  level: number;
  xp: number;
  tests_completed: number;
  time_typing_ms: number;
  current_streak: number;
  longest_streak: number;
  social_links: SocialLinks | null;
  created_at: string;
  is_public: boolean;
};

/**
 * Get the currently authenticated user's ID and username.
 */
async function getCurrentUser(): Promise<{ id: string; username: string | null } | null> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Also fetch the user's username from their profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .maybeSingle();

  return {
    id: user.id,
    username: profile?.username || null,
  };
}

/**
 * Fetch user profile by user ID from the database.
 * This is used for fetching the current user's own profile.
 */
async function getUserById(userId: string): Promise<ProfileData | null> {
  const supabase = await createClient();

  const { data: user, error } = await supabase
    .from('profiles')
    .select(`
      id,
      username,
      display_name,
      avatar_url,
      bio,
      country_code,
      level,
      xp,
      tests_completed,
      time_typing_ms,
      current_streak,
      longest_streak,
      social_links,
      created_at,
      is_public
    `)
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('[Profile] Error fetching profile by ID:', error.message, error.code);
    return null;
  }

  return user;
}

/**
 * Fetch user profile by username from the database.
 * This is used for viewing other users' profiles.
 */
async function getUserByUsername(username: string): Promise<ProfileData | null> {
  const supabase = await createClient();

  // Decode the username in case it's URL-encoded
  const decodedUsername = decodeURIComponent(username);

  // Use exact match for username lookup (usernames are unique in the database)
  // Using maybeSingle() to gracefully handle 0 or 1 results without PGRST116 error
  const { data: user, error } = await supabase
    .from('profiles')
    .select(`
      id,
      username,
      display_name,
      avatar_url,
      bio,
      country_code,
      level,
      xp,
      tests_completed,
      time_typing_ms,
      current_streak,
      longest_streak,
      social_links,
      created_at,
      is_public
    `)
    .eq('username', decodedUsername)
    .maybeSingle();

  if (error) {
    console.error('[Profile] Error fetching profile by username:', error.message, error.code);
    return null;
  }

  return user;
}

/**
 * Fetch user's test results from the database.
 */
async function getUserTestResults(userId: string, limit: number = 50): Promise<TestResult[]> {
  const supabase = await createClient();

  const { data: results, error } = await supabase
    .from('typing_results')
    .select(`
      id,
      test_mode,
      test_duration,
      test_word_count,
      wpm,
      raw_wpm,
      accuracy,
      consistency,
      chars_correct,
      chars_incorrect,
      chars_extra,
      chars_missed,
      completed_at
    `)
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })
    .limit(limit);

  if (error || !results) {
    return [];
  }

  return results.map((result) => ({
    id: result.id,
    date: result.completed_at,
    mode: result.test_mode as 'time' | 'words' | 'quote',
    modeValue: result.test_mode === 'time' ? result.test_duration : result.test_word_count,
    wpm: result.wpm,
    rawWpm: result.raw_wpm,
    accuracy: result.accuracy,
    consistency: result.consistency,
    characters: {
      correct: result.chars_correct || 0,
      incorrect: result.chars_incorrect || 0,
      extra: result.chars_extra || 0,
      missed: result.chars_missed || 0,
    },
  }));
}

/**
 * Fetch user's personal bests from the database.
 */
async function getUserPersonalBests(userId: string): Promise<PersonalBestsData> {
  const supabase = await createClient();

  const { data: personalBests, error } = await supabase
    .from('personal_bests')
    .select(`
      test_mode,
      test_duration,
      test_word_count,
      wpm,
      accuracy,
      achieved_at
    `)
    .eq('user_id', userId);

  const result: PersonalBestsData = {
    time: {},
    words: {},
  };

  if (error || !personalBests) {
    return result;
  }

  for (const pb of personalBests) {
    if (pb.test_mode === 'time' && pb.test_duration) {
      const timeKey = pb.test_duration as 15 | 30 | 60 | 120;
      if ([15, 30, 60, 120].includes(timeKey)) {
        result.time[timeKey] = {
          wpm: pb.wpm,
          accuracy: pb.accuracy,
          date: pb.achieved_at,
        };
      }
    } else if (pb.test_mode === 'words' && pb.test_word_count) {
      const wordKey = pb.test_word_count as 10 | 25 | 50 | 100;
      if ([10, 25, 50, 100].includes(wordKey)) {
        result.words[wordKey] = {
          wpm: pb.wpm,
          accuracy: pb.accuracy,
          date: pb.achieved_at,
        };
      }
    }
  }

  return result;
}

/**
 * Fetch user's achievements from the database.
 * The achievements table stores achievements per user with progress tracking.
 */
async function getUserAchievements(userId: string): Promise<Achievement[]> {
  const supabase = await createClient();

  // Fetch user's achievements from the achievements table
  const { data: userAchievements, error } = await supabase
    .from('achievements')
    .select(`
      id,
      achievement_key,
      achievement_name,
      achievement_description,
      achievement_icon,
      tier,
      is_completed,
      unlocked_at
    `)
    .eq('user_id', userId);

  if (error || !userAchievements) {
    return [];
  }

  // Map tier to rarity
  const tierToRarity = (tier: number): 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' => {
    switch (tier) {
      case 1: return 'common';
      case 2: return 'uncommon';
      case 3: return 'rare';
      case 4: return 'epic';
      case 5: return 'legendary';
      default: return 'common';
    }
  };

  // Derive category from achievement_key
  const keyToCategory = (key: string): 'speed' | 'accuracy' | 'consistency' | 'dedication' => {
    if (key.includes('speed') || key.includes('wpm')) return 'speed';
    if (key.includes('accuracy')) return 'accuracy';
    if (key.includes('consistency')) return 'consistency';
    return 'dedication';
  };

  return userAchievements.map((achievement) => ({
    id: achievement.id,
    name: achievement.achievement_name,
    description: achievement.achievement_description || '',
    category: keyToCategory(achievement.achievement_key),
    icon: achievement.achievement_icon || 'trophy',
    rarity: tierToRarity(achievement.tier),
    unlockedAt: achievement.is_completed ? achievement.unlocked_at : undefined,
  }));
}

/**
 * Calculate average WPM and accuracy from test results.
 */
function calculateAverages(results: TestResult[]): { averageWPM: number; averageAccuracy: number } {
  if (results.length === 0) {
    return { averageWPM: 0, averageAccuracy: 0 };
  }

  const totalWPM = results.reduce((sum, r) => sum + r.wpm, 0);
  const totalAccuracy = results.reduce((sum, r) => sum + r.accuracy, 0);

  return {
    averageWPM: Math.round((totalWPM / results.length) * 10) / 10,
    averageAccuracy: Math.round((totalAccuracy / results.length) * 10) / 10,
  };
}

/**
 * Get the friendship status between the current user and the profile owner.
 */
async function getFriendshipStatus(currentUserId: string | null, profileUserId: string): Promise<FriendshipState> {
  if (!currentUserId || currentUserId === profileUserId) {
    return 'none';
  }

  const supabase = await createClient();

  // Check if a friendship exists between the two users
  // Using limit(1) and maybeSingle() to prevent PGRST116 error if multiple records exist
  const { data: friendship, error } = await supabase
    .from('friendships')
    .select('id, status, requester_id')
    .or(`and(requester_id.eq.${currentUserId},addressee_id.eq.${profileUserId}),and(requester_id.eq.${profileUserId},addressee_id.eq.${currentUserId})`)
    .limit(1)
    .maybeSingle();

  if (error || !friendship) {
    return 'none';
  }

  if (friendship.status === 'accepted') {
    return 'friends';
  }

  if (friendship.status === 'pending') {
    // Determine if current user sent or received the request
    if (friendship.requester_id === currentUserId) {
      return 'pending_sent';
    } else {
      return 'pending_received';
    }
  }

  return 'none';
}

/**
 * User Profile Page - Server component that fetches and displays user data.
 */
export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const decodedUsername = decodeURIComponent(username);

  // First, get the current authenticated user
  const currentUser = await getCurrentUser();
  const currentUserId = currentUser?.id || null;

  let dbUser: ProfileData | null = null;
  let isOwnProfile = false;

  // Check if the user is viewing their own profile
  // Compare usernames case-insensitively
  const isUsernameMatch = currentUser && currentUser.username &&
      currentUser.username.toLowerCase() === decodedUsername.toLowerCase();

  if (isUsernameMatch) {
    // Fetch by ID to ensure RLS policy "Users can view own profile" applies
    // This is crucial for private profiles where only the owner can view
    dbUser = await getUserById(currentUser.id);
    isOwnProfile = true;
  } else {
    // Fetch by username for other users' profiles
    dbUser = await getUserByUsername(decodedUsername);
    // Double-check if this is actually the user's own profile (in case username doesn't match)
    if (dbUser && currentUserId && dbUser.id === currentUserId) {
      isOwnProfile = true;
    }

    // FALLBACK: If we couldn't fetch profile by username (could be private profile)
    // but we have an authenticated user, try fetching their profile by ID
    // If we find it, this IS their profile - redirect to correct URL if needed
    if (!dbUser && currentUserId) {
      const ownProfile = await getUserById(currentUserId);
      // If we found the user's own profile by ID, use it (and optionally redirect to correct URL)
      if (ownProfile) {
        // This is definitely the current user's profile
        // Redirect to correct URL if username doesn't match
        if (ownProfile.username?.toLowerCase() !== decodedUsername.toLowerCase()) {
          redirect(`/profile/${ownProfile.username}`);
        }
        dbUser = ownProfile;
        isOwnProfile = true;
      }
    }
  }

  if (!dbUser) {
    notFound();
  }

  // Check if profile is public or if viewing own profile
  if (!dbUser.is_public && !isOwnProfile) {
    // Private profile - show limited view
    return (
      <div className="container mx-auto px-4 py-8">
        <PrivateProfileView
          username={dbUser.username}
          avatarUrl={dbUser.avatar_url || undefined}
        />
      </div>
    );
  }

  // Fetch additional data in parallel
  const [testHistory, personalBests, achievements, friendshipStatus] = await Promise.all([
    getUserTestResults(dbUser.id),
    getUserPersonalBests(dbUser.id),
    getUserAchievements(dbUser.id),
    getFriendshipStatus(currentUserId, dbUser.id),
  ]);

  // Calculate averages from test history
  const { averageWPM, averageAccuracy } = calculateAverages(testHistory);

  // Extract social links from JSONB
  const socialLinks = dbUser.social_links || {};

  // Build user profile object
  const user: UserProfile = {
    id: dbUser.id,
    username: dbUser.username,
    displayName: dbUser.display_name || undefined,
    avatarUrl: dbUser.avatar_url || undefined,
    bio: dbUser.bio || undefined,
    country: dbUser.country_code || undefined,
    countryCode: dbUser.country_code || undefined,
    joinedAt: dbUser.created_at,
    socialLinks: {
      github: socialLinks.github || undefined,
      twitter: socialLinks.twitter || undefined,
      website: socialLinks.website || undefined,
    },
    xp: dbUser.xp || 0,
    level: dbUser.level || 1,
  };

  // Build stats object (time_typing_ms is in milliseconds, convert to seconds for display)
  const stats: UserStats = {
    testsCompleted: dbUser.tests_completed || 0,
    timeTyping: Math.floor((dbUser.time_typing_ms || 0) / 1000),
    averageWPM: averageWPM,
    averageAccuracy: averageAccuracy,
    currentStreak: dbUser.current_streak || 0,
    maxStreak: dbUser.longest_streak || 0,
    xp: dbUser.xp || 0,
    level: dbUser.level || 1,
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Profile Header */}
      <ProfileHeader
        user={user}
        isOwnProfile={isOwnProfile}
        isLoggedIn={!!currentUserId}
        friendshipStatus={friendshipStatus}
        className="mb-6"
      />

      {/* Stats and Personal Bests Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <StatsOverview stats={stats} />
        <PersonalBests personalBests={personalBests} />
      </div>

      {/* Achievements - only show if there are any */}
      {achievements.length > 0 && (
        <AchievementBadges
          achievements={achievements}
          showLocked={true}
          className="mb-6"
        />
      )}

      {/* Test History */}
      <TestHistory
        results={testHistory}
        pageSize={10}
      />

      {/* Activity Heatmap, Badge Showcase, and Social Share Card */}
      <ProfileExtras
        username={dbUser.username}
        shareCardData={{
          username: dbUser.username,
          displayName: dbUser.display_name || undefined,
          level: dbUser.level || 1,
          averageWPM,
          averageAccuracy,
          testsCompleted: dbUser.tests_completed || 0,
          currentStreak: dbUser.current_streak || 0,
          bestWPM: testHistory.length > 0
            ? Math.max(...testHistory.map((t) => t.wpm))
            : undefined,
        }}
        profileUrl={`/profile/${dbUser.username}`}
      />
    </div>
  );
}
