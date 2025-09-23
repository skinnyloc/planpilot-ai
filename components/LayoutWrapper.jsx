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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user is not signed in and not on sign-in/sign-up pages, show sign-in
  if (!isSignedIn && !pathname.includes('/sign-in') && !pathname.includes('/sign-up')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome to PlanPilot AI
            </h1>
            <p className="text-muted-foreground">
              Sign in to access your business planning tools
            </p>
          </div>
          <SignIn
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "bg-card border border-border shadow-lg",
                headerTitle: "text-foreground",
                headerSubtitle: "text-muted-foreground",
                socialButtonsBlockButton: "border border-border hover:bg-accent",
                formFieldInput: "bg-input border border-border text-foreground",
                formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90",
                footerActionLink: "text-primary hover:text-primary/80"
              }
            }}
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
          />
        </div>
      </div>
    );
  }

  // If user is signed in or on auth pages, use MainLayout
  if (isSignedIn) {
    return <MainLayout>{children}</MainLayout>;
  }

  // For sign-in/sign-up pages, render without MainLayout
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}