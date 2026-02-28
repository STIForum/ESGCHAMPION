/**
 * Supabase Service
 * ESG Champions Platform
 * 
 * Core service wrapper for Supabase client interactions
 * 
 * NOTE: This file now uses the centralized client from src/lib/supabase/client.js
 * The client is created there with proper schema configuration.
 */

// =====================================================
// FRAMEWORK TYPES (Centralized Constants)
// =====================================================
// Primary organizing mechanism for panels and indicators
const FRAMEWORK_TYPES = {
    GRI: 'gri',
    ESRS: 'esrs',
    IFRS: 'ifrs'
};

// Framework display labels
const FRAMEWORK_LABELS = {
    gri: 'GRI',
    esrs: 'ESRS',
    ifrs: 'IFRS'
};

// All valid framework values
const VALID_FRAMEWORKS = Object.values(FRAMEWORK_TYPES);

// Export for global access
window.FRAMEWORK_TYPES = FRAMEWORK_TYPES;
window.FRAMEWORK_LABELS = FRAMEWORK_LABELS;
window.VALID_FRAMEWORKS = VALID_FRAMEWORKS;

// =====================================================
// ALLOWED FIELDS (Safe Payload Whitelisting)
// =====================================================
// These constants define which fields are allowed in insert/update operations
// to prevent injection of unexpected fields into the database.

const CHAMPION_FIELDS = [
    'id', 'full_name', 'email', 'avatar_url', 'job_title', 'company',
    'location', 'bio', 'linkedin_url', 'twitter_url', 'website_url',
    'credits', 'is_admin', 'is_active', 'last_login_at', 'email_notifications',
    'marketing_emails', 'review_reminders', 'mobile_number', 'office_phone'
];

const PANEL_FIELDS = [
    'id', 'name', 'description', 'category', 'icon', 'color',
    'order_index', 'is_active', 'impact_level', 'estimated_time',
    'difficulty_level', 'prerequisites', 'framework', 'primary_framework',
    'esg_classification', 'impact', 'purpose', 'unicode', 'related_sdgs'
];

const INDICATOR_FIELDS = [
    'id', 'panel_id', 'name', 'description', 'methodology', 'data_source',
    'category', 'order_index', 'is_active', 'difficulty_level', 'weight',
    'source_url', 'example_data', 'framework', 'primary_framework', 'esg_class',
    // Additional fields from database schema
    'unit', 'frequency', 'code', 'framework_version', 'why_it_matters',
    'impact_level', 'estimated_time', 'related_sdgs', 'validation_question',
    'response_type', 'tags', 'icon', 'formula_required'
];

const REVIEW_FIELDS = [
    'id', 'champion_id', 'indicator_id', 'rating', 'clarity_rating',
    'content', 'status', 'comments', 'admin_notes', 'relevance_rating',
    'measurability_rating', 'actionability_rating'
];

const PANEL_REVIEW_FIELDS = [
    'id', 'champion_id', 'panel_id', 'status', 'submitted_at',
    'reviewed_at', 'reviewer_id', 'admin_notes'
];

const COMMENT_FIELDS = [
    'id', 'review_id', 'champion_id', 'content', 'parent_id'
];

const USER_PROGRESS_FIELDS = [
    'champion_id', 'panel_id', 'indicator_id', 'last_indicator_id'
];

/**
 * Build a safe payload for database operations
 * Only includes explicitly allowed keys
 */
function buildSafeDbPayload(data, allowedKeys) {
    // Use centralized buildSafePayload if available
    if (typeof window.buildSafePayload === 'function') {
        return window.buildSafePayload(data, allowedKeys);
    }
    // Fallback implementation
    const payload = {};
    allowedKeys.forEach(key => {
        if (data[key] !== undefined) {
            payload[key] = data[key];
        }
    });
    return payload;
}

// Get Supabase client from centralized module (if available) or initialize here
let supabaseClient = null;

/**
 * Initialize the Supabase client
 * Uses centralized client from src/lib/supabase/client.js if available
 */
function initSupabase() {
    // Try to use centralized client first
    if (typeof window.getSupabaseClient === 'function') {
        supabaseClient = window.getSupabaseClient();
        if (supabaseClient) return supabaseClient;
    }
    
    // Fallback to direct initialization (backward compatibility)
    if (typeof SUPABASE_URL === 'undefined' || typeof SUPABASE_ANON_KEY === 'undefined') {
        console.error('Supabase configuration not found. Please check supabase-config.js');
        return null;
    }

    if (!supabaseClient) {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            db: { schema: 'public' }
        });
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
                // Redirect back to verify.html after the user clicks "Confirm your mail"
                emailRedirectTo: `${window.location.origin}/verify.html`
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
        const safeData = buildSafeDbPayload(championData, CHAMPION_FIELDS);
        const { data, error } = await this.client
            .from('champions')
            .upsert(safeData, { onConflict: 'id' })
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    /**
     * Update champion profile
     */
    async updateChampion(id, updates) {
        const safeUpdates = buildSafeDbPayload(updates, CHAMPION_FIELDS);
        const { data, error } = await this.client
            .from('champions')
            .update({ ...safeUpdates, updated_at: new Date().toISOString() })
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
    async getPanels({ includeInactive = false } = {}) {
        let query = this.client
            .from('panels')
            .select('*')
            .order('order_index');

        // Treat missing is_active as active so newly inserted rows without the flag still appear
        if (!includeInactive) {
            query = query.or('is_active.is.null,is_active.eq.true');
        }

        const { data, error } = await query;
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
        const safeData = buildSafeDbPayload(panelData, PANEL_FIELDS);
        const { data, error } = await this.client
            .from('panels')
            .insert(safeData)
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    /**
     * Update panel (admin only)
     */
    async updatePanel(id, updates) {
        const safeUpdates = buildSafeDbPayload(updates, PANEL_FIELDS);
        const { data, error } = await this.client
            .from('panels')
            .update({ ...safeUpdates, updated_at: new Date().toISOString() })
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
        const safeData = buildSafeDbPayload(indicatorData, INDICATOR_FIELDS);
        
        // Ensure related_sdgs is properly formatted as an array for PostgreSQL
        if (safeData.related_sdgs && !Array.isArray(safeData.related_sdgs)) {
            safeData.related_sdgs = [safeData.related_sdgs];
        }
        
        console.log('Creating indicator with data:', JSON.stringify(safeData, null, 2));
        
        const { data, error } = await this.client
            .from('indicators')
            .insert(safeData)
            .select()
            .single();
        
        if (error) {
            console.error('Supabase createIndicator error:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
            throw error;
        }
        return data;
    }

    /**
     * Update indicator (admin only)
     */
    async updateIndicator(id, updates) {
        const safeUpdates = buildSafeDbPayload(updates, INDICATOR_FIELDS);
        const { data, error } = await this.client
            .from('indicators')
            .update({ ...safeUpdates, updated_at: new Date().toISOString() })
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
        const safeData = buildSafeDbPayload(reviewData, REVIEW_FIELDS);
        const { data, error } = await this.client
            .from('reviews')
            .insert(safeData)
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
        const safeUpdates = buildSafeDbPayload(updates, REVIEW_FIELDS);
        const { data, error } = await this.client
            .from('reviews')
            .update({ ...safeUpdates, updated_at: new Date().toISOString() })
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
            const safeData = buildSafeDbPayload(commentData, COMMENT_FIELDS);
            const { data, error } = await this.client
                .from('comments')
                .insert(safeData)
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
        try {
            const { data, error } = await this.client
                .from('notifications')
                .select('*')
                .eq('champion_id', championId)
                .order('created_at', { ascending: false })
                .limit(limit);
            if (error) {
                // Table may not exist yet - return empty array
                console.warn('Notifications not available:', error.message);
                return [];
            }
            return data || [];
        } catch (err) {
            console.warn('Failed to load notifications:', err.message);
            return [];
        }
    }

    /**
     * Mark notification as read
     */
    async markNotificationRead(notificationId) {
        try {
            const { data, error } = await this.client.rpc('mark_notification_read', {
                p_notification_id: notificationId
            });
            if (error) {
                console.warn('Could not mark notification as read:', error.message);
                return false;
            }
            return data;
        } catch (err) {
            console.warn('markNotificationRead failed:', err.message);
            return false;
        }
    }

    /**
     * Mark all notifications as read
     */
    async markAllNotificationsRead() {
        try {
            const { data, error } = await this.client.rpc('mark_all_notifications_read');
            if (error) {
                console.warn('Could not mark all notifications as read:', error.message);
                return 0;
            }
            return data;
        } catch (err) {
            console.warn('markAllNotificationsRead failed:', err.message);
            return 0;
        }
    }

    /**
     * Get unread notification count
     */
    async getUnreadNotificationCount(championId) {
        try {
            const { data, error } = await this.client.rpc('get_unread_notification_count', {
                p_champion_id: championId
            });
            if (error) {
                console.warn('Could not get unread count:', error.message);
                return 0;
            }
            return data || 0;
        } catch (err) {
            console.warn('getUnreadNotificationCount failed:', err.message);
            return 0;
        }
    }

    /**
     * Create a notification for a champion
     */
    async createNotification(championId, type, title, message, link = null, data = null) {
        try {
            console.log('Creating notification:', { championId, type, title });
            
            const { data: result, error } = await this.client
                .from('notifications')
                .insert({
                    champion_id: championId,
                    type: type,
                    title: title,
                    message: message,
                    link: link,
                    data: data,
                    is_read: false
                })
                .select()
                .single();
            
            if (error) {
                console.error('Could not create notification:', error.message, error);
                return null;
            }
            console.log('Notification created successfully:', result?.id);
            return result;
        } catch (err) {
            console.error('createNotification failed:', err.message, err);
            return null;
        }
    }

    /**
     * Get notifications for a business user by auth user id
     */
    async getBusinessNotifications(authUserId, limit = 20) {
        try {
            const { data: businessUser, error: businessError } = await this.client
                .from('business_users')
                .select('id')
                .eq('auth_user_id', authUserId)
                .maybeSingle();

            if (businessError || !businessUser?.id) {
                return [];
            }

            const { data, error } = await this.client
                .from('business_notifications')
                .select('*')
                .eq('business_user_id', businessUser.id)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) {
                // Table may not exist yet - return empty and let UI fallback
                console.warn('Business notifications not available:', error.message);
                return [];
            }

            return data || [];
        } catch (err) {
            console.warn('Failed to load business notifications:', err.message);
            return [];
        }
    }

    /**
     * Mark business notification as read
     */
    async markBusinessNotificationRead(notificationId) {
        try {
            const { error } = await this.client
                .from('business_notifications')
                .update({ is_read: true, updated_at: new Date().toISOString() })
                .eq('id', notificationId);

            if (error) {
                console.warn('Could not mark business notification as read:', error.message);
                return false;
            }

            return true;
        } catch (err) {
            console.warn('markBusinessNotificationRead failed:', err.message);
            return false;
        }
    }

    /**
     * Mark all business notifications as read for auth user
     */
    async markAllBusinessNotificationsRead(authUserId) {
        try {
            const { data: businessUser, error: businessError } = await this.client
                .from('business_users')
                .select('id')
                .eq('auth_user_id', authUserId)
                .maybeSingle();

            if (businessError || !businessUser?.id) {
                return 0;
            }

            const { data, error } = await this.client
                .from('business_notifications')
                .update({ is_read: true, updated_at: new Date().toISOString() })
                .eq('business_user_id', businessUser.id)
                .eq('is_read', false)
                .select('id');

            if (error) {
                console.warn('Could not mark all business notifications as read:', error.message);
                return 0;
            }

            return (data || []).length;
        } catch (err) {
            console.warn('markAllBusinessNotificationsRead failed:', err.message);
            return 0;
        }
    }

    /**
     * Create notification for business user
     */
    async createBusinessNotification(businessUserId, type, title, message, link = null, data = null) {
        try {
            const { data: result, error } = await this.client
                .from('business_notifications')
                .insert({
                    business_user_id: businessUserId,
                    type,
                    title,
                    message,
                    link,
                    data,
                    is_read: false
                })
                .select()
                .single();

            if (error) {
                console.warn('Could not create business notification:', error.message);
                return null;
            }

            return result;
        } catch (err) {
            console.warn('createBusinessNotification failed:', err.message);
            return null;
        }
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
                champion_id: reviewerUserId,
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
    async addIndicatorReviewsToSubmission(submissionId, indicatorReviews, championId) {
        if (!indicatorReviews || indicatorReviews.length === 0) {
            console.warn('No indicator reviews to insert');
            return [];
        }

        console.log('=== ADDING INDICATOR REVIEWS ===');
        console.log('Submission ID:', submissionId);
        console.log('Champion ID:', championId);
        console.log('Raw indicator reviews:', JSON.stringify(indicatorReviews, null, 2));

        // Insert one by one for better error tracking
        const insertedReviews = [];
        
        for (const review of indicatorReviews) {
            const reviewData = {
                submission_id: submissionId,
                indicator_id: review.indicatorId,
                champion_id: championId,
                sme_size_band: review.sme_size_band || null,
                primary_sector: review.primary_sector || null,
                geographic_footprint: review.geographic_footprint || null,
                primary_framework: review.primary_framework || null,
                esg_class: review.esg_class || null,
                sdgs: review.sdgs || [],
                relevance: review.relevance || null,
                regulatory_necessity: review.regulatory_necessity || null,
                operational_feasibility: review.operational_feasibility || null,
                cost_to_collect: review.cost_to_collect || null,
                misreporting_risk: review.misreporting_risk || null,
                estimated_time: review.estimated_time || null,
                support_required: review.support_required || null,
                stakeholder_priority: review.stakeholder_priority || [],
                suggested_tier: review.suggested_tier || null,
                rationale: review.rationale || null,
                optional_tags: review.optional_tags || [],
                notes: review.notes || null,
                // Legacy fields for backward compatibility
                analysis: review.rationale || review.analysis || 'Structured assessment provided'
            };

            console.log('Inserting single review:', reviewData);

            try {
                const { data, error } = await this.client
                    .from('panel_review_indicator_reviews')
                    .insert(reviewData)
                    .select('*, indicators(name, description)')
                    .single();
                
                if (error) {
                    console.error('Error inserting indicator review:', error);
                    console.error('Review data that failed:', reviewData);
                    // Continue with other reviews but log the error
                    continue;
                }
                
                console.log('Successfully inserted review:', data);
                insertedReviews.push(data);
            } catch (err) {
                console.error('Exception inserting review:', err);
                console.error('Review data:', reviewData);
            }
        }
        
        console.log(`Inserted ${insertedReviews.length} of ${indicatorReviews.length} reviews`);
        return insertedReviews;
    }

    /**
     * Get all panel review submissions (for admin)
     */
    async getAdminPanelReviewSubmissions(status = null) {
        let query = this.client
            .from('panel_review_submissions')
            .select('*, panels(name, category)')
            .order('created_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;
        if (error) throw error;
        
        // Fetch champion details separately for each submission
        if (data && data.length > 0) {
            const userIds = [...new Set(data.map(s => s.champion_id))];
            const { data: champions } = await this.client
                .from('champions')
                .select('id, full_name, email')
                .in('id', userIds);
            
            const championsMap = {};
            if (champions) {
                champions.forEach(c => championsMap[c.id] = c);
            }
            
            // Attach champion data to submissions
            data.forEach(submission => {
                submission.champions = championsMap[submission.champion_id] || null;
            });
        }
        
        return data || [];
    }

    /**
     * Get a submission with its indicator reviews
     */
    async getSubmissionWithIndicatorReviews(submissionId) {
        // Get submission
        const { data: submission, error: subError } = await this.client
            .from('panel_review_submissions')
            .select('*, panels(name, category)')
            .eq('id', submissionId)
            .single();
        if (subError) throw subError;

        // Get champion details separately
        if (submission && submission.champion_id) {
            const { data: champion } = await this.client
                .from('champions')
                .select('id, full_name, email')
                .eq('id', submission.champion_id)
                .single();
            submission.champions = champion || null;
        }

        // Get indicator reviews
        const { data: indicatorReviews, error: revError } = await this.client
            .from('panel_review_indicator_reviews')
            .select('id, indicator_id, submission_id, clarity_rating, analysis, status, created_at, indicators(id, name, description)')
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
     * Approve submission with admin comment - updates both submission and indicator reviews
     */
    async approveSubmissionWithComment(submissionId, adminComment, adminId) {
        // Update the submission status to approved with admin notes
        const { data: submission, error: submissionError } = await this.client
            .from('panel_review_submissions')
            .update({ 
                status: 'approved',
                admin_notes: adminComment || null,
                reviewed_by: adminId || null,
                reviewed_at: new Date().toISOString()
            })
            .eq('id', submissionId)
            .select()
            .single();
        
        if (submissionError) throw submissionError;

        // Update all indicator reviews for this submission to 'accepted' status
        const { error: indicatorError } = await this.client
            .from('panel_review_indicator_reviews')
            .update({ 
                review_status: 'accepted',
                updated_at: new Date().toISOString()
            })
            .eq('submission_id', submissionId);
        
        if (indicatorError) {
            console.error('Error updating indicator reviews:', indicatorError);
            // Don't throw - submission was already updated
        }

        return submission;
    }

    /**
     * Reject submission with admin comment
     */
    async rejectSubmissionWithComment(submissionId, adminComment, adminId) {
        // Update the submission status to rejected with admin notes
        const { data: submission, error: submissionError } = await this.client
            .from('panel_review_submissions')
            .update({ 
                status: 'rejected',
                admin_notes: adminComment || null,
                reviewed_by: adminId || null,
                reviewed_at: new Date().toISOString()
            })
            .eq('id', submissionId)
            .select()
            .single();
        
        if (submissionError) throw submissionError;

        // Update all indicator reviews for this submission to 'rejected' status
        const { error: indicatorError } = await this.client
            .from('panel_review_indicator_reviews')
            .update({ 
                review_status: 'rejected',
                updated_at: new Date().toISOString()
            })
            .eq('submission_id', submissionId);
        
        if (indicatorError) {
            console.error('Error updating indicator reviews:', indicatorError);
        }

        return submission;
    }

    /**
     * Get user's panel review submissions
     */
    async getUserPanelReviewSubmissions(userId) {
        const { data, error } = await this.client
            .from('panel_review_submissions')
            .select('*, panels(name, category)')
            .or(`champion_id.eq.${userId},reviewer_user_id.eq.${userId}`)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    }

    /**
     * Get user's submitted indicator IDs for a specific panel
     * Returns indicator IDs that have been submitted (pending or accepted) by the user
     * These should be greyed out and not selectable again
     */
    async getUserSubmittedIndicatorIds(userId, panelId) {
        // Get all submissions for this user and panel that are pending or approved
        // (not rejected - rejected can be resubmitted)
        // Note: We check both champion_id and reviewer_user_id for compatibility
        const { data: submissions, error: subError } = await this.client
            .from('panel_review_submissions')
            .select('id, status')
            .eq('panel_id', panelId)
            .in('status', ['pending', 'approved'])
            .or(`champion_id.eq.${userId},reviewer_user_id.eq.${userId}`);
        
        if (subError) {
            console.error('Error fetching submissions:', subError);
            return [];
        }
        if (!submissions || submissions.length === 0) return [];

        const submissionIds = submissions.map(s => s.id);

        // Get all indicator reviews for these submissions
        const { data: indicatorReviews, error: indError } = await this.client
            .from('panel_review_indicator_reviews')
            .select('indicator_id, submission_id')
            .in('submission_id', submissionIds);
        
        if (indError) {
            console.error('Error fetching indicator reviews:', indError);
            return [];
        }
        
        // Return unique indicator IDs with their status
        const indicatorIds = [...new Set((indicatorReviews || []).map(r => r.indicator_id))];
        return indicatorIds;
    }

    /**
     * Get user's rejected indicator IDs for a specific panel
     * Returns indicator IDs that have been rejected by admin and can be resubmitted
     */
    async getUserRejectedIndicatorIds(userId, panelId) {
        // Get all rejected submissions for this user and panel
        const { data: submissions, error: subError } = await this.client
            .from('panel_review_submissions')
            .select('id, status, admin_notes')
            .eq('panel_id', panelId)
            .eq('status', 'rejected')
            .or(`champion_id.eq.${userId},reviewer_user_id.eq.${userId}`);
        
        if (subError) {
            console.error('Error fetching rejected submissions:', subError);
            return [];
        }
        if (!submissions || submissions.length === 0) return [];

        const submissionIds = submissions.map(s => s.id);

        // Get all indicator reviews for these rejected submissions
        const { data: indicatorReviews, error: indError } = await this.client
            .from('panel_review_indicator_reviews')
            .select('indicator_id, submission_id')
            .in('submission_id', submissionIds);
        
        if (indError) {
            console.error('Error fetching rejected indicator reviews:', indError);
            return [];
        }
        
        // Return unique indicator IDs
        const indicatorIds = [...new Set((indicatorReviews || []).map(r => r.indicator_id))];
        return indicatorIds;
    }

    /**
     * Get user's accepted indicator IDs for a specific panel (legacy - kept for compatibility)
     * Returns indicator IDs that have been submitted and accepted by admin
     */
    async getUserAcceptedIndicatorIds(userId, panelId) {
        // Now calls the new method that includes both pending and approved
        return await this.getUserSubmittedIndicatorIds(userId, panelId);
    }
}

// Create and export singleton instance
window.SupabaseService = SupabaseService;
window.supabaseService = new SupabaseService();

