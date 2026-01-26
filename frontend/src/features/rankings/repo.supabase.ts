/**
 * Rankings Repository - Supabase Implementation
 */

import { supabase } from '@/lib/supabase/client'
import { Tables } from '@/lib/supabase/schema'
import type { IRankingsRepository } from './repo.interface'
import type { RankingEntry, LeaderboardFilters, RankingStats } from './types'

export class RankingsRepository implements IRankingsRepository {
  async getLeaderboard(filters?: LeaderboardFilters): Promise<RankingEntry[]> {
    let query = supabase
      .from(Tables.CHAMPIONS)
      .select('id, name, company, sector, contribution_score, indicators_reviewed, panels_completed, updated_at')
      .gt('contribution_score', 0)
      .order('contribution_score', { ascending: false })
    
    if (filters?.sector) {
      query = query.eq('sector', filters.sector)
    }
    
    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    const { data, error } = await query
    
    if (error) throw error
    
    // Transform to RankingEntry and add rank
    return (data || []).map((champion, index) => ({
      id: champion.id,
      championId: champion.id,
      championName: champion.name || 'Anonymous',
      company: champion.company || '',
      sector: champion.sector || '',
      score: champion.contribution_score || 0,
      rank: index + 1,
      indicatorsReviewed: champion.indicators_reviewed || 0,
      panelsCompleted: champion.panels_completed || 0,
      lastActivity: champion.updated_at || '',
    }))
  }

  async getChampionRanking(championId: string): Promise<RankingEntry | null> {
    // First get the champion's data
    const { data: champion, error: championError } = await supabase
      .from(Tables.CHAMPIONS)
      .select('id, name, company, sector, contribution_score, indicators_reviewed, panels_completed, updated_at')
      .eq('id', championId)
      .single()
    
    if (championError) {
      if (championError.code === 'PGRST116') return null
      throw championError
    }

    // Get their rank by counting champions with higher scores
    const { count, error: countError } = await supabase
      .from(Tables.CHAMPIONS)
      .select('*', { count: 'exact', head: true })
      .gt('contribution_score', champion.contribution_score || 0)

    if (countError) throw countError

    return {
      id: champion.id,
      championId: champion.id,
      championName: champion.name || 'Anonymous',
      company: champion.company || '',
      sector: champion.sector || '',
      score: champion.contribution_score || 0,
      rank: (count || 0) + 1,
      indicatorsReviewed: champion.indicators_reviewed || 0,
      panelsCompleted: champion.panels_completed || 0,
      lastActivity: champion.updated_at || '',
    }
  }

  async getRankingStats(): Promise<RankingStats> {
    const { data, error } = await supabase
      .from(Tables.CHAMPIONS)
      .select('contribution_score, indicators_reviewed, panels_completed')
      .gt('contribution_score', 0)

    if (error) throw error

    const champions = data || []
    const totalChampions = champions.length
    const totalIndicatorsReviewed = champions.reduce((sum, c) => sum + (c.indicators_reviewed || 0), 0)
    const totalPanelsCompleted = champions.reduce((sum, c) => sum + (c.panels_completed || 0), 0)
    const totalScore = champions.reduce((sum, c) => sum + (c.contribution_score || 0), 0)
    
    return {
      totalChampions,
      totalIndicatorsReviewed,
      totalPanelsCompleted,
      averageScore: totalChampions > 0 ? totalScore / totalChampions : 0,
    }
  }

  async updateChampionScore(championId: string, additionalScore: number): Promise<void> {
    // First get current score
    const { data: champion, error: getError } = await supabase
      .from(Tables.CHAMPIONS)
      .select('contribution_score')
      .eq('id', championId)
      .single()
    
    if (getError) throw getError

    const newScore = (champion.contribution_score || 0) + additionalScore

    // Update with new score
    const { error: updateError } = await supabase
      .from(Tables.CHAMPIONS)
      .update({ 
        contribution_score: newScore,
        updated_at: new Date().toISOString()
      })
      .eq('id', championId)
    
    if (updateError) throw updateError
  }

  async getAvailableSectors(): Promise<string[]> {
    const { data, error } = await supabase
      .from(Tables.CHAMPIONS)
      .select('sector')
      .not('sector', 'is', null)
      .gt('contribution_score', 0)

    if (error) throw error

    // Get unique sectors
    const sectors = [...new Set((data || []).map(c => c.sector).filter(Boolean))]
    return sectors.sort()
  }
}

export const rankingsRepository = new RankingsRepository()
