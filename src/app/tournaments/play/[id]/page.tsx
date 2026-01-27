import { TournamentTypingTest } from '@/components/tournaments/tournament-typing-test';

export default async function TournamentPlayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      <TournamentTypingTest tournamentId={id} />
    </div>
  );
}
