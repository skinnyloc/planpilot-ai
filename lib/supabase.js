import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rultnsioetsnlpgjasmt.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1bHRuc2lvZXRzbmxwZ2phc210Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NTc4NTYsImV4cCI6MjA3MjUzMzg1Nn0.wU40BvwUBZYYEjPiruZEC9zYWmhdXgkQvhjHz1D5K_4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)