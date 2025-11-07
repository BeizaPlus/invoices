import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Invoice Generator',
  description: 'Professional invoice generation system with API support',
  keywords: ['invoice', 'billing', 'accounting', 'PDF', 'API'],
  authors: [{ name: 'Invoice Generator Team' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
  openGraph: {
    title: 'Invoice Generator',
    description: 'Professional invoice generation system with API support',
    type: 'website',
    locale: 'en_US',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#ef4444" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <div id="root">
          {children}
        </div>
        <div id="modals" />
      </body>
    </html>
  )
}
