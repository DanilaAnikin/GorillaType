import { TypingTest } from '@/components/typing/typing-test';

/**
 * Homepage - Main typing test interface.
 * This is the primary entry point where users can take typing tests.
 */
export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-16rem)]">
        {/* Typing Test Component */}
        <TypingTest
          className="w-full"
          showResults={true}
        />

        {/* Keyboard Shortcuts Hint */}
        <div className="mt-8 text-center text-sm text-sub">
          <p>
            <kbd className="px-2 py-1 bg-sub-alt rounded text-xs">Tab</kbd>
            {' + '}
            <kbd className="px-2 py-1 bg-sub-alt rounded text-xs">Enter</kbd>
            {' to restart'}
          </p>
          <p className="mt-2">
            <kbd className="px-2 py-1 bg-sub-alt rounded text-xs">Esc</kbd>
            {' to reset'}
          </p>
        </div>
      </div>
    </div>
  );
}
