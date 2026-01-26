/**
 * Database Types
 * 
 * TypeScript types for the Supabase database schema.
 * These provide type safety for all database operations.
 */

export interface Database {
  public: {
    Tables: {
      champions: {
        Row: Champion
        Insert: ChampionInsert
        Update: Partial<ChampionInsert>
      }
      panels: {
        Row: Panel
        Insert: PanelInsert
        Update: Partial<PanelInsert>
      }
      indicators: {
        Row: Indicator
        Insert: IndicatorInsert
        Update: Partial<IndicatorInsert>
      }
      reviews: {
        Row: Review
        Insert: ReviewInsert
        Update: Partial<ReviewInsert>
      }
      accepted_reviews: {
        Row: AcceptedReview
        Insert: AcceptedReviewInsert
        Update: Partial<AcceptedReviewInsert>
      }
      votes: {
        Row: Vote
        Insert: VoteInsert
        Update: Partial<VoteInsert>
      }
      panel_review_submissions: {
        Row: PanelReviewSubmission
        Insert: PanelReviewSubmissionInsert
        Update: Partial<PanelReviewSubmissionInsert>
      }
      panel_review_indicator_reviews: {
        Row: IndicatorReview
        Insert: IndicatorReviewInsert
        Update: Partial<IndicatorReviewInsert>
      }
    }
  }
}

// =====================================================
// ROW TYPES
// =====================================================

export interface Champion {
  id: string
  email: string
  full_name: string | null
  company: string | null
  job_title: string | null
  linkedin_url: string | null
  avatar_url: string | null
  bio: string | null
  is_admin: boolean
  is_verified: boolean
  credits: number
  total_reviews: number
  accepted_reviews_count: number
  cla_accepted: boolean
  nda_accepted: boolean
  cla_accepted_at: string | null
  nda_accepted_at: string | null
  last_active_panel_id: string | null
  last_active_indicator_id: string | null
  last_activity_at: string | null
  created_at: string
  updated_at: string
}

export interface Panel {
  id: string
  name: string
  description: string | null
  category: string | null
  icon: string | null
  color: string | null
  impact: string | null
  esg_classification: string | null
  primary_framework: string | null
  related_sdgs: string[] | null
  purpose: string | null
  unicode: string | null
  order_index: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Indicator {
  id: string
  panel_id: string
  name: string
  description: string | null
  methodology: string | null
  data_source: string | null
  unit: string | null
  frequency: string | null
  code: string | null
  primary_framework: string | null
  framework_version: string | null
  why_it_matters: string | null
  impact_level: string | null
  difficulty_level: string | null
  estimated_time: string | null
  esg_class: string | null
  related_sdgs: string[] | null
  validation_question: string | null
  response_type: string | null
  tags: string | null
  icon: string | null
  formula_required: boolean
  order_index: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Review {
  id: string
  champion_id: string
  indicator_id: string
  panel_id: string
  content: string
  rating: number | null
  status: 'pending' | 'approved' | 'rejected' | 'deleted'
  feedback: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  is_deleted: boolean
  deleted_at: string | null
  deleted_by: string | null
  created_at: string
  updated_at: string
}

export interface AcceptedReview {
  id: string
  original_review_id: string
  champion_id: string
  indicator_id: string
  panel_id: string
  content: string
  rating: number | null
  credits_awarded: number
  accepted_by: string
  accepted_at: string
  created_at: string
  updated_at: string
}

export interface Vote {
  id: string
  review_id: string
  champion_id: string
  vote_type: 'upvote' | 'downvote'
  created_at: string
}

export interface PanelReviewSubmission {
  id: string
  panel_id: string
  champion_id: string
  status: 'pending' | 'approved' | 'rejected' | 'partial'
  submitted_at: string
  reviewed_by: string | null
  reviewed_at: string | null
  admin_notes: string | null
  created_at: string
  updated_at: string
  // Joined data
  panels?: Panel
}

export interface IndicatorReview {
  id: string
  submission_id: string
  indicator_id: string
  champion_id: string
  sme_size_band: string | null
  primary_sector: string | null
  primary_framework: string | null
  esg_class: string | null
  sdgs: number[] | null
  relevance: string | null
  regulatory_necessity: string | null
  operational_feasibility: string | null
  cost_to_collect: string | null
  misreporting_risk: string | null
  suggested_tier: string | null
  rationale: string | null
  optional_tags: string[] | null
  notes: string | null
  analysis: string | null
  status: 'pending' | 'approved' | 'rejected'
  feedback: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
  // Extended STIF fields
  review_status: string | null
  impact_level: string | null
  stakeholder_group: string | null
  frequency_of_disclosure: string | null
  estimated_cost_to_collect: string | null
  // Joined data
  indicators?: Indicator
}

// =====================================================
// INSERT TYPES
// =====================================================

export interface ChampionInsert {
  id?: string
  email: string
  full_name?: string | null
  company?: string | null
  job_title?: string | null
  linkedin_url?: string | null
  avatar_url?: string | null
  bio?: string | null
  is_admin?: boolean
  is_verified?: boolean
  credits?: number
  cla_accepted?: boolean
  nda_accepted?: boolean
}

export interface PanelInsert {
  name: string
  description?: string | null
  category?: string | null
  icon?: string | null
  color?: string | null
  impact?: string | null
  esg_classification?: string | null
  primary_framework?: string | null
  order_index?: number
  is_active?: boolean
}

export interface IndicatorInsert {
  panel_id: string
  name: string
  description?: string | null
  methodology?: string | null
  code?: string | null
  primary_framework?: string | null
  impact_level?: string | null
  difficulty_level?: string | null
  esg_class?: string | null
  order_index?: number
  is_active?: boolean
}

export interface ReviewInsert {
  champion_id: string
  indicator_id: string
  panel_id: string
  content: string
  rating?: number | null
  status?: 'pending' | 'approved' | 'rejected' | 'deleted'
}

export interface AcceptedReviewInsert {
  original_review_id: string
  champion_id: string
  indicator_id: string
  panel_id: string
  content: string
  rating?: number | null
  credits_awarded?: number
  accepted_by: string
}

export interface VoteInsert {
  review_id: string
  champion_id: string
  vote_type: 'upvote' | 'downvote'
}

export interface PanelReviewSubmissionInsert {
  panel_id: string
  champion_id: string
  status?: 'pending' | 'approved' | 'rejected' | 'partial'
}

export interface IndicatorReviewInsert {
  submission_id: string
  indicator_id: string
  champion_id: string
  sme_size_band?: string | null
  primary_sector?: string | null
  primary_framework?: string | null
  esg_class?: string | null
  sdgs?: number[] | null
  relevance?: string | null
  regulatory_necessity?: string | null
  operational_feasibility?: string | null
  cost_to_collect?: string | null
  misreporting_risk?: string | null
  suggested_tier?: string | null
  rationale?: string | null
  optional_tags?: string[] | null
  notes?: string | null
  analysis?: string | null
}
