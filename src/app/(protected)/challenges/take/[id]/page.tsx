import { ChallengeTypingTest } from '@/components/challenges/challenge-typing-test';

export default async function ChallengeTakePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <ChallengeTypingTest challengeId={id} />
    </div>
  );
}
