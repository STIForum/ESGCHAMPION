/**
 * Button Component
 * Reusable button with variants
 */

import { forwardRef } from 'react'
import { Link } from 'react-router-dom'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { 
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      disabled,
      children,
      className = '',
      ...props 
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={`btn btn-${variant} btn-${size} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <span className="loading-spinner" style={{ width: 16, height: 16 }} />
        ) : (
          <>
            {icon && iconPosition === 'left' && <span className="btn-icon">{icon}</span>}
            {children}
            {icon && iconPosition === 'right' && <span className="btn-icon">{icon}</span>}
          </>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

/**
 * Link styled as button
 */
interface LinkButtonProps {
  to: string
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  children: React.ReactNode
  className?: string
}

export function LinkButton({
  to,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  children,
  className = '',
}: LinkButtonProps) {
  return (
    <Link to={to} className={`btn btn-${variant} btn-${size} ${className}`}>
      {icon && iconPosition === 'left' && <span className="btn-icon">{icon}</span>}
      {children}
      {icon && iconPosition === 'right' && <span className="btn-icon">{icon}</span>}
    </Link>
  )
}
