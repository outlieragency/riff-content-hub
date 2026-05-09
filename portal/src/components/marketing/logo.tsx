import Link from 'next/link'

export function RiffMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <rect x="0.5" y="0.5" width="31" height="31" rx="7.5" fill="#FF6B35" />
      <rect
        x="0.5"
        y="0.5"
        width="31"
        height="31"
        rx="7.5"
        stroke="#1a0a04"
        strokeOpacity="0.25"
      />
      <path
        d="M9 22 L9 10 H17.5 C20 10 22 12 22 14.5 C22 16.6 20.6 18.4 18.6 18.9 L22.5 22 H19 L15.5 19 H12 V22 H9 Z M12 16.5 H17 C18.4 16.5 19 15.7 19 14.5 C19 13.3 18.4 12.5 17 12.5 H12 V16.5 Z"
        fill="#1a0a04"
      />
    </svg>
  )
}

export function RiffLogo({ small = false }: { small?: boolean }) {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2.5 no-underline text-[var(--rm-text)]"
    >
      <RiffMark size={small ? 24 : 28} />
      <span className="inline-flex flex-col leading-none">
        <span
          className="font-display font-extrabold tracking-[-0.04em]"
          style={{ fontSize: small ? 18 : 21 }}
        >
          Riff<span className="text-[var(--rm-accent)]">.</span>
        </span>
        <span
          className="font-mono uppercase mt-0.5 text-[var(--rm-muted-2)]"
          style={{ fontSize: 9.5, letterSpacing: '0.16em' }}
        >
          by Outlier Agency
        </span>
      </span>
    </Link>
  )
}
