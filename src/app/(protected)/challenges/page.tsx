import { ChallengeList } from '@/components/challenges/challenge-list'

export default function ChallengesPage() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-color)' }}>
        Challenges
      </h1>
      <ChallengeList />
    </div>
  )
}
