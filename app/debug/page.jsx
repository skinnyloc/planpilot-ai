'use client';

import { useUser } from '@clerk/clerk-react';

export default function DebugPage() {
  const { isLoaded, isSignedIn, user } = useUser();

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: 'white', color: 'black' }}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6" style={{ color: 'black' }}>🔍 Debug Information</h1>

        <div className="space-y-6">
          {/* Authentication Status */}
          <div className="bg-gray-100 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
            <div className="space-y-2">
              <div>Clerk Loaded: {isLoaded ? '✅ Yes' : '❌ No'}</div>
              <div>User Signed In: {isSignedIn ? '✅ Yes' : '❌ No'}</div>
              {user && (
                <div className="mt-4">
                  <h3 className="font-medium">User Details:</h3>
                  <div className="ml-4 mt-2 space-y-1">
                    <div>Email: {user.primaryEmailAddress?.emailAddress || 'Not available'}</div>
                    <div>First Name: {user.firstName || 'Not set'}</div>
                    <div>Last Name: {user.lastName || 'Not set'}</div>
                    <div>User ID: {user.id}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Environment Variables */}
          <div className="bg-gray-100 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
            <div className="space-y-2">
              <div>Clerk Key: {import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ? '✅ Set' : '❌ Missing'}</div>
              <div>Supabase URL: {import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</div>
              <div>Supabase Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</div>
              <div>OpenAI Key: {import.meta.env.VITE_OPENAI_API_KEY ? '✅ Set' : '❌ Missing'}</div>
            </div>
          </div>

          {/* Current URL Info */}
          <div className="bg-gray-100 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Current Page Info</h2>
            <div className="space-y-2">
              <div>Current URL: {window.location.href}</div>
              <div>Path: {window.location.pathname}</div>
              <div>Hash: {window.location.hash || 'None'}</div>
            </div>
          </div>

          {/* Local Storage */}
          <div className="bg-gray-100 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Local Storage (Demo Settings)</h2>
            <div className="space-y-2">
              <div>Demo Plan: {localStorage.getItem('demo_user_plan') || 'Not set'}</div>
              <div>Demo Status: {localStorage.getItem('demo_user_status') || 'Not set'}</div>
              <div>Demo Paid Features: {localStorage.getItem('demo_paid_features') || 'Not set'}</div>
            </div>
          </div>

          {/* Browser Info */}
          <div className="bg-gray-100 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Browser Info</h2>
            <div className="space-y-2">
              <div>User Agent: {navigator.userAgent}</div>
              <div>Screen Size: {window.screen.width}x{window.screen.height}</div>
              <div>Viewport: {window.innerWidth}x{window.innerHeight}</div>
            </div>
          </div>

          {/* Console Errors */}
          <div className="bg-red-50 p-4 rounded-lg border-2 border-red-200">
            <h2 className="text-xl font-semibold mb-4 text-red-800">Console Errors</h2>
            <p className="text-red-700">Check browser console (F12) for any JavaScript errors.</p>

            <div className="mt-4">
              <h3 className="font-medium text-red-800">Common Issues:</h3>
              <ul className="list-disc ml-6 mt-2 space-y-1 text-red-700">
                <li>CSS variables not loading properly</li>
                <li>Component import errors</li>
                <li>Route configuration issues</li>
                <li>Authentication state problems</li>
              </ul>
            </div>
          </div>

          {/* Navigation Test */}
          <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
            <h2 className="text-xl font-semibold mb-4 text-blue-800">Navigation Test</h2>
            <div className="space-y-2">
              <a href="/dashboard" className="block text-blue-600 hover:underline">→ Go to Dashboard</a>
              <a href="/business-idea" className="block text-blue-600 hover:underline">→ Go to Business Ideas</a>
              <a href="/test" className="block text-blue-600 hover:underline">→ Go to Test Page</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}