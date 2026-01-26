/**
 * Indicators Service
 * Business logic for indicator operations
 */

import type { IIndicatorsRepository } from './repo.interface'
import type { Indicator } from '@/lib/supabase/types'
import type { IndicatorWithPanel, IndicatorFilters } from './types'

export class IndicatorsService {
  constructor(private repository: IIndicatorsRepository) {}

  /**
   * Get all indicators for a panel
   */
  async getIndicatorsByPanel(panelId: string): Promise<Indicator[]> {
    return this.repository.getIndicatorsByPanel(panelId)
  }

  /**
   * Get a single indicator with panel info
   */
  async getIndicator(id: string): Promise<IndicatorWithPanel | null> {
    return this.repository.getIndicator(id)
  }

  /**
   * Get indicators with filters
   */
  async getIndicators(filters?: IndicatorFilters): Promise<IndicatorWithPanel[]> {
    return this.repository.getIndicators(filters)
  }

  /**
   * Search indicators
   */
  async searchIndicators(query: string): Promise<IndicatorWithPanel[]> {
    if (!query || query.trim().length < 2) {
      return []
    }
    return this.repository.searchIndicators(query.trim())
  }

  /**
   * Get indicator count for a panel
   */
  async getIndicatorCount(panelId: string): Promise<number> {
    return this.repository.getIndicatorCountByPanel(panelId)
  }

  /**
   * Group indicators by their first letter
   */
  groupByFirstLetter(indicators: Indicator[]): Map<string, Indicator[]> {
    const grouped = new Map<string, Indicator[]>()
    
    for (const indicator of indicators) {
      const letter = (indicator.name?.charAt(0) || '#').toUpperCase()
      if (!grouped.has(letter)) {
        grouped.set(letter, [])
      }
      grouped.get(letter)!.push(indicator)
    }
    
    return grouped
  }
}

// Import repo after class definition to avoid circular dependency
import { indicatorsRepository } from './repo.supabase'
export const indicatorsService = new IndicatorsService(indicatorsRepository)
