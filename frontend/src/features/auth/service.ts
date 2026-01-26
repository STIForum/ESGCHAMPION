/**
 * Auth Service
 * 
 * Business logic for authentication.
 * Uses repository for data access.
 */

import { authRepository } from './repo.supabase'
import type { LoginCredentials, RegisterCredentials, AuthResult } from './types'
import type { Champion, ChampionInsert } from '@/lib/supabase/types'
import { normalizeError } from '@/lib/supabase/errors'

class AuthService {
  private repository = authRepository

  async getSession() {
    return this.repository.getSession()
  }

  onAuthStateChange(callback: (event: string, session: import('@supabase/supabase-js').Session | null) => void) {
    return this.repository.onAuthStateChange(callback)
  }

  async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      // Validate input
      if (!credentials.email || !credentials.password) {
        return { success: false, error: 'Email and password are required' }
      }

      const { user, session } = await this.repository.signIn(credentials)
      
      if (!user || !session) {
        return { success: false, error: 'Login failed' }
      }

      return { success: true, message: 'Login successful' }
    } catch (error) {
      const appError = normalizeError(error)
      return { success: false, error: appError.message }
    }
  }

  async register(credentials: RegisterCredentials): Promise<AuthResult> {
    try {
      // Validate input
      if (!credentials.email || !credentials.password) {
        return { success: false, error: 'Email and password are required' }
      }

      if (!credentials.fullName) {
        return { success: false, error: 'Full name is required' }
      }

      if (!credentials.claAccepted || !credentials.ndaAccepted) {
        return { success: false, error: 'You must accept the CLA and NDA' }
      }

      if (credentials.password.length < 8) {
        return { success: false, error: 'Password must be at least 8 characters' }
      }

      const { user } = await this.repository.signUp(credentials)
      
      if (!user) {
        return { success: false, error: 'Registration failed' }
      }

      return { 
        success: true, 
        message: 'Registration successful! Please check your email to confirm your account.' 
      }
    } catch (error) {
      const appError = normalizeError(error)
      return { success: false, error: appError.message }
    }
  }

  async logout(): Promise<AuthResult> {
    try {
      await this.repository.signOut()
      return { success: true, message: 'Logged out successfully' }
    } catch (error) {
      const appError = normalizeError(error)
      return { success: false, error: appError.message }
    }
  }

  async loginWithLinkedIn(): Promise<AuthResult> {
    try {
      await this.repository.signInWithLinkedIn()
      return { success: true }
    } catch (error) {
      const appError = normalizeError(error)
      return { success: false, error: appError.message }
    }
  }

  async getChampion(userId: string): Promise<Champion | null> {
    try {
      return await this.repository.getChampion(userId)
    } catch (error) {
      console.error('Error getting champion:', error)
      return null
    }
  }

  async updateChampion(userId: string, updates: Partial<ChampionInsert>): Promise<Champion | null> {
    try {
      return await this.repository.updateChampion(userId, updates)
    } catch (error) {
      console.error('Error updating champion:', error)
      return null
    }
  }

  async resetPassword(email: string): Promise<AuthResult> {
    if (!email) {
      return { success: false, error: 'Email is required' }
    }
    return this.repository.resetPassword(email)
  }

  async updatePassword(newPassword: string): Promise<AuthResult> {
    if (!newPassword || newPassword.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters' }
    }
    return this.repository.updatePassword(newPassword)
  }
}

// Export singleton
export const authService = new AuthService()
