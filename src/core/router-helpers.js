/**
 * Router Helpers
 * ESG Champions Platform
 * 
 * Query parameter parsing and navigation utilities.
 */

/**
 * Get a query parameter from the current URL
 * @param {string} name - Parameter name
 * @param {string} defaultValue - Default value if not found
 * @returns {string} Parameter value
 */
function getQueryParam(name, defaultValue = '') {
    const params = new URLSearchParams(window.location.search);
    return params.get(name) || defaultValue;
}

/**
 * Get all query parameters as an object
 * @returns {Object} Key-value pairs of all query params
 */
function getAllQueryParams() {
    const params = new URLSearchParams(window.location.search);
    const result = {};
    for (const [key, value] of params.entries()) {
        result[key] = value;
    }
    return result;
}

/**
 * Set a query parameter without page reload
 * @param {string} name - Parameter name
 * @param {string} value - Parameter value
 */
function setQueryParam(name, value) {
    const url = new URL(window.location.href);
    if (value === null || value === undefined || value === '') {
        url.searchParams.delete(name);
    } else {
        url.searchParams.set(name, value);
    }
    window.history.replaceState({}, '', url.toString());
}

/**
 * Remove a query parameter
 * @param {string} name - Parameter name
 */
function removeQueryParam(name) {
    setQueryParam(name, null);
}

/**
 * Navigate to a URL
 * @param {string} url - Destination URL
 * @param {Object} params - Optional query parameters
 */
function navigateTo(url, params = {}) {
    const urlObj = new URL(url, window.location.origin);
    Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
            urlObj.searchParams.set(key, value);
        }
    });
    window.location.href = urlObj.toString();
}

/**
 * Navigate to login with redirect back to current page
 * @param {string} customRedirect - Optional custom redirect URL
 */
function redirectToLogin(customRedirect = null) {
    const redirect = customRedirect || window.location.pathname + window.location.search;
    navigateTo('/champion-login.html', { redirect });
}

/**
 * Get redirect URL from query params (for post-login redirect)
 * @returns {string} Redirect URL or dashboard
 */
function getRedirectUrl() {
    return getQueryParam('redirect', '/champion-dashboard.html');
}

/**
 * Check if current path matches a given path
 * @param {string} path - Path to check
 * @returns {boolean}
 */
function isCurrentPath(path) {
    const current = window.location.pathname;
    return current === path || current.endsWith(path);
}

// Export for ES modules and window
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getQueryParam,
        getAllQueryParams,
        setQueryParam,
        removeQueryParam,
        navigateTo,
        redirectToLogin,
        getRedirectUrl,
        isCurrentPath,
    };
}

// Window exports
window.getQueryParam = getQueryParam;
window.getAllQueryParams = getAllQueryParams;
window.setQueryParam = setQueryParam;
window.removeQueryParam = removeQueryParam;
window.navigateTo = navigateTo;
window.redirectToLogin = redirectToLogin;
window.getRedirectUrl = getRedirectUrl;
window.isCurrentPath = isCurrentPath;
