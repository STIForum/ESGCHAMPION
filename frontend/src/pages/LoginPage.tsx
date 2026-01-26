/**
 * Login Page
 * Champion authentication page
 */

import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { useToast } from '@/components'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signInWithEmail, signInWithLinkedIn, isLoading } = useAuth()
  const { showToast } = useToast()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const from = (location.state as { from?: string })?.from || '/champion-dashboard'

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      showToast('Please enter your email and password', 'error')
      return
    }

    setIsSubmitting(true)
    try {
      await signInWithEmail(email, password)
      showToast('Welcome back!', 'success')
      navigate(from, { replace: true })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Login failed'
      showToast(message, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLinkedInLogin = async () => {
    try {
      await signInWithLinkedIn()
      // LinkedIn OAuth will redirect, no need to navigate
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'LinkedIn login failed'
      showToast(message, 'error')
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card animate-fade-in">
        <div className="auth-header">
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to continue your journey</p>
        </div>

        {/* LinkedIn Login */}
        <button 
          type="button" 
          className="social-btn" 
          onClick={handleLinkedInLogin}
          disabled={isLoading}
        >
          <svg viewBox="0 0 24 24" fill="#0A66C2" width="20" height="20">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
          Continue with LinkedIn
        </button>

        <div className="divider">or</div>

        {/* Email Login Form */}
        <form onSubmit={handleEmailLogin}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input 
              type="email" 
              id="email" 
              className="form-input" 
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <div className="flex-between mb-2">
              <label className="form-label" htmlFor="password" style={{ marginBottom: 0 }}>
                Password
              </label>
              <Link 
                to="/forgot-password" 
                style={{ fontSize: 'var(--text-sm)', color: 'var(--primary-600)' }}
              >
                Forgot password?
              </Link>
            </div>
            <div className="input-wrapper">
              <input 
                type={showPassword ? 'text' : 'password'}
                id="password" 
                className="form-input" 
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button 
                type="button" 
                className="password-toggle" 
                aria-label="Toggle password visibility"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-full"
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting ? (
              <span className="loading-spinner" style={{ width: 20, height: 20 }} />
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/champion-register" style={{ color: 'var(--primary-600)', fontWeight: 600 }}>
              Create one
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
