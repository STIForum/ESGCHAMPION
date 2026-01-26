/**
 * Modal Component
 * Reusable modal dialog
 */

import { useEffect, useRef } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showClose?: boolean
}

const sizeClasses = {
  sm: 'modal-sm',
  md: 'modal-md',
  lg: 'modal-lg',
  xl: 'modal-xl',
}

export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  showClose = true 
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div 
        ref={modalRef}
        className={`modal ${sizeClasses[size]}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {(title || showClose) && (
          <div className="modal-header">
            {title && <h2 id="modal-title" className="modal-title">{title}</h2>}
            {showClose && (
              <button 
                type="button" 
                className="modal-close"
                onClick={onClose}
                aria-label="Close modal"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        )}
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  )
}

/**
 * Modal with footer actions
 */
interface ModalWithActionsProps extends ModalProps {
  primaryAction?: {
    label: string
    onClick: () => void
    disabled?: boolean
    loading?: boolean
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
}

export function ModalWithActions({
  primaryAction,
  secondaryAction,
  children,
  ...props
}: ModalWithActionsProps) {
  return (
    <Modal {...props}>
      {children}
      {(primaryAction || secondaryAction) && (
        <div className="modal-footer">
          {secondaryAction && (
            <button 
              type="button"
              className="btn btn-secondary"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </button>
          )}
          {primaryAction && (
            <button 
              type="button"
              className="btn btn-primary"
              onClick={primaryAction.onClick}
              disabled={primaryAction.disabled || primaryAction.loading}
            >
              {primaryAction.loading ? (
                <span className="loading-spinner" style={{ width: 16, height: 16 }} />
              ) : (
                primaryAction.label
              )}
            </button>
          )}
        </div>
      )}
    </Modal>
  )
}
