/**
 * Sidebar Component
 * Dashboard sidebar navigation
 */

import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth'

interface SidebarItem {
  label: string
  href: string
  icon: React.ReactNode
  adminOnly?: boolean
}

const DashboardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
)

const PanelsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
  </svg>
)

const RankingsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M8 6h13" />
    <path d="M8 12h13" />
    <path d="M8 18h13" />
    <path d="M3 6h.01" />
    <path d="M3 12h.01" />
    <path d="M3 18h.01" />
  </svg>
)

const ProfileIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

const InviteIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <line x1="20" y1="8" x2="20" y2="14" />
    <line x1="23" y1="11" x2="17" y2="11" />
  </svg>
)

const AdminIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
)

const sidebarItems: SidebarItem[] = [
  { label: 'Dashboard', href: '/champion-dashboard', icon: <DashboardIcon /> },
  { label: 'ESG Panels', href: '/champion-panels', icon: <PanelsIcon /> },
  { label: 'Rankings', href: '/ranking', icon: <RankingsIcon /> },
  { label: 'Profile', href: '/champion-profile', icon: <ProfileIcon /> },
  { label: 'Admin Review', href: '/admin-review', icon: <AdminIcon />, adminOnly: true },
]

interface SidebarProps {
  onInvitePeers?: () => void
}

export function Sidebar({ onInvitePeers }: SidebarProps) {
  const location = useLocation()
  const { user } = useAuth()
  
  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/')
  }
  
  const visibleItems = sidebarItems.filter(item => {
    if (item.adminOnly && !user?.is_admin) return false
    return true
  })

  return (
    <aside className="sidebar">
      <nav>
        <ul className="sidebar-nav">
          {visibleItems.map((item) => (
            <li key={item.href}>
              <Link 
                to={item.href} 
                className={`sidebar-link ${isActive(item.href) ? 'active' : ''}`}
              >
                {item.icon}
                {item.label}
              </Link>
            </li>
          ))}
          
          {onInvitePeers && (
            <li>
              <button
                type="button"
                className="sidebar-link"
                onClick={onInvitePeers}
              >
                <InviteIcon />
                Invite Peers
              </button>
            </li>
          )}
        </ul>
      </nav>
    </aside>
  )
}
