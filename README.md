# Gorilla Type

A modern, feature-rich typing test application inspired by Monkey Type. Built with Next.js and designed for speed enthusiasts who want to improve their typing skills.

![Gorilla Type](https://img.shields.io/badge/Gorilla-Type-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-14+-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

## Features

- **Multiple Test Modes**
  - Time Mode - Type against the clock (15s, 30s, 60s, 120s)
  - Words Mode - Complete a set number of words (10, 25, 50, 100)
  - Quote Mode - Type famous quotes and passages
  - Zen Mode - Practice without any pressure or limits

- **15 Beautiful Themes**
  - Dark and light variants
  - High contrast options
  - Custom color schemes for every preference

- **Real-time Statistics**
  - Words Per Minute (WPM) tracking
  - Accuracy percentage
  - Consistency metrics
  - Live progress indicators

- **Personal Bests & Statistics**
  - Track your improvement over time
  - Detailed performance analytics
  - Historical data visualization

- **Leaderboards**
  - Global rankings
  - Daily, weekly, and all-time boards
  - Filter by test mode and duration

- **User Profiles with Achievements**
  - Customizable profiles
  - Achievement badges
  - Progress milestones
  - Typing history

- **Multiplayer Racing Mode**
  - Real-time races with other users
  - Private rooms for friends
  - Competitive matchmaking

- **Sound Effects**
  - Satisfying keystroke sounds
  - Multiple sound packs
  - Adjustable volume

- **Customizable Settings**
  - Font family and size options
  - Smooth caret animations
  - Live WPM display toggle
  - And much more...

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **Next.js 14+** | React framework with App Router |
| **TypeScript** | Type-safe JavaScript |
| **Tailwind CSS** | Utility-first CSS framework |
| **Supabase** | Authentication, Database, Realtime subscriptions |
| **Zustand** | Lightweight state management |
| **Chart.js** | Statistics and data visualization |
| **Radix UI** | Accessible UI primitives |

## Getting Started

### Prerequisites

- Node.js 18.0 or higher
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/gorilla-type.git
   cd gorilla-type
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up Supabase project**

   - Go to [supabase.com](https://supabase.com) and create a new project
   - Wait for the project to be provisioned
   - Navigate to Project Settings > API to get your credentials

4. **Configure environment variables**

   Create a `.env.local` file in the root directory:

   ```bash
   cp .env.example .env.local
   ```

   Then fill in your Supabase credentials (see Environment Variables section below).

5. **Run database migrations**

   ```bash
   npm run db:migrate
   ```

6. **Start the development server**

   ```bash
   npm run dev
   ```

7. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

## Environment Variables

Create a `.env.local` file with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Database (if using direct connection)
DATABASE_URL=your_database_connection_string

# Optional: Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=your_google_analytics_id

# Optional: Error Tracking
SENTRY_DSN=your_sentry_dsn
```

> **Note:** Never commit your `.env.local` file to version control. It's already included in `.gitignore`.

## Project Structure

```
gorilla-type/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── (main)/            # Main application routes
│   ├── api/               # API routes
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── typing/           # Typing test components
│   ├── stats/            # Statistics components
│   └── multiplayer/      # Multiplayer components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions
│   ├── supabase/         # Supabase client & helpers
│   ├── utils/            # General utilities
│   └── constants/        # App constants
├── stores/                # Zustand state stores
├── types/                 # TypeScript type definitions
├── styles/                # Global styles & themes
├── public/                # Static assets
│   ├── sounds/           # Sound effect files
│   └── images/           # Image assets
├── supabase/              # Supabase configuration
│   └── migrations/       # Database migrations
└── tests/                 # Test files
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build production-ready application |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint for code quality |
| `npm run lint:fix` | Fix auto-fixable lint issues |
| `npm run type-check` | Run TypeScript compiler check |
| `npm run test` | Run test suite |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Generate test coverage report |
| `npm run db:migrate` | Run Supabase database migrations |
| `npm run db:reset` | Reset database (development only) |
| `npm run db:seed` | Seed database with sample data |
| `npm run format` | Format code with Prettier |

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting a pull request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by [Monkeytype](https://monkeytype.com)
- Built with [Next.js](https://nextjs.org)
- Powered by [Supabase](https://supabase.com)

---

Made with keyboard smashes and determination.
# GorillaType
