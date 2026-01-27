"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/user-store";
import { ErrorBoundary } from "@/components/ui/error-boundary";

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const router = useRouter();

  // Use the user store - auth state is already managed by providers.tsx
  const user = useUserStore((state) => state.user);
  const isLoading = useUserStore((state) => state.isLoading);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);

  // Debug logging - remove after fixing the issue
  console.log('[ProtectedLayout] Auth state:', { isLoading, isAuthenticated, user: user?.email ?? null });

  // Redirect to login if not authenticated after loading completes
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // Show loading while auth state is being determined
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

  // Show redirecting state while navigation happens
  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-main border-t-transparent" />
          <p className="text-sm text-sub">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
}
