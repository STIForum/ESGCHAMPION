/**
 * Formatting Utilities
 * ESG Champions Platform
 * 
 * Date, number, and string formatting helpers.
 */

/**
 * Format a date string for display
 * @param {string|Date} dateString - ISO date string or Date object
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date
 */
function formatDate(dateString, options = {}) {
    if (!dateString) return '';
    
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    if (isNaN(date.getTime())) {
        return '';
    }
    
    const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        ...options,
    };
    
    return date.toLocaleDateString('en-US', defaultOptions);
}

/**
 * Format a date as relative time (e.g., "2 hours ago")
 * @param {string|Date} dateString - ISO date string or Date object
 * @returns {string} Relative time string
 */
function formatRelativeTime(dateString) {
    if (!dateString) return '';
    
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSecs < 60) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return formatDate(date);
}

/**
 * Format a number with thousand separators
 * @param {number} num - Number to format
 * @param {number} decimals - Decimal places
 * @returns {string} Formatted number
 */
function formatNumber(num, decimals = 0) {
    if (num === null || num === undefined || isNaN(num)) return '0';
    
    return Number(num).toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
}

/**
 * Format a number as currency
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: USD)
 * @returns {string} Formatted currency
 */
function formatCurrency(amount, currency = 'USD') {
    if (amount === null || amount === undefined || isNaN(amount)) return '$0';
    
    return Number(amount).toLocaleString('en-US', {
        style: 'currency',
        currency,
    });
}

/**
 * Get initials from a name
 * @param {string} name - Full name
 * @param {number} maxChars - Maximum characters (default: 2)
 * @returns {string} Initials
 */
function getInitials(name, maxChars = 2) {
    if (!name || typeof name !== 'string') return '?';
    
    return name
        .split(' ')
        .filter(part => part.length > 0)
        .map(part => part[0].toUpperCase())
        .slice(0, maxChars)
        .join('');
}

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
function truncateText(text, maxLength = 100) {
    if (!text || text.length <= maxLength) return text || '';
    return text.substring(0, maxLength - 3) + '...';
}

/**
 * Capitalize first letter of a string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Convert snake_case to Title Case
 * @param {string} str - snake_case string
 * @returns {string} Title Case string
 */
function snakeToTitle(str) {
    if (!str) return '';
    return str
        .split('_')
        .map(word => capitalize(word))
        .join(' ');
}

/**
 * Format file size in bytes to human-readable
 * @param {number} bytes - Size in bytes
 * @returns {string} Human-readable size
 */
function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        formatDate,
        formatRelativeTime,
        formatNumber,
        formatCurrency,
        getInitials,
        truncateText,
        capitalize,
        snakeToTitle,
        formatFileSize,
    };
}

window.formatDate = formatDate;
window.formatRelativeTime = formatRelativeTime;
window.formatNumber = formatNumber;
window.formatCurrency = formatCurrency;
window.getInitials = getInitials;
window.truncateText = truncateText;
window.capitalize = capitalize;
window.snakeToTitle = snakeToTitle;
window.formatFileSize = formatFileSize;
