/**
 * Rankings Feature Types
 */

import type { Champion } from '@/lib/supabase/types'

export interface RankingEntry {
  id: string
  championId: string
  championName: string
  company: string
  sector: string
  score: number
  rank: number
  indicatorsReviewed: number
  panelsCompleted: number
  lastActivity: string
  champion?: Partial<Champion>
}

export interface LeaderboardFilters {
  sector?: string
  timeframe?: 'all' | 'month' | 'week'
  limit?: number
}

export interface RankingStats {
  totalChampions: number
  totalIndicatorsReviewed: number
  totalPanelsCompleted: number
  averageScore: number
}
