/**
 * Form Helpers
 * ESG Champions Platform
 * 
 * Reusable form handling utilities.
 */

/**
 * Get all form values as an object
 * @param {string|HTMLFormElement} form - Form ID or element
 * @returns {Object} Form data as key-value pairs
 */
function getFormValues(form) {
    const formEl = typeof form === 'string' ? document.getElementById(form) : form;
    if (!formEl) return {};
    
    const formData = new FormData(formEl);
    const values = {};
    
    for (const [key, value] of formData.entries()) {
        // Handle multiple values (e.g., checkboxes with same name)
        if (values[key] !== undefined) {
            if (!Array.isArray(values[key])) {
                values[key] = [values[key]];
            }
            values[key].push(value);
        } else {
            values[key] = value;
        }
    }
    
    return values;
}

/**
 * Set form values from an object
 * @param {string|HTMLFormElement} form - Form ID or element
 * @param {Object} values - Values to set
 */
function setFormValues(form, values) {
    const formEl = typeof form === 'string' ? document.getElementById(form) : form;
    if (!formEl || !values) return;
    
    Object.entries(values).forEach(([key, value]) => {
        const field = formEl.elements[key];
        if (!field) return;
        
        if (field.type === 'checkbox') {
            field.checked = Boolean(value);
        } else if (field.type === 'radio') {
            const radios = formEl.querySelectorAll(`[name="${key}"]`);
            radios.forEach(radio => {
                radio.checked = radio.value === String(value);
            });
        } else if (field.tagName === 'SELECT' && field.multiple) {
            const vals = Array.isArray(value) ? value : [value];
            Array.from(field.options).forEach(option => {
                option.selected = vals.includes(option.value);
            });
        } else {
            field.value = value ?? '';
        }
    });
}

/**
 * Reset a form to initial values
 * @param {string|HTMLFormElement} form - Form ID or element
 */
function resetForm(form) {
    const formEl = typeof form === 'string' ? document.getElementById(form) : form;
    if (formEl) formEl.reset();
}

/**
 * Disable all form inputs
 * @param {string|HTMLFormElement} form - Form ID or element
 * @param {boolean} disabled - Whether to disable
 */
function setFormDisabled(form, disabled = true) {
    const formEl = typeof form === 'string' ? document.getElementById(form) : form;
    if (!formEl) return;
    
    const inputs = formEl.querySelectorAll('input, select, textarea, button');
    inputs.forEach(input => {
        input.disabled = disabled;
    });
}

/**
 * Get a single field value
 * @param {string} fieldId - Field ID
 * @returns {*} Field value
 */
function getFieldValue(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return null;
    
    if (field.type === 'checkbox') {
        return field.checked;
    }
    
    return field.value.trim();
}

/**
 * Set a single field value
 * @param {string} fieldId - Field ID
 * @param {*} value - Value to set
 */
function setFieldValue(fieldId, value) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    if (field.type === 'checkbox') {
        field.checked = Boolean(value);
    } else {
        field.value = value ?? '';
    }
}

/**
 * Show field error
 * @param {string} fieldId - Field ID
 * @param {string} message - Error message
 */
function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    // Add error class
    field.classList.add('field-error');
    field.style.borderColor = 'var(--error)';
    
    // Find or create error message
    let errorEl = field.parentNode.querySelector('.field-error-message');
    if (!errorEl) {
        errorEl = document.createElement('div');
        errorEl.className = 'field-error-message';
        errorEl.style.cssText = 'color: var(--error); font-size: var(--text-sm); margin-top: var(--space-1);';
        field.parentNode.appendChild(errorEl);
    }
    
    errorEl.textContent = message;
}

/**
 * Clear field error
 * @param {string} fieldId - Field ID
 */
function clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    field.classList.remove('field-error');
    field.style.borderColor = '';
    
    const errorEl = field.parentNode.querySelector('.field-error-message');
    if (errorEl) errorEl.remove();
}

/**
 * Clear all form errors
 * @param {string|HTMLFormElement} form - Form ID or element
 */
function clearFormErrors(form) {
    const formEl = typeof form === 'string' ? document.getElementById(form) : form;
    if (!formEl) return;
    
    formEl.querySelectorAll('.field-error').forEach(el => {
        el.classList.remove('field-error');
        el.style.borderColor = '';
    });
    
    formEl.querySelectorAll('.field-error-message').forEach(el => el.remove());
}

/**
 * Build a safe payload object for database insert/update
 * Only includes explicitly allowed keys
 * @param {Object} data - Source data
 * @param {string[]} allowedKeys - Keys to include
 * @returns {Object} Filtered payload
 */
function buildSafePayload(data, allowedKeys) {
    const payload = {};
    
    allowedKeys.forEach(key => {
        if (data[key] !== undefined) {
            payload[key] = data[key];
        }
    });
    
    return payload;
}

/**
 * Add form submit handler with validation
 * @param {string|HTMLFormElement} form - Form ID or element
 * @param {Function} onSubmit - Submit handler (receives form values)
 * @param {Object} options - { validate, onError }
 */
function onFormSubmit(form, onSubmit, options = {}) {
    const formEl = typeof form === 'string' ? document.getElementById(form) : form;
    if (!formEl) return;
    
    const { validate = null, onError = null } = options;
    
    formEl.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        clearFormErrors(formEl);
        const values = getFormValues(formEl);
        
        // Validate if validator provided
        if (validate) {
            const result = validate(values);
            if (!result.valid) {
                if (onError) {
                    onError(result.errors);
                } else if (window.showToast) {
                    window.showToast(result.errors[0], 'error');
                }
                return;
            }
        }
        
        try {
            await onSubmit(values);
        } catch (error) {
            console.error('Form submit error:', error);
            if (window.showToast) {
                window.showToast(error.message || 'An error occurred', 'error');
            }
        }
    });
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getFormValues,
        setFormValues,
        resetForm,
        setFormDisabled,
        getFieldValue,
        setFieldValue,
        showFieldError,
        clearFieldError,
        clearFormErrors,
        buildSafePayload,
        onFormSubmit,
    };
}

window.getFormValues = getFormValues;
window.setFormValues = setFormValues;
window.resetForm = resetForm;
window.setFormDisabled = setFormDisabled;
window.getFieldValue = getFieldValue;
window.setFieldValue = setFieldValue;
window.showFieldError = showFieldError;
window.clearFieldError = clearFieldError;
window.clearFormErrors = clearFormErrors;
window.buildSafePayload = buildSafePayload;
window.onFormSubmit = onFormSubmit;
