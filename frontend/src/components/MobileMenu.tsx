/**
 * Mobile Menu Component
 * Slide-out menu for mobile navigation
 */

import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth'

interface NavItem {
  label: string
  href: string
  requiresAuth?: boolean
  adminOnly?: boolean
}

const allNavItems: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Dashboard', href: '/champion-dashboard', requiresAuth: true },
  { label: 'Panels', href: '/champion-panels', requiresAuth: true },
  { label: 'Rankings', href: '/ranking' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Profile', href: '/champion-profile', requiresAuth: true },
  { label: 'Admin Review', href: '/admin-review', adminOnly: true },
]

export function MobileMenu() {
  const location = useLocation()
  const { user, signOut } = useAuth()
  
  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/'
    return location.pathname.startsWith(href)
  }
  
  const handleClose = () => {
    document.body.classList.remove('mobile-menu-open')
  }
  
  const handleLinkClick = () => {
    handleClose()
  }
  
  const visibleItems = allNavItems.filter(item => {
    if (item.requiresAuth && !user) return false
    if (item.adminOnly && !user?.is_admin) return false
    return true
  })

  return (
    <div className="mobile-menu">
      <button className="mobile-menu-close" onClick={handleClose}>
        &times;
      </button>
      
      <ul className="mobile-nav-menu">
        {visibleItems.map((item) => (
          <li key={item.href}>
            <Link 
              to={item.href} 
              className={`mobile-nav-link ${isActive(item.href) ? 'active' : ''}`}
              onClick={handleLinkClick}
            >
              {item.label}
            </Link>
          </li>
        ))}
        
        <li className="mobile-nav-divider" />
        
        {user ? (
          <li>
            <button 
              type="button" 
              className="mobile-nav-link"
              onClick={() => {
                signOut()
                handleClose()
              }}
            >
              Sign Out
            </button>
          </li>
        ) : (
          <li>
            <Link 
              to="/champion-login" 
              className="mobile-nav-link"
              onClick={handleLinkClick}
            >
              Sign In
            </Link>
          </li>
        )}
      </ul>
    </div>
  )
}
