/**
 * Admin Review Page
 * Admin interface for reviewing submissions
 */

import { useState, useEffect } from 'react'
import { useAuth } from '@/features/auth'
import { Card, CardBody, Modal, useToast, LoadingPage } from '@/components'
import { reviewsRepository, type SubmissionWithReviews } from '@/features/reviews'
import type { PanelReviewSubmission, IndicatorReview } from '@/lib/supabase/types'

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected'

export function AdminReviewPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  
  const [isLoading, setIsLoading] = useState(true)
  const [submissions, setSubmissions] = useState<PanelReviewSubmission[]>([])
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending')
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionWithReviews | null>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)

  useEffect(() => {
    loadSubmissions()
  }, [statusFilter])

  const loadSubmissions = async () => {
    setIsLoading(true)
    try {
      const data = await reviewsRepository.getAdminSubmissions(
        statusFilter === 'all' ? undefined : statusFilter
      )
      setSubmissions(data)
    } catch (error) {
      console.error('Failed to load submissions:', error)
      showToast('Failed to load submissions', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const openSubmissionDetails = async (submission: PanelReviewSubmission) => {
    setIsLoadingDetails(true)
    try {
      const details = await reviewsRepository.getSubmissionWithReviews(submission.id)
      setSelectedSubmission(details)
    } catch (error) {
      console.error('Failed to load submission details:', error)
      showToast('Failed to load details', 'error')
    } finally {
      setIsLoadingDetails(false)
    }
  }

  const handleApproveSubmission = async (submissionId: string) => {
    try {
      await reviewsRepository.updateSubmissionStatus(submissionId, 'approved')
      showToast('Submission approved!', 'success')
      loadSubmissions()
      setSelectedSubmission(null)
    } catch (error) {
      console.error('Failed to approve submission:', error)
      showToast('Failed to approve submission', 'error')
    }
  }

  const handleRejectSubmission = async (submissionId: string) => {
    try {
      await reviewsRepository.updateSubmissionStatus(submissionId, 'rejected')
      showToast('Submission rejected', 'info')
      loadSubmissions()
      setSelectedSubmission(null)
    } catch (error) {
      console.error('Failed to reject submission:', error)
      showToast('Failed to reject submission', 'error')
    }
  }

  // Check admin access
  if (!user?.is_admin) {
    return (
      <div className="dashboard-container text-center p-12">
        <h1>Access Denied</h1>
        <p className="text-secondary">You do not have permission to access this page.</p>
      </div>
    )
  }

  if (isLoading) {
    return <LoadingPage />
  }

  return (
    <div className="dashboard-container">
      <div className="flex-between mb-6">
        <h1>Admin Review</h1>
        <div className="text-secondary">
          {submissions.length} submissions
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex mb-6" style={{ gap: 'var(--space-2)' }}>
        {(['all', 'pending', 'approved', 'rejected'] as StatusFilter[]).map(status => (
          <button
            key={status}
            className={`btn ${statusFilter === status ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setStatusFilter(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Submissions List */}
      <Card>
        <CardBody style={{ padding: 0 }}>
          {submissions.length === 0 ? (
            <p className="text-center text-secondary p-8">
              No submissions found
            </p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Panel</th>
                  <th>Champion</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map(submission => (
                  <tr key={submission.id}>
                    <td>
                      <strong>
                        {(submission as { panels?: { name?: string } }).panels?.name || 'Unknown Panel'}
                      </strong>
                    </td>
                    <td>{submission.champion_id}</td>
                    <td>
                      {submission.submitted_at 
                        ? new Date(submission.submitted_at).toLocaleDateString()
                        : 'N/A'
                      }
                    </td>
                    <td>
                      <span className={`badge badge-${submission.status || 'pending'}`}>
                        {submission.status || 'pending'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => openSubmissionDetails(submission)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>

      {/* Submission Details Modal */}
      <Modal
        isOpen={!!selectedSubmission || isLoadingDetails}
        onClose={() => setSelectedSubmission(null)}
        title="Submission Details"
        size="xl"
      >
        {isLoadingDetails ? (
          <div className="text-center p-8">
            <div className="loading-spinner" />
          </div>
        ) : selectedSubmission ? (
          <div>
            <div className="submission-meta mb-6" style={{ 
              background: 'var(--gray-50)', 
              padding: 'var(--space-4)', 
              borderRadius: 'var(--radius-lg)' 
            }}>
              <div className="flex-between">
                <div>
                  <strong>Panel:</strong>{' '}
                  {(selectedSubmission as { panels?: { name?: string } }).panels?.name}
                </div>
                <div>
                  <span className={`badge badge-${selectedSubmission.status || 'pending'}`}>
                    {selectedSubmission.status || 'pending'}
                  </span>
                </div>
              </div>
              <div className="mt-2 text-secondary text-sm">
                Submitted: {selectedSubmission.submitted_at 
                  ? new Date(selectedSubmission.submitted_at).toLocaleString()
                  : 'N/A'
                }
              </div>
            </div>

            <h4 className="mb-4">Indicator Reviews ({selectedSubmission.indicatorReviews?.length || 0})</h4>
            
            <div className="indicator-reviews-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {selectedSubmission.indicatorReviews?.map((review: IndicatorReview) => (
                <div 
                  key={review.id} 
                  className="indicator-review-item"
                  style={{
                    padding: 'var(--space-4)',
                    borderBottom: '1px solid var(--gray-100)',
                  }}
                >
                  <div className="flex-between mb-2">
                    <strong>
                      {(review as { indicators?: { name?: string } }).indicators?.name || 'Indicator'}
                    </strong>
                    <span className={`badge badge-${review.review_status === 'important' ? 'primary' : 'secondary'}`}>
                      {review.review_status}
                    </span>
                  </div>
                  
                  <div className="review-details" style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(2, 1fr)', 
                    gap: 'var(--space-2)',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--gray-600)'
                  }}>
                    {review.impact_level && (
                      <div><strong>Impact:</strong> {review.impact_level}</div>
                    )}
                    {review.stakeholder_group && (
                      <div><strong>Stakeholder:</strong> {review.stakeholder_group}</div>
                    )}
                    {review.frequency_of_disclosure && (
                      <div><strong>Frequency:</strong> {review.frequency_of_disclosure}</div>
                    )}
                    {review.estimated_cost_to_collect && (
                      <div><strong>Cost:</strong> {review.estimated_cost_to_collect}</div>
                    )}
                  </div>
                  
                  {review.notes && (
                    <div className="mt-2 text-secondary text-sm">
                      <strong>Notes:</strong> {review.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {selectedSubmission.status === 'pending' && (
              <div 
                className="modal-actions mt-6" 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'flex-end', 
                  gap: 'var(--space-3)',
                  borderTop: '1px solid var(--gray-100)',
                  paddingTop: 'var(--space-4)'
                }}
              >
                <button
                  className="btn btn-ghost"
                  style={{ color: 'var(--error)' }}
                  onClick={() => handleRejectSubmission(selectedSubmission.id)}
                >
                  Reject
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => handleApproveSubmission(selectedSubmission.id)}
                >
                  Approve Submission
                </button>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
