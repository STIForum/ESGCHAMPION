/**
 * Supabase Client
 * ESG Champions Platform
 * 
 * SINGLE SOURCE OF TRUTH for Supabase client creation.
 * All other modules should import from here.
 */

// Client singleton
let _supabaseClient = null;

/**
 * Initialize and get the Supabase client
 * @returns {Object|null} Supabase client instance
 */
function getSupabaseClient() {
    if (_supabaseClient) {
        return _supabaseClient;
    }
    
    // Get config from window globals (set by supabase-config.js)
    const url = window.SUPABASE_URL;
    const anonKey = window.SUPABASE_ANON_KEY;
    
    if (!url || !anonKey) {
        console.error(
            '[Supabase] Missing configuration.\n' +
            'Ensure supabase-config.js is loaded and defines SUPABASE_URL and SUPABASE_ANON_KEY.'
        );
        return null;
    }
    
    // Check if Supabase SDK is loaded
    if (typeof supabase === 'undefined' || !supabase.createClient) {
        console.error(
            '[Supabase] SDK not loaded.\n' +
            'Ensure @supabase/supabase-js is included before this script.'
        );
        return null;
    }
    
    // Create client with schema prefix
    _supabaseClient = supabase.createClient(url, anonKey, {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
        },
        db: {
            schema: 'public',
        },
    });
    
    if (window.ENV?.DEBUG) {
        console.log('[Supabase] Client initialized successfully');
    }
    
    return _supabaseClient;
}

/**
 * Get a typed query builder with schema prefix
 * Use this for all database operations to ensure schema consistency
 * @param {string} table - Table name
 * @returns {Object} Query builder
 */
function fromTable(table) {
    const client = getSupabaseClient();
    if (!client) {
        throw new Error('Supabase client not initialized');
    }
    return client.schema('public').from(table);
}

/**
 * Get the auth module
 * @returns {Object} Auth module
 */
function getAuth() {
    const client = getSupabaseClient();
    if (!client) {
        throw new Error('Supabase client not initialized');
    }
    return client.auth;
}

// Backward compatibility - create client on load if config exists
if (typeof window !== 'undefined') {
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
                getSupabaseClient();
            }
        });
    } else {
        if (window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
            getSupabaseClient();
        }
    }
}

// Export for ES modules and window
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { getSupabaseClient, fromTable, getAuth };
}

// Window exports for backward compatibility
window.getSupabaseClient = getSupabaseClient;
window.fromTable = fromTable;
window.getSupabaseAuth = getAuth;
