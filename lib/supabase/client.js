import { createClient } from '@supabase/supabase-js'

// Create Supabase client for client-side operations
// Only create client on the client side
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = typeof window !== 'undefined' ? createClient(supabaseUrl, supabaseAnonKey) : null

// Auth helper functions
export const authHelpers = {
  // Sign up new user
  signUp: async (email, password, userData) => {
    if (!supabase) throw new Error('Supabase not initialized')
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: userData.firstName,
          last_name: userData.lastName,
          username: userData.username,
          full_name: `${userData.firstName} ${userData.lastName}`
        }
      }
    })
    return { data, error }
  },

  // Sign in user
  signIn: async (email, password) => {
    if (!supabase) throw new Error('Supabase not initialized')
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  // Sign out user
  signOut: async () => {
    if (!supabase) throw new Error('Supabase not initialized')
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Get current session
  getSession: async () => {
    if (!supabase) return { session: null, error: new Error('Supabase not initialized') }
    const { data: { session }, error } = await supabase.auth.getSession()
    return { session, error }
  },

  // Get current user
  getUser: async () => {
    if (!supabase) return { user: null, error: new Error('Supabase not initialized') }
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  // Listen for auth changes
  onAuthStateChange: (callback) => {
    if (!supabase) return { data: { subscription: { unsubscribe: () => {} } } }
    return supabase.auth.onAuthStateChange(callback)
  }
}