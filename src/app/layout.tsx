import type { Metadata } from 'next'
import { Caveat, IBM_Plex_Mono, IBM_Plex_Sans, Unbounded } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { APP_NAME } from '@/lib/constants'
import './globals.css'

/** Poster / bunker titles — condensed, Cyrillic-ready */
const display = Unbounded({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-display',
  weight: ['500', '600', '700'],
})

/** Briefing body — utilitarian, less “SaaS” than Source Sans */
const sans = IBM_Plex_Sans({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700'],
})

const mono = IBM_Plex_Mono({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-geist-mono',
  weight: ['400', '500', '600'],
})

/** Notebook / dossier handwritten entries */
const hand = Caveat({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-hand',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: APP_NAME,
  description:
    'Мультиплеерная вечеринка на выживание: катастрофа, убежище, раскрытие характеристик и голосование.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ru"
      className={`dark ${display.variable} ${sans.variable} ${mono.variable} ${hand.variable} h-full`}
    >
      <body className="min-h-full bg-background font-sans text-foreground antialiased">
        <Toaster position="top-center" />
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  )
}
