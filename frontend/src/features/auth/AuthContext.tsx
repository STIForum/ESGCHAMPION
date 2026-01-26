/**
 * Auth Context
 * 
 * Provides authentication state throughout the app.
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { User as SupabaseUser, Session } from '@supabase/supabase-js'
import type { Champion } from '@/lib/supabase/types'
import { authService } from './service'
import type { AuthState, LoginCredentials, RegisterCredentials, AuthResult } from './types'

// Extended user type that includes champion properties
export interface User extends SupabaseUser {
  is_admin?: boolean
  name?: string
  full_name?: string
  company?: string
  sector?: string
  job_title?: string
  mobile_number?: string
  linkedin_url?: string
  website?: string
  esg_contributions?: string
  contribution_score?: number
  panels_completed?: number
  indicators_reviewed?: number
}

export interface AuthContextValue extends Omit<AuthState, 'user'> {
  user: User | null
  login: (credentials: LoginCredentials) => Promise<AuthResult>
  register: (credentials: RegisterCredentials) => Promise<AuthResult>
  logout: () => Promise<AuthResult>
  loginWithLinkedIn: () => Promise<AuthResult>
  refreshChampion: () => Promise<void>
  // Aliases for backwards compatibility
  signInWithEmail: (email: string, password: string) => Promise<AuthResult>
  signUp: (credentials: RegisterCredentials) => Promise<AuthResult>
  signOut: () => Promise<AuthResult>
  signInWithLinkedIn: () => Promise<AuthResult>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [champion, setChampion] = useState<Champion | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Merge supabase user with champion data
  const user: User | null = supabaseUser ? {
    ...supabaseUser,
    is_admin: champion?.is_admin ?? false,
    name: champion?.full_name ?? undefined,
    full_name: champion?.full_name ?? undefined,
    company: champion?.company ?? undefined,
    sector: undefined, // Not in champion type
    job_title: champion?.job_title ?? undefined,
    mobile_number: undefined, // Not in champion type  
    linkedin_url: champion?.linkedin_url ?? undefined,
    website: undefined, // Not in champion type
    esg_contributions: undefined, // Not in champion type
    contribution_score: champion?.credits ?? 0,
    panels_completed: 0, // Would need to query
    indicators_reviewed: champion?.total_reviews ?? 0,
  } : null

  useEffect(() => {
    // Get initial session
    const initAuth = async () => {
      try {
        const currentSession = await authService.getSession()
        setSession(currentSession)
        setSupabaseUser(currentSession?.user ?? null)
        
        if (currentSession?.user) {
          const championData = await authService.getChampion(currentSession.user.id)
          setChampion(championData)
        }
      } catch (error) {
        console.error('Auth init error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()

    // Listen for auth changes
    const unsubscribe = authService.onAuthStateChange(async (event, newSession) => {
      console.log('Auth state changed:', event)
      setSession(newSession)
      setSupabaseUser(newSession?.user ?? null)
      
      if (newSession?.user) {
        const championData = await authService.getChampion(newSession.user.id)
        setChampion(championData)
      } else {
        setChampion(null)
      }
    })

    return unsubscribe
  }, [])

  const login = async (credentials: LoginCredentials): Promise<AuthResult> => {
    const result = await authService.login(credentials)
    return result
  }

  const register = async (credentials: RegisterCredentials): Promise<AuthResult> => {
    const result = await authService.register(credentials)
    return result
  }

  const logout = async (): Promise<AuthResult> => {
    const result = await authService.logout()
    if (result.success) {
      setSupabaseUser(null)
      setSession(null)
      setChampion(null)
    }
    return result
  }

  const loginWithLinkedIn = async (): Promise<AuthResult> => {
    return authService.loginWithLinkedIn()
  }

  const refreshChampion = async () => {
    if (supabaseUser) {
      const championData = await authService.getChampion(supabaseUser.id)
      setChampion(championData)
    }
  }

  // Alias functions for backwards compatibility
  const signInWithEmail = async (email: string, password: string): Promise<AuthResult> => {
    return login({ email, password })
  }

  const signUp = register
  const signOut = logout
  const signInWithLinkedIn = loginWithLinkedIn
  const refreshUser = refreshChampion

  const value: AuthContextValue = {
    user,
    session,
    champion,
    isLoading,
    isAuthenticated: !!session,
    login,
    register,
    logout,
    loginWithLinkedIn,
    refreshChampion,
    // Aliases
    signInWithEmail,
    signUp,
    signOut,
    signInWithLinkedIn,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
