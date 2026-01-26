/**
 * Not Found Page
 * 404 error page
 */

import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <main className="flex-center" style={{ minHeight: 'calc(100vh - 200px)', padding: 'var(--space-8)' }}>
      <div className="text-center">
        <h1 style={{ fontSize: 'var(--text-6xl)', color: 'var(--gray-300)' }}>404</h1>
        <h2 style={{ marginBottom: 'var(--space-4)' }}>Page Not Found</h2>
        <p className="text-secondary" style={{ marginBottom: 'var(--space-6)' }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="btn btn-primary">
          Go Home
        </Link>
      </div>
    </main>
  )
}
