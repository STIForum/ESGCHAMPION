/**
 * Environment Configuration
 * ESG Champions Platform
 * 
 * Single source of truth for environment variables.
 * All other modules should import config from here.
 */

// Read from window globals (set by supabase-config.js or environment)
const ENV = {
    SUPABASE_URL: window.SUPABASE_URL || '',
    SUPABASE_ANON_KEY: window.SUPABASE_ANON_KEY || '',
    
    // App configuration
    APP_NAME: 'STIF ESG Champions',
    APP_URL: window.location.origin,
    
    // Feature flags
    DEBUG: window.location.hostname === 'localhost',
};

/**
 * Validate required environment variables
 * @returns {boolean} true if all required vars are present
 */
function validateEnv() {
    const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
    const missing = required.filter(key => !ENV[key]);
    
    if (missing.length > 0) {
        console.error(
            `[ENV ERROR] Missing required environment variables: ${missing.join(', ')}\n` +
            'Please ensure supabase-config.js is loaded before other scripts.'
        );
        return false;
    }
    
    if (ENV.DEBUG) {
        console.log('[ENV] Configuration loaded successfully');
    }
    
    return true;
}

/**
 * Get environment variable
 * @param {string} key - Environment variable name
 * @param {*} defaultValue - Default value if not found
 * @returns {*} The environment value or default
 */
function getEnv(key, defaultValue = '') {
    return ENV[key] !== undefined ? ENV[key] : defaultValue;
}

// Export for ES modules and window
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ENV, validateEnv, getEnv };
}

// Window exports for script tag usage
window.ENV = ENV;
window.validateEnv = validateEnv;
window.getEnv = getEnv;
