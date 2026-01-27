/**
 * Application Configuration
 * ESG Champions Platform
 * 
 * App-wide configuration constants and utilities.
 */

// Import env (will use window.ENV if loaded via script tag)
const ENV = window.ENV || {};

/**
 * Application configuration
 */
const CONFIG = {
    // App info
    APP_NAME: 'STIF ESG Champions',
    APP_TITLE_SUFFIX: ' | STIF - Sustainability Technology and Innovation Forum',
    
    // Routes
    ROUTES: {
        HOME: '/',
        LOGIN: '/champion-login.html',
        REGISTER: '/champion-register.html',
        DASHBOARD: '/champion-dashboard.html',
        PANELS: '/champion-panels.html',
        INDICATORS: '/champion-indicators.html',
        PROFILE: '/champion-profile.html',
        RANKINGS: '/ranking.html',
        ADMIN: '/admin-review.html',
        ABOUT: '/about.html',
        FAQ: '/faq.html',
        TERMS: '/terms.html',
        PRIVACY: '/privacy.html',
        COOKIE_POLICY: '/cookie-policy.html',
    },
    
    // Auth pages that don't require login
    PUBLIC_PAGES: [
        '/',
        '/index.html',
        '/champion-login.html',
        '/champion-register.html',
        '/about.html',
        '/faq.html',
        '/terms.html',
        '/privacy.html',
        '/cookie-policy.html',
        '/linkedin-callback.html',
    ],
    
    // Timing
    SERVICE_READY_DELAY: 300, // ms to wait for services
    TOAST_DURATION: 3000,     // ms for toast messages
    DEBOUNCE_DELAY: 300,      // ms for debounced inputs
    
    // Pagination
    DEFAULT_PAGE_SIZE: 20,
    LEADERBOARD_LIMIT: 50,
    
    // Credits
    CREDITS_PER_REVIEW: 90,
    CREDITS_FOR_COMMENTS: 2,
};

/**
 * Wait for services to be ready
 * @returns {Promise<void>}
 */
function waitForServices() {
    return new Promise(resolve => {
        setTimeout(resolve, CONFIG.SERVICE_READY_DELAY);
    });
}

/**
 * Check if current page is public (doesn't require auth)
 * @returns {boolean}
 */
function isPublicPage() {
    const path = window.location.pathname;
    return CONFIG.PUBLIC_PAGES.some(p => 
        path === p || path.endsWith(p)
    );
}

/**
 * Get the current page path
 * @returns {string}
 */
function getCurrentPath() {
    return window.location.pathname;
}

// Export for ES modules and window
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, waitForServices, isPublicPage, getCurrentPath };
}

// Window exports
window.CONFIG = CONFIG;
window.waitForServices = waitForServices;
window.isPublicPage = isPublicPage;
window.getCurrentPath = getCurrentPath;
