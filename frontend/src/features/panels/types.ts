/**
 * Panels Types
 */

import type { Panel, Indicator } from '@/lib/supabase/types'

export interface PanelWithIndicators extends Panel {
  indicators: Indicator[]
  indicatorCount: number
  completedCount: number
}

export interface PanelStats {
  totalIndicators: number
  completedIndicators: number
  pendingReviews: number
}
