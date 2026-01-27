/**
 * DOM Utilities
 * ESG Champions Platform
 * 
 * Safe DOM query helpers and common DOM operations.
 */

/**
 * Safely get an element by ID
 * @param {string} id - Element ID
 * @returns {HTMLElement|null}
 */
function $(id) {
    return document.getElementById(id);
}

/**
 * Safely query a single element
 * @param {string} selector - CSS selector
 * @param {HTMLElement} parent - Parent element (default: document)
 * @returns {HTMLElement|null}
 */
function $q(selector, parent = document) {
    return parent.querySelector(selector);
}

/**
 * Safely query all matching elements
 * @param {string} selector - CSS selector
 * @param {HTMLElement} parent - Parent element (default: document)
 * @returns {HTMLElement[]}
 */
function $qa(selector, parent = document) {
    return Array.from(parent.querySelectorAll(selector));
}

/**
 * Show an element (remove hidden class)
 * @param {string|HTMLElement} element - Element or ID
 */
function showElement(element) {
    const el = typeof element === 'string' ? $(element) : element;
    if (el) el.classList.remove('hidden');
}

/**
 * Hide an element (add hidden class)
 * @param {string|HTMLElement} element - Element or ID
 */
function hideElement(element) {
    const el = typeof element === 'string' ? $(element) : element;
    if (el) el.classList.add('hidden');
}

/**
 * Toggle element visibility
 * @param {string|HTMLElement} element - Element or ID
 * @param {boolean} show - Optional force show/hide
 */
function toggleElement(element, show) {
    const el = typeof element === 'string' ? $(element) : element;
    if (!el) return;
    
    if (show === undefined) {
        el.classList.toggle('hidden');
    } else {
        el.classList.toggle('hidden', !show);
    }
}

/**
 * Set text content safely
 * @param {string|HTMLElement} element - Element or ID
 * @param {string} text - Text content
 */
function setText(element, text) {
    const el = typeof element === 'string' ? $(element) : element;
    if (el) el.textContent = text ?? '';
}

/**
 * Set HTML content safely
 * @param {string|HTMLElement} element - Element or ID
 * @param {string} html - HTML content
 */
function setHTML(element, html) {
    const el = typeof element === 'string' ? $(element) : element;
    if (el) el.innerHTML = html ?? '';
}

/**
 * Add event listener with automatic cleanup
 * @param {string|HTMLElement} element - Element or ID
 * @param {string} event - Event name
 * @param {Function} handler - Event handler
 * @param {Object} options - Event listener options
 * @returns {Function} Cleanup function
 */
function on(element, event, handler, options = {}) {
    const el = typeof element === 'string' ? $(element) : element;
    if (!el) return () => {};
    
    el.addEventListener(event, handler, options);
    return () => el.removeEventListener(event, handler, options);
}

/**
 * Add click handler
 * @param {string|HTMLElement} element - Element or ID
 * @param {Function} handler - Click handler
 * @returns {Function} Cleanup function
 */
function onClick(element, handler) {
    return on(element, 'click', handler);
}

/**
 * Require authentication - redirect to login if not authenticated
 * @param {string} redirectUrl - URL to redirect back to after login (default: current page)
 * @returns {boolean} Whether user is authenticated
 */
function requireAuth(redirectUrl = null) {
    const isAuthenticated = window.championAuth?.isAuthenticated?.() ?? false;
    
    if (!isAuthenticated) {
        const redirect = redirectUrl || window.location.pathname + window.location.search;
        window.location.href = `/champion-login.html?redirect=${encodeURIComponent(redirect)}`;
        return false;
    }
    
    return true;
}

/**
 * Require admin role - redirect if not admin
 * @returns {Promise<boolean>} Whether user is admin
 */
async function requireAdmin() {
    if (!requireAuth()) return false;
    
    const isAdmin = await window.championAuth?.isAdmin?.() ?? false;
    
    if (!isAdmin) {
        window.location.href = '/champion-dashboard.html';
        return false;
    }
    
    return true;
}

/**
 * Create an element with attributes and content
 * @param {string} tag - Tag name
 * @param {Object} attrs - Attributes
 * @param {string|HTMLElement|HTMLElement[]} children - Children
 * @returns {HTMLElement}
 */
function createElement(tag, attrs = {}, children = null) {
    const el = document.createElement(tag);
    
    Object.entries(attrs).forEach(([key, value]) => {
        if (key === 'className') {
            el.className = value;
        } else if (key === 'style' && typeof value === 'object') {
            Object.assign(el.style, value);
        } else if (key.startsWith('on') && typeof value === 'function') {
            el.addEventListener(key.slice(2).toLowerCase(), value);
        } else {
            el.setAttribute(key, value);
        }
    });
    
    if (children) {
        if (typeof children === 'string') {
            el.textContent = children;
        } else if (Array.isArray(children)) {
            children.forEach(child => el.appendChild(child));
        } else {
            el.appendChild(children);
        }
    }
    
    return el;
}

/**
 * Debounce a function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle a function
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in ms
 * @returns {Function} Throttled function
 */
function throttle(func, limit = 100) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        $, $q, $qa,
        showElement, hideElement, toggleElement,
        setText, setHTML,
        on, onClick,
        requireAuth, requireAdmin,
        createElement,
        debounce, throttle,
    };
}

window.$ = $;
window.$q = $q;
window.$qa = $qa;
window.showElement = showElement;
window.hideElement = hideElement;
window.toggleElement = toggleElement;
window.setText = setText;
window.setHTML = setHTML;
window.onEvent = on;
window.onClick = onClick;
window.requireAuth = requireAuth;
window.requireAdmin = requireAdmin;
window.createElement = createElement;
window.debounce = debounce;
window.throttle = throttle;
