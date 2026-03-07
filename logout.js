/**
 * Logout Handler
 * ESG Champions Platform
 */

async function handleLogout(event) {
    if (event) {
        event.preventDefault();
    }

    try {
        // Always clear login_context on logout, regardless of which auth object handles it
        localStorage.removeItem('login_context');

        // Use whichever auth service is available — business pages may not have championAuth
        const auth = window.businessAuth?.isAuthenticated?.()
            ? window.businessAuth
            : window.championAuth;

        if (!auth) {
            console.error('Auth not available');
            window.location.href = '/';
            return;
        }

        // Show loading state
        const btn = event?.target;
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Logging out...';
        }

        // Perform logout
        const result = await auth.logout();

        if (result.success) {
            // Clear any local storage
            localStorage.removeItem('esg_user');
            localStorage.removeItem('esg_session');
            
            // Show success message
            showToast('Logged out successfully', 'success');
            
            // Redirect to home
            setTimeout(() => {
                window.location.href = '/';
            }, 500);
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Logout error:', error);
        showToast('Logout failed. Redirecting...', 'error');
        
        // Force redirect anyway
        setTimeout(() => {
            window.location.href = '/';
        }, 1000);
    }
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    // Check if toast container exists
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    // Create toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = {
        success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>',
        error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
        info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
    };

    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <span class="toast-message">${message}</span>
    `;

    container.appendChild(toast);

    // Remove after delay
    setTimeout(() => {
        toast.classList.add('toast-fade-out');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// Add toast styles
const toastStyles = document.createElement('style');
toastStyles.textContent = `
    .toast-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 10px;
    }
    
    .toast {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 20px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
        animation: toastSlideIn 0.3s ease;
        min-width: 280px;
    }
    
    .toast-success .toast-icon {
        color: var(--success);
    }
    
    .toast-error .toast-icon {
        color: var(--error);
    }
    
    .toast-info .toast-icon {
        color: var(--info);
    }
    
    .toast-message {
        flex: 1;
        font-weight: 500;
        color: var(--gray-800);
    }
    
    .toast-fade-out {
        animation: toastSlideOut 0.3s ease forwards;
    }
    
    @keyframes toastSlideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes toastSlideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(toastStyles);

// Export
window.handleLogout = handleLogout;
window.showToast = showToast;
