import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from 'sonner'
import MainLayout from '@/components/MainLayout'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'PlanPilot AI - Smart Business Planning',
  description: 'Generate professional business plans, proposals, and secure funding with AI-powered tools. Create winning grant proposals, business plans, and loan applications in minutes.',
  keywords: 'business plan generator, grant proposals, AI business planning, funding applications, loan applications, startup planning',
  author: 'PlanPilot AI',
  robots: 'index, follow',
  openGraph: {
    title: 'PlanPilot AI - Smart Business Planning',
    description: 'Generate professional business plans, proposals, and secure funding with AI-powered tools.',
    url: 'https://www.planpilotai.app',
    siteName: 'PlanPilot AI',
    type: 'website',
    images: [
      {
        url: 'https://www.planpilotai.app/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PlanPilot AI - Smart Business Planning',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PlanPilot AI - Smart Business Planning',
    description: 'Generate professional business plans, proposals, and secure funding with AI-powered tools.',
    images: ['https://www.planpilotai.app/og-image.png'],
  },
}

export default function RootLayout({ children }) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      afterSignOutUrl="/"
    >
      <html lang="en">
        <body className={inter.className}>
          <MainLayout>{children}</MainLayout>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  )
}