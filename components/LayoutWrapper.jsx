"use client";

import { useAuth } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import MainLayout from './MainLayout';
import { SignIn, SignUp } from '@clerk/nextjs';

export default function LayoutWrapper({ children }) {
  const { isSignedIn, isLoaded } = useAuth();
  const pathname = usePathname();

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