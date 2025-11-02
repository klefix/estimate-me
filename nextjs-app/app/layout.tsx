import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/layout/ThemeProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Estimate Me - Planning Poker',
  description: 'Real-time planning poker for agile teams',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="cpt-obvious"
          enableSystem={false}
          themes={['cpt-obvious', 'neumorpheus', 'c64', 'dark']}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
