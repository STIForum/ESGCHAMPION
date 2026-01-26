/**
 * Rankings Repository Interface
 */

import type { RankingEntry, LeaderboardFilters, RankingStats } from './types'

export interface IRankingsRepository {
  /**
   * Get the leaderboard with optional filters
   */
  getLeaderboard(filters?: LeaderboardFilters): Promise<RankingEntry[]>

  /**
   * Get a specific champion's ranking
   */
  getChampionRanking(championId: string): Promise<RankingEntry | null>

  /**
   * Get overall ranking statistics
   */
  getRankingStats(): Promise<RankingStats>

  /**
   * Update a champion's score (typically called after reviews)
   */
  updateChampionScore(championId: string, additionalScore: number): Promise<void>

  /**
   * Get available sectors for filtering
   */
  getAvailableSectors(): Promise<string[]>
}
