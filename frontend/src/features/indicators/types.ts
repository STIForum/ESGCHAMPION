/**
 * Indicators Feature Types
 */

import type { Indicator } from '@/lib/supabase/types'

export interface IndicatorWithPanel extends Indicator {
  panel?: {
    id: string
    name: string
    category: string
  }
}

export interface IndicatorFilters {
  panelId?: string
  category?: string
  search?: string
}

export interface IndicatorCategory {
  id: string
  name: string
  count: number
}
