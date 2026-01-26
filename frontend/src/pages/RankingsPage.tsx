/**
 * Rankings Page
 * Champion leaderboard and rankings
 */

import { useState, useEffect } from 'react'
import { useAuth } from '@/features/auth'
import { LoadingPage, Card, CardBody, useToast } from '@/components'
import { rankingsRepository, RankingsService, type RankingEntry } from '@/features/rankings'

type PeriodFilter = 'all' | '30days' | '7days'

export function RankingsPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  
  const [isLoading, setIsLoading] = useState(true)
  const [leaderboard, setLeaderboard] = useState<RankingEntry[]>([])
  const [userRanking, setUserRanking] = useState<RankingEntry | null>(null)
  const [activePeriod, setActivePeriod] = useState<PeriodFilter>('all')

  useEffect(() => {
    loadLeaderboard()
  }, [activePeriod])

  useEffect(() => {
    if (user?.id) {
      loadUserRanking()
    }
  }, [user?.id])

  const loadLeaderboard = async () => {
    setIsLoading(true)
    try {
      const rankingsService = new RankingsService(rankingsRepository)
      const data = await rankingsService.getLeaderboard()
      setLeaderboard(data)
    } catch (error) {
      console.error('Failed to load leaderboard:', error)
      showToast('Failed to load leaderboard', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const loadUserRanking = async () => {
    if (!user?.id) return
    try {
      const rankingsService = new RankingsService(rankingsRepository)
      const ranking = await rankingsService.getChampionRanking(user.id)
      setUserRanking(ranking)
    } catch (error) {
      console.error('Failed to load user ranking:', error)
    }
  }

  if (isLoading) {
    return <LoadingPage />
  }

  const topThree = leaderboard.slice(0, 3)
  const restOfLeaderboard = leaderboard.slice(3)

  return (
    <main style={{ paddingTop: '100px', minHeight: '100vh', background: 'var(--gray-50)' }}>
      <div className="container">
        {/* Header */}
        <div className="text-center mb-8">
          <h1>Champion Leaderboard</h1>
          <p className="text-secondary" style={{ maxWidth: '600px', margin: 'var(--space-4) auto' }}>
            See who's leading the sustainability movement. Earn credits by submitting quality reviews.
          </p>
        </div>

        {/* Your Rank Card (if logged in) */}
        {userRanking && (
          <div 
            className="widget mb-6" 
            style={{ background: 'linear-gradient(135deg, var(--primary-600), var(--primary-700))' }}
          >
            <div className="widget-body" style={{ color: 'white' }}>
              <div className="flex-between">
                <div>
                  <h3 style={{ color: 'white', marginBottom: 'var(--space-2)' }}>Your Position</h3>
                  <p style={{ color: 'var(--primary-100)', margin: 0 }}>
                    Keep contributing to climb the leaderboard!
                  </p>
                </div>
                <div className="text-right">
                  <div 
                    className="stat-value" 
                    style={{ fontSize: 'var(--text-5xl)', color: 'white' }}
                  >
                    #{userRanking.rank}
                  </div>
                  <div style={{ color: 'var(--primary-200)' }}>
                    {userRanking.score} credits
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Period Filter */}
        <div className="flex-between mb-6">
          <div 
            className="flex" 
            style={{ 
              gap: 'var(--space-2)', 
              background: 'white', 
              padding: 'var(--space-2)', 
              borderRadius: 'var(--radius-lg)', 
              boxShadow: 'var(--shadow)' 
            }}
          >
            {(['all', '30days', '7days'] as PeriodFilter[]).map(period => (
              <button
                key={period}
                className={`btn ${activePeriod === period ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setActivePeriod(period)}
              >
                {period === 'all' ? 'All Time' : period === '30days' ? '30 Days' : 'This Week'}
              </button>
            ))}
          </div>
          <div className="text-secondary">
            {leaderboard.length} Champions
          </div>
        </div>

        {/* Top 3 Podium */}
        {topThree.length >= 3 && (
          <div className="mb-8">
            <div className="flex-center" style={{ gap: 'var(--space-4)', flexWrap: 'wrap' }}>
              {/* Second Place */}
              <PodiumCard entry={topThree[1]} position={2} />
              
              {/* First Place */}
              <PodiumCard entry={topThree[0]} position={1} />
              
              {/* Third Place */}
              <PodiumCard entry={topThree[2]} position={3} />
            </div>
          </div>
        )}

        {/* Leaderboard List */}
        <Card>
          <CardBody style={{ padding: 0 }}>
            <ul className="leaderboard">
              {restOfLeaderboard.map((entry) => (
                <li 
                  key={entry.id} 
                  className={`leaderboard-item ${user?.id === entry.championId ? 'highlight' : ''}`}
                >
                  <div className="leaderboard-rank">{entry.rank}</div>
                  <div className="leaderboard-avatar">
                    {entry.championName.charAt(0).toUpperCase()}
                  </div>
                  <div className="leaderboard-info">
                    <div className="leaderboard-name">{entry.championName}</div>
                    <div className="leaderboard-company">{entry.company || 'Independent'}</div>
                  </div>
                  <div className="leaderboard-stats">
                    <div className="leaderboard-reviews">
                      {entry.indicatorsReviewed} reviews
                    </div>
                  </div>
                  <div className="leaderboard-credits">
                    <span className="credits-value">{entry.score}</span>
                    <span className="credits-label">credits</span>
                  </div>
                </li>
              ))}
              
              {leaderboard.length === 0 && (
                <li className="text-center p-8 text-secondary">
                  No champions on the leaderboard yet. Be the first!
                </li>
              )}
            </ul>
          </CardBody>
        </Card>
      </div>
    </main>
  )
}

interface PodiumCardProps {
  entry: RankingEntry
  position: 1 | 2 | 3
}

function PodiumCard({ entry, position }: PodiumCardProps) {
  const positionStyles = {
    1: {
      order: 0,
      width: '240px',
      transform: 'scale(1.1)',
      zIndex: 1,
      boxShadow: 'var(--shadow-xl)',
      padding: 'var(--space-8)',
      rankSize: { width: 64, height: 64, fontSize: 'var(--text-2xl)' },
      avatarSize: 'avatar-xl',
      creditsSize: 'var(--text-3xl)',
      rankBg: 'linear-gradient(135deg, #ffd700, #ffb700)',
      rankColor: '#7c5600',
    },
    2: {
      order: 1,
      width: '200px',
      transform: 'none',
      zIndex: 0,
      boxShadow: 'var(--shadow)',
      padding: 'var(--space-6)',
      rankSize: { width: 48, height: 48, fontSize: 'var(--text-xl)' },
      avatarSize: 'avatar-lg',
      creditsSize: 'var(--text-2xl)',
      rankBg: 'linear-gradient(135deg, #c0c0c0, #a0a0a0)',
      rankColor: '#505050',
    },
    3: {
      order: 2,
      width: '200px',
      transform: 'none',
      zIndex: 0,
      boxShadow: 'var(--shadow)',
      padding: 'var(--space-6)',
      rankSize: { width: 48, height: 48, fontSize: 'var(--text-xl)' },
      avatarSize: 'avatar-lg',
      creditsSize: 'var(--text-2xl)',
      rankBg: 'linear-gradient(135deg, #cd7f32, #b87333)',
      rankColor: '#4a2800',
    },
  }

  const styles = positionStyles[position]

  return (
    <div 
      className="card text-center" 
      style={{ 
        order: styles.order, 
        width: styles.width, 
        transform: styles.transform, 
        zIndex: styles.zIndex,
        boxShadow: styles.boxShadow,
        padding: styles.padding,
      }}
    >
      <div 
        className="leaderboard-rank" 
        style={{ 
          width: styles.rankSize.width, 
          height: styles.rankSize.height, 
          fontSize: styles.rankSize.fontSize,
          margin: '0 auto var(--space-4)',
          background: styles.rankBg,
          color: styles.rankColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
        }}
      >
        {position === 1 ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
          </svg>
        ) : position}
      </div>
      
      <div 
        className={`avatar ${styles.avatarSize}`} 
        style={{ margin: '0 auto var(--space-3)' }}
      >
        {entry.championName.charAt(0).toUpperCase()}
      </div>
      
      <h4 style={{ marginBottom: 'var(--space-1)' }}>{entry.championName}</h4>
      <p className="text-secondary" style={{ fontSize: 'var(--text-sm)' }}>
        {entry.company || 'Independent'}
      </p>
      
      <div 
        className="stat-value text-gradient" 
        style={{ fontSize: styles.creditsSize, marginTop: 'var(--space-3)' }}
      >
        {entry.score}
      </div>
      <div className="text-muted" style={{ fontSize: 'var(--text-xs)' }}>credits</div>
    </div>
  )
}
