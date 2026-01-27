/**
 * Modal System
 * ESG Champions Platform
 * 
 * Unified modal dialog system.
 */

// Active modals stack
const activeModals = [];

/**
 * Create and show a modal
 * @param {Object} options - Modal options
 * @returns {Object} Modal controller with close method
 */
function createModal(options = {}) {
    const {
        id = `modal-${Date.now()}`,
        title = '',
        content = '',
        size = 'md', // 'sm', 'md', 'lg', 'xl', 'full'
        showClose = true,
        closeOnOverlay = true,
        closeOnEscape = true,
        onClose = null,
        footer = null,
        className = '',
    } = options;
    
    // Size classes
    const sizes = {
        sm: 'max-width: 400px;',
        md: 'max-width: 500px;',
        lg: 'max-width: 700px;',
        xl: 'max-width: 900px;',
        full: 'max-width: 95vw; max-height: 95vh;',
    };
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = id;
    overlay.className = `modal-overlay ${className}`;
    overlay.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        opacity: 0;
        transition: opacity 0.2s ease;
    `;
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal-content';
    modal.style.cssText = `
        background: white;
        border-radius: var(--radius-xl);
        box-shadow: var(--shadow-2xl);
        width: 100%;
        ${sizes[size] || sizes.md}
        max-height: 90vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        transform: scale(0.95);
        transition: transform 0.2s ease;
    `;
    
    // Build modal HTML
    let html = '';
    
    // Header
    if (title || showClose) {
        html += `
            <div class="modal-header" style="
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: var(--space-5) var(--space-6);
                border-bottom: 1px solid var(--gray-100);
            ">
                <h3 style="margin: 0; font-size: var(--text-lg);">${title}</h3>
                ${showClose ? `
                    <button class="modal-close-btn" style="
                        background: none;
                        border: none;
                        font-size: 24px;
                        color: var(--gray-400);
                        cursor: pointer;
                        padding: 4px;
                        line-height: 1;
                    ">&times;</button>
                ` : ''}
            </div>
        `;
    }
    
    // Body
    html += `
        <div class="modal-body" style="
            padding: var(--space-6);
            overflow-y: auto;
            flex: 1;
        ">
            ${content}
        </div>
    `;
    
    // Footer
    if (footer) {
        html += `
            <div class="modal-footer" style="
                display: flex;
                justify-content: flex-end;
                gap: var(--space-3);
                padding: var(--space-4) var(--space-6);
                border-top: 1px solid var(--gray-100);
                background: var(--gray-50);
            ">
                ${footer}
            </div>
        `;
    }
    
    modal.innerHTML = html;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Close function
    const close = () => {
        overlay.style.opacity = '0';
        modal.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
            const idx = activeModals.indexOf(controller);
            if (idx > -1) activeModals.splice(idx, 1);
            if (onClose) onClose();
        }, 200);
    };
    
    // Controller object
    const controller = {
        id,
        element: overlay,
        modal,
        close,
        getBody: () => modal.querySelector('.modal-body'),
        setContent: (html) => {
            const body = modal.querySelector('.modal-body');
            if (body) body.innerHTML = html;
        },
    };
    
    // Event listeners
    if (showClose) {
        modal.querySelector('.modal-close-btn')?.addEventListener('click', close);
    }
    
    if (closeOnOverlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close();
        });
    }
    
    if (closeOnEscape) {
        const escHandler = (e) => {
            if (e.key === 'Escape' && activeModals[activeModals.length - 1] === controller) {
                close();
            }
        };
        document.addEventListener('keydown', escHandler);
        const originalClose = close;
        controller.close = () => {
            document.removeEventListener('keydown', escHandler);
            originalClose();
        };
    }
    
    // Show animation
    requestAnimationFrame(() => {
        overlay.style.opacity = '1';
        modal.style.transform = 'scale(1)';
    });
    
    activeModals.push(controller);
    return controller;
}

/**
 * Show a confirmation modal
 * @param {Object} options - { title, message, confirmText, cancelText, onConfirm, onCancel, danger }
 * @returns {Object} Modal controller
 */
function showConfirm(options = {}) {
    const {
        title = 'Confirm',
        message = 'Are you sure?',
        confirmText = 'Confirm',
        cancelText = 'Cancel',
        onConfirm = null,
        onCancel = null,
        danger = false,
    } = options;
    
    const btnClass = danger ? 'btn btn-danger' : 'btn btn-primary';
    
    const modal = createModal({
        title,
        content: `<p style="color: var(--gray-600);">${message}</p>`,
        size: 'sm',
        footer: `
            <button class="btn btn-ghost" id="confirm-cancel">${cancelText}</button>
            <button class="${btnClass}" id="confirm-ok">${confirmText}</button>
        `,
    });
    
    modal.modal.querySelector('#confirm-cancel')?.addEventListener('click', () => {
        modal.close();
        if (onCancel) onCancel();
    });
    
    modal.modal.querySelector('#confirm-ok')?.addEventListener('click', () => {
        modal.close();
        if (onConfirm) onConfirm();
    });
    
    return modal;
}

/**
 * Show an alert modal
 * @param {Object} options - { title, message, buttonText, onClose }
 * @returns {Object} Modal controller
 */
function showAlert(options = {}) {
    const {
        title = 'Alert',
        message = '',
        buttonText = 'OK',
        onClose = null,
    } = options;
    
    const modal = createModal({
        title,
        content: `<p style="color: var(--gray-600);">${message}</p>`,
        size: 'sm',
        footer: `<button class="btn btn-primary" id="alert-ok">${buttonText}</button>`,
        onClose,
    });
    
    modal.modal.querySelector('#alert-ok')?.addEventListener('click', () => {
        modal.close();
    });
    
    return modal;
}

/**
 * Close all open modals
 */
function closeAllModals() {
    [...activeModals].forEach(modal => modal.close());
}

/**
 * Get the topmost modal
 * @returns {Object|null} Modal controller
 */
function getActiveModal() {
    return activeModals[activeModals.length - 1] || null;
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        createModal,
        showConfirm,
        showAlert,
        closeAllModals,
        getActiveModal,
    };
}

window.createModal = createModal;
window.showConfirm = showConfirm;
window.showAlert = showAlert;
window.closeAllModals = closeAllModals;
window.getActiveModal = getActiveModal;
