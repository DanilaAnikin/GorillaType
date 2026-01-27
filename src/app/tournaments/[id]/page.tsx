import { TournamentDetail } from '@/components/tournaments/tournament-detail';

export default async function TournamentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      <TournamentDetail tournamentId={id} />
    </div>
  );
}
