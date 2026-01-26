/**
 * Stats Card Component
 * Dashboard statistics display
 */

interface StatsCardProps {
  title: string
  value: string | number
  icon?: React.ReactNode
  trend?: {
    value: number
    label: string
    positive?: boolean
  }
  variant?: 'default' | 'primary' | 'accent' | 'environmental' | 'social' | 'governance'
  className?: string
}

export function StatsCard({ 
  title, 
  value, 
  icon, 
  trend,
  variant = 'default',
  className = '' 
}: StatsCardProps) {
  return (
    <div className={`stats-card stats-card-${variant} ${className}`}>
      <div className="stats-card-header">
        <span className="stats-card-title">{title}</span>
        {icon && <span className="stats-card-icon">{icon}</span>}
      </div>
      <div className="stats-card-value">{value}</div>
      {trend && (
        <div className={`stats-card-trend ${trend.positive ? 'trend-positive' : 'trend-negative'}`}>
          {trend.positive ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="19" x2="12" y2="5" />
              <polyline points="5 12 12 5 19 12" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <polyline points="19 12 12 19 5 12" />
            </svg>
          )}
          <span>{trend.value}%</span>
          <span className="trend-label">{trend.label}</span>
        </div>
      )}
    </div>
  )
}

/**
 * Stats Grid Container
 */
interface StatsGridProps {
  children: React.ReactNode
  columns?: 2 | 3 | 4
  className?: string
}

export function StatsGrid({ children, columns = 4, className = '' }: StatsGridProps) {
  return (
    <div className={`stats-grid stats-grid-${columns} ${className}`}>
      {children}
    </div>
  )
}
