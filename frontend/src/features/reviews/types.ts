/**
 * Reviews Types
 */

import type { 
  PanelReviewSubmission, 
  IndicatorReview,
  Review,
  AcceptedReview 
} from '@/lib/supabase/types'

export interface IndicatorAssessment {
  indicatorId: string
  // New STIF fields
  reviewStatus?: 'important' | 'not_important'
  impactLevel?: string
  stakeholderGroup?: string
  frequencyOfDisclosure?: string
  estimatedCostToCollect?: string
  // Original fields
  sme_size_band: string
  primary_sector: string
  primary_framework: string
  esg_class: string
  sdgs: number[]
  relevance: string
  regulatory_necessity: string
  operational_feasibility: string
  cost_to_collect: string
  misreporting_risk: string
  suggested_tier: string
  rationale: string
  optional_tags: string[]
  notes: string
}

export interface SubmissionWithReviews extends PanelReviewSubmission {
  indicatorReviews: IndicatorReview[]
}

export interface ReviewStats {
  total: number
  totalReviews: number
  pendingReviews: number
  approvedReviews: number
  rejectedReviews: number
  creditsEarned: number
}

export { PanelReviewSubmission, IndicatorReview, Review, AcceptedReview }

