/**
 * Toast Notifications
 * ESG Champions Platform
 * 
 * Unified toast notification system.
 */

// Toast container
let toastContainer = null;

/**
 * Ensure toast container exists
 */
function ensureToastContainer() {
    if (toastContainer && document.body.contains(toastContainer)) {
        return toastContainer;
    }
    
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 10px;
        pointer-events: none;
    `;
    document.body.appendChild(toastContainer);
    return toastContainer;
}

/**
 * Get icon for toast type
 * @param {string} type - Toast type
 * @returns {string} SVG icon
 */
function getToastIcon(type) {
    const icons = {
        success: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>`,
        error: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>`,
        warning: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>`,
        info: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>`,
    };
    return icons[type] || icons.info;
}

/**
 * Get background color for toast type
 * @param {string} type - Toast type
 * @returns {string} CSS color value
 */
function getToastColor(type) {
    const colors = {
        success: 'linear-gradient(135deg, #10b981, #059669)',
        error: 'linear-gradient(135deg, #ef4444, #dc2626)',
        warning: 'linear-gradient(135deg, #f59e0b, #d97706)',
        info: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    };
    return colors[type] || colors.info;
}

/**
 * Show a toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type: 'success', 'error', 'warning', 'info'
 * @param {number} duration - Duration in ms (default: 3000)
 */
function showToast(message, type = 'info', duration = 3000) {
    const container = ensureToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 300px;
        max-width: 400px;
        padding: 16px 20px;
        background: ${getToastColor(type)};
        color: white;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        font-weight: 500;
        pointer-events: auto;
        transform: translateX(120%);
        transition: transform 0.3s ease;
    `;
    
    toast.innerHTML = `
        <span class="toast-icon" style="flex-shrink: 0;">${getToastIcon(type)}</span>
        <span class="toast-message" style="flex: 1;">${message}</span>
        <button class="toast-close" style="
            background: none;
            border: none;
            color: white;
            opacity: 0.7;
            cursor: pointer;
            padding: 4px;
            font-size: 18px;
            line-height: 1;
        ">&times;</button>
    `;
    
    container.appendChild(toast);
    
    // Trigger animation
    requestAnimationFrame(() => {
        toast.style.transform = 'translateX(0)';
    });
    
    // Close handler
    const close = () => {
        toast.style.transform = 'translateX(120%)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    };
    
    // Close button
    toast.querySelector('.toast-close').addEventListener('click', close);
    
    // Auto-close
    if (duration > 0) {
        setTimeout(close, duration);
    }
    
    return { close };
}

/**
 * Show success toast
 * @param {string} message - Message to display
 * @param {number} duration - Duration in ms
 */
function showSuccess(message, duration = 3000) {
    return showToast(message, 'success', duration);
}

/**
 * Show error toast
 * @param {string} message - Message to display
 * @param {number} duration - Duration in ms
 */
function showError(message, duration = 4000) {
    return showToast(message, 'error', duration);
}

/**
 * Show warning toast
 * @param {string} message - Message to display
 * @param {number} duration - Duration in ms
 */
function showWarning(message, duration = 3500) {
    return showToast(message, 'warning', duration);
}

/**
 * Show info toast
 * @param {string} message - Message to display
 * @param {number} duration - Duration in ms
 */
function showInfo(message, duration = 3000) {
    return showToast(message, 'info', duration);
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
    };
}

window.showToast = showToast;
window.showSuccess = showSuccess;
window.showError = showError;
window.showWarning = showWarning;
window.showInfo = showInfo;
