"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError) {
          console.error("Auth error:", authError);
          setError("Authentication error. Please try logging in again.");
          setIsLoading(false);
          return;
        }

        if (!user) {
          // Not authenticated - redirect to login
          router.push("/login");
          // Still set loading to false in case redirect fails or is slow
          setIsLoading(false);
          return;
        }

        setIsAuthenticated(true);
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to check authentication:", err);
        setError("Failed to verify authentication. Please refresh the page.");
        setIsLoading(false);
      }
    };

    checkAuth();

    // Listen for auth state changes
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_OUT" || !session) {
          setIsAuthenticated(false);
          router.push("/login");
        } else if (event === "SIGNED_IN" && session) {
          setIsAuthenticated(true);
          setIsLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-main border-t-transparent" />
          <p className="text-sm text-sub">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-4 max-w-md text-center px-4">
          <div className="text-error text-lg font-medium">Authentication Error</div>
          <p className="text-sm text-sub">{error}</p>
          <button
            onClick={() => router.push("/login")}
            className="mt-4 px-4 py-2 rounded-lg bg-main text-bg font-medium hover:bg-main/90 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Still show loading while redirect happens
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-main border-t-transparent" />
          <p className="text-sm text-sub">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
