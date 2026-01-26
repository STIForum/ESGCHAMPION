/**
 * Dashboard Page
 * Champion's main dashboard with stats and recent activity
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { StatsCard, StatsGrid, Card, CardHeader, CardBody, Modal, LoadingPage } from '@/components'
import { reviewsRepository } from '@/features/reviews'
import { rankingsRepository, RankingsService } from '@/features/rankings'

interface DashboardStats {
  credits: number
  approvedReviews: number
  pendingReviews: number
  rank: number | null
  stifScore: number
}

interface RecentReview {
  id: string
  panelName: string
  status: string
  submittedAt: string
}

export function DashboardPage() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    credits: 0,
    approvedReviews: 0,
    pendingReviews: 0,
    rank: null,
    stifScore: 0,
  })
  const [recentReviews, setRecentReviews] = useState<RecentReview[]>([])
  const [showScoreModal, setShowScoreModal] = useState(false)
  const [resumePanel, setResumePanel] = useState<{ id: string; name: string } | null>(null)

  useEffect(() => {
    if (user?.id) {
      loadDashboardData()
    }
  }, [user?.id])

  const loadDashboardData = async () => {
    if (!user?.id) return
    
    setIsLoading(true)
    try {
      // Load submissions
      const submissions = await reviewsRepository.getUserSubmissions(user.id)
      
      // Calculate stats
      const approved = submissions.filter(s => s.status === 'approved').length
      const pending = submissions.filter(s => s.status === 'pending').length
      
      // Get ranking
      const rankingsService = new RankingsService(rankingsRepository)
      const ranking = await rankingsService.getChampionRanking(user.id)
      
      setStats({
        credits: user.contribution_score || 0,
        approvedReviews: approved,
        pendingReviews: pending,
        rank: ranking?.rank || null,
        stifScore: user.contribution_score || 0,
      })

      // Transform recent reviews
      const recent = submissions.slice(0, 5).map(s => ({
        id: s.id,
        panelName: (s as { panels?: { name?: string } }).panels?.name || 'Unknown Panel',
        status: s.status || 'pending',
        submittedAt: s.submitted_at || s.created_at || '',
      }))
      setRecentReviews(recent)

      // Check for partial/in-progress panel
      const inProgress = submissions.find(s => s.status === 'partial')
      if (inProgress) {
        setResumePanel({
          id: inProgress.panel_id || '',
          name: (inProgress as { panels?: { name?: string } }).panels?.name || 'Panel',
        })
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <LoadingPage />
  }

  return (
    <div className="dashboard-container">
      {/* Welcome Header */}
      <div className="flex-between mb-8">
        <div>
          <h1>Welcome back, {user?.name?.split(' ')[0] || 'Champion'}!</h1>
          <p className="text-secondary">Here's your sustainability impact overview</p>
        </div>
        <Link to="/champion-panels" className="btn btn-primary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Submit Review
        </Link>
      </div>

      {/* Resume Progress Card */}
      {resumePanel && (
        <div 
          className="widget mb-6"
          style={{ 
            background: 'linear-gradient(135deg, var(--primary-600), var(--primary-700))', 
            color: 'white' 
          }}
        >
          <div className="widget-body">
            <div className="flex-between">
              <div>
                <h3 style={{ color: 'white', marginBottom: 'var(--space-2)' }}>
                  Continue Where You Left Off
                </h3>
                <p style={{ color: 'var(--primary-100)', marginBottom: 0 }}>
                  You have an in-progress review for {resumePanel.name}
                </p>
              </div>
              <Link to={`/champion-indicators?panel=${resumePanel.id}`} className="btn btn-accent">
                Continue
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <StatsGrid columns={4} className="mb-8">
        <StatsCard
          title="STIF Credits"
          value={stats.credits}
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          }
        />
        <StatsCard
          title="Approved Reviews"
          value={stats.approvedReviews}
          variant="primary"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
        />
        <StatsCard
          title="Pending Reviews"
          value={stats.pendingReviews}
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />
        <StatsCard
          title="Your Rank"
          value={stats.rank ? `#${stats.rank}` : '#--'}
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 20V10" />
              <path d="M12 20V4" />
              <path d="M6 20v-6" />
            </svg>
          }
        />
      </StatsGrid>

      {/* Content Grid */}
      <div className="dashboard-grid">
        {/* Recent Reviews */}
        <Card>
          <CardHeader 
            title="Recent Reviews"
            action={
              <Link to="/champion-panels" className="btn btn-ghost btn-sm">View All</Link>
            }
          />
          <CardBody>
            {recentReviews.length === 0 ? (
              <p className="text-secondary text-center p-6">
                No reviews yet. Start by exploring ESG panels!
              </p>
            ) : (
              <div className="review-list">
                {recentReviews.map(review => (
                  <div key={review.id} className="review-item">
                    <div className="review-item-content">
                      <span className="review-item-title">{review.panelName}</span>
                      <span className="review-item-date">
                        {new Date(review.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <span className={`badge badge-${review.status}`}>
                      {review.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Why Your Reviews Matter + STIF Score */}
        <div>
          <Card>
            <CardHeader title="Why Your Reviews Matter" />
            <CardBody>
              <div className="info-list">
                <div className="info-item">
                  <span className="info-check">✓</span>
                  <span>Your insights train the STIF Intelligence Engine to deliver smarter, fairer, expert-driven recommendations.</span>
                </div>
                <div className="info-item">
                  <span className="info-check">✓</span>
                  <span>You shape the ESG baseline for SMEs, directing small businesses toward what truly drives impact.</span>
                </div>
                <div className="info-item">
                  <span className="info-check">✓</span>
                  <span>Your reviews strengthen trust in sustainability reporting and accelerate industry-wide progress.</span>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="mt-6">
            <CardHeader title="STIF Score" />
            <CardBody className="text-center">
              <div 
                className="stat-value text-gradient" 
                style={{ fontSize: 'var(--text-5xl)' }}
              >
                {stats.stifScore}
              </div>
              <p className="text-secondary mt-2">Your sustainability impact score</p>
              <button 
                className="btn btn-secondary btn-sm mt-4"
                onClick={() => setShowScoreModal(true)}
              >
                How it's calculated
              </button>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Score Info Modal */}
      <Modal 
        isOpen={showScoreModal} 
        onClose={() => setShowScoreModal(false)}
        title="How Your STIF Score is Calculated"
      >
        <div className="score-calculation">
          <p className="mb-4">
            Your STIF Score reflects your contribution to sustainability reporting excellence:
          </p>
          <ul className="score-list">
            <li>
              <strong>+10 points</strong> for each indicator review submitted
            </li>
            <li>
              <strong>+50 points</strong> for completing a full panel review
            </li>
            <li>
              <strong>+25 bonus points</strong> when your review is approved
            </li>
            <li>
              <strong>+100 points</strong> for inviting a peer who becomes active
            </li>
          </ul>
          <p className="mt-4 text-secondary">
            Your score helps determine your ranking on the leaderboard and unlocks special recognition badges.
          </p>
        </div>
      </Modal>
    </div>
  )
}
