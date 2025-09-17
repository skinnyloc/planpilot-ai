import { createClient } from '@supabase/supabase-js'

// Handle both browser (Vite) and Node.js environments
const getEnvVar = (key, fallback) => {
  // Browser environment (Vite) - try multiple prefixes
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key] ||
           import.meta.env[`VITE_${key.replace('NEXT_PUBLIC_', '')}`] ||
           import.meta.env[`VITE_${key}`] ||
           fallback;
  }
  // Node.js environment
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || fallback;
  }
  return fallback;
};

const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL', 'https://rultnsioetsnlpgjasmt.supabase.co')
const supabaseAnonKey = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1bHRuc2lvZXRzbmxwZ2phc210Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NTc4NTYsImV4cCI6MjA3MjUzMzg1Nn0.wU40BvwUBZYYEjPiruZEC9zYWmhdXgkQvhjHz1D5K_4')

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Create service client for server-side operations
const serviceRoleKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1bHRuc2lvZXRzbmxwZ2phc210Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njk1Nzg1NiwiZXhwIjoyMDcyNTMzODU2fQ.9BxhPBq_HtQHA1UqYI9w3Jl5A0VLjEtG2T_vDkLXNPo')

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)