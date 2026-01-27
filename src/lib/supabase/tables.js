/**
 * Database Table & Column Constants
 * ESG Champions Platform
 * 
 * Centralized table and column names to prevent typos and enable refactoring.
 */

const TABLES = {
    CHAMPIONS: 'champions',
    PANELS: 'panels',
    INDICATORS: 'indicators',
    PANEL_INDICATORS: 'panel_indicators',
    REVIEWS: 'reviews',
    INDICATOR_REVIEWS: 'indicator_reviews',
    PANEL_REVIEW_SUBMISSIONS: 'panel_review_submissions',
    VOTES: 'votes',
    NOTIFICATIONS: 'notifications',
    USER_PROGRESS: 'user_progress',
};

const COLUMNS = {
    // Common columns
    ID: 'id',
    CREATED_AT: 'created_at',
    UPDATED_AT: 'updated_at',
    
    // Champions
    CHAMPION: {
        EMAIL: 'email',
        FULL_NAME: 'full_name',
        COMPANY: 'company',
        JOB_TITLE: 'job_title',
        AVATAR_URL: 'avatar_url',
        IS_ADMIN: 'is_admin',
        IS_VERIFIED: 'is_verified',
        CONTRIBUTION_SCORE: 'contribution_score',
        TOTAL_REVIEWS: 'total_reviews',
        ACCEPTED_REVIEWS: 'accepted_reviews',
        CLA_ACCEPTED: 'cla_accepted',
        NDA_ACCEPTED: 'nda_accepted',
    },
    
    // Panels
    PANEL: {
        NAME: 'name',
        DESCRIPTION: 'description',
        CATEGORY: 'category',
        IS_ACTIVE: 'is_active',
        IMPACT_LEVEL: 'impact_level',
        ESTIMATED_TIME: 'estimated_time',
    },
    
    // Indicators
    INDICATOR: {
        NAME: 'name',
        DESCRIPTION: 'description',
        CODE: 'code',
        CATEGORY: 'category',
        PANEL_ID: 'panel_id',
        UNIT: 'unit',
        DATA_TYPE: 'data_type',
        METHODOLOGY: 'methodology',
        FRAMEWORK_SOURCE: 'framework_source',
        SDG_ALIGNMENT: 'sdg_alignment',
    },
    
    // Reviews
    REVIEW: {
        CHAMPION_ID: 'champion_id',
        INDICATOR_ID: 'indicator_id',
        RATING: 'rating',
        REVIEW_TEXT: 'review_text',
        STATUS: 'status',
        REVIEWED_BY: 'reviewed_by',
        REVIEWED_AT: 'reviewed_at',
        FEEDBACK: 'feedback',
    },
    
    // Indicator Reviews (STIF Assessment)
    INDICATOR_REVIEW: {
        SUBMISSION_ID: 'submission_id',
        INDICATOR_ID: 'indicator_id',
        CHAMPION_ID: 'champion_id',
        CLARITY_RATING: 'clarity_rating',
        REVIEW_STATUS: 'review_status',
        IMPACT_LEVEL: 'impact_level',
        STAKEHOLDER_GROUP: 'stakeholder_group',
        FREQUENCY_OF_DISCLOSURE: 'frequency_of_disclosure',
        ESTIMATED_COST_TO_COLLECT: 'estimated_cost_to_collect',
        SME_SIZE: 'sme_size',
        SECTOR: 'sector',
        FRAMEWORK_PREFERENCE: 'framework_preference',
        ESG_CLASS: 'esg_class',
        SDG_LINK: 'sdg_link',
        COMPLEXITY: 'complexity',
        MATERIALITY: 'materiality',
        REGULATORY_NEED: 'regulatory_need',
        RECOMMENDED_TIER: 'recommended_tier',
        NOTES: 'notes',
    },
    
    // Panel Review Submissions
    SUBMISSION: {
        CHAMPION_ID: 'champion_id',
        PANEL_ID: 'panel_id',
        STATUS: 'status',
        SUBMITTED_AT: 'submitted_at',
        REVIEWED_BY: 'reviewed_by',
        REVIEWED_AT: 'reviewed_at',
        FEEDBACK: 'feedback',
        CREDITS_AWARDED: 'credits_awarded',
    },
};

// Status enums
const STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    PARTIAL: 'partial',
    DRAFT: 'draft',
};

// Category enums
const CATEGORY = {
    ENVIRONMENTAL: 'environmental',
    SOCIAL: 'social',
    GOVERNANCE: 'governance',
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TABLES, COLUMNS, STATUS, CATEGORY };
}

window.TABLES = TABLES;
window.COLUMNS = COLUMNS;
window.STATUS = STATUS;
window.CATEGORY = CATEGORY;
