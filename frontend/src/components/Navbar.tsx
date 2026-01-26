/**
 * Navbar Component
 * Main navigation header matching existing design
 */

import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth'

interface NavItem {
  label: string
  href: string
  requiresAuth?: boolean
  adminOnly?: boolean
}

const publicNavItems: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Rankings', href: '/ranking' },
  { label: 'FAQ', href: '/faq' },
]

const authNavItems: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Dashboard', href: '/champion-dashboard', requiresAuth: true },
  { label: 'Panels', href: '/champion-panels', requiresAuth: true },
  { label: 'Rankings', href: '/ranking' },
]

const adminNavItems: NavItem[] = [
  { label: 'Admin Review', href: '/admin-review', adminOnly: true },
]

export function Navbar() {
  const location = useLocation()
  const { user, isLoading } = useAuth()
  
  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/'
    return location.pathname.startsWith(href)
  }

  const navItems = user ? [...authNavItems, ...adminNavItems] : publicNavItems

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="logo">
          <img src="/assets/images/logo1.png" alt="STIF Logo" className="logo-img" />
          <span className="logo-text">Sustainability Technology and Innovation Forum</span>
        </Link>
        
        <nav>
          <ul className="nav-menu">
            {navItems.map((item) => {
              // Skip admin-only items if user is not admin
              if (item.adminOnly && !user?.is_admin) return null
              
              return (
                <li key={item.href}>
                  <Link 
                    to={item.href} 
                    className={`nav-link ${isActive(item.href) ? 'active' : ''}`}
                  >
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
        
        <div className="nav-actions">
          {isLoading ? (
            <div className="loading-spinner" style={{ width: 20, height: 20 }} />
          ) : user ? (
            <UserMenu user={user} />
          ) : (
            <Link to="/champion-login" className="btn btn-primary">
              Sign In
            </Link>
          )}
        </div>
        
        <MobileMenuToggle />
      </div>
    </header>
  )
}

interface UserMenuProps {
  user: {
    name?: string
    email?: string
    is_admin?: boolean
  }
}

function UserMenu({ user }: UserMenuProps) {
  const { signOut } = useAuth()
  
  return (
    <div className="user-menu">
      <button className="user-menu-trigger" type="button">
        <span className="user-avatar">
          {user.name?.charAt(0).toUpperCase() || 'U'}
        </span>
        <span className="user-name">{user.name || 'User'}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      
      <div className="user-menu-dropdown">
        <Link to="/champion-profile" className="user-menu-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          Profile
        </Link>
        <Link to="/champion-dashboard" className="user-menu-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          Dashboard
        </Link>
        {user.is_admin && (
          <Link to="/admin-review" className="user-menu-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Admin Review
          </Link>
        )}
        <hr className="user-menu-divider" />
        <button type="button" className="user-menu-item" onClick={signOut}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Sign Out
        </button>
      </div>
    </div>
  )
}

function MobileMenuToggle() {
  const handleToggle = () => {
    document.body.classList.toggle('mobile-menu-open')
  }
  
  return (
    <button 
      className="mobile-menu-toggle" 
      aria-label="Toggle menu"
      onClick={handleToggle}
    >
      <span></span>
      <span></span>
      <span></span>
    </button>
  )
}
