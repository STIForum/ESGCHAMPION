/**
 * Reviews Service
 * Business logic for panel review submissions and indicator reviews
 */

import type { IReviewsRepository } from './repo.interface'
import type { 
  IndicatorAssessment, 
  SubmissionWithReviews,
  ReviewStats 
} from './types'
import type { 
  PanelReviewSubmission, 
  IndicatorReview,
  PanelReviewSubmissionInsert,
  IndicatorReviewInsert 
} from '@/lib/supabase/types'
import { ReviewStatus } from '@/lib/supabase/schema'

export class ReviewsService {
  constructor(private repository: IReviewsRepository) {}

  /**
   * Create a new panel review submission
   */
  async createSubmission(
    championId: string, 
    panelId: string
  ): Promise<PanelReviewSubmission> {
    const submission: PanelReviewSubmissionInsert = {
      champion_id: championId,
      panel_id: panelId,
      status: ReviewStatus.PENDING,
    }
    
    return this.repository.createSubmission(submission)
  }

  /**
   * Get a submission by ID
   */
  async getSubmission(id: string): Promise<PanelReviewSubmission | null> {
    return this.repository.getSubmission(id)
  }

  /**
   * Get a submission with all its indicator reviews
   */
  async getSubmissionWithReviews(id: string): Promise<SubmissionWithReviews | null> {
    return this.repository.getSubmissionWithReviews(id)
  }

  /**
   * Get all submissions for a user
   */
  async getUserSubmissions(userId: string): Promise<PanelReviewSubmission[]> {
    return this.repository.getUserSubmissions(userId)
  }

  /**
   * Get all submissions for admin review
   */
  async getAdminSubmissions(status?: string): Promise<PanelReviewSubmission[]> {
    return this.repository.getAdminSubmissions(status)
  }

  /**
   * Submit indicator reviews for a submission
   */
  async submitIndicatorReviews(
    submissionId: string,
    championId: string,
    assessments: IndicatorAssessment[]
  ): Promise<IndicatorReview[]> {
    const reviews: IndicatorReviewInsert[] = assessments.map(assessment => ({
      submission_id: submissionId,
      champion_id: championId,
      indicator_id: assessment.indicatorId,
      sme_size_band: assessment.sme_size_band || null,
      primary_sector: assessment.primary_sector || null,
      primary_framework: assessment.primary_framework || null,
      esg_class: assessment.esg_class || null,
      sdgs: assessment.sdgs || null,
      relevance: assessment.reviewStatus || assessment.relevance || null,
      regulatory_necessity: assessment.regulatory_necessity || null,
      operational_feasibility: assessment.operational_feasibility || null,
      cost_to_collect: assessment.estimatedCostToCollect || assessment.cost_to_collect || null,
      misreporting_risk: assessment.misreporting_risk || null,
      suggested_tier: assessment.suggested_tier || null,
      rationale: assessment.rationale || null,
      optional_tags: assessment.optional_tags || null,
      notes: assessment.notes || null,
    }))
    
    return this.repository.createIndicatorReviews(reviews)
  }

  /**
   * Update submission status
   */
  async updateSubmissionStatus(
    id: string, 
    status: string
  ): Promise<PanelReviewSubmission> {
    return this.repository.updateSubmissionStatus(id, status)
  }

  /**
   * Update an indicator review status (admin action)
   */
  async updateIndicatorReviewStatus(
    id: string, 
    status: string, 
    feedback?: string
  ): Promise<IndicatorReview> {
    return this.repository.updateIndicatorReviewStatus(id, status, feedback)
  }

  /**
   * Calculate review statistics for a submission
   */
  calculateReviewStats(reviews: IndicatorReview[]): ReviewStats {
    const total = reviews.length
    const approved = reviews.filter(r => r.status === ReviewStatus.APPROVED).length
    const rejected = reviews.filter(r => r.status === ReviewStatus.REJECTED).length
    const pending = reviews.filter(r => r.status === ReviewStatus.PENDING).length
    
    return {
      total,
      totalReviews: total,
      pendingReviews: pending,
      approvedReviews: approved,
      rejectedReviews: rejected,
      creditsEarned: approved * 10, // 10 credits per approved review
    }
  }

  /**
   * Check if all indicator reviews are complete
   */
  isSubmissionComplete(reviews: IndicatorReview[]): boolean {
    return reviews.every(r => 
      r.status === ReviewStatus.APPROVED || r.status === ReviewStatus.REJECTED
    )
  }

  /**
   * Determine overall submission status based on indicator reviews
   */
  determineOverallStatus(reviews: IndicatorReview[]): string {
    if (reviews.length === 0) return ReviewStatus.PENDING
    
    const allApproved = reviews.every(r => r.status === ReviewStatus.APPROVED)
    const anyRejected = reviews.some(r => r.status === ReviewStatus.REJECTED)
    const allComplete = this.isSubmissionComplete(reviews)
    
    if (allApproved) return ReviewStatus.APPROVED
    if (anyRejected && allComplete) return ReviewStatus.REJECTED
    if (allComplete) return ReviewStatus.APPROVED // Use approved when complete
    
    return ReviewStatus.PENDING
  }
}

// Import repo after class definition to avoid circular dependency
import { reviewsRepository } from './repo.supabase'
export const reviewsService = new ReviewsService(reviewsRepository)
