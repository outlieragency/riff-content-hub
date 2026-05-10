import { GenerateForm } from './generate-form'

export const dynamic = 'force-dynamic'

export default function GeneratePage() {
  return (
    <div className="min-h-screen px-4 sm:px-6 py-8 sm:py-12">
      <div className="max-w-[1200px] mx-auto">
        <header className="mb-8">
          <p className="text-2xs uppercase tracking-[0.18em] text-text-muted">
            Riff
          </p>
          <h1
            className="font-serif-display mt-2"
            style={{
              fontSize: 'clamp(28px, 4vw, 36px)',
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
            }}
          >
            FB cover generator
          </h1>
          <p className="text-sm text-text-muted mt-2 leading-relaxed">
            วาง YouTube URL — ได้ post copy + cover ในเสียงพี่เอิร์ธ
          </p>
        </header>

        <GenerateForm />
      </div>
    </div>
  )
}
