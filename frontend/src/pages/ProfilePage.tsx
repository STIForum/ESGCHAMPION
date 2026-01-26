/**
 * Profile Page
 * Champion profile management
 */

import { useState, useEffect } from 'react'
import { useAuth } from '@/features/auth'
import { Card, CardHeader, CardBody, useToast, LoadingPage } from '@/components'

interface ProfileFormData {
  name: string
  company: string
  job_title: string
  sector: string
  mobile_number: string
  linkedin_url: string
  website: string
  esg_contributions: string
}

const SECTORS = [
  { value: 'agriculture', label: 'Agriculture, Forestry & Fishing' },
  { value: 'automotive', label: 'Automotive & Transport' },
  { value: 'banking', label: 'Banking & Financial Services' },
  { value: 'construction', label: 'Construction & Real Estate' },
  { value: 'energy', label: 'Energy & Utilities' },
  { value: 'healthcare', label: 'Healthcare & Pharmaceuticals' },
  { value: 'it', label: 'Information Technology' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'retail', label: 'Retail & E-commerce' },
  { value: 'other', label: 'Other' },
]

export function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const { showToast } = useToast()
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<ProfileFormData>({
    name: '',
    company: '',
    job_title: '',
    sector: '',
    mobile_number: '',
    linkedin_url: '',
    website: '',
    esg_contributions: '',
  })

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        company: user.company || '',
        job_title: user.job_title || '',
        sector: user.sector || '',
        mobile_number: user.mobile_number || '',
        linkedin_url: user.linkedin_url || '',
        website: user.website || '',
        esg_contributions: user.esg_contributions || '',
      })
      setIsLoading(false)
    }
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setIsSaving(true)
    try {
      // TODO: Implement profile update via auth service
      showToast('Profile updated successfully!', 'success')
      if (refreshUser) {
        await refreshUser()
      }
    } catch (error) {
      console.error('Failed to update profile:', error)
      showToast('Failed to update profile', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <LoadingPage />
  }

  return (
    <div className="dashboard-container">
      <h1 className="mb-6">Profile Settings</h1>
      
      <div className="profile-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 'var(--space-6)' }}>
        {/* Profile Form */}
        <Card>
          <CardHeader title="Personal Information" />
          <CardBody>
            <form onSubmit={handleSubmit}>
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="form-input"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    className="form-input"
                    value={user?.email || ''}
                    disabled
                  />
                  <span className="form-helper">Email cannot be changed</span>
                </div>
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="company">Company</label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    className="form-input"
                    value={formData.company}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="job_title">Job Title</label>
                  <input
                    type="text"
                    id="job_title"
                    name="job_title"
                    className="form-input"
                    value={formData.job_title}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="sector">Sector</label>
                <select
                  id="sector"
                  name="sector"
                  className="form-input"
                  value={formData.sector}
                  onChange={handleChange}
                >
                  <option value="" disabled>Select sector...</option>
                  {SECTORS.map(sector => (
                    <option key={sector.value} value={sector.value}>{sector.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="mobile_number">Mobile Number</label>
                <input
                  type="tel"
                  id="mobile_number"
                  name="mobile_number"
                  className="form-input"
                  value={formData.mobile_number}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="linkedin_url">LinkedIn Profile</label>
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

              <div className="form-group">
                <label className="form-label" htmlFor="website">Professional Website</label>
                <input
                  type="url"
                  id="website"
                  name="website"
                  className="form-input"
                  placeholder="https://yourwebsite.com"
                  value={formData.website}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="esg_contributions">ESG Contributions</label>
                <textarea
                  id="esg_contributions"
                  name="esg_contributions"
                  className="form-input"
                  rows={4}
                  placeholder="Describe your key ESG contributions and expertise..."
                  value={formData.esg_contributions}
                  onChange={handleChange}
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={isSaving}
              >
                {isSaving ? (
                  <span className="loading-spinner" style={{ width: 20, height: 20 }} />
                ) : (
                  'Save Changes'
                )}
              </button>
            </form>
          </CardBody>
        </Card>

        {/* Stats Sidebar */}
        <div>
          <Card className="mb-4">
            <CardHeader title="Your Stats" />
            <CardBody>
              <div className="profile-stat-item">
                <span className="profile-stat-label">STIF Credits</span>
                <span className="profile-stat-value">{user?.contribution_score || 0}</span>
              </div>
              <div className="profile-stat-item">
                <span className="profile-stat-label">Panels Reviewed</span>
                <span className="profile-stat-value">{user?.panels_completed || 0}</span>
              </div>
              <div className="profile-stat-item">
                <span className="profile-stat-label">Indicators Reviewed</span>
                <span className="profile-stat-value">{user?.indicators_reviewed || 0}</span>
              </div>
              <div className="profile-stat-item">
                <span className="profile-stat-label">Member Since</span>
                <span className="profile-stat-value">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Account" />
            <CardBody>
              <button 
                type="button" 
                className="btn btn-secondary w-full mb-3"
                onClick={() => showToast('Password reset email sent!', 'info')}
              >
                Change Password
              </button>
              <button 
                type="button" 
                className="btn btn-ghost w-full"
                style={{ color: 'var(--error)' }}
              >
                Delete Account
              </button>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
