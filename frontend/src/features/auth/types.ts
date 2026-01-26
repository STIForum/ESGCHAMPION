/**
 * Auth Types
 */

import type { User, Session } from '@supabase/supabase-js'
import type { Champion } from '@/lib/supabase/types'

export interface AuthState {
  user: User | null
  session: Session | null
  champion: Champion | null
  isLoading: boolean
  isAuthenticated: boolean
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  email: string
  password: string
  fullName: string
  company?: string
  jobTitle?: string
  linkedinUrl?: string
  claAccepted: boolean
  ndaAccepted: boolean
}

export interface AuthResult {
  success: boolean
  message?: string
  error?: string
}
