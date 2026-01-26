/**
 * Auth Repository Interface
 * 
 * Defines the contract for auth data access.
 * This allows swapping implementations without changing service code.
 */

import type { User, Session } from '@supabase/supabase-js'
import type { Champion, ChampionInsert } from '@/lib/supabase/types'
import type { LoginCredentials, RegisterCredentials, AuthResult } from './types'

export interface IAuthRepository {
  // Session management
  getSession(): Promise<Session | null>
  onAuthStateChange(callback: (event: string, session: Session | null) => void): () => void
  
  // Authentication
  signIn(credentials: LoginCredentials): Promise<{ user: User | null; session: Session | null }>
  signUp(credentials: RegisterCredentials): Promise<{ user: User | null; session: Session | null }>
  signOut(): Promise<void>
  signInWithLinkedIn(): Promise<void>
  
  // Password management
  resetPassword(email: string): Promise<AuthResult>
  updatePassword(newPassword: string): Promise<AuthResult>
  
  // Champion profile
  getChampion(userId: string): Promise<Champion | null>
  upsertChampion(champion: ChampionInsert): Promise<Champion>
  updateChampion(userId: string, updates: Partial<ChampionInsert>): Promise<Champion>
}
