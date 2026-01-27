# Gorilla Type - Manual Testing Checklist

Use this checklist to verify all implemented features work correctly. Check each item after testing.

---

## Prerequisites

Before testing, ensure:
1. Run `npm install` to install all dependencies (including new test dependencies)
2. Run the database migration `00020_option_b_features.sql` against your Supabase instance
3. Run `npm run build` to verify a clean build
4. Run `npm test` to verify all 490 automated tests pass
5. Run `npm run dev` to start the development server

---

## A. Foundation Features (Option A)

### A1. Sound System
- [ ] Go to Settings > Sound
- [ ] Enable sound and select "Click" sound scheme
- [ ] Type in a test and verify you hear click sounds on keypress
- [ ] Switch to "Beep" sound scheme and verify different sound
- [ ] Switch to "Pop" and verify
- [ ] Switch to "NK Cream" and verify
- [ ] Switch to "Typewriter" and verify
- [ ] Enable error sounds and make a typo - verify error sound plays
- [ ] Complete a test and verify the completion sound plays
- [ ] Adjust volume slider and verify volume changes
- [ ] Disable sound and verify no sounds play

### A2. Error Boundaries
- [ ] The app should load without crashing
- [ ] If a component error occurs, a styled fallback UI should appear (not a white screen)
- [ ] The fallback should have a "Try Again" button that resets the component
- [ ] Protected pages (account, settings, analytics, etc.) are wrapped in error boundaries

### A3. Performance
- [ ] Pages with loading states show skeleton placeholders (not blank screens)
- [ ] Large lists (leaderboards, tournament lists) should render smoothly
- [ ] Navigation between pages should feel fast (code splitting)

### A4. Accessibility
- [ ] Press Tab on page load - a "Skip to main content" link should appear
- [ ] The skip link should jump focus to the main content area
- [ ] Use keyboard Tab/Enter to navigate the header menu
- [ ] Screen reader should announce test completion and results
- [ ] Enable "Reduce Motion" in OS settings - animations should be reduced
- [ ] All interactive elements should have visible focus indicators
- [ ] Test config bar buttons should have proper ARIA labels

### A5. Mobile Optimization
- [ ] Open the app on a mobile device or browser dev tools mobile view
- [ ] A bottom navigation bar should appear with 5 items: Type, Ranks, Compete, Social, Settings
- [ ] Each nav item should navigate to the correct page
- [ ] Tap the typing area - a hint should appear to open the keyboard
- [ ] Touch targets should be at least 44px (buttons, links in nav)
- [ ] The test config bar should be usable on mobile (tap-friendly)

### A6. API Documentation
- [ ] Open `API_DOCUMENTATION.md` in the project root
- [ ] Verify it covers all endpoints (auth, results, leaderboards, friends, clans, chat, multiplayer, tournaments, challenges, notifications, analytics, practice, replay, users)
- [ ] Verify each endpoint has method, URL, description, request/response examples

---

## B. Feature Expansion (Option B)

### B1. Analytics Dashboard
- [ ] Navigate to `/analytics` (must be logged in)
- [ ] Verify the page loads with stat cards (Total Tests, Average WPM, Best WPM, Average Accuracy)
- [ ] Verify the WPM History chart renders (line chart with WPM and Raw WPM)
- [ ] Verify the Accuracy Trend chart renders
- [ ] Verify the Activity Heatmap renders (GitHub-style grid for last 90 days)
- [ ] Verify Mode Breakdown shows stats per test mode (time, words, quote, zen, custom)
- [ ] Charts should use the current theme colors (CSS variables)
- [ ] With no test data, appropriate empty states should show

### B2. Replay System
- [ ] Complete a typing test
- [ ] On the results screen, look for a "Watch Replay" button
- [ ] Click "Watch Replay" to open the replay player
- [ ] Verify the replay plays back your keystrokes in real-time
- [ ] Test the play/pause button
- [ ] Test speed controls: 0.5x, 1x, 2x, 4x
- [ ] Test the progress scrubber (drag to seek through the replay)
- [ ] Verify characters appear green (correct) or red (incorrect) as in the original test
- [ ] Close the replay and verify return to results

### B3. Smart Practice Mode
- [ ] Navigate to `/practice` (must be logged in)
- [ ] If you have previous test data with keystrokes, verify weakness analysis loads
- [ ] Verify "Weak Keys" section shows keys you frequently mistype
- [ ] Verify "Weak Bigrams" section shows character pairs you struggle with
- [ ] Verify "Slow Keys" section shows keys where your typing speed drops
- [ ] Each weakness should show an error rate or speed metric
- [ ] Click "Start Practice" to begin a practice session with targeted words
- [ ] Verify the practice words contain your weak keys/bigrams
- [ ] With no keystroke data, an appropriate empty state should show

### B4. Tournament System
- [ ] Navigate to `/tournaments`
- [ ] Verify the page loads with tabs: Upcoming, Active, Completed
- [ ] Click "Create Tournament" button
- [ ] Fill in the form: name, description, test mode, duration, max participants, rounds
- [ ] Submit and verify the tournament appears in the list
- [ ] Verify the tournament card shows: name, status badge, test config, participant count
- [ ] Click a tournament to view its detail page (`/tournaments/[id]`)
- [ ] Verify detail page shows: description, config, participant list, leaderboard
- [ ] Click "Join" on a tournament (not your own)
- [ ] After joining, verify you appear in the participants list
- [ ] Submit a round result and verify it shows on the leaderboard
- [ ] Leaderboard should show gold/silver/bronze medals for top 3
- [ ] Verify tournaments can be filtered by status

### B5. Notification Center
- [ ] Look for a bell icon in the header navigation bar
- [ ] Click the bell icon to open the notification panel
- [ ] If no notifications, verify empty state message appears
- [ ] Trigger a notification (e.g., receive a challenge, join a tournament)
- [ ] Verify the bell icon shows an unread count badge (red dot with number)
- [ ] Open the panel and verify new notifications appear with:
  - Type-specific icon (trophy, swords, info, etc.)
  - Title and message
  - Relative timestamp ("2 minutes ago")
  - Unread indicator (dot)
- [ ] Click "Mark all as read" and verify all notifications become read
- [ ] Click the X on a notification to delete it
- [ ] Click a notification with a link to verify navigation works

### B6. Challenge System (1v1)
- [ ] Navigate to `/challenges` (must be logged in)
- [ ] Verify the page shows Received and Sent challenge sections
- [ ] Go to the Friends page and find a friend
- [ ] Click the "Challenge" (swords) button next to a friend's name
- [ ] In the modal, configure: test mode, duration/word count, and submit
- [ ] Verify the challenge appears in "Sent" challenges
- [ ] As the challenged user, verify it appears in "Received" challenges
- [ ] Test "Accept" button - should change status to accepted
- [ ] Test "Decline" button - should change status to declined
- [ ] After both users complete the challenge test, verify:
  - Results comparison shows side-by-side WPM, accuracy, consistency
  - Winner is displayed with a crown icon
  - Status changes to completed
- [ ] Verify challenges expire after 24 hours

### B7. Profile Enhancements
- [ ] Navigate to a user profile page (`/profile/[username]`)
- [ ] Verify the Activity Heatmap appears (365-day GitHub-style grid)
  - Hover over a cell to see date and test count
  - Greener cells = more activity
  - Month labels along the top
  - Day labels (Mon, Wed, Fri) along the side
  - Legend showing activity intensity levels
- [ ] Verify the Badge Showcase appears with achievement cards
  - Badges should show bronze/silver/gold tiers
  - Each badge should have a progress bar if not fully earned
  - Achievement categories: speed, accuracy, consistency, endurance, etc.
- [ ] Verify profile loads correctly for users with no test data

---

## C. Integration Tests

### C1. End-to-End Typing Flow
- [ ] Start a typing test (time mode, 30 seconds)
- [ ] Complete the test with some intentional errors
- [ ] Verify results screen shows: WPM, raw WPM, accuracy, consistency, characters, time
- [ ] Verify "Watch Replay" button appears
- [ ] Click "Watch Replay" and verify playback works
- [ ] Close replay, navigate to Analytics
- [ ] Verify the just-completed test appears in the analytics data

### C2. Tournament + Challenge Integration
- [ ] Create a tournament, have multiple users join
- [ ] Each user completes a round - verify leaderboard updates
- [ ] Challenge a user from within the tournament context
- [ ] Verify notifications fire for tournament events and challenges

### C3. Practice Loop
- [ ] Complete several typing tests with consistent errors on specific keys
- [ ] Go to Practice mode
- [ ] Verify the analyzer detected your actual weak points
- [ ] Complete a practice session
- [ ] Return to normal typing to see if weak keys improved

### C4. Cross-Feature Navigation
- [ ] Verify header has: logo, navigation links (including Tournaments), notification bell, user menu
- [ ] Navigate: Home > Analytics > Practice > Tournaments > Challenges > Profile > Settings
- [ ] Verify each page loads without errors
- [ ] Verify the active navigation link is highlighted
- [ ] On mobile, verify bottom nav works for all destinations

---

## D. Database Verification

Run these checks against your Supabase database after applying migration `00020_option_b_features.sql`:

- [ ] Table `keystroke_events` exists with columns: id, result_id, user_id, key_char, is_correct, timestamp_ms, key_code
- [ ] Table `notifications` exists with columns: id, user_id, type, title, message, data, is_read, link
- [ ] Table `tournaments` exists with status CHECK constraint (registration, active, completed, cancelled)
- [ ] Table `tournament_participants` exists with status CHECK constraint (registered, active, eliminated, completed)
- [ ] Table `tournament_rounds` exists with foreign keys to tournaments and participants
- [ ] Table `challenges` exists with status CHECK constraint (pending, accepted, declined, completed, expired)
- [ ] RLS is enabled on all 6 new tables
- [ ] Indexes exist on frequently queried columns (user_id, tournament_id, status, etc.)
- [ ] `determine_challenge_winner()` function exists

---

## E. Automated Tests

- [ ] Run `npm test` - all 490 tests should pass
- [ ] Run `npm run test:coverage` - verify coverage report generates
- [ ] Test files cover:
  - [ ] `calculations.test.ts` - WPM, accuracy, consistency, XP calculations
  - [ ] `validation.test.ts` - Input validation (username, email, password, etc.)
  - [ ] `formatting.test.ts` - Display formatting (time, numbers, dates, etc.)
  - [ ] `word-generator.test.ts` - Word generation, shuffling, custom lists
  - [ ] `weakness-analyzer.test.ts` - Weakness detection and analysis
  - [ ] `config-store.test.ts` - Configuration state management
  - [ ] `typing-store.test.ts` - Typing test state machine
  - [ ] `ui-store.test.ts` - UI state (modals, notifications, tooltips)
  - [ ] `results-store.test.ts` - Results storage and personal bests

---

## F. Build Verification

- [ ] `npm run build` completes with 0 errors
- [ ] All routes listed in build output (both static `○` and dynamic `ƒ`)
- [ ] New routes present: `/analytics`, `/challenges`, `/practice`, `/tournaments`, `/tournaments/[id]`
- [ ] New API routes present: `/api/analytics`, `/api/challenges`, `/api/notifications`, `/api/practice`, `/api/replay`, `/api/tournaments`, `/api/users/[username]/activity`
- [ ] Sound files exist in `public/sounds/`: click.wav, beep.wav, pop.wav, nk-cream.wav, typewriter.wav, error-beep.wav, error-damage.wav, complete.wav

---

**Total manual test items: ~120 checks across 6 categories**
