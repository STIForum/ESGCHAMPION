/**
 * Card Component
 * Reusable card container
 */

interface CardProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'elevated' | 'outlined'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function Card({ 
  children, 
  className = '',
  variant = 'default',
  padding = 'md'
}: CardProps) {
  return (
    <div className={`card card-${variant} card-padding-${padding} ${className}`}>
      {children}
    </div>
  )
}

interface CardHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  className?: string
}

export function CardHeader({ title, subtitle, action, className = '' }: CardHeaderProps) {
  return (
    <div className={`card-header ${className}`}>
      <div className="card-header-content">
        <h3 className="card-title">{title}</h3>
        {subtitle && <p className="card-subtitle">{subtitle}</p>}
      </div>
      {action && <div className="card-header-action">{action}</div>}
    </div>
  )
}

export interface CardBodyProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export function CardBody({ children, className = '', style }: CardBodyProps) {
  return (
    <div className={`card-body ${className}`} style={style}>
      {children}
    </div>
  )
}

interface CardFooterProps {
  children: React.ReactNode
  className?: string
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div className={`card-footer ${className}`}>
      {children}
    </div>
  )
}
