/**
 * Loading States
 * ESG Champions Platform
 * 
 * Standardized loading state management.
 */

/**
 * Show loading state
 * @param {string} loadingId - ID of loading element (default: 'loading-state')
 * @param {string} contentId - ID of content element to hide
 */
function showLoading(loadingId = 'loading-state', contentId = null) {
    const loading = document.getElementById(loadingId);
    if (loading) {
        loading.classList.remove('hidden');
    }
    
    if (contentId) {
        const content = document.getElementById(contentId);
        if (content) {
            content.classList.add('hidden');
        }
    }
}

/**
 * Hide loading state and show content
 * @param {string} loadingId - ID of loading element (default: 'loading-state')
 * @param {string} contentId - ID of content element to show
 */
function hideLoading(loadingId = 'loading-state', contentId = null) {
    const loading = document.getElementById(loadingId);
    if (loading) {
        loading.classList.add('hidden');
    }
    
    if (contentId) {
        const content = document.getElementById(contentId);
        if (content) {
            content.classList.remove('hidden');
        }
    }
}

/**
 * Set loading state (toggle between loading and content)
 * @param {boolean} isLoading - Whether loading is active
 * @param {Object} options - { loadingId, contentId }
 */
function setLoading(isLoading, options = {}) {
    const { loadingId = 'loading-state', contentId = null } = options;
    
    if (isLoading) {
        showLoading(loadingId, contentId);
    } else {
        hideLoading(loadingId, contentId);
    }
}

/**
 * Create loading spinner HTML
 * @param {string} size - 'sm', 'md', 'lg'
 * @returns {string} HTML string
 */
function createLoadingSpinner(size = 'md') {
    const sizeClass = size === 'sm' ? 'loading-spinner-sm' : 'loading-spinner';
    return `<div class="${sizeClass}"></div>`;
}

/**
 * Create full loading state HTML
 * @param {string} message - Optional loading message
 * @returns {string} HTML string
 */
function createLoadingState(message = 'Loading...') {
    return `
        <div class="flex-center" style="flex-direction: column; gap: var(--space-4); padding: var(--space-8);">
            <div class="loading-spinner"></div>
            ${message ? `<p class="text-secondary">${message}</p>` : ''}
        </div>
    `;
}

/**
 * Show error state in a container
 * @param {string} containerId - Container element ID
 * @param {string} message - Error message
 * @param {Object} options - { showRetry, onRetry }
 */
function showErrorState(containerId, message, options = {}) {
    const { showRetry = false, onRetry = null } = options;
    const container = document.getElementById(containerId);
    
    if (!container) return;
    
    let html = `
        <div class="error-state" style="text-align: center; padding: var(--space-8);">
            <div style="
                width: 64px;
                height: 64px;
                margin: 0 auto var(--space-4);
                background: var(--error-100);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
            ">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--error)" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
            </div>
            <h3 style="color: var(--error); margin-bottom: var(--space-2);">Error</h3>
            <p class="text-secondary" style="margin-bottom: var(--space-4);">${message}</p>
    `;
    
    if (showRetry) {
        html += `<button class="btn btn-primary" id="${containerId}-retry">Try Again</button>`;
    }
    
    html += '</div>';
    
    container.innerHTML = html;
    
    if (showRetry && onRetry) {
        document.getElementById(`${containerId}-retry`)?.addEventListener('click', onRetry);
    }
}

/**
 * Show empty state in a container
 * @param {string} containerId - Container element ID
 * @param {string} message - Empty state message
 * @param {Object} options - { icon, actionText, onAction }
 */
function showEmptyState(containerId, message, options = {}) {
    const { icon = null, actionText = null, onAction = null } = options;
    const container = document.getElementById(containerId);
    
    if (!container) return;
    
    const defaultIcon = `
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
    `;
    
    let html = `
        <div class="empty-state" style="text-align: center; padding: var(--space-8); color: var(--gray-400);">
            <div style="margin-bottom: var(--space-4);">
                ${icon || defaultIcon}
            </div>
            <p style="color: var(--gray-500); margin-bottom: var(--space-4);">${message}</p>
    `;
    
    if (actionText && onAction) {
        html += `<button class="btn btn-primary" id="${containerId}-action">${actionText}</button>`;
    }
    
    html += '</div>';
    
    container.innerHTML = html;
    
    if (actionText && onAction) {
        document.getElementById(`${containerId}-action`)?.addEventListener('click', onAction);
    }
}

/**
 * Wrap an async function with loading state management
 * @param {Function} asyncFn - Async function to wrap
 * @param {Object} options - { loadingId, contentId }
 * @returns {Function} Wrapped function
 */
function withLoading(asyncFn, options = {}) {
    return async function (...args) {
        setLoading(true, options);
        try {
            return await asyncFn.apply(this, args);
        } finally {
            setLoading(false, options);
        }
    };
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showLoading,
        hideLoading,
        setLoading,
        createLoadingSpinner,
        createLoadingState,
        showErrorState,
        showEmptyState,
        withLoading,
    };
}

window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.setLoading = setLoading;
window.createLoadingSpinner = createLoadingSpinner;
window.createLoadingState = createLoadingState;
window.showErrorState = showErrorState;
window.showEmptyState = showEmptyState;
window.withLoading = withLoading;
