/**
 * Panels Page
 * Browse and select ESG panels for review
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LoadingPage, Modal, useToast } from '@/components'
import { panelsService } from '@/features/panels'
import { indicatorsService } from '@/features/indicators'
import type { Panel, Indicator } from '@/lib/supabase/types'

type CategoryFilter = 'all' | 'environmental' | 'social' | 'governance'

export function PanelsPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  
  const [isLoading, setIsLoading] = useState(true)
  const [panels, setPanels] = useState<Panel[]>([])
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>('all')
  
  // Modal state
  const [selectedPanel, setSelectedPanel] = useState<Panel | null>(null)
  const [indicators, setIndicators] = useState<Indicator[]>([])
  const [selectedIndicators, setSelectedIndicators] = useState<Set<string>>(new Set())
  const [indicatorSearch, setIndicatorSearch] = useState('')
  const [isLoadingIndicators, setIsLoadingIndicators] = useState(false)

  useEffect(() => {
    loadPanels()
  }, [])

  const loadPanels = async () => {
    setIsLoading(true)
    try {
      const allPanels = await panelsService.getPanels()
      setPanels(allPanels)
    } catch (error) {
      console.error('Failed to load panels:', error)
      showToast('Failed to load panels', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const openPanelModal = async (panel: Panel) => {
    setSelectedPanel(panel)
    setSelectedIndicators(new Set())
    setIndicatorSearch('')
    setIsLoadingIndicators(true)
    
    try {
      const panelIndicators = await indicatorsService.getIndicatorsByPanel(panel.id)
      setIndicators(panelIndicators)
    } catch (error) {
      console.error('Failed to load indicators:', error)
      showToast('Failed to load indicators', 'error')
    } finally {
      setIsLoadingIndicators(false)
    }
  }

  const closePanelModal = () => {
    setSelectedPanel(null)
    setIndicators([])
    setSelectedIndicators(new Set())
  }

  const toggleIndicator = (indicatorId: string) => {
    setSelectedIndicators(prev => {
      const next = new Set(prev)
      if (next.has(indicatorId)) {
        next.delete(indicatorId)
      } else {
        next.add(indicatorId)
      }
      return next
    })
  }

  const selectAllIndicators = () => {
    const filteredIds = filteredIndicators.map(i => i.id)
    if (selectedIndicators.size === filteredIds.length) {
      setSelectedIndicators(new Set())
    } else {
      setSelectedIndicators(new Set(filteredIds))
    }
  }

  const handleProceed = () => {
    if (selectedIndicators.size === 0) {
      showToast('Please select at least one indicator', 'warning')
      return
    }
    
    // Navigate to indicators page with selected panel and indicators
    const params = new URLSearchParams({
      panel: selectedPanel!.id,
      indicators: Array.from(selectedIndicators).join(','),
    })
    navigate(`/champion-indicators?${params.toString()}`)
  }

  const filteredPanels = panels.filter(panel => {
    if (activeFilter === 'all') return true
    return panel.category?.toLowerCase() === activeFilter
  })

  const filteredIndicators = indicators.filter(indicator =>
    indicator.name?.toLowerCase().includes(indicatorSearch.toLowerCase()) ||
    indicator.description?.toLowerCase().includes(indicatorSearch.toLowerCase())
  )

  const groupedPanels = {
    environmental: filteredPanels.filter(p => p.category?.toLowerCase() === 'environmental'),
    social: filteredPanels.filter(p => p.category?.toLowerCase() === 'social'),
    governance: filteredPanels.filter(p => p.category?.toLowerCase() === 'governance'),
  }

  if (isLoading) {
    return <LoadingPage />
  }

  return (
    <main style={{ paddingTop: '100px', minHeight: '100vh', background: 'var(--gray-50)' }}>
      <div className="container">
        {/* Header */}
        <div className="text-center mb-8">
          <h1>ESG Panels</h1>
          <p className="text-secondary" style={{ maxWidth: '600px', margin: 'var(--space-4) auto' }}>
            Explore our comprehensive ESG indicator panels. Select a panel to view and validate indicators.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex-center mb-8">
          <div className="btn-group" style={{ 
            display: 'flex', 
            gap: 'var(--space-2)', 
            background: 'white', 
            padding: 'var(--space-2)', 
            borderRadius: 'var(--radius-lg)', 
            boxShadow: 'var(--shadow)' 
          }}>
            {(['all', 'environmental', 'social', 'governance'] as CategoryFilter[]).map(filter => (
              <button
                key={filter}
                className={`btn btn-ghost filter-btn ${activeFilter === filter ? 'active' : ''}`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter === 'all' ? 'All Panels' : filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Panels by Category */}
        {(activeFilter === 'all' || activeFilter === 'environmental') && groupedPanels.environmental.length > 0 && (
          <PanelSection
            title="Environmental"
            color="var(--environmental)"
            panels={groupedPanels.environmental}
            onSelectPanel={openPanelModal}
          />
        )}

        {(activeFilter === 'all' || activeFilter === 'social') && groupedPanels.social.length > 0 && (
          <PanelSection
            title="Social"
            color="var(--social)"
            panels={groupedPanels.social}
            onSelectPanel={openPanelModal}
          />
        )}

        {(activeFilter === 'all' || activeFilter === 'governance') && groupedPanels.governance.length > 0 && (
          <PanelSection
            title="Governance"
            color="var(--governance)"
            panels={groupedPanels.governance}
            onSelectPanel={openPanelModal}
          />
        )}
      </div>

      {/* Indicator Selection Modal */}
      <Modal
        isOpen={!!selectedPanel}
        onClose={closePanelModal}
        title={`Review: ${selectedPanel?.name || 'Panel'}`}
        size="lg"
      >
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <p className="text-secondary" style={{ marginBottom: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>
            Select the indicators you want to review for this panel:
          </p>
          <input
            type="text"
            className="form-input"
            placeholder="Search indicators..."
            value={indicatorSearch}
            onChange={(e) => setIndicatorSearch(e.target.value)}
            style={{ marginBottom: 'var(--space-3)' }}
          />
          <div className="flex-between">
            <button type="button" className="btn btn-ghost btn-sm" onClick={selectAllIndicators}>
              {selectedIndicators.size === filteredIndicators.length ? 'Deselect All' : 'Select All'}
            </button>
            <span className="text-secondary" style={{ fontSize: 'var(--text-sm)' }}>
              {selectedIndicators.size} of {filteredIndicators.length} selected
            </span>
          </div>
        </div>

        <div 
          style={{ 
            maxHeight: '400px', 
            overflowY: 'auto', 
            border: '1px solid var(--gray-200)', 
            borderRadius: 'var(--radius-lg)', 
            padding: 'var(--space-2)' 
          }}
        >
          {isLoadingIndicators ? (
            <div className="text-center p-6">
              <div className="loading-spinner" />
            </div>
          ) : filteredIndicators.length === 0 ? (
            <p className="text-center text-secondary p-6">No indicators found</p>
          ) : (
            filteredIndicators.map(indicator => (
              <label
                key={indicator.id}
                className="indicator-checkbox-item"
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius)',
                  cursor: 'pointer',
                  background: selectedIndicators.has(indicator.id) ? 'var(--primary-50)' : 'transparent',
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedIndicators.has(indicator.id)}
                  onChange={() => toggleIndicator(indicator.id)}
                  style={{ marginTop: '2px' }}
                />
                <div>
                  <div style={{ fontWeight: 500 }}>{indicator.name}</div>
                  {indicator.description && (
                    <div className="text-secondary" style={{ fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
                      {indicator.description}
                    </div>
                  )}
                </div>
              </label>
            ))
          )}
        </div>

        <div 
          style={{ 
            borderTop: '1px solid var(--gray-100)', 
            paddingTop: 'var(--space-4)', 
            marginTop: 'var(--space-4)',
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: 'var(--space-3)' 
          }}
        >
          <button type="button" className="btn btn-ghost" onClick={closePanelModal}>
            Cancel
          </button>
          <button 
            type="button" 
            className="btn btn-primary"
            onClick={handleProceed}
            disabled={selectedIndicators.size === 0}
          >
            Proceed to Review ({selectedIndicators.size})
          </button>
        </div>
      </Modal>
    </main>
  )
}

interface PanelSectionProps {
  title: string
  color: string
  panels: Panel[]
  onSelectPanel: (panel: Panel) => void
}

function PanelSection({ title, color, panels, onSelectPanel }: PanelSectionProps) {
  const icons: Record<string, React.ReactNode> = {
    Environmental: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22c4-4 8-7.5 8-12a8 8 0 1 0-16 0c0 4.5 4 8 8 12z" />
      </svg>
    ),
    Social: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
      </svg>
    ),
    Governance: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 21h18" />
        <path d="M3 10h18" />
        <path d="M5 6l7-3 7 3" />
      </svg>
    ),
  }

  return (
    <section className="mb-8">
      <h2 className="mb-4" style={{ color }}>
        <span style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }}>
          {icons[title]}
        </span>
        {title}
      </h2>
      <div className="features-grid">
        {panels.map(panel => (
          <div
            key={panel.id}
            className="feature-card"
            onClick={() => onSelectPanel(panel)}
            style={{ cursor: 'pointer' }}
          >
            <div className="feature-icon" style={{ background: `${color}20`, color }}>
              {icons[title]}
            </div>
            <h3 className="feature-title">{panel.name}</h3>
            <p className="feature-description">{panel.description}</p>
            <div className="feature-footer">
              <span className="badge">{(panel as unknown as { indicator_count?: number }).indicator_count || 0} indicators</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
