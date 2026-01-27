"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Settings,
  Sun,
  Moon,
  User,
  LogOut,
  Trophy,
  Info,
  ChevronDown,
  Keyboard,
  Users,
  Shield,
  ChartLine,
  Target,
  Swords,
} from "lucide-react";
import { useUserStore, selectIsLoggedIn, selectDisplayName, selectAvatarUrl } from "@/store/user-store";
import { Avatar } from "@/components/ui/avatar";
import { useConfigStore } from "@/store/config-store";
import { cn } from "@/lib/utils/cn";
import { buttonVariants } from "@/components/ui/button";
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
  DropdownLabel,
} from "@/components/ui/dropdown";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { NotificationCenter } from "@/components/notifications";

/* ============================================
   HEADER COMPONENT
   Top navigation bar with logo, nav links, and user menu
   ============================================ */

/**
 * Navigation item configuration.
 */
interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

/**
 * Main navigation items (always visible).
 */
const navItems: NavItem[] = [
  {
    href: "/leaderboards",
    label: "Leaderboards",
    icon: <Trophy className="h-4 w-4" />,
  },
  {
    href: "/tournaments",
    label: "Tournaments",
    icon: <Trophy className="h-4 w-4" />,
  },
  {
    href: "/clans",
    label: "Clans",
    icon: <Shield className="h-4 w-4" />,
  },
  {
    href: "/friends",
    label: "Friends",
    icon: <Users className="h-4 w-4" />,
  },
  {
    href: "/about",
    label: "About",
    icon: <Info className="h-4 w-4" />,
  },
];

/**
 * Authenticated navigation items (only visible when logged in).
 */
const authNavItems: NavItem[] = [
  {
    href: "/analytics",
    label: "Analytics",
    icon: <ChartLine className="h-4 w-4" />,
  },
  {
    href: "/practice",
    label: "Practice",
    icon: <Target className="h-4 w-4" />,
  },
  {
    href: "/challenges",
    label: "Challenges",
    icon: <Swords className="h-4 w-4" />,
  },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const isLoggedIn = useUserStore(selectIsLoggedIn);
  const displayName = useUserStore(selectDisplayName);
  const avatarUrl = useUserStore(selectAvatarUrl);
  const user = useUserStore((state) => state.user);

  const theme = useConfigStore((state) => state.visual.theme);
  const setTheme = useConfigStore((state) => state.setTheme);

  // Light themes list
  const lightThemes = ["serika", "solarized-light", "github-light", "nord-light"];
  const isDark = !lightThemes.includes(theme);

  const toggleTheme = () => {
    setTheme(isDark ? "serika" : "serika-dark");
  };

  const handleLogout = async () => {
    console.log("Logout clicked - handleLogout called");

    // Clear local state first - this ensures UI updates immediately
    useUserStore.getState().clearUser();
    console.log("User store cleared");

    // Call server-side logout API to properly clear session cookies
    try {
      console.log("Calling server-side logout API...");
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      console.log("Server logout response:", data);
    } catch (e) {
      console.log("Server logout error:", e);
      // Continue with redirect even if server logout fails
    }

    // Always redirect regardless of logout result
    router.push("/");
    router.refresh();
    console.log("Router push and refresh called");
  };

  return (
    <header className="header sticky top-0 z-50 w-full border-b border-sub-alt bg-bg/80 backdrop-blur-sm transition-all duration-[125ms]">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        {/* Logo / Brand */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-main font-bold text-xl transition-all duration-[125ms] hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded-md"
          >
            <Keyboard className="h-6 w-6" />
            <span className="hidden sm:inline">gorilla-type</span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-[125ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
                    isActive
                      ? "text-main bg-sub-alt"
                      : "text-sub hover:text-main hover:bg-sub-alt/50"
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
            {isLoggedIn && authNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-[125ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
                    isActive
                      ? "text-main bg-sub-alt"
                      : "text-sub hover:text-main hover:bg-sub-alt/50"
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Side - User Menu & Controls */}
        <div className="flex items-center gap-2">
          {/* Settings Link */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/settings"
                className={cn(
                  "inline-flex items-center justify-center h-9 w-9 rounded-lg transition-all duration-[125ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
                  pathname === "/settings"
                    ? "text-main bg-sub-alt"
                    : "text-sub hover:text-text hover:bg-sub-alt/50"
                )}
              >
                <Settings className="h-5 w-5" />
                <span className="sr-only">Settings</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent>Settings</TooltipContent>
          </Tooltip>

          {/* Theme Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggleTheme}
                className="inline-flex items-center justify-center h-9 w-9 rounded-lg text-sub transition-all duration-[125ms] hover:text-text hover:bg-sub-alt/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
              >
                {isDark ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              {isDark ? "Light mode" : "Dark mode"}
            </TooltipContent>
          </Tooltip>

          {/* Notification Center */}
          <NotificationCenter />

          {/* User Menu */}
          {isLoggedIn ? (
            <Dropdown>
              <DropdownTrigger asChild>
                <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sub transition-all duration-[125ms] hover:bg-sub-alt/50 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main focus-visible:ring-offset-2 focus-visible:ring-offset-bg">
                  <Avatar
                    src={avatarUrl}
                    alt={displayName}
                    fallback={displayName.charAt(0)}
                    size="sm"
                  />
                  <span className="hidden sm:inline text-sm font-medium text-text">
                    {displayName}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </button>
              </DropdownTrigger>
              <DropdownContent align="end" className="w-48 bg-sub-alt border-sub/20">
                <DropdownLabel className="text-sub">My Account</DropdownLabel>
                <DropdownSeparator className="bg-sub/20" />
                <DropdownItem asChild className="text-text hover:bg-bg hover:text-main focus:bg-bg focus:text-main transition-all duration-[125ms]">
                  <Link href={user ? `/profile/${user.username}` : "/profile"} className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownItem>
                <DropdownItem asChild className="text-text hover:bg-bg hover:text-main focus:bg-bg focus:text-main transition-all duration-[125ms]">
                  <Link href="/settings" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownItem>
                <DropdownSeparator className="bg-sub/20" />
                <DropdownItem
                  onSelect={(e) => {
                    e.preventDefault();
                    handleLogout();
                  }}
                  className="flex items-center gap-2 text-error hover:bg-bg hover:text-error focus:bg-bg focus:text-error transition-all duration-[125ms] cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Log out</span>
                </DropdownItem>
              </DropdownContent>
            </Dropdown>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              >
                Log in
              </Link>
              <Link
                href="/register"
                className={cn(buttonVariants({ variant: "active", size: "sm" }))}
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
