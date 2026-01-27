/**
 * Storage Utilities
 * ESG Champions Platform
 * 
 * localStorage and sessionStorage wrapper with JSON support.
 */

/**
 * Storage wrapper class
 */
class StorageWrapper {
    constructor(storage) {
        this.storage = storage;
        this.prefix = 'stif_';
    }
    
    /**
     * Get prefixed key
     * @param {string} key - Storage key
     * @returns {string} Prefixed key
     */
    _key(key) {
        return this.prefix + key;
    }
    
    /**
     * Get a value from storage
     * @param {string} key - Storage key
     * @param {*} defaultValue - Default value if not found
     * @returns {*} Stored value or default
     */
    get(key, defaultValue = null) {
        try {
            const value = this.storage.getItem(this._key(key));
            if (value === null) return defaultValue;
            return JSON.parse(value);
        } catch (e) {
            console.warn(`[Storage] Error reading ${key}:`, e);
            return defaultValue;
        }
    }
    
    /**
     * Set a value in storage
     * @param {string} key - Storage key
     * @param {*} value - Value to store
     * @returns {boolean} Success
     */
    set(key, value) {
        try {
            this.storage.setItem(this._key(key), JSON.stringify(value));
            return true;
        } catch (e) {
            console.warn(`[Storage] Error writing ${key}:`, e);
            return false;
        }
    }
    
    /**
     * Remove a value from storage
     * @param {string} key - Storage key
     */
    remove(key) {
        try {
            this.storage.removeItem(this._key(key));
        } catch (e) {
            console.warn(`[Storage] Error removing ${key}:`, e);
        }
    }
    
    /**
     * Check if a key exists
     * @param {string} key - Storage key
     * @returns {boolean}
     */
    has(key) {
        return this.storage.getItem(this._key(key)) !== null;
    }
    
    /**
     * Clear all prefixed items
     */
    clear() {
        try {
            const keysToRemove = [];
            for (let i = 0; i < this.storage.length; i++) {
                const key = this.storage.key(i);
                if (key && key.startsWith(this.prefix)) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => this.storage.removeItem(key));
        } catch (e) {
            console.warn('[Storage] Error clearing:', e);
        }
    }
    
    /**
     * Get all stored keys (without prefix)
     * @returns {string[]}
     */
    keys() {
        const result = [];
        try {
            for (let i = 0; i < this.storage.length; i++) {
                const key = this.storage.key(i);
                if (key && key.startsWith(this.prefix)) {
                    result.push(key.slice(this.prefix.length));
                }
            }
        } catch (e) {
            console.warn('[Storage] Error getting keys:', e);
        }
        return result;
    }
}

// Create instances
const local = new StorageWrapper(
    typeof localStorage !== 'undefined' ? localStorage : { 
        getItem: () => null, 
        setItem: () => {}, 
        removeItem: () => {},
        length: 0,
        key: () => null,
    }
);

const session = new StorageWrapper(
    typeof sessionStorage !== 'undefined' ? sessionStorage : {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
        length: 0,
        key: () => null,
    }
);

/**
 * Convenience functions for common storage operations
 */

// User preferences
function getUserPreference(key, defaultValue = null) {
    return local.get(`pref_${key}`, defaultValue);
}

function setUserPreference(key, value) {
    return local.set(`pref_${key}`, value);
}

// Session data (clears on browser close)
function getSessionData(key, defaultValue = null) {
    return session.get(key, defaultValue);
}

function setSessionData(key, value) {
    return session.set(key, value);
}

// Form drafts (auto-save form data)
function saveFormDraft(formId, data) {
    return session.set(`form_${formId}`, data);
}

function getFormDraft(formId) {
    return session.get(`form_${formId}`, null);
}

function clearFormDraft(formId) {
    session.remove(`form_${formId}`);
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        local,
        session,
        getUserPreference,
        setUserPreference,
        getSessionData,
        setSessionData,
        saveFormDraft,
        getFormDraft,
        clearFormDraft,
    };
}

window.storage = { local, session };
window.getUserPreference = getUserPreference;
window.setUserPreference = setUserPreference;
window.getSessionData = getSessionData;
window.setSessionData = setSessionData;
window.saveFormDraft = saveFormDraft;
window.getFormDraft = getFormDraft;
window.clearFormDraft = clearFormDraft;
