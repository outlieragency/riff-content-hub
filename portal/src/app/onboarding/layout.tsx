export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      className="min-h-screen bg-page text-text-primary antialiased"
      style={{ background: '#F5F0E5' }}
    >
      {children}
    </div>
  )
}
