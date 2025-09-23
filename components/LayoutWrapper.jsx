"use client";

import { useAuth } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import MainLayout from './MainLayout';
import { SignIn, SignUp } from '@clerk/nextjs';

export default function LayoutWrapper({ children }) {
  const { isSignedIn, isLoaded } = useAuth();
  const pathname = usePathname();

  // Check if Clerk is properly configured
  const isClerkConfigured = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
                           process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== 'your_clerk_publishable_key_here';

  // Don't show loading state, let Clerk handle it
  if (!isLoaded) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0a0a0a'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '2px solid #f59e0b',
          borderTop: '2px solid transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // If Clerk is not configured, show setup message
  if (!isClerkConfigured) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0a0a0a',
        color: '#fafafa',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{ width: '100%', maxWidth: '500px', padding: '40px', textAlign: 'center' }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            marginBottom: '16px',
            background: 'linear-gradient(to right, #f59e0b, #fbbf24)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            PlanPilot AI Setup Required
          </h1>
          <div style={{
            backgroundColor: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '8px',
            padding: '24px',
            marginBottom: '24px',
            textAlign: 'left'
          }}>
            <h3 style={{ color: '#f59e0b', marginBottom: '16px', fontSize: '1.1rem' }}>
              🔧 Clerk Environment Variables Missing
            </h3>
            <p style={{ color: '#ccc', marginBottom: '16px', lineHeight: '1.5' }}>
              Please add these environment variables in your Vercel dashboard:
            </p>
            <div style={{
              backgroundColor: '#0a0a0a',
              padding: '16px',
              borderRadius: '4px',
              fontSize: '14px',
              fontFamily: 'monospace',
              color: '#fff',
              border: '1px solid #444'
            }}>
              NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...<br/>
              CLERK_SECRET_KEY=sk_test_...<br/>
              NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in<br/>
              NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up<br/>
              NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard<br/>
              NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
            </div>
            <p style={{ color: '#999', fontSize: '14px', marginTop: '12px' }}>
              Get your keys from: <span style={{ color: '#f59e0b' }}>https://dashboard.clerk.com</span>
            </p>
          </div>
          <div style={{
            backgroundColor: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '8px',
            padding: '16px'
          }}>
            <p style={{ color: '#ccc', fontSize: '14px', margin: 0 }}>
              After adding the environment variables, redeploy your site on Vercel.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If user is not signed in and not on sign-in/sign-up pages, show sign-in
  if (!isSignedIn && !pathname.includes('/sign-in') && !pathname.includes('/sign-up')) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0a0a0a',
        color: '#fafafa',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{ width: '100%', maxWidth: '400px', padding: '20px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              marginBottom: '8px',
              background: 'linear-gradient(to right, #f59e0b, #fbbf24)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Welcome to PlanPilot AI
            </h1>
            <p style={{ color: '#999', fontSize: '1rem' }}>
              Sign in to access your business planning tools
            </p>
          </div>
          <SignIn
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "shadow-lg rounded-lg border",
                cardBox: "shadow-lg",
                socialButtonsBlockButton: "border hover:bg-gray-50",
                formFieldInput: "border rounded-md",
                formButtonPrimary: "bg-orange-500 hover:bg-orange-600 text-white",
                footerActionLink: "text-orange-500 hover:text-orange-600"
              },
              variables: {
                colorPrimary: "#f59e0b",
                colorBackground: "#ffffff",
                colorText: "#000000"
              }
            }}
            signUpUrl="/sign-up"
            redirectUrl="/dashboard"
          />
        </div>
      </div>
    );
  }

  // If user is signed in, use MainLayout
  if (isSignedIn) {
    return <MainLayout>{children}</MainLayout>;
  }

  // For sign-in/sign-up pages, render with basic styling
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0a',
      color: '#fafafa'
    }}>
      {children}
    </div>
  );
}