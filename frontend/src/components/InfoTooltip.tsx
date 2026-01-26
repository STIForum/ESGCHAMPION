/**
 * Info Tooltip Component
 * Hover-based tooltip matching existing design
 */

interface InfoTooltipProps {
  content: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

export function InfoTooltip({ 
  content, 
  position = 'top',
  className = '' 
}: InfoTooltipProps) {
  return (
    <span className={`info-wrapper ${className}`}>
      <span className="info-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      </span>
      <span className={`info-popover info-popover-${position}`}>
        {content}
      </span>
    </span>
  )
}

/**
 * Form field label with optional tooltip
 */
interface LabelWithTooltipProps {
  label: string
  htmlFor?: string
  tooltip?: string
  required?: boolean
}

export function LabelWithTooltip({ 
  label, 
  htmlFor, 
  tooltip, 
  required 
}: LabelWithTooltipProps) {
  return (
    <label htmlFor={htmlFor} className="form-label">
      {label}
      {required && <span className="required-indicator">*</span>}
      {tooltip && <InfoTooltip content={tooltip} />}
    </label>
  )
}
