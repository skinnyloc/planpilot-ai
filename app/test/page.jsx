'use client';

import { useState, useEffect } from 'react';

export default function TestPage() {
  const [status, setStatus] = useState('Loading...');
  const [supabaseStatus, setSupabaseStatus] = useState('Checking...');
  const [userStatus, setUserStatus] = useState('Checking...');

  useEffect(() => {
    setStatus('React is working!');

    // Test Supabase connection
    const testSupabase = async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        console.log('Supabase URL:', supabaseUrl);
        console.log('Supabase Key exists:', !!supabaseKey);

        if (!supabaseUrl || !supabaseKey) {
          setSupabaseStatus('❌ Missing Supabase credentials');
          return;
        }

        // Try to import supabase
        const { supabase } = await import('../../src/lib/supabase.js');
        const { data, error } = await supabase.from('profiles').select('count').limit(1);

        if (error) {
          setSupabaseStatus(`❌ Supabase Error: ${error.message}`);
        } else {
          setSupabaseStatus('✅ Supabase connection working!');
        }
      } catch (error) {
        setSupabaseStatus(`❌ Supabase Error: ${error.message}`);
        console.error('Supabase test failed:', error);
      }
    };

    // Test user hook
    const testUser = async () => {
      try {
        // For now, just check if Clerk's useUser is available
        const { useUser } = await import('@clerk/clerk-react');
        setUserStatus('✅ Clerk user hook available');
      } catch (error) {
        setUserStatus(`❌ User hook error: ${error.message}`);
        console.error('User hook test failed:', error);
      }
    };

    testSupabase();
    testUser();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">System Status Test</h1>

        <div className="space-y-3">
          <div>
            <strong>React:</strong> {status}
          </div>

          <div>
            <strong>Supabase:</strong> {supabaseStatus}
          </div>

          <div>
            <strong>User Hook:</strong> {userStatus}
          </div>

          <div>
            <strong>Environment Variables:</strong>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>VITE_SUPABASE_URL: {import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</li>
              <li>VITE_SUPABASE_ANON_KEY: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</li>
              <li>VITE_OPENAI_API_KEY: {import.meta.env.VITE_OPENAI_API_KEY ? '✅ Set' : '❌ Missing'}</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="font-semibold text-blue-900">Debug Info</h2>
        <p className="text-blue-700 text-sm mt-1">
          If you can see this page, React is working. Check the status above for other components.
        </p>
      </div>
    </div>
  );
}