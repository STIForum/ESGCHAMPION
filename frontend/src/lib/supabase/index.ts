export { supabase, publicSchema } from './client'
export * from './errors'

// From schema - export only constants and enums (not insert types)
export {
  Tables,
  type TableName,
  ChampionColumns,
  PanelColumns,
  IndicatorColumns,
  ReviewStatus,
  type ReviewStatusType,
  ImpactLevel,
  type ImpactLevelType,
  DifficultyLevel,
  type DifficultyLevelType,
  ESGClassification,
  type ESGClassificationType,
  PrimaryFramework,
  type PrimaryFrameworkType,
  SMESizeBand,
  type SMESizeBandType,
  TriLevel,
  type TriLevelType,
  RegulatoryNecessity,
  type RegulatoryNecessityType,
  TierLevel,
  type TierLevelType,
} from './schema'

// From types - export all types
export * from './types'
