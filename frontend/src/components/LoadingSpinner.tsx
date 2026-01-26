/**
 * Loading Spinner Component
 */

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: { width: 16, height: 16 },
  md: { width: 24, height: 24 },
  lg: { width: 48, height: 48 },
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const dimensions = sizeMap[size]
  
  return (
    <div 
      className={`loading-spinner ${className}`}
      style={{ width: dimensions.width, height: dimensions.height }}
    />
  )
}

/**
 * Full page loading state
 */
export function LoadingPage() {
  return (
    <div className="flex-center" style={{ height: '400px' }}>
      <LoadingSpinner size="lg" />
    </div>
  )
}
