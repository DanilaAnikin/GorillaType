"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Search,
  RotateCcw,
  Palette,
  Volume2,
  VolumeX,
  Home,
  Trophy,
  Settings,
  User,
  Info,
  Clock,
  Command,
  Sun,
  Moon,
} from "lucide-react";
import { useTypingStore } from "@/store/typing-store";
import { useConfigStore } from "@/store/config-store";
import { cn } from "@/lib/utils";

/* ============================================
   COMMAND PALETTE COMPONENT
   Accessible via Cmd+K / Ctrl+K
   Quick actions and navigation
   ============================================ */

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
  category: "action" | "navigation" | "recent";
}

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Store actions
  const resetTest = useTypingStore((state) => state.resetTest);
  const theme = useConfigStore((state) => state.visual.theme);
  const setTheme = useConfigStore((state) => state.setTheme);
  const soundOnClick = useConfigStore((state) => state.sound.soundOnClick);
  const toggleSoundOnClick = useConfigStore((state) => state.toggleSoundOnClick);

  const isDark = theme === "serika-dark" || theme === "dracula" || theme === "nord" || theme === "monokai" || theme === "solarized-dark" || theme === "gruvbox-dark" || theme === "catppuccin-mocha" || theme === "tokyo-night" || theme === "github-dark" || theme === "one-dark" || theme === "cyber" || theme === "midnight" || theme === "ocean" || theme === "matrix";

  // Define command items
  const commands: CommandItem[] = React.useMemo(() => [
    // Actions
    {
      id: "restart-test",
      label: "Restart Test",
      description: "Start a new typing test",
      icon: <RotateCcw className="h-4 w-4" />,
      shortcut: "Tab",
      action: () => {
        resetTest();
        setOpen(false);
      },
      category: "action",
    },
    {
      id: "toggle-theme",
      label: isDark ? "Light Mode" : "Dark Mode",
      description: "Toggle between light and dark theme",
      icon: isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />,
      shortcut: undefined,
      action: () => {
        setTheme(isDark ? "serika" : "serika-dark");
        setOpen(false);
      },
      category: "action",
    },
    {
      id: "change-theme",
      label: "Change Theme",
      description: "Browse and select a theme",
      icon: <Palette className="h-4 w-4" />,
      action: () => {
        router.push("/settings?tab=theme");
        setOpen(false);
      },
      category: "action",
    },
    {
      id: "toggle-sounds",
      label: soundOnClick ? "Disable Sounds" : "Enable Sounds",
      description: "Toggle typing sounds",
      icon: soundOnClick ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />,
      action: () => {
        toggleSoundOnClick();
        setOpen(false);
      },
      category: "action",
    },

    // Navigation
    {
      id: "nav-home",
      label: "Home",
      description: "Go to home page",
      icon: <Home className="h-4 w-4" />,
      action: () => {
        router.push("/");
        setOpen(false);
      },
      category: "navigation",
    },
    {
      id: "nav-leaderboards",
      label: "Leaderboards",
      description: "View top scores",
      icon: <Trophy className="h-4 w-4" />,
      action: () => {
        router.push("/leaderboards");
        setOpen(false);
      },
      category: "navigation",
    },
    {
      id: "nav-profile",
      label: "Profile",
      description: "View your profile",
      icon: <User className="h-4 w-4" />,
      action: () => {
        router.push("/profile");
        setOpen(false);
      },
      category: "navigation",
    },
    {
      id: "nav-settings",
      label: "Settings",
      description: "Customize your experience",
      icon: <Settings className="h-4 w-4" />,
      action: () => {
        router.push("/settings");
        setOpen(false);
      },
      category: "navigation",
    },
    {
      id: "nav-about",
      label: "About",
      description: "Learn about gorilla-type",
      icon: <Info className="h-4 w-4" />,
      action: () => {
        router.push("/about");
        setOpen(false);
      },
      category: "navigation",
    },

    // Recent tests placeholder (would be populated from results store)
    {
      id: "recent-test-1",
      label: "Recent: 30s Test",
      description: "75 WPM - 96% accuracy",
      icon: <Clock className="h-4 w-4" />,
      action: () => {
        // Would navigate to specific test result
        setOpen(false);
      },
      category: "recent",
    },
  ], [isDark, soundOnClick, resetTest, setTheme, toggleSoundOnClick, router]);

  // Filter commands based on search
  const filteredCommands = React.useMemo(() => {
    if (!search) return commands;
    const searchLower = search.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(searchLower) ||
        cmd.description?.toLowerCase().includes(searchLower)
    );
  }, [commands, search]);

  // Group commands by category
  const groupedCommands = React.useMemo(() => {
    const groups: Record<string, CommandItem[]> = {
      action: [],
      navigation: [],
      recent: [],
    };
    filteredCommands.forEach((cmd) => {
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  // Keyboard shortcut to open
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input when opened
  React.useEffect(() => {
    if (open) {
      setSearch("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;
    }
  };

  // Reset selected index when search changes
  React.useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  const renderCommandGroup = (title: string, items: CommandItem[]) => {
    if (items.length === 0) return null;

    const startIndex = filteredCommands.indexOf(items[0]);

    return (
      <div className="py-2">
        <div className="px-3 py-1.5 text-xs font-semibold text-sub uppercase tracking-wider">
          {title}
        </div>
        {items.map((cmd, idx) => {
          const globalIndex = startIndex + idx;
          return (
            <button
              key={cmd.id}
              onClick={cmd.action}
              onMouseEnter={() => setSelectedIndex(globalIndex)}
              className={cn(
                "flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors",
                globalIndex === selectedIndex
                  ? "bg-sub-alt text-main"
                  : "text-text hover:bg-sub-alt/50"
              )}
            >
              <span className="text-sub">{cmd.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{cmd.label}</div>
                {cmd.description && (
                  <div className="text-xs text-sub truncate">
                    {cmd.description}
                  </div>
                )}
              </div>
              {cmd.shortcut && (
                <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-sub bg-bg px-1.5 py-0.5 text-xs text-sub">
                  {cmd.shortcut}
                </kbd>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out" />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-1/4 z-50 w-full max-w-lg -translate-x-1/2 rounded-xl border border-sub bg-bg shadow-2xl data-[state=open]:animate-modal-in data-[state=closed]:animate-modal-out focus:outline-none"
          onKeyDown={handleKeyDown}
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 border-b border-sub px-4 py-3">
            <Search className="h-5 w-5 text-sub" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type a command or search..."
              className="flex-1 bg-transparent text-text placeholder:text-sub focus:outline-none"
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-sub bg-sub-alt px-1.5 py-0.5 text-xs text-sub">
              <Command className="h-3 w-3" />
              <span>K</span>
            </kbd>
          </div>

          {/* Command List */}
          <div className="max-h-80 overflow-y-auto">
            {filteredCommands.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-sub">
                No commands found for &ldquo;{search}&rdquo;
              </div>
            ) : (
              <>
                {renderCommandGroup("Quick Actions", groupedCommands.action)}
                {renderCommandGroup("Navigation", groupedCommands.navigation)}
                {renderCommandGroup("Recent Tests", groupedCommands.recent)}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-sub px-4 py-2 text-xs text-sub">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-sub bg-sub-alt px-1 py-0.5">
                  &uarr;
                </kbd>
                <kbd className="rounded border border-sub bg-sub-alt px-1 py-0.5">
                  &darr;
                </kbd>
                <span>to navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-sub bg-sub-alt px-1.5 py-0.5">
                  Enter
                </kbd>
                <span>to select</span>
              </span>
            </div>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-sub bg-sub-alt px-1.5 py-0.5">
                Esc
              </kbd>
              <span>to close</span>
            </span>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export default CommandPalette;
