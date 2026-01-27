/**
 * Validation Utilities
 * ESG Champions Platform
 * 
 * Form field validation helpers.
 */

/**
 * Validation result object
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Whether validation passed
 * @property {string[]} errors - List of error messages
 */

/**
 * Validate that required fields are present
 * @param {Object} fields - Object with field values
 * @param {string[]} requiredKeys - Keys that must have values
 * @returns {ValidationResult}
 */
function validateRequired(fields, requiredKeys) {
    const errors = [];
    
    for (const key of requiredKeys) {
        const value = fields[key];
        if (value === undefined || value === null || value === '') {
            const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            errors.push(`${label} is required`);
        }
    }
    
    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Validate an email address
 * @param {string} email - Email to validate
 * @returns {ValidationResult}
 */
function validateEmail(email) {
    const errors = [];
    
    if (!email) {
        errors.push('Email is required');
    } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            errors.push('Please enter a valid email address');
        }
    }
    
    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Validate a password
 * @param {string} password - Password to validate
 * @param {Object} options - Validation options
 * @returns {ValidationResult}
 */
function validatePassword(password, options = {}) {
    const {
        minLength = 8,
        requireUppercase = false,
        requireLowercase = false,
        requireNumber = false,
        requireSpecial = false,
    } = options;
    
    const errors = [];
    
    if (!password) {
        errors.push('Password is required');
        return { valid: false, errors };
    }
    
    if (password.length < minLength) {
        errors.push(`Password must be at least ${minLength} characters`);
    }
    
    if (requireUppercase && !/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    
    if (requireLowercase && !/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    
    if (requireNumber && !/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
    }
    
    if (requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('Password must contain at least one special character');
    }
    
    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Validate that two passwords match
 * @param {string} password - Original password
 * @param {string} confirmPassword - Confirmation password
 * @returns {ValidationResult}
 */
function validatePasswordMatch(password, confirmPassword) {
    const errors = [];
    
    if (password !== confirmPassword) {
        errors.push('Passwords do not match');
    }
    
    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Validate a URL
 * @param {string} url - URL to validate
 * @param {boolean} required - Whether the field is required
 * @returns {ValidationResult}
 */
function validateUrl(url, required = false) {
    const errors = [];
    
    if (!url) {
        if (required) {
            errors.push('URL is required');
        }
        return { valid: !required, errors };
    }
    
    try {
        new URL(url);
    } catch {
        errors.push('Please enter a valid URL');
    }
    
    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Validate minimum/maximum length
 * @param {string} value - Value to validate
 * @param {Object} options - { min, max, fieldName }
 * @returns {ValidationResult}
 */
function validateLength(value, options = {}) {
    const { min = 0, max = Infinity, fieldName = 'Field' } = options;
    const errors = [];
    
    const length = value ? value.length : 0;
    
    if (length < min) {
        errors.push(`${fieldName} must be at least ${min} characters`);
    }
    
    if (length > max) {
        errors.push(`${fieldName} must be no more than ${max} characters`);
    }
    
    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Validate a numeric value
 * @param {*} value - Value to validate
 * @param {Object} options - { min, max, fieldName, integer }
 * @returns {ValidationResult}
 */
function validateNumber(value, options = {}) {
    const { min = -Infinity, max = Infinity, fieldName = 'Value', integer = false } = options;
    const errors = [];
    
    const num = Number(value);
    
    if (isNaN(num)) {
        errors.push(`${fieldName} must be a valid number`);
        return { valid: false, errors };
    }
    
    if (integer && !Number.isInteger(num)) {
        errors.push(`${fieldName} must be a whole number`);
    }
    
    if (num < min) {
        errors.push(`${fieldName} must be at least ${min}`);
    }
    
    if (num > max) {
        errors.push(`${fieldName} must be no more than ${max}`);
    }
    
    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Combine multiple validation results
 * @param {...ValidationResult} results - Validation results to combine
 * @returns {ValidationResult}
 */
function combineValidations(...results) {
    const allErrors = results.flatMap(r => r.errors);
    return {
        valid: allErrors.length === 0,
        errors: allErrors,
    };
}

/**
 * Show validation errors as toast or in UI
 * @param {ValidationResult} result - Validation result
 * @param {boolean} useToast - Whether to use toast notifications
 * @returns {boolean} Whether validation passed
 */
function showValidationErrors(result, useToast = true) {
    if (result.valid) return true;
    
    if (useToast && typeof window.showToast === 'function') {
        window.showToast(result.errors[0], 'error');
    }
    
    return false;
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        validateRequired,
        validateEmail,
        validatePassword,
        validatePasswordMatch,
        validateUrl,
        validateLength,
        validateNumber,
        combineValidations,
        showValidationErrors,
    };
}

window.validateRequired = validateRequired;
window.validateEmail = validateEmail;
window.validatePassword = validatePassword;
window.validatePasswordMatch = validatePasswordMatch;
window.validateUrl = validateUrl;
window.validateLength = validateLength;
window.validateNumber = validateNumber;
window.combineValidations = combineValidations;
window.showValidationErrors = showValidationErrors;
