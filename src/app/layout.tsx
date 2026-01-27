import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { MobileNav } from '@/components/layout/mobile-nav';
import { SkipLink } from '@/components/ui/skip-link';
import { SRAnnouncerProvider } from '@/components/ui/sr-announcer';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'gorilla-type | Typing Speed Test',
    template: '%s | gorilla-type',
  },
  description:
    'A minimalist, customizable typing test to measure and improve your typing speed and accuracy. Track your progress, compete on leaderboards, and become a better typist.',
  keywords: [
    'typing test',
    'typing speed',
    'wpm',
    'words per minute',
    'typing practice',
    'keyboard',
    'monkeytype alternative',
  ],
  authors: [{ name: 'gorilla-type' }],
  creator: 'gorilla-type',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://gorilla-type.com',
    siteName: 'gorilla-type',
    title: 'gorilla-type | Typing Speed Test',
    description:
      'A minimalist, customizable typing test to measure and improve your typing speed and accuracy.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'gorilla-type | Typing Speed Test',
    description:
      'A minimalist, customizable typing test to measure and improve your typing speed and accuracy.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="serika-dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <SkipLink />
        <Providers>
          <SRAnnouncerProvider>
            <Header />
            <main id="main-content" className="flex-1 pb-16 md:pb-0">{children}</main>
            <Footer />
            <MobileNav />
          </SRAnnouncerProvider>
        </Providers>
      </body>
    </html>
  );
}
