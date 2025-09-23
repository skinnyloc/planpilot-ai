"use client";

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import MainLayout from './MainLayout';
import { SignIn, SignUp } from '@clerk/nextjs';

// Simple auth form component
function SimpleAuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // For demo purposes, any email/password will work
    if (email && password) {
      // Save user profile data during sign up
      if (isSignUp) {
        const profileData = {
          email,
          firstName,
          lastName,
          username: ''
        };
        localStorage.setItem('demoProfile', JSON.stringify(profileData));
      } else {
        // For sign in, check if profile exists, if not create basic one
        const existingProfile = localStorage.getItem('demoProfile');
        if (!existingProfile) {
          const profileData = {
            email,
            firstName: '',
            lastName: '',
            username: ''
          };
          localStorage.setItem('demoProfile', JSON.stringify(profileData));
        }
      }

      setIsAuthenticated(true);
      localStorage.setItem('demoAuth', 'true');
    }
  };

  if (isAuthenticated || localStorage.getItem('demoAuth')) {
    return <MainLayout><DemoDashboard /></MainLayout>;
  }

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
            {isSignUp ? 'Create your account' : 'Sign in to access your business planning tools'}
          </p>
        </div>

        <div style={{
          backgroundColor: '#1a1a1a',
          border: '1px solid #333',
          borderRadius: '8px',
          padding: '24px'
        }}>
          <form onSubmit={handleSubmit}>
            {isSignUp && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#ccc' }}>
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #444',
                      borderRadius: '6px',
                      backgroundColor: '#333',
                      color: '#fff',
                      fontSize: '14px'
                    }}
                    placeholder="Enter your first name"
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#ccc' }}>
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #444',
                      borderRadius: '6px',
                      backgroundColor: '#333',
                      color: '#fff',
                      fontSize: '14px'
                    }}
                    placeholder="Enter your last name"
                  />
                </div>
              </>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#ccc' }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #444',
                  borderRadius: '6px',
                  backgroundColor: '#333',
                  color: '#fff',
                  fontSize: '14px'
                }}
                placeholder="Enter your email"
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#ccc' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #444',
                  borderRadius: '6px',
                  backgroundColor: '#333',
                  color: '#fff',
                  fontSize: '14px'
                }}
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#f59e0b',
                color: '#000',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                marginBottom: '16px'
              }}
            >
              {isSignUp ? 'Create Account' : 'Sign In'}
            </button>

            <div style={{ textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#f59e0b',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                {isSignUp
                  ? 'Already have an account? Sign in'
                  : "Don't have an account? Sign up"
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Demo dashboard component
function DemoDashboard() {
  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '16px', color: '#fafafa' }}>
        Welcome to Your Dashboard
      </h1>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
        marginTop: '20px'
      }}>
        {[
          { title: 'Business Ideas', desc: 'Explore and develop concepts', href: '/business-idea' },
          { title: 'Business Plans', desc: 'Create comprehensive plans', href: '/business-plans' },
          { title: 'Grant Proposals', desc: 'Submit applications', href: '/grant-proposals' },
          { title: 'Documents', desc: 'Manage your files', href: '/documents' }
        ].map((item) => (
          <a
            key={item.title}
            href={item.href}
            style={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '8px',
              padding: '20px',
              cursor: 'pointer',
              textDecoration: 'none',
              display: 'block',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#333';
              e.target.style.borderColor = '#f59e0b';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#1a1a1a';
              e.target.style.borderColor = '#333';
            }}
          >
            <h3 style={{ color: '#f59e0b', marginBottom: '8px', margin: '0 0 8px' }}>{item.title}</h3>
            <p style={{ color: '#ccc', fontSize: '14px', margin: 0 }}>{item.desc}</p>
          </a>
        ))}
      </div>
    </div>
  );
}

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

  // If Clerk is not configured, show simple auth form
  if (!isClerkConfigured || !isSignedIn) {
    return <SimpleAuthForm />;
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