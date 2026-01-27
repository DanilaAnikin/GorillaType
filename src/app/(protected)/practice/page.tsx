import { SmartPractice } from '@/components/practice/smart-practice'

export default function PracticePage() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-color)' }}>
        Smart Practice
      </h1>
      <SmartPractice />
    </div>
  )
}
