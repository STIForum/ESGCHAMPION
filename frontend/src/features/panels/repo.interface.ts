/**
 * Panels Repository Interface
 */

import type { Panel, Indicator } from '@/lib/supabase/types'

export interface IPanelsRepository {
  getPanels(): Promise<Panel[]>
  getPanel(id: string): Promise<Panel | null>
  getIndicatorsByPanel(panelId: string): Promise<Indicator[]>
  getIndicator(id: string): Promise<Indicator | null>
  getAllIndicators(): Promise<Indicator[]>
}
