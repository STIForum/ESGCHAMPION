/**
 * Reviews Repository Interface
 */

import type { 
  PanelReviewSubmission, 
  IndicatorReview,
  PanelReviewSubmissionInsert,
  IndicatorReviewInsert 
} from '@/lib/supabase/types'
import type { SubmissionWithReviews } from './types'

export interface IReviewsRepository {
  // Submissions
  createSubmission(data: PanelReviewSubmissionInsert): Promise<PanelReviewSubmission>
  getSubmission(id: string): Promise<PanelReviewSubmission | null>
  getSubmissionWithReviews(id: string): Promise<SubmissionWithReviews | null>
  getUserSubmissions(userId: string): Promise<PanelReviewSubmission[]>
  getAdminSubmissions(status?: string): Promise<PanelReviewSubmission[]>
  updateSubmissionStatus(id: string, status: string): Promise<PanelReviewSubmission>
  
  // Indicator Reviews
  createIndicatorReviews(reviews: IndicatorReviewInsert[]): Promise<IndicatorReview[]>
  getIndicatorReviews(submissionId: string): Promise<IndicatorReview[]>
  updateIndicatorReviewStatus(id: string, status: string, feedback?: string): Promise<IndicatorReview>
}
