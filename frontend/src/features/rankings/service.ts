/**
 * Rankings Service
 * Business logic for leaderboard and ranking operations
 */

import type { IRankingsRepository } from './repo.interface'
import type { RankingEntry, LeaderboardFilters, RankingStats } from './types'

export class RankingsService {
  constructor(private repository: IRankingsRepository) {}

  /**
   * Get the leaderboard
   */
  async getLeaderboard(filters?: LeaderboardFilters): Promise<RankingEntry[]> {
    return this.repository.getLeaderboard(filters)
  }

  /**
   * Get top N champions
   */
  async getTopChampions(limit: number = 10): Promise<RankingEntry[]> {
    return this.repository.getLeaderboard({ limit })
  }

  /**
   * Get a champion's ranking details
   */
  async getChampionRanking(championId: string): Promise<RankingEntry | null> {
    return this.repository.getChampionRanking(championId)
  }

  /**
   * Get overall stats
   */
  async getRankingStats(): Promise<RankingStats> {
    return this.repository.getRankingStats()
  }

  /**
   * Award points for completing an indicator review
   */
  async awardIndicatorReviewPoints(championId: string): Promise<void> {
    const INDICATOR_REVIEW_POINTS = 10
    await this.repository.updateChampionScore(championId, INDICATOR_REVIEW_POINTS)
  }

  /**
   * Award points for completing a panel
   */
  async awardPanelCompletionPoints(championId: string): Promise<void> {
    const PANEL_COMPLETION_POINTS = 50
    await this.repository.updateChampionScore(championId, PANEL_COMPLETION_POINTS)
  }

  /**
   * Get available sectors for filtering
   */
  async getAvailableSectors(): Promise<string[]> {
    return this.repository.getAvailableSectors()
  }

  /**
   * Get rank badge/tier based on score
   */
  getRankTier(score: number): { tier: string; color: string } {
    if (score >= 1000) return { tier: 'Diamond', color: '#b9f2ff' }
    if (score >= 500) return { tier: 'Platinum', color: '#e5e4e2' }
    if (score >= 250) return { tier: 'Gold', color: '#ffd700' }
    if (score >= 100) return { tier: 'Silver', color: '#c0c0c0' }
    if (score >= 50) return { tier: 'Bronze', color: '#cd7f32' }
    return { tier: 'Newcomer', color: '#4a5568' }
  }

  /**
   * Format rank with suffix (1st, 2nd, 3rd, etc.)
   */
  formatRank(rank: number): string {
    const suffixes = ['th', 'st', 'nd', 'rd']
    const v = rank % 100
    return rank + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0])
  }
}
