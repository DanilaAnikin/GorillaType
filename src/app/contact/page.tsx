import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Github,
  MessageSquare,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';
import { ContactForm } from './contact-form';

export const metadata: Metadata = {
  title: 'Contact - Gorilla Type',
  description:
    'Get in touch with the Gorilla Type team. Find our contact information, GitHub repository, and ways to reach out.',
};

/**
 * Contact card component.
 */
interface ContactCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  linkLabel: string;
  external?: boolean;
}

function ContactCard({ icon, title, description, href, linkLabel, external }: ContactCardProps) {
  const LinkComponent = external ? 'a' : Link;
  const linkProps = external
    ? { href, target: '_blank', rel: 'noopener noreferrer' }
    : { href };

  return (
    <div className="bg-sub-alt rounded-lg p-6 hover:bg-sub-alt/80 transition-colors">
      <div className="w-12 h-12 bg-main/10 rounded-lg flex items-center justify-center mb-4 text-main">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-text mb-2">{title}</h3>
      <p className="text-sm text-sub mb-4">{description}</p>
      <LinkComponent
        {...linkProps}
        className="inline-flex items-center gap-2 text-sm text-main hover:underline transition-colors"
      >
        {linkLabel}
        {external && <ExternalLink className="w-3 h-3" />}
      </LinkComponent>
    </div>
  );
}

/**
 * Contact page - Contact form and project links.
 */
export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      {/* Back link */}
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-sub hover:text-text transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to typing
        </Link>
      </div>

      {/* Header */}
      <section className="text-center mb-16">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-main/10 rounded-2xl flex items-center justify-center">
            <MessageSquare className="w-10 h-10 text-main" />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-text mb-4">
          Contact
        </h1>
        <p className="text-xl text-sub max-w-2xl mx-auto">
          Have a question, suggestion, or found a bug? Send us a message
          or reach out through one of the channels below.
        </p>
      </section>

      {/* Contact Form */}
      <section className="mb-16">
        <ContactForm />
      </section>

      {/* Other Contact Channels */}
      <section className="mb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <ContactCard
            icon={<Github className="w-6 h-6" />}
            title="GitHub"
            description="Report issues, suggest features, or contribute to the project on GitHub."
            href="https://github.com/DanilaAnikin/GorillaType/"
            linkLabel="View Repository"
            external
          />
          <ContactCard
            icon={<MessageSquare className="w-6 h-6" />}
            title="GitHub Issues"
            description="Found a bug or have a feature request? Open an issue on our repository."
            href="https://github.com/DanilaAnikin/GorillaType/issues"
            linkLabel="Open an Issue"
            external
          />
        </div>
      </section>

      {/* Additional Info */}
      <section className="mb-16 bg-sub-alt rounded-2xl p-8 md:p-12 max-w-4xl mx-auto">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-text mb-4">Contributing</h2>
          <p className="text-sub max-w-2xl mx-auto mb-6">
            Gorilla Type is an open-source project. If you would like to contribute,
            check out our GitHub repository for guidelines on how to get started.
          </p>
          <a
            href="https://github.com/DanilaAnikin/GorillaType/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-main text-bg rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            <Github className="w-5 h-5" />
            View on GitHub
          </a>
        </div>
      </section>
    </div>
  );
}
