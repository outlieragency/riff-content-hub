import Link from 'next/link'

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="riff-marketing min-h-screen antialiased">
      {children}
      {/* Tiny escape link for logged-in users browsing the landing in preview mode */}
      <Link
        href="/today"
        className="fixed bottom-4 left-4 z-40 font-mono no-underline opacity-30 hover:opacity-100"
        style={{
          fontSize: 10,
          color: 'var(--rm-muted-2)',
          letterSpacing: '0.06em',
        }}
      >
        → app
      </Link>
    </div>
  )
}
