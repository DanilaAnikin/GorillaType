'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useConfigStore, type CustomThemeColors } from '@/store/config-store';
import { useUIStore } from '@/store/ui-store';
import { useUserStore } from '@/store/user-store';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ChatPanel, ChatToggle } from '@/components/chat';
import { createClient } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Converts a Supabase user to our app's User type
 */
function mapSupabaseUser(supabaseUser: SupabaseUser) {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? '',
    username: supabaseUser.user_metadata?.username ?? supabaseUser.email?.split('@')[0] ?? '',
    createdAt: supabaseUser.created_at,
    emailVerified: supabaseUser.email_confirmed_at !== null,
  };
}

/**
 * Providers component wraps the application with necessary context providers.
 * Handles theme synchronization and Supabase auth state management.
 */
/**
 * Applies custom theme CSS variables to the document root
 */
function applyCustomThemeColors(customTheme: CustomThemeColors | null) {
  const root = document.documentElement;

  if (customTheme) {
    root.style.setProperty('--custom-bg', customTheme.bg);
    root.style.setProperty('--custom-main', customTheme.main);
    root.style.setProperty('--custom-caret', customTheme.caret);
    root.style.setProperty('--custom-sub', customTheme.sub);
    root.style.setProperty('--custom-sub-alt', customTheme.subAlt);
    root.style.setProperty('--custom-text', customTheme.text);
    root.style.setProperty('--custom-error', customTheme.error);
    root.style.setProperty('--custom-error-extra', customTheme.errorExtra);
  } else {
    // Remove custom properties when not using custom theme
    root.style.removeProperty('--custom-bg');
    root.style.removeProperty('--custom-main');
    root.style.removeProperty('--custom-caret');
    root.style.removeProperty('--custom-sub');
    root.style.removeProperty('--custom-sub-alt');
    root.style.removeProperty('--custom-text');
    root.style.removeProperty('--custom-error');
    root.style.removeProperty('--custom-error-extra');
  }
}

export function Providers({ children }: ProvidersProps) {
  const [mounted, setMounted] = useState(false);
  const theme = useConfigStore((state) => state.visual.theme);
  const customTheme = useConfigStore((state) => state.customTheme);
  const isFocusMode = useUIStore((state) => state.isFocusMode);

  // User store actions
  const setUser = useUserStore((state) => state.setUser);
  const setProfile = useUserStore((state) => state.setProfile);
  const setTokens = useUserStore((state) => state.setTokens);
  const clearUser = useUserStore((state) => state.clearUser);
  const setLoading = useUserStore((state) => state.setLoading);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  // Supabase auth state listener
  useEffect(() => {
    const supabase = createClient();
    let authCheckCompleted = false;

    // Set loading while we check initial session
    setLoading(true);

    // Set a timeout to ensure we don't hang forever (like signOut was hanging)
    const timeout = setTimeout(() => {
      if (!authCheckCompleted) {
        console.log('[Providers] Auth check timeout after 3s - setting isLoading to false');
        authCheckCompleted = true;
        setLoading(false);
      }
    }, 3000);

    // Helper function to fetch and set user profile
    const fetchProfile = async (userId: string) => {
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select(`
            id,
            username,
            display_name,
            bio,
            avatar_url,
            country_code,
            tests_completed,
            time_typing_ms,
            xp,
            level,
            current_streak,
            longest_streak,
            is_public,
            created_at,
            updated_at
          `)
          .eq('id', userId)
          .single();

        if (!error && profile) {
          setProfile({
            id: profile.id,
            username: profile.username,
            displayName: profile.display_name,
            bio: profile.bio,
            avatarUrl: profile.avatar_url,
            country: profile.country_code,
            totalTests: profile.tests_completed || 0,
            totalTime: Math.floor((profile.time_typing_ms || 0) / 1000),
            totalWords: 0,
            totalChars: 0,
            bestWpm: 0,
            bestAccuracy: 0,
            averageWpm: 0,
            averageAccuracy: 0,
            currentStreak: profile.current_streak || 0,
            longestStreak: profile.longest_streak || 0,
            lastTestAt: null,
            xp: profile.xp || 0,
            level: profile.level || 1,
            isPublic: profile.is_public ?? true,
            showCountry: true,
            showStats: true,
            createdAt: profile.created_at,
            updatedAt: profile.updated_at,
          });
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      }
    };

    // Check auth with timeout protection
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        // If timeout already fired, don't update state
        if (authCheckCompleted) return;

        if (session?.user) {
          setUser(mapSupabaseUser(session.user));
          setTokens(
            session.access_token,
            session.refresh_token,
            session.expires_in ?? 3600
          );
          // Fetch user profile
          await fetchProfile(session.user.id);
        } else {
          clearUser();
        }
      } catch (err) {
        console.error('[Providers] Error getting session:', err);
        if (!authCheckCompleted) {
          clearUser();
        }
      } finally {
        if (!authCheckCompleted) {
          authCheckCompleted = true;
          clearTimeout(timeout);
          setLoading(false);
        }
      }
    };

    checkAuth();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(mapSupabaseUser(session.user));
          setTokens(
            session.access_token,
            session.refresh_token,
            session.expires_in ?? 3600
          );
          // Fetch profile on sign in
          await fetchProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          clearUser();
        } else if (event === 'TOKEN_REFRESHED' && session) {
          setTokens(
            session.access_token,
            session.refresh_token,
            session.expires_in ?? 3600
          );
        } else if (event === 'USER_UPDATED' && session?.user) {
          setUser(mapSupabaseUser(session.user));
          // Refresh profile on user update
          await fetchProfile(session.user.id);
        }
      }
    );

    // Cleanup subscription and timeout on unmount
    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [setUser, setProfile, setTokens, clearUser, setLoading]);

  // Sync theme to document
  useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute('data-theme', theme);

      // Apply custom theme colors when custom theme is active
      if (theme === 'custom') {
        applyCustomThemeColors(customTheme);
      } else {
        // Clear custom properties when switching away from custom theme
        applyCustomThemeColors(null);
      }
    }
  }, [theme, customTheme, mounted]);

  // Sync focus mode class to body for header/footer fade effect
  useEffect(() => {
    if (mounted) {
      if (isFocusMode) {
        document.body.classList.add('focus-mode-active');
      } else {
        document.body.classList.remove('focus-mode-active');
      }
    }
  }, [isFocusMode, mounted]);

  // Always wrap in TooltipProvider for consistent rendering
  // Use visibility to prevent flash of unstyled content
  return (
    <TooltipProvider delayDuration={300} skipDelayDuration={100}>
      {!mounted ? (
        <div style={{ visibility: 'hidden' }}>
          {children}
        </div>
      ) : (
        <>
          {children}
          <ChatToggle />
          <ChatPanel />
        </>
      )}
    </TooltipProvider>
  );
}

export default Providers;
