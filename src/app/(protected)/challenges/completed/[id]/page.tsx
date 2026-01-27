import { CompletedChallengeDetail } from '@/components/challenges/completed-challenge-detail';

export default async function CompletedChallengePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <CompletedChallengeDetail challengeId={id} />
    </div>
  );
}
