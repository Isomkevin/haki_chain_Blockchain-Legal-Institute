import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
const _geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

// const siteUrl = 'https://hakichain.co.ke'

const siteUrl = 'https://hakichain-blockchain-legal-institute.vercel.app/'
const siteName = 'HakiChain Blockchain Legal Institute'
const siteTitle = 'HakiChain | AI x Blockchain-Powered Legal Platform'
const siteDescription =
  'HakiChain connects lawyers, NGOs, and donors with blockchain-backed legal bounties, milestone-based escrow, and AI assistants tailored for African justice systems.'
const siteKeywords = [
  'HakiChain',
  'legal tech',
  'blockchain escrow',
  'legal bounties',
  'AI legal assistant',
  'lawyer marketplace',
  'Kenya legal technology',
  'legal project management',
  'Supabase',
  'smart contracts',
]

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  keywords: siteKeywords,
  generator: 'v0.app',
  applicationName: siteName,
  authors: [{ name: siteName, url: siteUrl }],
  creator: siteName,
  publisher: siteName,
  category: 'technology',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName,
    title: siteTitle,
    description: siteDescription,
    images: [
      {
        url: `${siteUrl}/hakichain-logo.png`,
        width: 1200,
        height: 630,
        alt: 'HakiChain Legal Platform Preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@hakichain',
    creator: '@hakichain',
    title: siteTitle,
    description: siteDescription,
    images: [`${siteUrl}/placeholder-logo.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      maxSnippet: -1,
      maxImagePreview: 'large',
      maxVideoPreview: -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
  manifest: '/site.webmanifest',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0b1120' },
    { media: '(prefers-color-scheme: dark)', color: '#0b1120' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${_geist.className} ${_geistMono.className} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
