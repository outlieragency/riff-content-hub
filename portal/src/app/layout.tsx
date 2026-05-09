import type { Metadata } from 'next'
import {
  IBM_Plex_Sans_Thai,
  Instrument_Serif,
} from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/layout/theme-provider'

const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  variable: '--font-ibm-plex-sans-thai',
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
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
  title: 'Riff — ลง content ทุกวัน ในเสียงคุณ ใน 5 นาที',
  description:
    'AI สำหรับ creator ไทย เปลี่ยน 1 YouTube video เป็น 4 โพสต์พร้อมลง (FB · IG · Reels · YT) ในเสียงคุณเอง ใน 5 นาที',
  openGraph: {
    title: 'Riff — ลง content ทุกวัน ในเสียงคุณ ใน 5 นาที',
    description:
      'AI สำหรับ creator ไทย โดย Outlier Agency ทำงานน้อยลง ได้ผลมากขึ้น',
    type: 'website',
    locale: 'th_TH',
    siteName: 'Riff',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Riff — ลง content ทุกวัน ในเสียงคุณ ใน 5 นาที',
    description: 'AI สำหรับ creator ไทย โดย Outlier Agency',
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
      className={`${ibmPlexSansThai.variable} ${instrumentSerif.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
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
