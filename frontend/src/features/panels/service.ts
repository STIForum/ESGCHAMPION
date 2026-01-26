/**
 * Panels Service
 */

import { panelsRepository } from './repo.supabase'
import type { Panel, Indicator } from '@/lib/supabase/types'
import type { PanelWithIndicators } from './types'

class PanelsService {
  private repository = panelsRepository

  async getPanels(): Promise<Panel[]> {
    return this.repository.getPanels()
  }

  async getPanel(id: string): Promise<Panel | null> {
    return this.repository.getPanel(id)
  }

  async getPanelWithIndicators(panelId: string): Promise<PanelWithIndicators | null> {
    const panel = await this.repository.getPanel(panelId)
    if (!panel) return null

    const indicators = await this.repository.getIndicatorsByPanel(panelId)
    
    return {
      ...panel,
      indicators,
      indicatorCount: indicators.length,
      completedCount: 0, // This will be calculated with user reviews
    }
  }

  async getIndicatorsByPanel(panelId: string): Promise<Indicator[]> {
    return this.repository.getIndicatorsByPanel(panelId)
  }

  async getIndicator(id: string): Promise<Indicator | null> {
    return this.repository.getIndicator(id)
  }

  async getAllIndicators(): Promise<Indicator[]> {
    return this.repository.getAllIndicators()
  }

  /**
   * Get panels grouped by ESG classification
   */
  async getPanelsGroupedByESG(): Promise<{
    environmental: Panel[]
    social: Panel[]
    governance: Panel[]
  }> {
    const panels = await this.getPanels()
    
    return {
      environmental: panels.filter(p => 
        p.category?.toLowerCase() === 'environmental' ||
        p.esg_classification?.toLowerCase() === 'environment'
      ),
      social: panels.filter(p => 
        p.category?.toLowerCase() === 'social' ||
        p.esg_classification?.toLowerCase() === 'social'
      ),
      governance: panels.filter(p => 
        p.category?.toLowerCase() === 'governance' ||
        p.esg_classification?.toLowerCase() === 'governance'
      ),
    }
  }
}

export { PanelsService }
export const panelsService = new PanelsService()

