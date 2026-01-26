/**
 * Supabase/PostgREST Error Handling
 * 
 * Normalizes errors from Supabase into a consistent format.
 */

import { PostgrestError, AuthError } from '@supabase/supabase-js'

export interface AppError {
  code: string
  message: string
  details?: string
  hint?: string
  isAuthError: boolean
  isRLSError: boolean
  isNotFoundError: boolean
  isConflictError: boolean
  original: PostgrestError | AuthError | Error | null
}

/**
 * Common Supabase/PostgREST error codes
 */
export const ErrorCodes = {
  // Auth errors
  INVALID_CREDENTIALS: 'invalid_credentials',
  USER_NOT_FOUND: 'user_not_found',
  EMAIL_NOT_CONFIRMED: 'email_not_confirmed',
  INVALID_TOKEN: 'invalid_token',
  
  // Database errors
  RLS_VIOLATION: '42501',
  FOREIGN_KEY_VIOLATION: '23503',
  UNIQUE_VIOLATION: '23505',
  NOT_NULL_VIOLATION: '23502',
  CHECK_VIOLATION: '23514',
  NOT_FOUND: 'PGRST116',
  
  // Network/general
  NETWORK_ERROR: 'network_error',
  UNKNOWN_ERROR: 'unknown_error',
} as const

/**
 * Normalize any error into AppError format
 */
export function normalizeError(error: unknown): AppError {
  // Handle PostgrestError
  if (isPostgrestError(error)) {
    return {
      code: error.code || ErrorCodes.UNKNOWN_ERROR,
      message: getHumanReadableMessage(error),
      details: error.details || undefined,
      hint: error.hint || undefined,
      isAuthError: false,
      isRLSError: error.code === ErrorCodes.RLS_VIOLATION,
      isNotFoundError: error.code === ErrorCodes.NOT_FOUND,
      isConflictError: error.code === ErrorCodes.UNIQUE_VIOLATION,
      original: error,
    }
  }

  // Handle AuthError
  if (isAuthError(error)) {
    return {
      code: error.status?.toString() || ErrorCodes.UNKNOWN_ERROR,
      message: error.message || 'Authentication error',
      details: undefined,
      hint: undefined,
      isAuthError: true,
      isRLSError: false,
      isNotFoundError: false,
      isConflictError: false,
      original: error,
    }
  }

  // Handle standard Error
  if (error instanceof Error) {
    return {
      code: ErrorCodes.UNKNOWN_ERROR,
      message: error.message,
      details: undefined,
      hint: undefined,
      isAuthError: false,
      isRLSError: false,
      isNotFoundError: false,
      isConflictError: false,
      original: error,
    }
  }

  // Handle unknown
  return {
    code: ErrorCodes.UNKNOWN_ERROR,
    message: 'An unexpected error occurred',
    details: undefined,
    hint: undefined,
    isAuthError: false,
    isRLSError: false,
    isNotFoundError: false,
    isConflictError: false,
    original: null,
  }
}

/**
 * Type guard for PostgrestError
 */
function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error
  )
}

/**
 * Type guard for AuthError
 */
function isAuthError(error: unknown): error is AuthError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    'message' in error &&
    error.constructor.name === 'AuthError'
  )
}

/**
 * Convert error codes to human-readable messages
 */
function getHumanReadableMessage(error: PostgrestError): string {
  switch (error.code) {
    case ErrorCodes.RLS_VIOLATION:
      return 'You do not have permission to perform this action.'
    case ErrorCodes.FOREIGN_KEY_VIOLATION:
      return 'This operation references data that does not exist.'
    case ErrorCodes.UNIQUE_VIOLATION:
      return 'This record already exists.'
    case ErrorCodes.NOT_NULL_VIOLATION:
      return 'Required fields are missing.'
    case ErrorCodes.CHECK_VIOLATION:
      return 'The provided values are not valid.'
    case ErrorCodes.NOT_FOUND:
      return 'The requested record was not found.'
    default:
      return error.message || 'An error occurred while processing your request.'
  }
}

/**
 * Helper to throw normalized errors
 */
export function throwIfError<T>(
  result: { data: T | null; error: PostgrestError | null }
): T {
  if (result.error) {
    throw normalizeError(result.error)
  }
  if (result.data === null) {
    throw normalizeError({ code: ErrorCodes.NOT_FOUND, message: 'No data returned', details: null, hint: null })
  }
  return result.data
}
