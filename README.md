# Gorilla Type

A modern, feature-rich typing test application built with Next.js 16 and React 19. Measure your typing speed, track your progress, compete with friends, and improve your skills.

![Gorilla Type](https://img.shields.io/badge/Gorilla-Type-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## Table of Contents

- [Description](#description)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Getting Started](#getting-started)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Author](#author)
- [Links](#links)

---

## Description

Gorilla Type is a minimalist, customizable typing test application inspired by Monkeytype. It provides a comprehensive suite of tools for typists of all levels: timed and word-count tests, quote typing, a zen mode for pressure-free practice, and a smart practice mode that targets your weaknesses. Beyond solo typing, Gorilla Type offers social features including a friends system, 1v1 challenges, clan support, tournaments, and multiplayer racing. A detailed analytics dashboard tracks your performance over time, and extensive customization options let you tailor the experience to your preferences.

---

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| **Next.js** | 16 | React framework with App Router |
| **React** | 19 | UI library |
| **TypeScript** | 5 (strict mode) | Type-safe JavaScript |
| **Supabase** | 2.x | PostgreSQL database, authentication, storage, realtime |
| **Zustand** | 5 | Lightweight state management |
| **Tailwind CSS** | 4 | Utility-first CSS framework |
| **Chart.js + react-chartjs-2** | 4.x / 5.x | Data visualization and statistics charts |
| **Howler.js** | 2.x | Audio playback for keystroke sounds |
| **Radix UI** | -- | Accessible UI primitives (dialog, dropdown, popover, select, slider, switch, tabs, tooltip) |
| **Vitest + React Testing Library** | 4.x / 16.x | Unit and component testing |
| **Lucide React** | -- | Icon library |
| **date-fns** | 4.x | Date utility functions |

---

## Features

### Core

- **Multiple test modes** -- time (15s, 30s, 60s, 120s), words (10, 25, 50, 100), quote, zen, and custom
- **Multiple languages** for typing tests
- **Real-time WPM and accuracy stats** displayed during the test
- **Live progress indicators** and consistency metrics

### Analytics

- Advanced analytics dashboard with WPM charts and accuracy trends
- Activity heatmap with configurable range (week, month, year, 500 days, max)
- Mode breakdown showing performance across different test types

### Practice

- Smart practice mode with automatic weakness detection
- Targeted word generation based on per-key error analysis
- Focused drills to improve problem areas

### Social

- Friends system with add, accept, and manage flows
- 1v1 challenges with automatic winner detection
- Clan system for group-based competition

### Competitive

- Tournament system (create, join, multiple rounds, leaderboard)
- Multiplayer racing with real-time updates
- Global leaderboards with daily, weekly, and all-time rankings filtered by mode and duration

### Replay

- Full keystroke recording during tests
- Playback with adjustable speed control (0.5x to 4x)

### Notifications

- Real-time notification center
- Mark-as-read support for managing alerts

### Profile

- Activity heatmap on user profiles
- Badge showcase with bronze, silver, and gold tiers
- Social sharing of results and achievements

### Customization

- 30+ built-in themes (dark and light variants, high contrast options)
- Custom theme builder for creating your own color schemes
- Multiple caret styles with smooth animation
- Sound schemes with adjustable volume and multiple sound packs
- Typography settings (font family and size)

### Accessibility

- WCAG 2.1 AA compliance
- Skip links for keyboard navigation
- Screen reader announcements via a dedicated SR announcer provider
- Reduced motion support

### Mobile

- Fully responsive design
- Bottom navigation bar for mobile devices
- Touch-optimized interface

---

## Getting Started

### Prerequisites

- **Node.js** 18.0 or higher
- **npm** (included with Node.js)
- A **Supabase** project ([supabase.com](https://supabase.com))

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/DanilaAnikin/GorillaType.git
   cd GorillaType
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables by creating a `.env.local` file in the project root:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

   You can find these values in your Supabase dashboard under Project Settings > API.

4. Run database migrations:

   ```bash
   supabase db push
   ```

   Alternatively, apply the SQL migration files located in `supabase/migrations/` manually through the Supabase SQL editor.

5. Start the development server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm run start
```

---

## Testing

Gorilla Type uses Vitest and React Testing Library for its test suite (490 tests).

| Command | Description |
|---|---|
| `npm test` | Run the full test suite |
| `npm run test:coverage` | Run tests and generate a coverage report |
| `npm run test:ui` | Open the Vitest UI for interactive test exploration |

---

## Project Structure

```
gorilla-type/
├── public/                     # Static assets
│   └── sounds/                 # Keystroke sound files
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Authentication routes (login, signup)
│   │   ├── (protected)/        # Routes requiring authentication (account, settings)
│   │   ├── api/                # API routes (auth, results, clans, chat)
│   │   ├── about/              # About page
│   │   ├── clans/              # Clans pages
│   │   ├── friends/            # Friends page
│   │   ├── leaderboards/       # Leaderboard pages
│   │   ├── multiplayer/        # Multiplayer racing
│   │   ├── profile/            # User profile pages
│   │   ├── tournaments/        # Tournament pages
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Home page (typing test)
│   ├── components/             # React components
│   │   ├── analytics/          # Analytics dashboard and charts
│   │   ├── auth/               # Authentication forms
│   │   ├── challenges/         # 1v1 challenge components
│   │   ├── chat/               # Chat system components
│   │   ├── clans/              # Clan management components
│   │   ├── friends/            # Friends list and management
│   │   ├── layout/             # Header, footer, mobile nav, command palette
│   │   ├── leaderboard/        # Leaderboard display
│   │   ├── multiplayer/        # Multiplayer racing components
│   │   ├── notifications/      # Notification center
│   │   ├── practice/           # Smart practice mode
│   │   ├── profile/            # Profile display and badges
│   │   ├── replay/             # Keystroke replay player
│   │   ├── results/            # Results screen, charts, sharing
│   │   ├── settings/           # Settings panels (themes, caret, sound, typography)
│   │   ├── tournaments/        # Tournament system
│   │   ├── typing/             # Core typing test (word display, caret, live stats)
│   │   └── ui/                 # Reusable UI primitives (skip link, SR announcer)
│   ├── lib/                    # Shared libraries
│   │   ├── api/                # API client utilities
│   │   ├── hooks/              # Custom React hooks (sound, etc.)
│   │   ├── supabase/           # Supabase client configuration
│   │   └── utils/              # General utilities (word generator, keyboard layouts)
│   ├── store/                  # Zustand state stores
│   │   ├── config-store.ts     # User configuration (theme, caret, sound)
│   │   ├── typing-store.ts     # Typing test state
│   │   ├── results-store.ts    # Test results
│   │   ├── user-store.ts       # User session and profile
│   │   ├── ui-store.ts         # UI state (modals, panels)
│   │   └── notifications-store.ts  # Notification state
│   ├── test/                   # Test setup and utilities
│   ├── types/                  # TypeScript type definitions
│   └── middleware.ts           # Next.js middleware (auth guards)
├── supabase/
│   └── migrations/             # Database migration files
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

---

## Author

**D.S. Anikin**

---

## Links

- **GitHub**: [https://github.com/DanilaAnikin/GorillaType/](https://github.com/DanilaAnikin/GorillaType/)

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by [Monkeytype](https://monkeytype.com)
- Built with [Next.js](https://nextjs.org)
- Powered by [Supabase](https://supabase.com)
