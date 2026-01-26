/**
 * Indicators Repository Interface
 */

import type { Indicator } from '@/lib/supabase/types'
import type { IndicatorWithPanel, IndicatorFilters } from './types'

export interface IIndicatorsRepository {
  /**
   * Get all indicators for a specific panel
   */
  getIndicatorsByPanel(panelId: string): Promise<Indicator[]>

  /**
   * Get a single indicator by ID
   */
  getIndicator(id: string): Promise<IndicatorWithPanel | null>

  /**
   * Get all indicators with optional filters
   */
  getIndicators(filters?: IndicatorFilters): Promise<IndicatorWithPanel[]>

  /**
   * Search indicators by name or description
   */
  searchIndicators(query: string): Promise<IndicatorWithPanel[]>

  /**
   * Get indicator count by panel
   */
  getIndicatorCountByPanel(panelId: string): Promise<number>
}
