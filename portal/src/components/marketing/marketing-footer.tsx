export function MarketingFooter() {
  return (
    <footer
      className="px-6 py-8"
      style={{ borderTop: '1px solid var(--rm-border)' }}
    >
      <div className="rm-container flex justify-between items-center flex-wrap gap-4">
        <div className="font-mono text-[var(--rm-muted-2)]" style={{ fontSize: 12 }}>
          Riff<span style={{ color: 'var(--rm-accent)' }}>.</span> by Outlier
          Agency · © 2026
        </div>
        <div className="flex gap-6">
          {[
            { label: 'Privacy', href: '#' },
            { label: 'Terms', href: '#' },
            { label: 'YouTube', href: 'https://youtube.com/@earthrati' },
            { label: 'Login', href: '/login' },
          ].map((t) => (
            <a
              key={t.label}
              href={t.href}
              className="no-underline text-[var(--rm-muted)] hover:text-[var(--rm-text)]"
              style={{ fontSize: 13 }}
            >
              {t.label}
            </a>
          ))}
        </div>
        <div
          className="font-mono text-[var(--rm-muted-2)]"
          style={{ fontSize: 11 }}
        >
          Built in BKK · v0.4.1
        </div>
      </div>
    </footer>
  )
}
