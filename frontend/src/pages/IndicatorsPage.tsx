/**
 * Indicators Page
 * Review and assess selected indicators with STIF Assessment Form
 */

import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { LoadingPage, useToast, InfoTooltip } from '@/components'
import { indicatorsService } from '@/features/indicators'
import { panelsService } from '@/features/panels'
import { reviewsService, type IndicatorAssessment } from '@/features/reviews'
import type { Indicator, Panel } from '@/lib/supabase/types'

const IMPACT_LEVELS = ['low', 'medium', 'high', 'very_high'] as const
const STAKEHOLDER_GROUPS = [
  'investors',
  'customers',
  'employees',
  'regulators',
  'communities',
  'suppliers',
] as const
const FREQUENCIES = ['annual', 'biannual', 'quarterly', 'monthly', 'continuous'] as const
const COST_ESTIMATES = ['minimal', 'low', 'moderate', 'high', 'very_high'] as const

interface IndicatorFormData {
  reviewStatus: 'important' | 'not_important' | null
  impactLevel: string
  stakeholderGroup: string
  frequencyOfDisclosure: string
  estimatedCostToCollect: string
  notes: string
}

const emptyFormData: IndicatorFormData = {
  reviewStatus: null,
  impactLevel: '',
  stakeholderGroup: '',
  frequencyOfDisclosure: '',
  estimatedCostToCollect: '',
  notes: '',
}

export function IndicatorsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const { showToast } = useToast()
  
  const panelId = searchParams.get('panel')
  const indicatorIds = searchParams.get('indicators')?.split(',') || []
  
  const [isLoading, setIsLoading] = useState(true)
  const [panel, setPanel] = useState<Panel | null>(null)
  const [indicators, setIndicators] = useState<Indicator[]>([])
  const [selectedIndicator, setSelectedIndicator] = useState<Indicator | null>(null)
  const [formData, setFormData] = useState<Map<string, IndicatorFormData>>(new Map())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  useEffect(() => {
    if (panelId && indicatorIds.length > 0) {
      loadData()
    } else {
      navigate('/champion-panels')
    }
  }, [panelId])

  const loadData = async () => {
    setIsLoading(true)
    try {
      // Load panel
      const panelData = await panelsService.getPanel(panelId!)
      setPanel(panelData)

      // Load selected indicators
      const allIndicators = await indicatorsService.getIndicatorsByPanel(panelId!)
      const selectedIndicators = allIndicators.filter(i => indicatorIds.includes(i.id))
      setIndicators(selectedIndicators)
      
      if (selectedIndicators.length > 0) {
        setSelectedIndicator(selectedIndicators[0])
      }
      
      // Initialize form data for each indicator
      const initialFormData = new Map<string, IndicatorFormData>()
      selectedIndicators.forEach(ind => {
        initialFormData.set(ind.id, { ...emptyFormData })
      })
      setFormData(initialFormData)
    } catch (error) {
      console.error('Failed to load data:', error)
      showToast('Failed to load indicators', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const updateFormData = (indicatorId: string, field: keyof IndicatorFormData, value: string | null) => {
    setFormData(prev => {
      const next = new Map(prev)
      const current = next.get(indicatorId) || { ...emptyFormData }
      next.set(indicatorId, { ...current, [field]: value })
      return next
    })
  }

  const isIndicatorComplete = (indicatorId: string): boolean => {
    const data = formData.get(indicatorId)
    if (!data) return false
    return data.reviewStatus !== null
  }

  const handleSubmitAll = async () => {
    if (!user?.id || !panel?.id) return

    // Validate all indicators have at least reviewStatus
    const incompleteCount = indicators.filter(i => !isIndicatorComplete(i.id)).length
    if (incompleteCount > 0) {
      showToast(`Please complete ${incompleteCount} remaining indicator(s)`, 'warning')
      return
    }

    setIsSubmitting(true)
    try {
      // Create submission
      const submission = await reviewsService.createSubmission(user.id, panel.id)
      
      // Prepare assessments
      const assessments: IndicatorAssessment[] = indicators.map(indicator => {
        const data = formData.get(indicator.id)!
        return {
          indicatorId: indicator.id,
          reviewStatus: data.reviewStatus || 'not_important',
          impactLevel: data.impactLevel || undefined,
          stakeholderGroup: data.stakeholderGroup || undefined,
          frequencyOfDisclosure: data.frequencyOfDisclosure || undefined,
          estimatedCostToCollect: data.estimatedCostToCollect || undefined,
          notes: data.notes || '',
          // Required fields with defaults
          sme_size_band: 'small',
          primary_sector: 'general',
          primary_framework: 'STIF',
          esg_class: panel?.esg_classification || 'Environment',
          sdgs: [],
          relevance: data.reviewStatus || 'not_important',
          regulatory_necessity: 'optional',
          operational_feasibility: 'medium',
          cost_to_collect: data.estimatedCostToCollect || 'medium',
          misreporting_risk: 'low',
          suggested_tier: 'recommended',
          rationale: data.notes || '',
          optional_tags: [],
        }
      })
      
      // Submit indicator reviews
      await reviewsService.submitIndicatorReviews(submission.id, user.id, assessments)
      
      setSubmitSuccess(true)
      showToast('Panel review submitted successfully!', 'success')
    } catch (error) {
      console.error('Failed to submit review:', error)
      showToast('Failed to submit review. Please try again.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <LoadingPage />
  }

  if (submitSuccess) {
    return (
      <main className="dashboard-layout">
        <div className="main-content">
          <div className="panel-review-success">
            <div className="success-icon">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h1 className="success-title">Panel Review Submitted!</h1>
            <p className="success-text">
              Thank you for your expert review of {panel?.name}. Your insights help shape
              the future of ESG reporting for SMEs worldwide.
            </p>
            <div className="success-badge">
              <span className="badge badge-primary" style={{ fontSize: 'var(--text-base)', padding: 'var(--space-3) var(--space-6)' }}>
                +{indicators.length * 10} STIF Credits Earned
              </span>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center' }}>
              <Link to="/champion-dashboard" className="btn btn-primary">
                Go to Dashboard
              </Link>
              <Link to="/champion-panels" className="btn btn-secondary">
                Review Another Panel
              </Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  const currentFormData = selectedIndicator ? formData.get(selectedIndicator.id) : null
  const completedCount = indicators.filter(i => isIndicatorComplete(i.id)).length

  return (
    <main className="dashboard-layout">
      {/* Sidebar - Indicator List */}
      <aside className="sidebar" style={{ width: '320px', background: 'white' }}>
        <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--gray-100)' }}>
          <h3 style={{ margin: 0 }}>{panel?.name}</h3>
          <p className="text-secondary" style={{ fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
            {completedCount} of {indicators.length} completed
          </p>
          <div 
            className="progress-bar" 
            style={{ 
              height: '4px', 
              background: 'var(--gray-200)', 
              borderRadius: '2px',
              marginTop: 'var(--space-2)',
              overflow: 'hidden'
            }}
          >
            <div 
              style={{ 
                width: `${(completedCount / indicators.length) * 100}%`,
                height: '100%',
                background: 'var(--primary-500)',
                transition: 'width 0.3s ease'
              }}
            />
          </div>
        </div>
        
        <nav style={{ padding: 'var(--space-2)', maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
          {indicators.map((indicator, index) => (
            <div
              key={indicator.id}
              className={`indicator-card ${selectedIndicator?.id === indicator.id ? 'active' : ''} ${isIndicatorComplete(indicator.id) ? 'reviewed' : ''}`}
              onClick={() => setSelectedIndicator(indicator)}
              style={{ marginBottom: 'var(--space-2)', padding: 'var(--space-3)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span className={`indicator-number ${isIndicatorComplete(indicator.id) ? 'completed' : ''}`}>
                  {isIndicatorComplete(indicator.id) ? '✓' : index + 1}
                </span>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>
                  {indicator.name}
                </span>
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content - Indicator Detail & Form */}
      <div className="main-content" style={{ background: 'var(--gray-50)' }}>
        {selectedIndicator && currentFormData ? (
          <div className="indicator-detail" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="indicator-header">
              <h2>{selectedIndicator.name}</h2>
              {selectedIndicator.description && (
                <p className="text-secondary" style={{ marginTop: 'var(--space-2)' }}>
                  {selectedIndicator.description}
                </p>
              )}
            </div>
            
            <div className="indicator-body">
              {/* STIF Assessment Form */}
              <div className="section-block">
                <h3 className="section-title">
                  <span>📋</span> Assessment
                </h3>
                
                {/* Review Status (Required) */}
                <div className="field-row">
                  <div className="field-header">
                    <label className="form-label">
                      Is this indicator important for SME sustainability reporting?
                      <span className="required">*</span>
                    </label>
                    <InfoTooltip content="Select whether you believe this indicator should be part of the baseline ESG reporting requirements for small and medium enterprises." />
                  </div>
                  <div className="radio-group">
                    <label className="radio-option">
                      <input
                        type="radio"
                        name={`review-status-${selectedIndicator.id}`}
                        checked={currentFormData.reviewStatus === 'important'}
                        onChange={() => updateFormData(selectedIndicator.id, 'reviewStatus', 'important')}
                      />
                      Yes, Important
                    </label>
                    <label className="radio-option">
                      <input
                        type="radio"
                        name={`review-status-${selectedIndicator.id}`}
                        checked={currentFormData.reviewStatus === 'not_important'}
                        onChange={() => updateFormData(selectedIndicator.id, 'reviewStatus', 'not_important')}
                      />
                      Not Important for SMEs
                    </label>
                  </div>
                </div>

                {/* Impact Level */}
                <div className="field-row">
                  <div className="field-header">
                    <label className="form-label">Impact Level</label>
                    <InfoTooltip content="How significant is the potential sustainability impact of this indicator?" />
                  </div>
                  <select
                    className="form-input"
                    value={currentFormData.impactLevel}
                    onChange={(e) => updateFormData(selectedIndicator.id, 'impactLevel', e.target.value)}
                  >
                    <option value="" disabled>Select impact level...</option>
                    {IMPACT_LEVELS.map(level => (
                      <option key={level} value={level}>
                        {level.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Stakeholder Group */}
                <div className="field-row">
                  <div className="field-header">
                    <label className="form-label">Primary Stakeholder Group</label>
                    <InfoTooltip content="Which stakeholder group would benefit most from disclosure of this indicator?" />
                  </div>
                  <select
                    className="form-input"
                    value={currentFormData.stakeholderGroup}
                    onChange={(e) => updateFormData(selectedIndicator.id, 'stakeholderGroup', e.target.value)}
                  >
                    <option value="" disabled>Select stakeholder group...</option>
                    {STAKEHOLDER_GROUPS.map(group => (
                      <option key={group} value={group}>
                        {group.charAt(0).toUpperCase() + group.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Frequency of Disclosure */}
                <div className="field-row">
                  <div className="field-header">
                    <label className="form-label">Recommended Disclosure Frequency</label>
                    <InfoTooltip content="How often should SMEs report on this indicator?" />
                  </div>
                  <select
                    className="form-input"
                    value={currentFormData.frequencyOfDisclosure}
                    onChange={(e) => updateFormData(selectedIndicator.id, 'frequencyOfDisclosure', e.target.value)}
                  >
                    <option value="" disabled>Select frequency...</option>
                    {FREQUENCIES.map(freq => (
                      <option key={freq} value={freq}>
                        {freq.charAt(0).toUpperCase() + freq.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Estimated Cost to Collect */}
                <div className="field-row">
                  <div className="field-header">
                    <label className="form-label">Estimated Cost to Collect</label>
                    <InfoTooltip content="What is the estimated effort/cost for an SME to collect and report this data?" />
                  </div>
                  <select
                    className="form-input"
                    value={currentFormData.estimatedCostToCollect}
                    onChange={(e) => updateFormData(selectedIndicator.id, 'estimatedCostToCollect', e.target.value)}
                  >
                    <option value="" disabled>Select cost estimate...</option>
                    {COST_ESTIMATES.map(cost => (
                      <option key={cost} value={cost}>
                        {cost.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Notes */}
                <div className="field-row">
                  <label className="form-label">Additional Notes</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    placeholder="Any additional comments or suggestions..."
                    value={currentFormData.notes}
                    onChange={(e) => updateFormData(selectedIndicator.id, 'notes', e.target.value)}
                  />
                </div>
              </div>

              {/* Navigation Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-6)' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    const currentIndex = indicators.findIndex(i => i.id === selectedIndicator.id)
                    if (currentIndex > 0) {
                      setSelectedIndicator(indicators[currentIndex - 1])
                    }
                  }}
                  disabled={indicators.findIndex(i => i.id === selectedIndicator.id) === 0}
                >
                  ← Previous
                </button>
                
                {indicators.findIndex(i => i.id === selectedIndicator.id) < indicators.length - 1 ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      const currentIndex = indicators.findIndex(i => i.id === selectedIndicator.id)
                      setSelectedIndicator(indicators[currentIndex + 1])
                    }}
                  >
                    Next Indicator →
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSubmitAll}
                    disabled={isSubmitting || completedCount < indicators.length}
                  >
                    {isSubmitting ? (
                      <span className="loading-spinner" style={{ width: 20, height: 20 }} />
                    ) : (
                      `Submit All Reviews (${completedCount}/${indicators.length})`
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center p-8">
            <p className="text-secondary">Select an indicator to begin reviewing</p>
          </div>
        )}
      </div>
    </main>
  )
}
