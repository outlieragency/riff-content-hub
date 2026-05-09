import type { Metadata } from 'next'
import {
  IBM_Plex_Sans,
  IBM_Plex_Sans_Thai,
  Inter,
  Inter_Tight,
  Instrument_Serif,
  JetBrains_Mono,
} from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/layout/theme-provider'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
})

const interTight = Inter_Tight({
  variable: '--font-inter-tight',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
})

const ibmPlexSans = IBM_Plex_Sans({
  variable: '--font-ibm-plex-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
})

const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  variable: '--font-ibm-plex-sans-thai',
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

const instrumentSerif = Instrument_Serif({
  variable: '--font-instrument-serif',
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Riff — Turn YouTube outliers into your next viral post',
  description:
    'AI content tool by Outlier Agency that turns YouTube outliers into scripts, articles, reels, or carousels in your own voice — Thai-first.',
  openGraph: {
    title: 'Riff — Turn YouTube outliers into your next viral post',
    description:
      'AI content tool by Outlier Agency. Built by creators, for creators.',
    type: 'website',
    locale: 'th_TH',
    siteName: 'Riff',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Riff — Turn YouTube outliers into your next viral post',
    description: 'AI content tool by Outlier Agency.',
  },
}

const themeInitScript = `
(function() {
  try {
    var t = localStorage.getItem('theme') || 'light';
    var d = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (d) document.documentElement.classList.add('dark');
    document.documentElement.dataset.theme = d ? 'dark' : 'light';
  } catch (e) {}
})();
`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="th"
      className={`${inter.variable} ${interTight.variable} ${ibmPlexSans.variable} ${ibmPlexSansThai.variable} ${jetbrainsMono.variable} ${instrumentSerif.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <style>{`
          /* Bind Google Font CSS vars to font names referenced in marketing CSS */
          :root {
            --font-inter-tight-name: 'Inter Tight';
            --font-jetbrains-mono-name: 'JetBrains Mono';
          }
          .font-display { font-family: var(--font-inter-tight), 'Inter Tight', sans-serif !important; }
          .font-mono { font-family: var(--font-jetbrains-mono), 'JetBrains Mono', monospace !important; }
        `}</style>
      </head>
      <body className="min-h-full">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:bg-card focus:border focus:border-border focus:rounded-[8px] focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:shadow-md"
        >
          ข้ามไปยังเนื้อหาหลัก
        </a>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
