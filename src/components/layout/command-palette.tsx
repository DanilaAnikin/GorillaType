"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
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
  Timer,
  Hash,
  Quote,
  Infinity,
  ToggleLeft,
  ToggleRight,
  Type,
  Eye,
  EyeOff,
  Keyboard,
  Mail,
  Gauge,
  AlertCircle,
  Play,
  Share2,
  Maximize,
  Users,
  Swords,
  UserPlus,
  Sparkles,
  ChevronRight,
  ArrowLeft,
  ChartLine,
  Target,
} from "lucide-react";
import { useTypingStore } from "@/store/typing-store";
import { useConfigStore, Theme, FontFamily, FunboxMode } from "@/store/config-store";
import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";

/* ============================================
   ENHANCED COMMAND PALETTE COMPONENT
   Accessible via Cmd+K / Ctrl+K / Ctrl+Shift+P
   Quick actions, settings, and navigation
   ============================================ */

// Fuzzy search implementation
function fuzzyMatch(text: string, query: string): { match: boolean; score: number } {
  if (!query) return { match: true, score: 0 };

  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();

  // Exact match gets highest score
  if (textLower.includes(queryLower)) {
    return { match: true, score: queryLower.length * 2 + (textLower.startsWith(queryLower) ? 10 : 0) };
  }

  // Fuzzy match: check if all query characters appear in order
  let queryIndex = 0;
  let score = 0;
  let consecutiveMatches = 0;

  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      score += 1 + consecutiveMatches;
      consecutiveMatches++;
      queryIndex++;
    } else {
      consecutiveMatches = 0;
    }
  }

  return { match: queryIndex === queryLower.length, score };
}

type CommandCategory =
  | "navigation"
  | "test-config"
  | "visual"
  | "behavior"
  | "action"
  | "theme"
  | "font";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
  category: CommandCategory;
  keywords?: string[];
  isActive?: boolean;
}

interface CommandGroup {
  title: string;
  category: CommandCategory;
}

const COMMAND_GROUPS: CommandGroup[] = [
  { title: "Quick Actions", category: "action" },
  { title: "Navigation", category: "navigation" },
  { title: "Test Configuration", category: "test-config" },
  { title: "Visual Settings", category: "visual" },
  { title: "Behavior Settings", category: "behavior" },
  { title: "Themes", category: "theme" },
  { title: "Fonts", category: "font" },
];

const THEME_OPTIONS: { value: Theme; label: string; isDark: boolean }[] = [
  { value: "serika-dark", label: "Serika Dark", isDark: true },
  { value: "serika", label: "Serika", isDark: false },
  { value: "dracula", label: "Dracula", isDark: true },
  { value: "nord", label: "Nord", isDark: true },
  { value: "nord-light", label: "Nord Light", isDark: false },
  { value: "monokai", label: "Monokai", isDark: true },
  { value: "solarized-dark", label: "Solarized Dark", isDark: true },
  { value: "solarized-light", label: "Solarized Light", isDark: false },
  { value: "gruvbox-dark", label: "Gruvbox Dark", isDark: true },
  { value: "catppuccin-mocha", label: "Catppuccin Mocha", isDark: true },
  { value: "tokyo-night", label: "Tokyo Night", isDark: true },
  { value: "github-dark", label: "GitHub Dark", isDark: true },
  { value: "github-light", label: "GitHub Light", isDark: false },
  { value: "one-dark", label: "One Dark", isDark: true },
  { value: "cyber", label: "Cyber", isDark: true },
  { value: "midnight", label: "Midnight", isDark: true },
  { value: "ocean", label: "Ocean", isDark: true },
  { value: "matrix", label: "Matrix", isDark: true },
];

const FONT_OPTIONS: { value: FontFamily; label: string }[] = [
  { value: "roboto_mono", label: "Roboto Mono" },
  { value: "jetbrains_mono", label: "JetBrains Mono" },
  { value: "fira_code", label: "Fira Code" },
  { value: "source_code_pro", label: "Source Code Pro" },
  { value: "ibm_plex_mono", label: "IBM Plex Mono" },
];

const FUNBOX_OPTIONS: { value: FunboxMode; label: string; description: string }[] = [
  { value: "none", label: "None", description: "Normal typing mode" },
  { value: "memory", label: "Memory", description: "Words disappear after a delay" },
  { value: "readAhead", label: "Read Ahead", description: "Only see upcoming words" },
];

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [subMenu, setSubMenu] = React.useState<"theme" | "font" | "funbox" | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Store actions
  const resetTest = useTypingStore((state) => state.resetTest);
  const restartWithSameWords = useTypingStore((state) => state.restartWithSameWords);
  const testStatus = useTypingStore((state) => state.status);

  // Config store state
  const theme = useConfigStore((state) => state.visual.theme);
  const setTheme = useConfigStore((state) => state.setTheme);
  const fontFamily = useConfigStore((state) => state.visual.fontFamily);
  const setFontFamily = useConfigStore((state) => state.setFontFamily);
  const soundOnClick = useConfigStore((state) => state.sound.soundOnClick);
  const toggleSoundOnClick = useConfigStore((state) => state.toggleSoundOnClick);

  // Test settings
  const testMode = useConfigStore((state) => state.test.mode);
  const setMode = useConfigStore((state) => state.setMode);
  const testTime = useConfigStore((state) => state.test.time);
  const setTime = useConfigStore((state) => state.setTime);
  const testWords = useConfigStore((state) => state.test.words);
  const setWords = useConfigStore((state) => state.setWords);

  // Behavior settings
  const punctuation = useConfigStore((state) => state.behavior.punctuation);
  const togglePunctuation = useConfigStore((state) => state.togglePunctuation);
  const numbers = useConfigStore((state) => state.behavior.numbers);
  const toggleNumbers = useConfigStore((state) => state.toggleNumbers);
  const blindMode = useConfigStore((state) => state.behavior.blindMode);
  const toggleBlindMode = useConfigStore((state) => state.toggleBlindMode);
  const freedomMode = useConfigStore((state) => state.behavior.freedomMode);
  const toggleFreedomMode = useConfigStore((state) => state.toggleFreedomMode);
  const stopOnError = useConfigStore((state) => state.behavior.stopOnError);
  const setStopOnError = useConfigStore((state) => state.setStopOnError);

  // Visual settings
  const showLiveWpm = useConfigStore((state) => state.visual.showLiveWpm);
  const toggleShowLiveWpm = useConfigStore((state) => state.toggleShowLiveWpm);
  const showLiveAccuracy = useConfigStore((state) => state.visual.showLiveAccuracy);
  const toggleShowLiveAccuracy = useConfigStore((state) => state.toggleShowLiveAccuracy);
  const showKeymap = useConfigStore((state) => state.visual.showKeymap);
  const toggleKeymap = useConfigStore((state) => state.toggleKeymap);

  // Pacemaker settings
  const pacemakerEnabled = useConfigStore((state) => state.pacemaker.enabled);
  const setPacemakerEnabled = useConfigStore((state) => state.setPacemakerEnabled);

  // Funbox settings
  const funboxMode = useConfigStore((state) => state.funbox.mode);
  const setFunboxMode = useConfigStore((state) => state.setFunboxMode);

  // UI store
  const isFocusMode = useUIStore((state) => state.isFocusMode);
  const toggleFocusMode = useUIStore((state) => state.toggleFocusMode);

  const isDark = THEME_OPTIONS.find(t => t.value === theme)?.isDark ?? true;

  // Build commands list
  const commands: CommandItem[] = React.useMemo(() => {
    const items: CommandItem[] = [];

    // ========== ACTION COMMANDS ==========
    items.push({
      id: "restart-test",
      label: "Restart Test",
      description: "Start a new typing test with new words",
      icon: <RotateCcw className="h-4 w-4" />,
      shortcut: "Tab",
      action: () => {
        resetTest();
        setOpen(false);
      },
      category: "action",
      keywords: ["new", "reset", "refresh"],
    });

    items.push({
      id: "restart-same",
      label: "Restart with Same Words",
      description: "Retry the same test",
      icon: <Play className="h-4 w-4" />,
      action: () => {
        restartWithSameWords();
        setOpen(false);
      },
      category: "action",
      keywords: ["retry", "repeat", "same"],
    });

    items.push({
      id: "toggle-focus",
      label: isFocusMode ? "Exit Focus Mode" : "Enter Focus Mode",
      description: "Hide distractions while typing",
      icon: isFocusMode ? <Maximize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />,
      action: () => {
        toggleFocusMode();
        setOpen(false);
      },
      category: "action",
      keywords: ["zen", "distraction", "minimal"],
      isActive: isFocusMode,
    });

    if (testStatus === "finished" || pathname?.includes("/results")) {
      items.push({
        id: "share-result",
        label: "Share Result",
        description: "Copy result link to clipboard",
        icon: <Share2 className="h-4 w-4" />,
        action: () => {
          navigator.clipboard.writeText(window.location.href);
          setOpen(false);
        },
        category: "action",
        keywords: ["copy", "link"],
      });
    }

    items.push({
      id: "toggle-theme-mode",
      label: isDark ? "Switch to Light Mode" : "Switch to Dark Mode",
      description: "Toggle between light and dark theme",
      icon: isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />,
      action: () => {
        setTheme(isDark ? "serika" : "serika-dark");
        setOpen(false);
      },
      category: "action",
      keywords: ["dark", "light", "mode"],
    });

    items.push({
      id: "toggle-sounds",
      label: soundOnClick ? "Disable Sounds" : "Enable Sounds",
      description: "Toggle typing sounds",
      icon: soundOnClick ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />,
      action: () => {
        toggleSoundOnClick();
        setOpen(false);
      },
      category: "action",
      keywords: ["audio", "click", "mute"],
      isActive: soundOnClick,
    });

    // ========== NAVIGATION COMMANDS ==========
    items.push({
      id: "nav-home",
      label: "Go to Home",
      description: "Return to the main typing test",
      icon: <Home className="h-4 w-4" />,
      action: () => {
        router.push("/");
        setOpen(false);
      },
      category: "navigation",
      keywords: ["main", "typing", "test"],
    });

    items.push({
      id: "nav-settings",
      label: "Go to Settings",
      description: "Customize your experience",
      icon: <Settings className="h-4 w-4" />,
      action: () => {
        router.push("/settings");
        setOpen(false);
      },
      category: "navigation",
      keywords: ["config", "preferences", "options"],
    });

    items.push({
      id: "nav-leaderboards",
      label: "Go to Leaderboards",
      description: "View top scores",
      icon: <Trophy className="h-4 w-4" />,
      action: () => {
        router.push("/leaderboards");
        setOpen(false);
      },
      category: "navigation",
      keywords: ["rankings", "scores", "top"],
    });

    items.push({
      id: "nav-profile",
      label: "Go to Profile",
      description: "View your profile and stats",
      icon: <User className="h-4 w-4" />,
      action: () => {
        router.push("/account");
        setOpen(false);
      },
      category: "navigation",
      keywords: ["account", "stats", "history"],
    });

    items.push({
      id: "nav-clans",
      label: "Go to Clans",
      description: "Browse and join clans",
      icon: <Users className="h-4 w-4" />,
      action: () => {
        router.push("/clans");
        setOpen(false);
      },
      category: "navigation",
      keywords: ["groups", "teams", "community"],
    });

    items.push({
      id: "nav-friends",
      label: "Go to Friends",
      description: "Manage your friends list",
      icon: <UserPlus className="h-4 w-4" />,
      action: () => {
        router.push("/friends");
        setOpen(false);
      },
      category: "navigation",
      keywords: ["social", "add", "people"],
    });

    items.push({
      id: "nav-multiplayer",
      label: "Go to Multiplayer",
      description: "Race against others",
      icon: <Swords className="h-4 w-4" />,
      action: () => {
        router.push("/multiplayer");
        setOpen(false);
      },
      category: "navigation",
      keywords: ["race", "compete", "versus", "pvp"],
    });

    items.push({
      id: "nav-about",
      label: "Go to About",
      description: "Learn about Gorilla Type",
      icon: <Info className="h-4 w-4" />,
      action: () => {
        router.push("/about");
        setOpen(false);
      },
      category: "navigation",
    });

    items.push({
      id: "nav-contact",
      label: "Go to Contact",
      description: "Get in touch or report issues",
      icon: <Mail className="h-4 w-4" />,
      action: () => {
        router.push("/contact");
        setOpen(false);
      },
      category: "navigation",
      keywords: ["email", "support", "help", "feedback", "bug"],
    });

    items.push({
      id: "nav-analytics",
      label: "Go to Analytics",
      description: "View your typing statistics and progress",
      icon: <ChartLine className="h-4 w-4" />,
      action: () => {
        router.push("/analytics");
        setOpen(false);
      },
      category: "navigation",
      keywords: ["stats", "progress", "charts", "data", "history"],
    });

    items.push({
      id: "nav-practice",
      label: "Go to Practice",
      description: "Targeted practice to improve your skills",
      icon: <Target className="h-4 w-4" />,
      action: () => {
        router.push("/practice");
        setOpen(false);
      },
      category: "navigation",
      keywords: ["train", "improve", "drill", "exercise"],
    });

    items.push({
      id: "nav-challenges",
      label: "Go to Challenges",
      description: "Take on typing challenges",
      icon: <Swords className="h-4 w-4" />,
      action: () => {
        router.push("/challenges");
        setOpen(false);
      },
      category: "navigation",
      keywords: ["compete", "battle", "contest", "mission"],
    });

    items.push({
      id: "nav-tournaments",
      label: "Go to Tournaments",
      description: "Join competitive typing tournaments",
      icon: <Trophy className="h-4 w-4" />,
      action: () => {
        router.push("/tournaments");
        setOpen(false);
      },
      category: "navigation",
      keywords: ["compete", "bracket", "competition", "event"],
    });

    // ========== TEST CONFIGURATION COMMANDS ==========
    // Mode commands
    items.push({
      id: "mode-time",
      label: "Set Mode: Time",
      description: "Type for a set duration",
      icon: <Timer className="h-4 w-4" />,
      action: () => {
        setMode("time");
        resetTest();
        setOpen(false);
      },
      category: "test-config",
      keywords: ["timer", "duration", "seconds"],
      isActive: testMode === "time",
    });

    items.push({
      id: "mode-words",
      label: "Set Mode: Words",
      description: "Type a set number of words",
      icon: <Hash className="h-4 w-4" />,
      action: () => {
        setMode("words");
        resetTest();
        setOpen(false);
      },
      category: "test-config",
      keywords: ["count", "number"],
      isActive: testMode === "words",
    });

    items.push({
      id: "mode-quote",
      label: "Set Mode: Quote",
      description: "Type famous quotes",
      icon: <Quote className="h-4 w-4" />,
      action: () => {
        setMode("quote");
        resetTest();
        setOpen(false);
      },
      category: "test-config",
      keywords: ["text", "passage"],
      isActive: testMode === "quote",
    });

    items.push({
      id: "mode-zen",
      label: "Set Mode: Zen",
      description: "Free typing without limits",
      icon: <Infinity className="h-4 w-4" />,
      action: () => {
        setMode("zen");
        resetTest();
        setOpen(false);
      },
      category: "test-config",
      keywords: ["free", "endless", "infinite"],
      isActive: testMode === "zen",
    });

    // Time duration commands
    [15, 30, 60, 120].forEach(seconds => {
      items.push({
        id: `time-${seconds}`,
        label: `Set Time: ${seconds}s`,
        description: `${seconds} second test`,
        icon: <Clock className="h-4 w-4" />,
        action: () => {
          setMode("time");
          setTime(seconds as 15 | 30 | 60 | 120);
          resetTest();
          setOpen(false);
        },
        category: "test-config",
        keywords: ["duration", "seconds", "timer"],
        isActive: testMode === "time" && testTime === seconds,
      });
    });

    // Word count commands
    [10, 25, 50, 100].forEach(count => {
      items.push({
        id: `words-${count}`,
        label: `Set Words: ${count}`,
        description: `${count} word test`,
        icon: <Type className="h-4 w-4" />,
        action: () => {
          setMode("words");
          setWords(count as 10 | 25 | 50 | 100);
          resetTest();
          setOpen(false);
        },
        category: "test-config",
        keywords: ["count", "number"],
        isActive: testMode === "words" && testWords === count,
      });
    });

    // Punctuation toggle
    items.push({
      id: "toggle-punctuation",
      label: punctuation ? "Disable Punctuation" : "Enable Punctuation",
      description: "Include punctuation marks in tests",
      icon: punctuation ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />,
      action: () => {
        togglePunctuation();
        resetTest();
        setOpen(false);
      },
      category: "test-config",
      keywords: ["comma", "period", "symbols"],
      isActive: punctuation,
    });

    // Numbers toggle
    items.push({
      id: "toggle-numbers",
      label: numbers ? "Disable Numbers" : "Enable Numbers",
      description: "Include numbers in tests",
      icon: numbers ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />,
      action: () => {
        toggleNumbers();
        resetTest();
        setOpen(false);
      },
      category: "test-config",
      keywords: ["digits", "123"],
      isActive: numbers,
    });

    // Funbox submenu
    items.push({
      id: "open-funbox",
      label: "Set Funbox Mode",
      description: `Current: ${FUNBOX_OPTIONS.find(f => f.value === funboxMode)?.label || "None"}`,
      icon: <Sparkles className="h-4 w-4" />,
      action: () => setSubMenu("funbox"),
      category: "test-config",
      keywords: ["special", "challenge", "memory"],
    });

    // ========== VISUAL COMMANDS ==========
    items.push({
      id: "open-themes",
      label: "Switch Theme",
      description: `Current: ${THEME_OPTIONS.find(t => t.value === theme)?.label || theme}`,
      icon: <Palette className="h-4 w-4" />,
      action: () => setSubMenu("theme"),
      category: "visual",
      keywords: ["color", "style", "appearance"],
    });

    items.push({
      id: "open-fonts",
      label: "Change Font",
      description: `Current: ${FONT_OPTIONS.find(f => f.value === fontFamily)?.label || fontFamily}`,
      icon: <Type className="h-4 w-4" />,
      action: () => setSubMenu("font"),
      category: "visual",
      keywords: ["typeface", "text", "monospace"],
    });

    items.push({
      id: "toggle-live-wpm",
      label: showLiveWpm ? "Hide Live WPM" : "Show Live WPM",
      description: "Display WPM while typing",
      icon: <Gauge className="h-4 w-4" />,
      action: () => {
        toggleShowLiveWpm();
        setOpen(false);
      },
      category: "visual",
      keywords: ["speed", "words per minute"],
      isActive: showLiveWpm,
    });

    items.push({
      id: "toggle-live-accuracy",
      label: showLiveAccuracy ? "Hide Live Accuracy" : "Show Live Accuracy",
      description: "Display accuracy while typing",
      icon: <Gauge className="h-4 w-4" />,
      action: () => {
        toggleShowLiveAccuracy();
        setOpen(false);
      },
      category: "visual",
      keywords: ["percentage", "errors"],
      isActive: showLiveAccuracy,
    });

    items.push({
      id: "toggle-keymap",
      label: showKeymap ? "Hide Keymap" : "Show Keymap",
      description: "Display keyboard layout",
      icon: <Keyboard className="h-4 w-4" />,
      action: () => {
        toggleKeymap();
        setOpen(false);
      },
      category: "visual",
      keywords: ["keyboard", "layout", "keys"],
      isActive: showKeymap,
    });

    // ========== BEHAVIOR COMMANDS ==========
    items.push({
      id: "toggle-blind",
      label: blindMode ? "Disable Blind Mode" : "Enable Blind Mode",
      description: "Hide typed text feedback",
      icon: blindMode ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />,
      action: () => {
        toggleBlindMode();
        setOpen(false);
      },
      category: "behavior",
      keywords: ["hide", "invisible"],
      isActive: blindMode,
    });

    items.push({
      id: "toggle-freedom",
      label: freedomMode ? "Disable Freedom Mode" : "Enable Freedom Mode",
      description: "Allow going back to fix errors",
      icon: freedomMode ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />,
      action: () => {
        toggleFreedomMode();
        setOpen(false);
      },
      category: "behavior",
      keywords: ["backspace", "fix", "correct"],
      isActive: freedomMode,
    });

    items.push({
      id: "stop-error-off",
      label: "Stop on Error: Off",
      description: "Continue typing after errors",
      icon: <AlertCircle className="h-4 w-4" />,
      action: () => {
        setStopOnError("off");
        setOpen(false);
      },
      category: "behavior",
      keywords: ["continue", "ignore"],
      isActive: stopOnError === "off",
    });

    items.push({
      id: "stop-error-word",
      label: "Stop on Error: Word",
      description: "Stop at the end of the word on error",
      icon: <AlertCircle className="h-4 w-4" />,
      action: () => {
        setStopOnError("word");
        setOpen(false);
      },
      category: "behavior",
      keywords: ["pause", "mistake"],
      isActive: stopOnError === "word",
    });

    items.push({
      id: "stop-error-letter",
      label: "Stop on Error: Letter",
      description: "Stop immediately on error",
      icon: <AlertCircle className="h-4 w-4" />,
      action: () => {
        setStopOnError("letter");
        setOpen(false);
      },
      category: "behavior",
      keywords: ["strict", "instant"],
      isActive: stopOnError === "letter",
    });

    items.push({
      id: "toggle-pacemaker",
      label: pacemakerEnabled ? "Disable Pacemaker" : "Enable Pacemaker",
      description: "Show a ghost caret at target WPM",
      icon: <Gauge className="h-4 w-4" />,
      action: () => {
        setPacemakerEnabled(!pacemakerEnabled);
        setOpen(false);
      },
      category: "behavior",
      keywords: ["ghost", "target", "speed"],
      isActive: pacemakerEnabled,
    });

    return items;
  }, [
    resetTest, restartWithSameWords, testStatus, pathname,
    isDark, setTheme, soundOnClick, toggleSoundOnClick,
    testMode, setMode, testTime, setTime, testWords, setWords,
    punctuation, togglePunctuation, numbers, toggleNumbers,
    blindMode, toggleBlindMode, freedomMode, toggleFreedomMode,
    stopOnError, setStopOnError, pacemakerEnabled, setPacemakerEnabled,
    showLiveWpm, toggleShowLiveWpm, showLiveAccuracy, toggleShowLiveAccuracy,
    showKeymap, toggleKeymap, isFocusMode, toggleFocusMode,
    theme, fontFamily, funboxMode, router
  ]);

  // Filter and sort commands based on search using fuzzy matching
  const filteredCommands = React.useMemo(() => {
    if (!search) return commands;

    const results = commands.map(cmd => {
      // Search in label, description, and keywords
      const labelMatch = fuzzyMatch(cmd.label, search);
      const descMatch = fuzzyMatch(cmd.description || "", search);
      const keywordMatches = (cmd.keywords || []).map(kw => fuzzyMatch(kw, search));

      const bestKeywordScore = Math.max(0, ...keywordMatches.map(m => m.match ? m.score : 0));
      const anyMatch = labelMatch.match || descMatch.match || keywordMatches.some(m => m.match);

      return {
        cmd,
        score: anyMatch ? labelMatch.score * 2 + descMatch.score + bestKeywordScore : -1,
        match: anyMatch,
      };
    });

    return results
      .filter(r => r.match)
      .sort((a, b) => b.score - a.score)
      .map(r => r.cmd);
  }, [commands, search]);

  // Generate theme submenu items
  const themeCommands: CommandItem[] = React.useMemo(() => {
    return THEME_OPTIONS.map(t => ({
      id: `theme-${t.value}`,
      label: t.label,
      description: t.isDark ? "Dark theme" : "Light theme",
      icon: t.isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />,
      action: () => {
        setTheme(t.value);
        setSubMenu(null);
        setOpen(false);
      },
      category: "theme" as CommandCategory,
      isActive: theme === t.value,
    }));
  }, [theme, setTheme]);

  // Generate font submenu items
  const fontCommands: CommandItem[] = React.useMemo(() => {
    return FONT_OPTIONS.map(f => ({
      id: `font-${f.value}`,
      label: f.label,
      icon: <Type className="h-4 w-4" />,
      action: () => {
        setFontFamily(f.value);
        setSubMenu(null);
        setOpen(false);
      },
      category: "font" as CommandCategory,
      isActive: fontFamily === f.value,
    }));
  }, [fontFamily, setFontFamily]);

  // Generate funbox submenu items
  const funboxCommands: CommandItem[] = React.useMemo(() => {
    return FUNBOX_OPTIONS.map(f => ({
      id: `funbox-${f.value}`,
      label: f.label,
      description: f.description,
      icon: <Sparkles className="h-4 w-4" />,
      action: () => {
        setFunboxMode(f.value);
        resetTest();
        setSubMenu(null);
        setOpen(false);
      },
      category: "test-config" as CommandCategory,
      isActive: funboxMode === f.value,
    }));
  }, [funboxMode, setFunboxMode, resetTest]);

  // Get current display commands based on submenu state
  const displayCommands = React.useMemo(() => {
    if (subMenu === "theme") {
      if (!search) return themeCommands;
      return themeCommands.filter(cmd =>
        fuzzyMatch(cmd.label, search).match ||
        fuzzyMatch(cmd.description || "", search).match
      );
    }
    if (subMenu === "font") {
      if (!search) return fontCommands;
      return fontCommands.filter(cmd => fuzzyMatch(cmd.label, search).match);
    }
    if (subMenu === "funbox") {
      if (!search) return funboxCommands;
      return funboxCommands.filter(cmd =>
        fuzzyMatch(cmd.label, search).match ||
        fuzzyMatch(cmd.description || "", search).match
      );
    }
    return filteredCommands;
  }, [subMenu, search, themeCommands, fontCommands, funboxCommands, filteredCommands]);

  // Group commands by category
  const groupedCommands = React.useMemo(() => {
    const groups: Record<CommandCategory, CommandItem[]> = {
      action: [],
      navigation: [],
      "test-config": [],
      visual: [],
      behavior: [],
      theme: [],
      font: [],
    };

    displayCommands.forEach(cmd => {
      groups[cmd.category].push(cmd);
    });

    return groups;
  }, [displayCommands]);

  // Keyboard shortcut to open (Ctrl+K and Ctrl+Shift+P)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      // Ctrl+Shift+P or Cmd+Shift+P
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "P") {
        e.preventDefault();
        setOpen(prev => !prev);
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
      setSubMenu(null);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < displayCommands.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : displayCommands.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (displayCommands[selectedIndex]) {
          displayCommands[selectedIndex].action();
        }
        break;
      case "Escape":
        e.preventDefault();
        if (subMenu) {
          setSubMenu(null);
          setSearch("");
        } else {
          setOpen(false);
        }
        break;
      case "Backspace":
        if (search === "" && subMenu) {
          e.preventDefault();
          setSubMenu(null);
        }
        break;
    }
  };

  // Reset selected index when search or submenu changes
  React.useEffect(() => {
    setSelectedIndex(0);
  }, [search, subMenu]);

  // Scroll selected item into view
  React.useEffect(() => {
    if (listRef.current && displayCommands.length > 0) {
      const selectedElement = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex, displayCommands.length]);

  const renderCommandItem = (cmd: CommandItem, globalIndex: number) => {
    const hasSubmenu = cmd.id.startsWith("open-");

    return (
      <button
        key={cmd.id}
        data-index={globalIndex}
        onClick={cmd.action}
        onMouseEnter={() => setSelectedIndex(globalIndex)}
        className={cn(
          "flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors",
          globalIndex === selectedIndex
            ? "bg-sub-alt text-main"
            : "text-text hover:bg-sub-alt/50"
        )}
      >
        <span className={cn("text-sub", cmd.isActive && "text-main")}>
          {cmd.icon}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn("font-medium truncate", cmd.isActive && "text-main")}>
              {cmd.label}
            </span>
            {cmd.isActive && (
              <span className="text-xs text-main bg-main/10 px-1.5 py-0.5 rounded">
                Active
              </span>
            )}
          </div>
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
        {hasSubmenu && (
          <ChevronRight className="h-4 w-4 text-sub" />
        )}
      </button>
    );
  };

  const renderCommandGroup = (title: string, items: CommandItem[], startIndex: number) => {
    if (items.length === 0) return null;

    return (
      <div className="py-2">
        <div className="px-3 py-1.5 text-xs font-semibold text-sub uppercase tracking-wider">
          {title}
        </div>
        {items.map((cmd, idx) => renderCommandItem(cmd, startIndex + idx))}
      </div>
    );
  };

  // Calculate start indices for each group
  const getGroupStartIndex = (category: CommandCategory): number => {
    let index = 0;
    for (const group of COMMAND_GROUPS) {
      if (group.category === category) break;
      index += groupedCommands[group.category].length;
    }
    return index;
  };

  const getSubMenuTitle = () => {
    switch (subMenu) {
      case "theme": return "Select Theme";
      case "font": return "Select Font";
      case "funbox": return "Select Funbox Mode";
      default: return "";
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out" />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-1/4 z-50 w-full max-w-xl -translate-x-1/2 rounded-xl border border-sub bg-bg shadow-2xl data-[state=open]:animate-modal-in data-[state=closed]:animate-modal-out focus:outline-none"
          onKeyDown={handleKeyDown}
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 border-b border-sub px-4 py-3">
            {subMenu && (
              <button
                onClick={() => {
                  setSubMenu(null);
                  setSearch("");
                }}
                className="text-sub hover:text-text transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <Search className="h-5 w-5 text-sub" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={subMenu ? `Search ${getSubMenuTitle().toLowerCase()}...` : "Type a command or search..."}
              className="flex-1 bg-transparent text-text placeholder:text-sub focus:outline-none"
            />
            <div className="hidden sm:flex items-center gap-1">
              <kbd className="inline-flex items-center gap-1 rounded border border-sub bg-sub-alt px-1.5 py-0.5 text-xs text-sub">
                <Command className="h-3 w-3" />
                <span>K</span>
              </kbd>
              <span className="text-xs text-sub">or</span>
              <kbd className="inline-flex items-center gap-1 rounded border border-sub bg-sub-alt px-1.5 py-0.5 text-xs text-sub">
                <span>Ctrl</span>
                <span>Shift</span>
                <span>P</span>
              </kbd>
            </div>
          </div>

          {/* Submenu Header */}
          {subMenu && (
            <div className="px-4 py-2 border-b border-sub/50 bg-sub-alt/30">
              <span className="text-sm font-medium text-text">{getSubMenuTitle()}</span>
            </div>
          )}

          {/* Command List */}
          <div ref={listRef} className="max-h-96 overflow-y-auto">
            {displayCommands.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-sub">
                No commands found for &ldquo;{search}&rdquo;
              </div>
            ) : subMenu ? (
              // Submenu: flat list
              <div className="py-2">
                {displayCommands.map((cmd, idx) => renderCommandItem(cmd, idx))}
              </div>
            ) : (
              // Main menu: grouped
              <>
                {COMMAND_GROUPS.map(group =>
                  renderCommandGroup(
                    group.title,
                    groupedCommands[group.category],
                    getGroupStartIndex(group.category)
                  )
                )}
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
                <span>navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-sub bg-sub-alt px-1.5 py-0.5">
                  Enter
                </kbd>
                <span>select</span>
              </span>
              {subMenu && (
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-sub bg-sub-alt px-1.5 py-0.5">
                    Backspace
                  </kbd>
                  <span>back</span>
                </span>
              )}
            </div>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-sub bg-sub-alt px-1.5 py-0.5">
                Esc
              </kbd>
              <span>{subMenu ? "back" : "close"}</span>
            </span>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export default CommandPalette;
