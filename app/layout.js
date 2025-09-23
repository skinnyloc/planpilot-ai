import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from 'sonner'
import MainLayout from '@/components/MainLayout'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'PlanPilot AI',
  description: 'Business planning platform',
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