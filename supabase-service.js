/**
 * Supabase Service
 * ESG Champions Platform
 * 
 * Core service wrapper for Supabase client interactions
 */

// Initialize Supabase client
let supabaseClient = null;

/**
 * Initialize the Supabase client
 */
function initSupabase() {
    if (typeof SUPABASE_URL === 'undefined' || typeof SUPABASE_ANON_KEY === 'undefined') {
        console.error('Supabase configuration not found. Please check supabase-config.js');
        return null;
    }

    if (!supabaseClient) {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    return supabaseClient;
}

/**
 * Get the Supabase client instance
 */
function getSupabase() {
    if (!supabaseClient) {
        return initSupabase();
    }
    return supabaseClient;
}

// Export for window access
window.supabaseClient = null;
window.getSupabase = getSupabase;
window.initSupabase = initSupabase;

/**
 * SupabaseService - Main service class
 */
class SupabaseService {
    constructor() {
        this.client = getSupabase();
    }

    // =====================================================
    // AUTHENTICATION
    // =====================================================

    /**
     * Get current user session
     */
    async getSession() {
        const { data: { session }, error } = await this.client.auth.getSession();
        if (error) throw error;
        return session;
    }

    /**
     * Get current user
     */
    async getUser() {
        const { data: { user }, error } = await this.client.auth.getUser();
        if (error) throw error;
        return user;
    }

    /**
     * Sign up with email and password
     */
    async signUp(email, password, metadata = {}) {
        const { data, error } = await this.client.auth.signUp({
            email,
            password,
            options: {
                data: metadata,
                emailRedirectTo: `${window.location.origin}/champion-dashboard.html`
            }
        });
        if (error) throw error;
        return data;
    }

    /**
     * Sign in with email and password
     */
    async signIn(email, password) {
        const { data, error } = await this.client.auth.signInWithPassword({
            email,
            password
        });
        if (error) throw error;
        return data;
    }

    /**
     * Sign in with OAuth (LinkedIn)
     */
    async signInWithOAuth(provider) {
        const { data, error } = await this.client.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${window.location.origin}/linkedin-callback.html`
            }
        });
        if (error) throw error;
        return data;
    }

    /**
     * Sign out
     */
    async signOut() {
        const { error } = await this.client.auth.signOut();
        if (error) throw error;
    }

    /**
     * Reset password
     */
    async resetPassword(email) {
        const { data, error } = await this.client.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password.html`
        });
        if (error) throw error;
        return data;
    }

    /**
     * Update password
     */
    async updatePassword(newPassword) {
        const { data, error } = await this.client.auth.updateUser({
            password: newPassword
        });
        if (error) throw error;
        return data;
    }

    /**
     * Listen for auth state changes
     */
    onAuthStateChange(callback) {
        return this.client.auth.onAuthStateChange((event, session) => {
            callback(event, session);
        });
    }

    // =====================================================
    // CHAMPIONS (Users)
    // =====================================================

    /**
     * Get champion by ID
     */
    async getChampion(id) {
        try {
            const { data, error } = await this.client
                .from('champions')
                .select('*')
                .eq('id', id)
                .single();
            if (error) {
                console.warn('getChampion error:', error.message);
                // Return a default champion object to prevent crashes
                return { id, credits: 0, full_name: '', email: '' };
            }
            return data;
        } catch (err) {
            console.warn('getChampion failed:', err.message);
            return { id, credits: 0, full_name: '', email: '' };
        }
    }

    /**
     * Get champion by email
     */
    async getChampionByEmail(email) {
        const { data, error } = await this.client
            .from('champions')
            .select('*')
            .eq('email', email)
            .single();
        if (error) throw error;
        return data;
    }

    /**
     * Create or update champion profile
     */
    async upsertChampion(championData) {
        const { data, error } = await this.client
            .from('champions')
            .upsert(championData, { onConflict: 'id' })
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    /**
     * Update champion profile
     */
    async updateChampion(id, updates) {
        const { data, error } = await this.client
            .from('champions')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    /**
     * Get all champions (for ranking)
     */
    async getChampions(options = {}) {
        let query = this.client
            .from('champions')
            .select('*');

        if (options.orderBy) {
            query = query.order(options.orderBy, { ascending: options.ascending ?? false });
        }

        if (options.limit) {
            query = query.limit(options.limit);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    }

    /**
     * Get champion leaderboard
     */
    async getLeaderboard(limit = 50, period = '30days') {
        let query = this.client
            .from('champions')
            .select('id, full_name, avatar_url, credits, accepted_reviews_count, company')
            .order('credits', { ascending: false })
            .limit(limit);

        const { data, error } = await query;
        if (error) throw error;
        return data;
    }

    // =====================================================
    // PANELS
    // =====================================================

    /**
     * Get all active panels
     */
    async getPanels() {
        const { data, error } = await this.client
            .from('panels')
            .select('*')
            .eq('is_active', true)
            .order('order_index');
        if (error) throw error;
        return data;
    }

    /**
     * Get panel by ID
     */
    async getPanel(id) {
        const { data, error } = await this.client
            .from('panels')
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw error;
        return data;
    }

    /**
     * Create panel (admin only)
     */
    async createPanel(panelData) {
        const { data, error } = await this.client
            .from('panels')
            .insert(panelData)
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    /**
     * Update panel (admin only)
     */
    async updatePanel(id, updates) {
        const { data, error } = await this.client
            .from('panels')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    // =====================================================
    // INDICATORS
    // =====================================================

    /**
     * Get indicators for a panel
     */
    async getIndicatorsByPanel(panelId) {
        const { data, error } = await this.client
            .from('indicators')
            .select('*')
            .eq('panel_id', panelId)
            .eq('is_active', true)
            .order('order_index');
        if (error) throw error;
        return data;
    }

    /**
     * Get indicator by ID
     */
    async getIndicator(id) {
        const { data, error } = await this.client
            .from('indicators')
            .select('*, panels(*)')
            .eq('id', id)
            .single();
        if (error) throw error;
        return data;
    }

    /**
     * Get all indicators
     */
    async getAllIndicators() {
        try {
            const { data, error } = await this.client
                .from('indicators')
                .select('*, panels(name, category)')
                .eq('is_active', true)
                .order('order_index');
            if (error) {
                console.warn('getAllIndicators error:', error.message);
                return [];
            }
            return data || [];
        } catch (err) {
            console.warn('getAllIndicators failed:', err.message);
            return [];
        }
    }

    /**
     * Get indicators by their IDs
     */
    async getIndicatorsByIds(ids) {
        if (!ids || ids.length === 0) return [];
        try {
            const { data, error } = await this.client
                .from('indicators')
                .select('*, panels(name, category)')
                .in('id', ids)
                .eq('is_active', true)
                .order('order_index');
            if (error) {
                console.warn('getIndicatorsByIds error:', error.message);
                return [];
            }
            return data || [];
        } catch (err) {
            console.warn('getIndicatorsByIds failed:', err.message);
            return [];
        }
    }

    /**
     * Create indicator (admin only)
     */
    async createIndicator(indicatorData) {
        const { data, error } = await this.client
            .from('indicators')
            .insert(indicatorData)
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    /**
     * Update indicator (admin only)
     */
    async updateIndicator(id, updates) {
        const { data, error } = await this.client
            .from('indicators')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    // =====================================================
    // REVIEWS
    // =====================================================

    /**
     * Create a review
     */
    async createReview(reviewData) {
        const { data, error } = await this.client
            .from('reviews')
            .insert(reviewData)
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    /**
     * Get reviews for an indicator
     */
    async getReviewsByIndicator(indicatorId) {
        try {
            const { data, error } = await this.client
                .from('reviews')
                .select('*')
                .eq('indicator_id', indicatorId)
                .order('created_at', { ascending: false });
            if (error) {
                console.warn('getReviewsByIndicator error:', error.message);
                return [];
            }
            return data || [];
        } catch (err) {
            console.warn('getReviewsByIndicator failed:', err.message);
            return [];
        }
    }

    /**
     * Get reviews by champion
     */
    async getReviewsByChampion(championId) {
        try {
            // Try with is_deleted filter first
            const { data, error } = await this.client
                .from('reviews')
                .select('*, indicators(name), panels(name, category)')
                .eq('champion_id', championId)
                .order('created_at', { ascending: false });
            
            if (error) {
                console.warn('getReviewsByChampion error:', error.message);
                return [];
            }
            return data || [];
        } catch (err) {
            console.warn('getReviewsByChampion failed:', err.message);
            return [];
        }
    }

    /**
     * Get pending reviews (admin)
     */
    async getPendingReviews() {
        try {
            const { data, error } = await this.client
                .from('reviews')
                .select('*, indicators(name), panels(name, category)')
                .eq('status', 'pending')
                .order('created_at', { ascending: true });
            if (error) {
                console.warn('getPendingReviews error:', error.message);
                return [];
            }
            return data || [];
        } catch (err) {
            console.warn('getPendingReviews failed:', err.message);
            return [];
        }
    }

    /**
     * Accept a review (admin)
     */
    async acceptReview(reviewId, adminId) {
        const { data, error } = await this.client.rpc('accept_review', {
            review_id: reviewId,
            admin_id: adminId
        });
        if (error) throw error;
        return data;
    }

    /**
     * Delete a review (admin)
     */
    async deleteReview(reviewId, adminId, reason = null) {
        const { data, error } = await this.client.rpc('delete_review', {
            review_id: reviewId,
            admin_id: adminId,
            reason: reason
        });
        if (error) throw error;
        return data;
    }

    /**
     * Update review
     */
    async updateReview(id, updates) {
        const { data, error } = await this.client
            .from('reviews')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    // =====================================================
    // VOTES
    // =====================================================

    /**
     * Vote on a review
     */
    async vote(reviewId, championId, voteType) {
        const { data, error } = await this.client
            .from('votes')
            .upsert({
                review_id: reviewId,
                champion_id: championId,
                vote_type: voteType
            }, { onConflict: 'review_id,champion_id' })
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    /**
     * Remove vote
     */
    async removeVote(reviewId, championId) {
        const { error } = await this.client
            .from('votes')
            .delete()
            .eq('review_id', reviewId)
            .eq('champion_id', championId);
        if (error) throw error;
    }

    /**
     * Get votes for a review
     */
    async getVotes(reviewId) {
        const { data, error } = await this.client
            .from('votes')
            .select('*')
            .eq('review_id', reviewId);
        if (error) throw error;
        return data;
    }

    // =====================================================
    // COMMENTS
    // =====================================================

    /**
     * Create a comment
     */
    async createComment(commentData) {
        try {
            const { data, error } = await this.client
                .from('comments')
                .insert(commentData)
                .select('*')
                .single();
            if (error) {
                console.warn('createComment error:', error.message);
                return null;
            }
            return data;
        } catch (err) {
            console.warn('createComment failed:', err.message);
            return null;
        }
    }

    /**
     * Get comments for a review
     */
    async getComments(reviewId) {
        try {
            const { data, error } = await this.client
                .from('comments')
                .select('*')
                .eq('review_id', reviewId)
                .order('created_at', { ascending: true });
            if (error) {
                console.warn('getComments error:', error.message);
                return [];
            }
            return data || [];
        } catch (err) {
            console.warn('getComments failed:', err.message);
            return [];
        }
    }

    // =====================================================
    // NOTIFICATIONS
    // =====================================================

    /**
     * Get notifications for a champion
     */
    async getNotifications(championId, limit = 20) {
        const { data, error } = await this.client
            .from('notifications')
            .select('*')
            .eq('champion_id', championId)
            .order('created_at', { ascending: false })
            .limit(limit);
        if (error) throw error;
        return data;
    }

    /**
     * Mark notification as read
     */
    async markNotificationRead(notificationId) {
        const { data, error } = await this.client.rpc('mark_notification_read', {
            p_notification_id: notificationId
        });
        if (error) throw error;
        return data;
    }

    /**
     * Mark all notifications as read
     */
    async markAllNotificationsRead() {
        const { data, error } = await this.client.rpc('mark_all_notifications_read');
        if (error) throw error;
        return data;
    }

    /**
     * Get unread notification count
     */
    async getUnreadNotificationCount(championId) {
        const { data, error } = await this.client.rpc('get_unread_notification_count', {
            p_champion_id: championId
        });
        if (error) throw error;
        return data;
    }

    // =====================================================
    // PROGRESS TRACKING
    // =====================================================

    /**
     * Log champion activity
     */
    async logActivity(championId, activityType, panelId = null, indicatorId = null, reviewId = null, metadata = null) {
        const { data, error } = await this.client.rpc('log_champion_activity', {
            p_champion_id: championId,
            p_activity_type: activityType,
            p_panel_id: panelId,
            p_indicator_id: indicatorId,
            p_review_id: reviewId,
            p_metadata: metadata
        });
        if (error) throw error;
        return data;
    }

    /**
     * Get champion resume point
     */
    async getResumePoint(championId) {
        try {
            const { data, error } = await this.client.rpc('get_champion_resume_point', {
                p_champion_id: championId
            });
            // Don't throw on error - RPC function may not exist
            if (error) {
                console.warn('getResumePoint RPC not available:', error.message);
                return null;
            }
            return data?.[0] || null;
        } catch (err) {
            console.warn('getResumePoint failed:', err.message);
            return null;
        }
    }

    /**
     * Update champion progress
     */
    async updateProgress(championId, panelId, indicatorId) {
        const { data, error } = await this.client.rpc('update_champion_progress', {
            p_champion_id: championId,
            p_panel_id: panelId,
            p_indicator_id: indicatorId
        });
        if (error) throw error;
        return data;
    }

    // =====================================================
    // ACCEPTED REVIEWS
    // =====================================================

    /**
     * Get accepted reviews
     */
    async getAcceptedReviews(options = {}) {
        try {
            // Simplified query without ambiguous joins
            let query = this.client
                .from('accepted_reviews')
                .select('*, indicators(name), panels(name, category)');

            if (options.championId) {
                query = query.eq('champion_id', options.championId);
            }

            if (options.limit) {
                query = query.limit(options.limit);
            }

            query = query.order('accepted_at', { ascending: false });

            const { data, error } = await query;
            if (error) {
                // Table might not exist yet
                console.warn('getAcceptedReviews error:', error.message);
                return [];
            }
            return data || [];
        } catch (err) {
            console.warn('getAcceptedReviews failed:', err.message);
            return [];
        }
    }

    // =====================================================
    // ADMIN
    // =====================================================

    /**
     * Check if user is admin
     */
    async isAdmin(userId) {
        const { data, error } = await this.client
            .from('champions')
            .select('is_admin')
            .eq('id', userId)
            .single();
        if (error) return false;
        return data?.is_admin ?? false;
    }

    /**
     * Get admin actions log
     */
    async getAdminActions(limit = 100) {
        const { data, error } = await this.client
            .from('admin_actions')
            .select('*, champions!admin_id(full_name)')
            .order('created_at', { ascending: false })
            .limit(limit);
        if (error) throw error;
        return data;
    }

    /**
     * Log admin action
     */
    async logAdminAction(adminId, actionType, targetType, targetId, details = {}) {
        const { data, error } = await this.client
            .from('admin_actions')
            .insert({
                admin_id: adminId,
                action_type: actionType,
                target_type: targetType,
                target_id: targetId,
                details
            })
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    // =====================================================
    // PANEL REVIEW SUBMISSIONS
    // =====================================================

    /**
     * Create a panel review submission
     */
    async createPanelReviewSubmission(panelId, reviewerUserId) {
        const { data, error } = await this.client
            .from('panel_review_submissions')
            .insert({
                panel_id: panelId,
                reviewer_user_id: reviewerUserId,
                status: 'pending'
            })
            .select('*, panels(name, category)')
            .single();
        if (error) throw error;
        return data;
    }

    /**
     * Add indicator reviews to a submission
     */
    async addIndicatorReviewsToSubmission(submissionId, indicatorReviews) {
        const reviewsWithSubmissionId = indicatorReviews.map(review => ({
            submission_id: submissionId,
            indicator_id: review.indicatorId,
            is_necessary: review.isNecessary,
            clarity_rating: review.clarityRating,
            analysis: review.analysis
        }));

        const { data, error } = await this.client
            .from('panel_review_indicator_reviews')
            .insert(reviewsWithSubmissionId)
            .select('*, indicators(name, description)');
        if (error) throw error;
        return data;
    }

    /**
     * Get all panel review submissions (for admin)
     */
    async getAdminPanelReviewSubmissions(status = null) {
        let query = this.client
            .from('panel_review_submissions')
            .select('*, panels(name, category), champions:reviewer_user_id(id, full_name, email)')
            .order('created_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    }

    /**
     * Get a submission with its indicator reviews
     */
    async getSubmissionWithIndicatorReviews(submissionId) {
        // Get submission
        const { data: submission, error: subError } = await this.client
            .from('panel_review_submissions')
            .select('*, panels(name, category), champions:reviewer_user_id(id, full_name, email)')
            .eq('id', submissionId)
            .single();
        if (subError) throw subError;

        // Get indicator reviews
        const { data: indicatorReviews, error: revError } = await this.client
            .from('panel_review_indicator_reviews')
            .select('*, indicators(id, name, description, panels(name, category))')
            .eq('submission_id', submissionId);
        if (revError) throw revError;

        return {
            ...submission,
            indicatorReviews: indicatorReviews || []
        };
    }

    /**
     * Update submission status (admin only)
     */
    async updateSubmissionStatus(submissionId, status) {
        const { data, error } = await this.client
            .from('panel_review_submissions')
            .update({ status })
            .eq('id', submissionId)
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    /**
     * Get user's panel review submissions
     */
    async getUserPanelReviewSubmissions(userId) {
        const { data, error } = await this.client
            .from('panel_review_submissions')
            .select('*, panels(name, category)')
            .eq('reviewer_user_id', userId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    }
}

// Create and export singleton instance
window.SupabaseService = SupabaseService;
window.supabaseService = new SupabaseService();

