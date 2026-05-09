import Image from 'next/image'
import Link from 'next/link'

export function RiffMark({ size = 28 }: { size?: number }) {
  return (
    <Image
      src="/riff-logo.svg"
      alt="Riff"
      width={size}
      height={size}
      priority
      style={{ display: 'inline-block' }}
    />
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
