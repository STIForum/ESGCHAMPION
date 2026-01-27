/**
 * Supabase Error Handling
 * ESG Champions Platform
 * 
 * Normalize and handle Supabase/PostgREST errors consistently.
 */

/**
 * Known PostgREST error codes and their user-friendly messages
 */
const ERROR_CODES = {
    // PostgREST errors
    'PGRST116': 'Record not found',
    'PGRST204': 'No data returned. The database schema may need refreshing.',
    'PGRST301': 'Invalid request format',
    'PGRST302': 'Content type not supported',
    
    // Auth errors
    'invalid_credentials': 'Invalid email or password',
    'email_not_confirmed': 'Please verify your email address',
    'user_already_exists': 'An account with this email already exists',
    'weak_password': 'Password is too weak. Use at least 8 characters.',
    'invalid_email': 'Please enter a valid email address',
    
    // Rate limiting
    'rate_limit_exceeded': 'Too many requests. Please wait a moment.',
    
    // Network
    'network_error': 'Network error. Please check your connection.',
    'timeout': 'Request timed out. Please try again.',
};

/**
 * Normalize a Supabase error into a consistent format
 * @param {Error|Object} error - The error from Supabase
 * @returns {Object} Normalized error object
 */
function normalizeError(error) {
    // Already normalized
    if (error && error._normalized) {
        return error;
    }
    
    const normalized = {
        _normalized: true,
        code: 'unknown',
        message: 'An unexpected error occurred',
        details: null,
        original: error,
    };
    
    if (!error) {
        return normalized;
    }
    
    // Extract code
    if (error.code) {
        normalized.code = error.code;
    } else if (error.error_code) {
        normalized.code = error.error_code;
    } else if (error.status) {
        normalized.code = `HTTP_${error.status}`;
    }
    
    // Get user-friendly message
    if (ERROR_CODES[normalized.code]) {
        normalized.message = ERROR_CODES[normalized.code];
    } else if (error.message) {
        normalized.message = error.message;
    } else if (error.error_description) {
        normalized.message = error.error_description;
    } else if (typeof error === 'string') {
        normalized.message = error;
    }
    
    // Store details
    if (error.details) {
        normalized.details = error.details;
    } else if (error.hint) {
        normalized.details = error.hint;
    }
    
    return normalized;
}

/**
 * Log error with context (for debugging)
 * @param {string} context - Where the error occurred
 * @param {Error|Object} error - The error
 */
function logError(context, error) {
    const normalized = normalizeError(error);
    
    console.error(`[${context}] Error:`, {
        code: normalized.code,
        message: normalized.message,
        details: normalized.details,
    });
    
    // Log schema cache hint for PGRST204
    if (normalized.code === 'PGRST204') {
        console.warn(
            '[Schema Cache] This error often indicates a schema mismatch.\n' +
            'Try refreshing the Supabase schema cache or check column names.'
        );
    }
    
    return normalized;
}

/**
 * Handle error with optional toast notification
 * @param {string} context - Where the error occurred
 * @param {Error|Object} error - The error
 * @param {boolean} showToast - Whether to show a toast
 * @returns {Object} Normalized error
 */
function handleError(context, error, showToast = true) {
    const normalized = logError(context, error);
    
    if (showToast && typeof window.showToast === 'function') {
        window.showToast(normalized.message, 'error');
    }
    
    return normalized;
}

/**
 * Check if error is a "not found" error
 * @param {Error|Object} error - The error
 * @returns {boolean}
 */
function isNotFoundError(error) {
    const normalized = normalizeError(error);
    return normalized.code === 'PGRST116' || 
           normalized.message.toLowerCase().includes('not found');
}

/**
 * Check if error is an auth error
 * @param {Error|Object} error - The error
 * @returns {boolean}
 */
function isAuthError(error) {
    const normalized = normalizeError(error);
    const authCodes = ['invalid_credentials', 'email_not_confirmed', 'user_already_exists'];
    return authCodes.includes(normalized.code);
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ERROR_CODES,
        normalizeError,
        logError,
        handleError,
        isNotFoundError,
        isAuthError,
    };
}

window.normalizeError = normalizeError;
window.logError = logError;
window.handleSupabaseError = handleError;
window.isNotFoundError = isNotFoundError;
window.isAuthError = isAuthError;
