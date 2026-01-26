/**
 * Auth Repository - Supabase Implementation
 * 
 * Implements IAuthRepository using Supabase.
 */

import { supabase } from '@/lib/supabase/client'
import { Tables } from '@/lib/supabase/schema'
import type { Champion, ChampionInsert } from '@/lib/supabase/types'
import type { IAuthRepository } from './repo.interface'
import type { LoginCredentials, RegisterCredentials, AuthResult } from './types'

export class AuthRepository implements IAuthRepository {
  async getSession() {
    const { data: { session } } = await supabase.auth.getSession()
    return session
  }

  onAuthStateChange(callback: (event: string, session: import('@supabase/supabase-js').Session | null) => void) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(callback)
    return () => subscription.unsubscribe()
  }

  async signIn(credentials: LoginCredentials) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    })
    
    if (error) throw error
    return { user: data.user, session: data.session }
  }

  async signUp(credentials: RegisterCredentials) {
    const { data, error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        data: {
          full_name: credentials.fullName,
          company: credentials.company,
          job_title: credentials.jobTitle,
          linkedin_url: credentials.linkedinUrl,
          cla_accepted: credentials.claAccepted,
          nda_accepted: credentials.ndaAccepted,
        },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    })
    
    if (error) throw error
    return { user: data.user, session: data.session }
  }

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  async signInWithLinkedIn() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'linkedin_oidc',
      options: {
        redirectTo: `${window.location.origin}/linkedin-callback`,
      },
    })
    if (error) throw error
  }

  async resetPassword(email: string): Promise<AuthResult> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    
    if (error) {
      return { success: false, error: error.message }
    }
    return { success: true, message: 'Password reset email sent' }
  }

  async updatePassword(newPassword: string): Promise<AuthResult> {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    
    if (error) {
      return { success: false, error: error.message }
    }
    return { success: true, message: 'Password updated successfully' }
  }

  async getChampion(userId: string): Promise<Champion | null> {
    const { data, error } = await supabase
      .from(Tables.CHAMPIONS)
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data
  }

  async upsertChampion(champion: ChampionInsert): Promise<Champion> {
    const { data, error } = await supabase
      .from(Tables.CHAMPIONS)
      .upsert(champion, { onConflict: 'id' })
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  async updateChampion(userId: string, updates: Partial<ChampionInsert>): Promise<Champion> {
    const { data, error } = await supabase
      .from(Tables.CHAMPIONS)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

// Export singleton instance
export const authRepository = new AuthRepository()
