/**
 * Supabase Client - SINGLE POINT OF CREATION
 * 
 * This is the ONLY file that should call createClient().
 * All other modules must import the client from here.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
    'Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file.'
  )
}

/**
 * The singleton Supabase client instance.
 * Use this for all database operations.
 * 
 * Note: Not using generic Database type to avoid strict typing issues.
 * Type assertions are used in repository files for now.
 * TODO: Generate proper types with `supabase gen types typescript`
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

/**
 * Helper to get the public schema explicitly.
 * Use this when you need to be explicit about schema access.
 */
export const publicSchema = () => supabase.schema('public')

export default supabase
