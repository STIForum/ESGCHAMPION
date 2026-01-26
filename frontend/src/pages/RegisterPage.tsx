/**
 * Register Page
 * Champion registration form
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { useToast } from '@/components'

interface FormData {
  first_name: string
  last_name: string
  company: string
  job_title: string
  email: string
  password: string
  confirm_password: string
  mobile_number: string
  office_phone: string
  linkedin_url: string
  website: string
  competence_level: string
  esg_contributions: string
  primary_sector: string
  agree_terms: boolean
  agree_privacy: boolean
}

const initialFormData: FormData = {
  first_name: '',
  last_name: '',
  company: '',
  job_title: '',
  email: '',
  password: '',
  confirm_password: '',
  mobile_number: '',
  office_phone: '',
  linkedin_url: '',
  website: '',
  competence_level: '',
  esg_contributions: '',
  primary_sector: '',
  agree_terms: false,
  agree_privacy: false,
}

const SECTORS = [
  { value: 'agriculture', label: 'Agriculture, Forestry & Fishing' },
  { value: 'automotive', label: 'Automotive & Transport' },
  { value: 'aviation', label: 'Aviation & Aerospace' },
  { value: 'banking', label: 'Banking & Financial Services' },
  { value: 'construction', label: 'Construction & Real Estate' },
  { value: 'creative', label: 'Creative Industries' },
  { value: 'defense', label: 'Defense & Security' },
  { value: 'education', label: 'Education & Training' },
  { value: 'energy', label: 'Energy & Utilities' },
  { value: 'engineering', label: 'Engineering & Manufacturing' },
  { value: 'environmental', label: 'Environmental Services' },
  { value: 'food', label: 'Food & Beverage' },
  { value: 'government', label: 'Government & Public Services' },
  { value: 'healthcare', label: 'Healthcare & Pharmaceuticals' },
  { value: 'it', label: 'Information Technology' },
  { value: 'legal', label: 'Legal & Professional Services' },
  { value: 'logistics', label: 'Logistics & Supply Chain' },
  { value: 'marine', label: 'Marine & Maritime' },
  { value: 'mining', label: 'Mining & Quarrying' },
  { value: 'nonprofit', label: 'Non-Profit & NGOs' },
  { value: 'retail', label: 'Retail & E-commerce' },
  { value: 'telecom', label: 'Telecommunications' },
  { value: 'tourism', label: 'Tourism, Leisure & Hospitality' },
  { value: 'transport', label: 'Transport & Infrastructure' },
  { value: 'venture', label: 'Venture Capital & Private Equity' },
]

const COMPETENCE_LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' },
]

export function RegisterPage() {
  const { signUp, signInWithLinkedIn, isLoading } = useAuth()
  const { showToast } = useToast()
  
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (formData.password !== formData.confirm_password) {
      showToast('Passwords do not match', 'error')
      return
    }

    if (formData.password.length < 8) {
      showToast('Password must be at least 8 characters', 'error')
      return
    }

    if (!formData.agree_terms || !formData.agree_privacy) {
      showToast('Please accept the terms and privacy policy', 'error')
      return
    }

    setIsSubmitting(true)
    try {
      await signUp({
        email: formData.email,
        password: formData.password,
        fullName: `${formData.first_name} ${formData.last_name}`,
        company: formData.company,
        jobTitle: formData.job_title,
        claAccepted: formData.agree_terms,
        ndaAccepted: formData.agree_privacy,
      })
      
      setShowSuccess(true)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Registration failed'
      showToast(message, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLinkedInRegister = async () => {
    try {
      await signInWithLinkedIn()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'LinkedIn registration failed'
      showToast(message, 'error')
    }
  }

  if (showSuccess) {
    return (
      <main className="auth-page">
        <div className="auth-card animate-fade-in">
          <div className="success-message">
            <div className="success-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h2>Registration Successful!</h2>
            <p style={{ color: 'var(--gray-500)', marginBottom: 'var(--space-6)' }}>
              Please check your email to verify your account.
            </p>
            <Link to="/champion-login" className="btn btn-primary">
              Go to Login
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="auth-page">
      <div className="auth-card animate-fade-in" style={{ maxWidth: '720px' }}>
        <div className="auth-header">
          <h1 className="auth-title">Become a Champion</h1>
          <p className="auth-subtitle">Join our community of sustainability experts</p>
        </div>

        {/* LinkedIn Register */}
        <button 
          type="button" 
          className="social-btn" 
          onClick={handleLinkedInRegister}
          disabled={isLoading}
        >
          <svg viewBox="0 0 24 24" fill="#0A66C2" width="20" height="20">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
          Continue with LinkedIn
        </button>

        <div className="divider">or register with email</div>

        <form onSubmit={handleSubmit}>
          {/* Section 1.1: Basic Information */}
          <div className="form-section">
            <h2 className="section-title">1.1 Basic Information</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="first_name">
                  First Name <span className="required">*</span>
                </label>
                <input 
                  type="text" 
                  id="first_name" 
                  name="first_name" 
                  className="form-input" 
                  placeholder="John"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="last_name">
                  Last Name <span className="required">*</span>
                </label>
                <input 
                  type="text" 
                  id="last_name" 
                  name="last_name" 
                  className="form-input" 
                  placeholder="Doe"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label" htmlFor="company">
                Company/Organization <span className="required">*</span>
              </label>
              <input 
                type="text" 
                id="company" 
                name="company" 
                className="form-input" 
                placeholder="Your Company Ltd"
                value={formData.company}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label" htmlFor="job_title">
                Role/Designation <span className="required">*</span>
              </label>
              <input 
                type="text" 
                id="job_title" 
                name="job_title" 
                className="form-input" 
                placeholder="Sustainability Manager"
                value={formData.job_title}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Section 1.2: Contact Details */}
          <div className="form-section">
            <h2 className="section-title">1.2 Contact Details</h2>
            
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Business Email <span className="required">*</span>
              </label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                className="form-input" 
                placeholder="champion@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="password">
                  Password <span className="required">*</span>
                </label>
                <input 
                  type="password" 
                  id="password" 
                  name="password" 
                  className="form-input" 
                  placeholder="Min. 8 characters"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="confirm_password">
                  Confirm Password <span className="required">*</span>
                </label>
                <input 
                  type="password" 
                  id="confirm_password" 
                  name="confirm_password" 
                  className="form-input" 
                  placeholder="Repeat password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label" htmlFor="mobile_number">
                Mobile Number <span className="required">*</span>
              </label>
              <input 
                type="tel" 
                id="mobile_number" 
                name="mobile_number" 
                className="form-input" 
                placeholder="+44 123 456 7890"
                value={formData.mobile_number}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label" htmlFor="linkedin_url">
                LinkedIn Profile
              </label>
              <input 
                type="url" 
                id="linkedin_url" 
                name="linkedin_url" 
                className="form-input" 
                placeholder="https://linkedin.com/in/yourprofile"
                value={formData.linkedin_url}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Section 1.3: ESG Expertise */}
          <div className="form-section">
            <h2 className="section-title">1.3 ESG Expertise</h2>
            
            <div className="form-group">
              <label className="form-label" htmlFor="competence_level">
                Competence in ESG Reporting
              </label>
              <select 
                id="competence_level" 
                name="competence_level" 
                className="form-input"
                value={formData.competence_level}
                onChange={handleChange}
              >
                <option value="" disabled>Select your competence level</option>
                {COMPETENCE_LEVELS.map(level => (
                  <option key={level.value} value={level.value}>{level.label}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label" htmlFor="primary_sector">
                Primary Sector <span className="required">*</span>
              </label>
              <select 
                id="primary_sector" 
                name="primary_sector" 
                className="form-input"
                value={formData.primary_sector}
                onChange={handleChange}
                required
              >
                <option value="" disabled>Select primary sector</option>
                {SECTORS.map(sector => (
                  <option key={sector.value} value={sector.value}>{sector.label}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label" htmlFor="esg_contributions">
                Key ESG Contributions
              </label>
              <textarea 
                id="esg_contributions" 
                name="esg_contributions" 
                className="form-input" 
                rows={4} 
                placeholder="Highlight impactful projects, reporting experience, or certifications."
                value={formData.esg_contributions}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Agreements */}
          <div className="form-section" style={{ borderBottom: 'none' }}>
            <div className="agreement-box">
              <h4>Terms & Privacy</h4>
              <p>
                By registering, you agree to our terms of service and privacy policy.
              </p>
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  name="agree_terms"
                  checked={formData.agree_terms}
                  onChange={handleChange}
                  required
                />
                <span>I agree to the <Link to="/terms">Terms of Service</Link></span>
              </label>
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  name="agree_privacy"
                  checked={formData.agree_privacy}
                  onChange={handleChange}
                  required
                />
                <span>I agree to the <Link to="/privacy">Privacy Policy</Link></span>
              </label>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-full"
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting ? (
              <span className="loading-spinner" style={{ width: 20, height: 20 }} />
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/champion-login" style={{ color: 'var(--primary-600)', fontWeight: 600 }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
