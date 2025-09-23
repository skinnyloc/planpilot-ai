import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import LayoutWrapper from '../components/LayoutWrapper'

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </body>
      </html>
    </ClerkProvider>
  )
}