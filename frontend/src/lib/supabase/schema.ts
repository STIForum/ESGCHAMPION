/**
 * Database Schema Definitions
 * 
 * Contains table names, column constants, and enum types.
 * This provides type safety and prevents typos in database operations.
 */

// =====================================================
// TABLE NAMES
// =====================================================

export const Tables = {
  CHAMPIONS: 'champions',
  PANELS: 'panels',
  INDICATORS: 'indicators',
  REVIEWS: 'reviews',
  ACCEPTED_REVIEWS: 'accepted_reviews',
  VOTES: 'votes',
  COMMENTS: 'comments',
  ADMIN_ACTIONS: 'admin_actions',
  INVITATIONS: 'invitations',
  PANEL_REVIEW_SUBMISSIONS: 'panel_review_submissions',
  PANEL_REVIEW_INDICATOR_REVIEWS: 'panel_review_indicator_reviews',
} as const

export type TableName = typeof Tables[keyof typeof Tables]

// =====================================================
// COLUMN NAMES
// =====================================================

export const ChampionColumns = {
  ID: 'id',
  EMAIL: 'email',
  FULL_NAME: 'full_name',
  COMPANY: 'company',
  JOB_TITLE: 'job_title',
  LINKEDIN_URL: 'linkedin_url',
  AVATAR_URL: 'avatar_url',
  BIO: 'bio',
  IS_ADMIN: 'is_admin',
  IS_VERIFIED: 'is_verified',
  CREDITS: 'credits',
  TOTAL_REVIEWS: 'total_reviews',
  ACCEPTED_REVIEWS_COUNT: 'accepted_reviews_count',
  CLA_ACCEPTED: 'cla_accepted',
  NDA_ACCEPTED: 'nda_accepted',
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at',
} as const

export const PanelColumns = {
  ID: 'id',
  NAME: 'name',
  DESCRIPTION: 'description',
  CATEGORY: 'category',
  ICON: 'icon',
  COLOR: 'color',
  IMPACT: 'impact',
  ESG_CLASSIFICATION: 'esg_classification',
  PRIMARY_FRAMEWORK: 'primary_framework',
  ORDER_INDEX: 'order_index',
  IS_ACTIVE: 'is_active',
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at',
} as const

export const IndicatorColumns = {
  ID: 'id',
  PANEL_ID: 'panel_id',
  NAME: 'name',
  DESCRIPTION: 'description',
  METHODOLOGY: 'methodology',
  DATA_SOURCE: 'data_source',
  UNIT: 'unit',
  FREQUENCY: 'frequency',
  CODE: 'code',
  PRIMARY_FRAMEWORK: 'primary_framework',
  FRAMEWORK_VERSION: 'framework_version',
  WHY_IT_MATTERS: 'why_it_matters',
  IMPACT_LEVEL: 'impact_level',
  DIFFICULTY_LEVEL: 'difficulty_level',
  ESTIMATED_TIME: 'estimated_time',
  ESG_CLASS: 'esg_class',
  RELATED_SDGS: 'related_sdgs',
  VALIDATION_QUESTION: 'validation_question',
  RESPONSE_TYPE: 'response_type',
  TAGS: 'tags',
  ICON: 'icon',
  FORMULA_REQUIRED: 'formula_required',
  ORDER_INDEX: 'order_index',
  IS_ACTIVE: 'is_active',
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at',
} as const

// =====================================================
// ENUM TYPES
// =====================================================

export const ReviewStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  DELETED: 'deleted',
} as const

export type ReviewStatusType = typeof ReviewStatus[keyof typeof ReviewStatus]

export const ImpactLevel = {
  HIGH: 'High',
  MEDIUM: 'Medium',
  FOUNDATIONAL: 'Foundational',
} as const

export type ImpactLevelType = typeof ImpactLevel[keyof typeof ImpactLevel]

export const DifficultyLevel = {
  EASY: 'Easy',
  MODERATE: 'Moderate',
  COMPLEX: 'Complex',
} as const

export type DifficultyLevelType = typeof DifficultyLevel[keyof typeof DifficultyLevel]

export const ESGClassification = {
  ENVIRONMENT: 'Environment',
  SOCIAL: 'Social',
  GOVERNANCE: 'Governance',
} as const

export type ESGClassificationType = typeof ESGClassification[keyof typeof ESGClassification]

export const PrimaryFramework = {
  GRI: 'GRI',
  ESRS: 'ESRS',
  SASB: 'SASB',
  SME_HUB: 'SME Hub',
  OTHER: 'Other',
} as const

export type PrimaryFrameworkType = typeof PrimaryFramework[keyof typeof PrimaryFramework]

export const SMESizeBand = {
  MICRO: 'micro',
  SMALL: 'small',
  MEDIUM: 'medium',
} as const

export type SMESizeBandType = typeof SMESizeBand[keyof typeof SMESizeBand]

export const TriLevel = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const

export type TriLevelType = typeof TriLevel[keyof typeof TriLevel]

export const RegulatoryNecessity = {
  MANDATORY: 'mandatory',
  EXPECTED: 'expected',
  OPTIONAL: 'optional',
} as const

export type RegulatoryNecessityType = typeof RegulatoryNecessity[keyof typeof RegulatoryNecessity]

export const TierLevel = {
  CORE: 'core',
  RECOMMENDED: 'recommended',
  ADVANCED: 'advanced',
} as const

export type TierLevelType = typeof TierLevel[keyof typeof TierLevel]

// =====================================================
// INSERT PAYLOAD TYPES (for type-safe inserts)
// =====================================================

export interface ChampionInsert {
  id?: string
  email: string
  full_name?: string
  company?: string
  job_title?: string
  linkedin_url?: string
  avatar_url?: string
  bio?: string
  is_admin?: boolean
  is_verified?: boolean
  credits?: number
  cla_accepted?: boolean
  nda_accepted?: boolean
}

export interface ReviewInsert {
  champion_id: string
  indicator_id: string
  panel_id: string
  content: string
  rating?: number
  status?: ReviewStatusType
}

export interface PanelReviewSubmissionInsert {
  panel_id: string
  champion_id: string
  status?: ReviewStatusType
}

export interface IndicatorReviewInsert {
  submission_id: string
  indicator_id: string
  champion_id: string
  sme_size_band?: string
  primary_sector?: string
  primary_framework?: string
  esg_class?: string
  sdgs?: number[]
  relevance?: string
  regulatory_necessity?: string
  operational_feasibility?: string
  cost_to_collect?: string
  misreporting_risk?: string
  suggested_tier?: string
  rationale?: string
  optional_tags?: string[]
  notes?: string
  analysis?: string
}
