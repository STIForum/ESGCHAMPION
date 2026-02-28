/**
 * Supabase Service
 * ESG Champions Platform
 * 
 * Core service wrapper for Supabase client interactions
 */

// =====================================================
// FRAMEWORK TYPES (Centralized Constants)
// =====================================================
const FRAMEWORK_TYPES = {
    GRI: 'gri',
    ESRS: 'esrs',
    IFRS: 'ifrs'
};

const FRAMEWORK_LABELS = {
    gri: 'GRI',
    esrs: 'ESRS',
    ifrs: 'IFRS'
};

const VALID_FRAMEWORKS = Object.values(FRAMEWORK_TYPES);

// Export for global access
window.FRAMEWORK_TYPES = FRAMEWORK_TYPES;
window.FRAMEWORK_LABELS = FRAMEWORK_LABELS;
window.VALID_FRAMEWORKS = VALID_FRAMEWORKS;

// =====================================================
// ALLOWED FIELDS (Safe Payload Whitelisting)
// =====================================================
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
 */
function buildSafeDbPayload(data, allowedKeys) {
    const payload = {};
    allowedKeys.forEach(key => {
        if (data[key] !== undefined) {
            payload[key] = data[key];
        }
    });
    return payload;
}

// Supabase client instance
let supabaseClient = null;

/**
 * Initialize Supabase client safely
 */
function initSupabase() {
    console.log('Initializing Supabase client...');
    
    // Check dependencies
    if (typeof supabase === 'undefined') {
        console.error('Supabase library not loaded');
        return null;
    }
    
    if (typeof SUPABASE_URL === 'undefined' || typeof SUPABASE_ANON_KEY === 'undefined') {
        console.error('Supabase configuration not found');
        return null;
    }

    try {
        if (!supabaseClient) {
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                db: { schema: 'public' }
            });
            console.log('Supabase client initialized successfully');
        }
        return supabaseClient;
    } catch (error) {
        console.error('Failed to initialize Supabase client:', error);
        return null;
    }
}

/**
 * Get Supabase client instance
 */
function getSupabase() {
    if (!supabaseClient) {
        return initSupabase();
    }
    return supabaseClient;
}

// Export for global access
window.getSupabase = getSupabase;
window.initSupabase = initSupabase;

/**
 * SupabaseService - Main service class
 */
class SupabaseService {
    constructor() {
        this.client = null;
        this.initPromise = this.initialize();
    }

    async initialize() {
        try {
            this.client = getSupabase();
            if (!this.client) {
                console.warn('Supabase client not available during initialization');
            }
        } catch (error) {
            console.error('SupabaseService initialization error:', error);
        }
    }

    async ensureInitialized() {
        await this.initPromise;
        if (!this.client) {
            this.client = getSupabase();
        }
        if (!this.client) {
            throw new Error('Supabase client not initialized');
        }
    }

    // =====================================================
    // AUTHENTICATION
    // =====================================================

    async getSession() {
        await this.ensureInitialized();
        const { data: { session }, error } = await this.client.auth.getSession();
        if (error) throw error;
        return session;
    }

    async getUser() {
        await this.ensureInitialized();
        const { data: { user }, error } = await this.client.auth.getUser();
        if (error) throw error;
        return user;
    }

    async signUp(email, password, metadata = {}) {
        await this.ensureInitialized();
        
        const redirectUrl = `${window.location.origin}/champion-login.html?confirmed=true`;
        console.log('Sign up redirect URL:', redirectUrl);
        
        const { data, error } = await this.client.auth.signUp({
            email,
            password,
            options: {
                data: metadata,
                emailRedirectTo: redirectUrl
            }
        });
        if (error) throw error;
        return data;
    }

    async signIn(email, password) {
        await this.ensureInitialized();
        const { data, error } = await this.client.auth.signInWithPassword({
            email,
            password
        });
        if (error) throw error;
        return data;
    }

    async signInWithOAuth(provider) {
        await this.ensureInitialized();
        const { data, error } = await this.client.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${window.location.origin}/linkedin-callback.html`
            }
        });
        if (error) throw error;
        return data;
    }

    async signOut() {
        await this.ensureInitialized();
        const { error } = await this.client.auth.signOut();
        if (error) throw error;
    }

    async resetPassword(email) {
        await this.ensureInitialized();
        const { data, error } = await this.client.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password.html`
        });
        if (error) throw error;
        return data;
    }

    async updatePassword(newPassword) {
        await this.ensureInitialized();
        const { data, error } = await this.client.auth.updateUser({
            password: newPassword
        });
        if (error) throw error;
        return data;
    }

    onAuthStateChange(callback) {
        // Use setTimeout to ensure client is initialized
        setTimeout(async () => {
            try {
                await this.ensureInitialized();
                return this.client.auth.onAuthStateChange((event, session) => {
                    callback(event, session);
                });
            } catch (error) {
                console.error('Error setting up auth state change listener:', error);
            }
        }, 100);
    }

    // =====================================================
    // CHAMPIONS (Users)
    // =====================================================

    async getChampion(id) {
        try {
            await this.ensureInitialized();
            const { data, error } = await this.client
                .from('champions')
                .select('*')
                .eq('id', id)
                .single();
            if (error) {
                console.warn('getChampion error:', error.message);
                return { id, credits: 0, full_name: '', email: '' };
            }
            return data;
        } catch (err) {
            console.warn('getChampion failed:', err.message);
            return { id, credits: 0, full_name: '', email: '' };
        }
    }

    async getChampionByEmail(email) {
        await this.ensureInitialized();
        const { data, error } = await this.client
            .from('champions')
            .select('*')
            .eq('email', email)
            .single();
        if (error) throw error;
        return data;
    }

    async upsertChampion(championData) {
        await this.ensureInitialized();
        const safeData = buildSafeDbPayload(championData, CHAMPION_FIELDS);
        const { data, error } = await this.client
            .from('champions')
            .upsert(safeData, { onConflict: 'id' })
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    async updateChampion(id, updates) {
        await this.ensureInitialized();
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

    async getChampions(options = {}) {
        await this.ensureInitialized();
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

    async getLeaderboard(limit = 50, period = '30days') {
        await this.ensureInitialized();
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

    async getPanels({ includeInactive = false } = {}) {
        await this.ensureInitialized();
        let query = this.client
            .from('panels')
            .select('*')
            .order('order_index');

        if (!includeInactive) {
            query = query.or('is_active.is.null,is_active.eq.true');
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    }

    async getPanel(id) {
        await this.ensureInitialized();
        const { data, error } = await this.client
            .from('panels')
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw error;
        return data;
    }

    async createPanel(panelData) {
        await this.ensureInitialized();
        const safeData = buildSafeDbPayload(panelData, PANEL_FIELDS);
        const { data, error } = await this.client
            .from('panels')
            .insert(safeData)
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    async updatePanel(id, updates) {
        await this.ensureInitialized();
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
    // ACTIVITY LOGGING
    // =====================================================

    async logActivity(championId, activityType, panelId = null, indicatorId = null, reviewId = null, metadata = null) {
        try {
            await this.ensureInitialized();
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
        } catch (err) {
            console.warn('logActivity failed:', err.message);
            return null;
        }
    }

    // =====================================================
    // NOTIFICATIONS  
    // =====================================================

    async createNotification(championId, type, title, message, link = null, data = null) {
        try {
            await this.ensureInitialized();
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
                console.error('Could not create notification:', error.message);
                return null;
            }
            console.log('Notification created successfully:', result?.id);
            return result;
        } catch (err) {
            console.error('createNotification failed:', err.message);
            return null;
        }
    }
}

// Create and export singleton instance
let serviceInstance = null;

// Initialize service when DOM is ready or immediately if already ready
function initializeService() {
    if (!serviceInstance) {
        serviceInstance = new SupabaseService();
        window.supabaseService = serviceInstance;
    }
    return serviceInstance;
}

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeService);
} else {
    initializeService();
}

// Export classes and functions
window.SupabaseService = SupabaseService;
window.buildSafeDbPayload = buildSafeDbPayload;

// Fallback initialization for immediate access
setTimeout(initializeService, 0);
