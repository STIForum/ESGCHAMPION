/**
 * Protected Route Component
 * 
 * Redirects to login if user is not authenticated.
 */

import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { ReactNode } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
  requireAdmin?: boolean
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, champion } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    // Redirect to login, preserving the intended destination
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requireAdmin && !champion?.is_admin) {
    // Redirect non-admins to dashboard
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
