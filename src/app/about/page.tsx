import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Keyboard,
  BarChart3,
  Trophy,
  Palette,
  Zap,
  Globe,
  Heart,
  Shield,
  Clock,
  Crown,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Learn about gorilla-type, a minimalist typing test application designed to help you improve your typing speed and accuracy.',
};

/**
 * Feature card component.
 */
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-sub-alt rounded-lg p-6 hover:bg-sub-alt/80 transition-colors">
      <div className="w-12 h-12 bg-main/10 rounded-lg flex items-center justify-center mb-4 text-main">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-text mb-2">{title}</h3>
      <p className="text-sm text-sub">{description}</p>
    </div>
  );
}

/**
 * About page - Project description, features, and credits.
 */
export default function AboutPage() {
  const features = [
    {
      icon: <Keyboard className="w-6 h-6" />,
      title: 'Multiple Test Modes',
      description:
        'Choose from timed tests, word counts, quotes, or zen mode. Customize your practice to match your goals.',
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Detailed Statistics',
      description:
        'Track your WPM, accuracy, consistency, and more. View charts and analyze your performance over time.',
    },
    {
      icon: <Trophy className="w-6 h-6" />,
      title: 'Global Leaderboards',
      description:
        'Compete with typists worldwide. See where you rank and challenge yourself to climb higher.',
    },
    {
      icon: <Palette className="w-6 h-6" />,
      title: 'Customizable Themes',
      description:
        'Choose from a variety of beautiful themes or create your own. Make your typing experience unique.',
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Real-time Feedback',
      description:
        'Get instant feedback on your typing with live WPM tracking, error highlighting, and smooth animations.',
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: 'Multiple Languages',
      description:
        'Practice typing in different languages with support for various character sets and word lists.',
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Privacy Focused',
      description:
        'Your data stays yours. We prioritize user privacy and only collect what is necessary.',
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: 'Progress Tracking',
      description:
        'Monitor your improvement over time with detailed history and personal best tracking.',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      {/* Hero Section */}
      <section className="text-center mb-16">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-main/10 rounded-2xl flex items-center justify-center">
            <Crown className="w-10 h-10 text-main" />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-text mb-4">
          gorilla-type
        </h1>
        <p className="text-xl text-sub max-w-2xl mx-auto mb-8">
          A minimalist, customizable typing test designed to help you measure
          and improve your typing speed and accuracy.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-main text-bg rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            <Keyboard className="w-5 h-5" />
            Start Typing
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-text text-center mb-8">
          Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-text text-center mb-8">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="w-16 h-16 bg-main/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-main">1</span>
            </div>
            <h3 className="text-lg font-semibold text-text mb-2">
              Choose Your Mode
            </h3>
            <p className="text-sm text-sub">
              Select a test mode, duration, and customize settings to match your
              practice goals.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-main/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-main">2</span>
            </div>
            <h3 className="text-lg font-semibold text-text mb-2">
              Start Typing
            </h3>
            <p className="text-sm text-sub">
              Begin typing when ready. Focus on accuracy first, then build up
              your speed over time.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-main/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-main">3</span>
            </div>
            <h3 className="text-lg font-semibold text-text mb-2">
              Track Progress
            </h3>
            <p className="text-sm text-sub">
              Review your results, analyze statistics, and watch your typing
              skills improve over time.
            </p>
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section className="mb-16 bg-sub-alt rounded-2xl p-8 md:p-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-text mb-4">Growing Community</h2>
          <p className="text-sub max-w-2xl mx-auto">
            Join our growing community of typists who are improving their skills every day.
            Practice at your own pace and track your personal progress.
          </p>
        </div>
      </section>

      {/* Credits */}
      <section className="text-center">
        <h2 className="text-2xl font-bold text-text mb-4">Credits</h2>
        <p className="text-sub mb-6 max-w-2xl mx-auto">
          gorilla-type is inspired by{' '}
          <a
            href="https://monkeytype.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-main hover:underline"
          >
            Monkeytype
          </a>
          , the popular typing test website. Built with love using Next.js,
          React, and Tailwind CSS.
        </p>
        <p className="flex items-center justify-center gap-2 text-sm text-sub">
          Made with <Heart className="w-4 h-4 text-error" /> by D.S. Anikin
        </p>
      </section>
    </div>
  );
}
