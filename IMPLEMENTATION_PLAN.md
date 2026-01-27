# Implementation Plan: Option B - Feature Expansion

## Overview
Option B includes ALL items from Option A (Polish & Perfect) plus Option B's feature expansion items. This plan was fully implemented across 16+ parallel sub-agents in 5 coordinated waves.

## Build & Test Status
- **Build**: SUCCESS (0 errors, 73 warnings)
- **Tests**: 490/490 PASSING (9 test files)
- **New files**: 39
- **Modified files**: 24
- **Total affected**: 63 files

---

## Phase A: Foundation (Option A Items)

### A1. Testing Framework
- **Stack**: Vitest v4.0.18 + React Testing Library + jsdom
- **Config**: `vitest.config.ts` with React plugin, path aliases
- **Setup**: `src/test/setup.ts` mocking browser APIs (IntersectionObserver, matchMedia, ResizeObserver, AudioContext)
- **Scripts**: `npm test`, `npm run test:coverage`, `npm run test:ui`
- **Coverage**: 9 test files, 490 tests across utilities, stores, and analyzers

### A2. Audio System Fix
- **Problem**: Missing sound files, broken Howler.js integration
- **Solution**:
  - Created `scripts/generate-sounds.js` to programmatically generate WAV files
  - Generated 8 WAV files: click, beep, pop, nk-cream, typewriter, error-beep, error-damage, complete
  - Rewrote `src/lib/hooks/use-sound.ts` with proper sound mapping, preloading, error handling, volume levels
  - Added `playComplete()` function for test completion sound

### A3. Error Boundaries
- **Component**: `src/components/ui/error-boundary.tsx` - React class component with reset capability
- **Fallback**: `src/components/typing/typing-error-fallback.tsx` - Typing-specific error UI
- **Integration**: Wrapped typing test, results screen, and protected layout

### A4. Performance Optimization
- **Skeleton Loading**: `src/components/ui/skeleton.tsx` with text/circular/rectangular variants
- **Virtual Scrolling**: `src/components/ui/virtual-list.tsx` for long lists
- **Code Splitting**: Dynamic imports for heavy components (charts, modals)

### A5. Accessibility (WCAG 2.1 AA)
- **Skip Link**: `src/components/ui/skip-link.tsx` for keyboard navigation
- **Screen Reader**: `src/components/ui/sr-announcer.tsx` with global `announce()` function
- **CSS**: Reduced motion media query, high contrast support in `globals.css`
- **ARIA**: Added attributes to typing test, config bar, results screen

### A6. API Documentation
- **File**: `API_DOCUMENTATION.md` (58KB)
- **Coverage**: 30+ endpoints documented with request/response examples
- **Sections**: Authentication, Results, Leaderboards, Friends, Clans, Chat, Multiplayer, Tournaments, Challenges, Notifications, Analytics, Practice, Replay, Users

### A7. Mobile Touch Optimization
- **Mobile Nav**: `src/components/layout/mobile-nav.tsx` - Fixed bottom navigation (Type, Ranks, Compete, Social, Settings)
- **Keyboard Hint**: `src/components/typing/mobile-keyboard-hint.tsx` - Tap-to-focus prompt
- **CSS**: Touch target sizing (min 44px), mobile-specific styles, viewport fixes

---

## Phase B: Feature Expansion (Option B Items)

### B1. Advanced Analytics Dashboard
- **Page**: `src/app/(protected)/analytics/page.tsx`
- **API**: `src/app/api/analytics/route.ts` - Aggregates WPM history, daily tests, mode stats, language stats, overall stats, recent progress
- **Components**:
  - `analytics-dashboard.tsx` - Main dashboard layout
  - `stat-card.tsx` - Reusable stat card with change indicators
  - `wpm-chart.tsx` - WPM + Raw WPM line chart (Chart.js with CSS variable theming)
  - `accuracy-chart.tsx` - Accuracy trend line chart
  - `activity-heatmap.tsx` - GitHub-style 90-day contribution heatmap
  - `mode-breakdown.tsx` - Performance breakdown per test mode

### B2. Replay System
- **Keystroke Recorder**: `src/lib/hooks/use-keystroke-recorder.ts` - Records KeystrokeEvent[] with timestamps
- **Replay Player**: `src/components/replay/replay-player.tsx` - Play/pause, speed control (0.5x-4x), progress scrubber, requestAnimationFrame animation
- **API**: `src/app/api/replay/route.ts` - GET (retrieve by resultId), POST (batch save keystrokes)
- **Integration**: Typing test records keystrokes; results screen shows "Watch Replay" button

### B3. Smart Practice Mode
- **Analyzer**: `src/lib/utils/weakness-analyzer.ts` - Per-key error rates, bigram analysis, speed analysis, practice word generation from WORD_BANK
- **Page**: `src/app/(protected)/practice/page.tsx`
- **API**: `src/app/api/practice/route.ts` - Fetches keystroke data, runs weakness analysis
- **Components**:
  - `smart-practice.tsx` - Weakness report with practice start
  - `weakness-card.tsx` - Key/bigram weakness visualization
  - `key-cap.tsx` - Styled keyboard key cap

### B4. Tournament System
- **Pages**: `src/app/tournaments/page.tsx`, `src/app/tournaments/[id]/page.tsx`
- **API Routes**:
  - `GET/POST /api/tournaments` - List (filterable, paginated) / Create
  - `GET/PUT/DELETE /api/tournaments/[id]` - Detail / Update / Delete
  - `POST /api/tournaments/[id]/join` - Join tournament
  - `POST /api/tournaments/[id]/rounds` - Submit round result (score = wpm * accuracy/100)
- **Components**:
  - `tournament-list.tsx` - Tabs (Upcoming/Active/Completed), grid layout, create button
  - `tournament-card.tsx` - Status badge, config summary, participant count
  - `create-tournament-modal.tsx` - Creation form with validation
  - `tournament-detail.tsx` - Full tournament view with rounds
  - `tournament-leaderboard.tsx` - Sorted table with gold/silver/bronze medals

### B5. Notification Center
- **Store**: `src/store/notifications-store.ts` - Zustand store with fetch, mark read, add, remove
- **API**: `src/app/api/notifications/route.ts` - GET, PATCH (mark read/all), DELETE
- **Components**:
  - `notification-center.tsx` - Popover panel with list, mark all read, empty state
  - `notification-item.tsx` - Type icon, unread dot, relative time, delete button
- **Integration**: Header bell icon with unread count badge

### B6. Challenge System (1v1)
- **Page**: `src/app/(protected)/challenges/page.tsx`
- **API Routes**:
  - `GET/POST /api/challenges` - List (sent/received) / Create (24h expiry)
  - `GET/PATCH/DELETE /api/challenges/[id]` - Detail / Accept/Decline/Submit/Determine winner
- **Components**:
  - `challenge-list.tsx` - Received/Sent sections with tabs
  - `challenge-card.tsx` - Status-aware action buttons
  - `send-challenge-modal.tsx` - Modal form for sending challenges
  - `challenge-result-comparison.tsx` - Side-by-side comparison with winner crown
- **Integration**: "Challenge" button with Swords icon in friends list

### B7. Profile Enhancements
- **Activity Heatmap**: `src/components/profile/activity-heatmap.tsx` - 365-day GitHub-style heatmap with month/day labels, legend
- **Badge Showcase**: `src/components/profile/badge-showcase.tsx` - Achievement grid with bronze/silver/gold tiers, progress bars
- **Profile Extras**: `src/components/profile/profile-extras.tsx` - Wrapper fetching activity data
- **API**: `src/app/api/users/[username]/activity/route.ts` - Activity data + achievements
- **Integration**: Added to profile page

---

## Database Migration

**File**: `supabase/migrations/00020_option_b_features.sql` (22KB)

### New Tables
| Table | Purpose |
|-------|---------|
| `keystroke_events` | Records individual keystrokes for replay system |
| `notifications` | User notification storage |
| `tournaments` | Tournament definitions and configuration |
| `tournament_participants` | User enrollment and standings |
| `tournament_rounds` | Individual round results |
| `challenges` | 1v1 challenge tracking with 24h expiry |

### Features
- Row-Level Security (RLS) policies on all tables
- Indexes on frequently queried columns
- Triggers for automatic timestamp updates
- `determine_challenge_winner()` function for automatic winner resolution
- Status CHECK constraints (tournament: registration/active/completed/cancelled; challenge: pending/accepted/declined/completed/expired)

---

## Test Suite

| Test File | Tests | Coverage |
|-----------|-------|----------|
| `calculations.test.ts` | 49 | WPM, accuracy, consistency, XP, validation |
| `validation.test.ts` | 63 | Username, email, password, match, numbers, sanitization |
| `formatting.test.ts` | 62 | Time, numbers, percentages, dates, relative time, bytes |
| `word-generator.test.ts` | 38 | Shuffle, generate, quotes, custom lists, bigrams |
| `weakness-analyzer.test.ts` | 18 | Weakness detection, summary generation |
| `config-store.test.ts` | 63 | All config actions and state |
| `typing-store.test.ts` | 53 | Init, start, keypress, backspace, space, end, reset, tick |
| `ui-store.test.ts` | 53 | Modals, notifications, tooltips, toggles, chat |
| `results-store.test.ts` | 47 | Add/remove results, personal bests, weakspots, sync |
| **Total** | **490** | |

---

## File Inventory

### New Files (39)
- Infrastructure: `vitest.config.ts`, `src/test/setup.ts`, `scripts/generate-sounds.js`
- Database: `supabase/migrations/00020_option_b_features.sql`
- Documentation: `API_DOCUMENTATION.md`
- Sound files: 8 WAV files in `public/sounds/`
- UI components: error-boundary, skeleton, virtual-list, skip-link, sr-announcer
- Feature components: analytics (6), challenges (5), notifications (3), practice (4), replay (2), tournaments (6), profile (3)
- API routes: analytics, challenges, notifications, practice, replay, tournaments (4), users/activity
- Pages: analytics, challenges, practice, tournaments (2)
- Hooks: use-keystroke-recorder
- Utilities: weakness-analyzer
- Store: notifications-store
- Tests: 9 test files
- Layout: mobile-nav, mobile-keyboard-hint, typing-error-fallback

### Modified Files (24)
- Package: package.json, package-lock.json
- Layout: layout.tsx (root), layout.tsx (protected)
- Pages: page.tsx (home), profile/[username]/page.tsx
- Components: header, providers, friends-list, results-screen, test-config-bar, typing-test, keymap, sound-settings
- Styles: globals.css
- Hooks: use-sound.ts
- Utilities: index.ts, word-generator.ts
- Stores: index.ts
- Barrel exports: ui/index.ts, profile/index.ts
- Bug fixes: chat/route.ts, clans/[id]/page.tsx, multiplayer/[code]/race-room.tsx
