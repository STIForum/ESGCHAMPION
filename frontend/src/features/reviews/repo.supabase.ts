/**
 * Reviews Repository - Supabase Implementation
 */

import { supabase } from '@/lib/supabase/client'
import { Tables } from '@/lib/supabase/schema'
import type { 
  PanelReviewSubmission, 
  IndicatorReview,
  PanelReviewSubmissionInsert,
  IndicatorReviewInsert 
} from '@/lib/supabase/types'
import type { IReviewsRepository } from './repo.interface'
import type { SubmissionWithReviews } from './types'

export class ReviewsRepository implements IReviewsRepository {
  async createSubmission(data: PanelReviewSubmissionInsert): Promise<PanelReviewSubmission> {
    const { data: submission, error } = await supabase
      .from(Tables.PANEL_REVIEW_SUBMISSIONS)
      .insert(data)
      .select('*, panels(name, category)')
      .single()
    
    if (error) throw error
    return submission
  }

  async getSubmission(id: string): Promise<PanelReviewSubmission | null> {
    const { data, error } = await supabase
      .from(Tables.PANEL_REVIEW_SUBMISSIONS)
      .select('*, panels(name, category)')
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data
  }

  async getSubmissionWithReviews(id: string): Promise<SubmissionWithReviews | null> {
    const submission = await this.getSubmission(id)
    if (!submission) return null

    const indicatorReviews = await this.getIndicatorReviews(id)
    
    return {
      ...submission,
      indicatorReviews,
    }
  }

  async getUserSubmissions(userId: string): Promise<PanelReviewSubmission[]> {
    const { data, error } = await supabase
      .from(Tables.PANEL_REVIEW_SUBMISSIONS)
      .select('*, panels(name, category)')
      .eq('champion_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  async getAdminSubmissions(status?: string): Promise<PanelReviewSubmission[]> {
    let query = supabase
      .from(Tables.PANEL_REVIEW_SUBMISSIONS)
      .select('*, panels(name, category)')
      .order('created_at', { ascending: false })
    
    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  async updateSubmissionStatus(id: string, status: string): Promise<PanelReviewSubmission> {
    const { data, error } = await supabase
      .from(Tables.PANEL_REVIEW_SUBMISSIONS)
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, panels(name, category)')
      .single()
    
    if (error) throw error
    return data
  }

  async createIndicatorReviews(reviews: IndicatorReviewInsert[]): Promise<IndicatorReview[]> {
    const insertedReviews: IndicatorReview[] = []
    
    for (const review of reviews) {
      try {
        const { data, error } = await supabase
          .from(Tables.PANEL_REVIEW_INDICATOR_REVIEWS)
          .insert(review)
          .select('*, indicators(id, name, description)')
          .single()
        
        if (error) {
          console.error('Error inserting indicator review:', error)
          continue
        }
        
        insertedReviews.push(data)
      } catch (err) {
        console.error('Exception inserting review:', err)
      }
    }
    
    return insertedReviews
  }

  async getIndicatorReviews(submissionId: string): Promise<IndicatorReview[]> {
    const { data, error } = await supabase
      .from(Tables.PANEL_REVIEW_INDICATOR_REVIEWS)
      .select('*, indicators(id, name, description)')
      .eq('submission_id', submissionId)
    
    if (error) throw error
    return data || []
  }

  async updateIndicatorReviewStatus(
    id: string, 
    status: string, 
    feedback?: string
  ): Promise<IndicatorReview> {
    const { data, error } = await supabase
      .from(Tables.PANEL_REVIEW_INDICATOR_REVIEWS)
      .update({ 
        status, 
        feedback,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select('*, indicators(id, name, description)')
      .single()
    
    if (error) throw error
    return data
  }
}

export const reviewsRepository = new ReviewsRepository()
