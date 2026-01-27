/**
 * Layout Injection System
 * ESG Champions Platform
 * 
 * Injects reusable header, sidebar, and footer components.
 */

/**
 * Layout configuration
 */
const LAYOUT_CONFIG = {
    logo: {
        src: 'assets/images/logo1.png',
        alt: 'STIF Logo',
        text: 'Sustainability Technology and Innovation Forum',
    },
    socialLinks: {
        linkedin: '#',
        twitter: '#',
    },
};

/**
 * Navigation items for different contexts
 */
const NAV_ITEMS = {
    public: [
        { href: '/', label: 'Home' },
        { href: '/about.html', label: 'About' },
        { href: '/faq.html', label: 'FAQ' },
    ],
    authenticated: [
        { href: '/', label: 'Home' },
        { href: '/about.html', label: 'About' },
        { href: '/champion-dashboard.html', label: 'Dashboard' },
        { href: '/champion-panels.html', label: 'Panels' },
        { href: '/ranking.html', label: 'Rankings' },
    ],
    admin: [
        { href: '/admin-review.html', label: 'Admin' },
    ],
};

/**
 * Sidebar items for dashboard pages
 */
const SIDEBAR_ITEMS = [
    {
        href: '/champion-dashboard.html',
        label: 'Dashboard',
        icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
        </svg>`,
    },
    {
        href: '/champion-panels.html',
        label: 'ESG Panels',
        icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
            <path d="M2 17l10 5 10-5"></path>
            <path d="M2 12l10 5 10-5"></path>
        </svg>`,
    },
    {
        href: '/ranking.html',
        label: 'Rankings',
        icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M8 6h13"></path>
            <path d="M8 12h13"></path>
            <path d="M8 18h13"></path>
            <path d="M3 6h.01"></path>
            <path d="M3 12h.01"></path>
            <path d="M3 18h.01"></path>
        </svg>`,
    },
    {
        href: '/champion-profile.html',
        label: 'Profile',
        icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
        </svg>`,
    },
    {
        href: '#invite-peers',
        label: 'Invite Peers',
        icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="8.5" cy="7" r="4"></circle>
            <line x1="20" y1="8" x2="20" y2="14"></line>
            <line x1="23" y1="11" x2="17" y2="11"></line>
        </svg>`,
        onclick: "event.preventDefault(); openInvitePeersModal({ page: 'sidebar', panelId: null });",
    },
];

/**
 * Check if a path is active
 * @param {string} path - Path to check
 * @returns {boolean}
 */
function isPathActive(path) {
    const current = window.location.pathname;
    if (path === '/') {
        return current === '/' || current === '/index.html';
    }
    return current.includes(path.replace('.html', ''));
}

/**
 * Generate header HTML
 * @param {Object} options - { isAuthenticated, isAdmin, champion }
 * @returns {string} Header HTML
 */
function generateHeaderHTML(options = {}) {
    const { isAuthenticated = false, isAdmin = false } = options;
    
    // Build nav items
    let navItems = isAuthenticated ? [...NAV_ITEMS.authenticated] : [...NAV_ITEMS.public];
    if (isAdmin) {
        navItems = [...navItems, ...NAV_ITEMS.admin];
    }
    
    const navHTML = navItems.map(item => 
        `<li><a href="${item.href}" class="nav-link ${isPathActive(item.href) ? 'active' : ''}">${item.label}</a></li>`
    ).join('');
    
    return `
        <header class="header">
            <div class="header-inner">
                <a href="/" class="logo">
                    <img src="${LAYOUT_CONFIG.logo.src}" alt="${LAYOUT_CONFIG.logo.alt}" class="logo-img">
                    <span class="logo-text">${LAYOUT_CONFIG.logo.text}</span>
                </a>
                <nav>
                    <ul class="nav-menu">
                        ${navHTML}
                    </ul>
                </nav>
                <div class="nav-actions"></div>
                <button class="mobile-menu-toggle" aria-label="Toggle menu">
                    <span></span><span></span><span></span>
                </button>
            </div>
        </header>
    `;
}

/**
 * Generate mobile menu HTML
 * @param {Object} options - { isAuthenticated, isAdmin }
 * @returns {string} Mobile menu HTML
 */
function generateMobileMenuHTML(options = {}) {
    const { isAuthenticated = false, isAdmin = false } = options;
    
    let navItems = isAuthenticated ? [...NAV_ITEMS.authenticated] : [...NAV_ITEMS.public];
    if (isAdmin) {
        navItems = [...navItems, ...NAV_ITEMS.admin];
    }
    
    const navHTML = navItems.map(item => 
        `<li><a href="${item.href}" class="mobile-nav-link">${item.label}</a></li>`
    ).join('');
    
    return `
        <div class="mobile-menu">
            <button class="mobile-menu-close">&times;</button>
            <ul class="mobile-nav-menu">
                ${navHTML}
                ${!isAuthenticated ? `
                    <li><a href="/champion-login.html" class="mobile-nav-link">Login</a></li>
                    <li><a href="/champion-register.html" class="mobile-nav-link">Register</a></li>
                ` : ''}
            </ul>
        </div>
    `;
}

/**
 * Generate sidebar HTML
 * @param {Object} options - { isAdmin }
 * @returns {string} Sidebar HTML
 */
function generateSidebarHTML(options = {}) {
    const { isAdmin = false } = options;
    
    const items = [...SIDEBAR_ITEMS];
    
    const itemsHTML = items.map(item => {
        const isActive = isPathActive(item.href);
        const onclickAttr = item.onclick ? `onclick="${item.onclick}"` : '';
        
        return `
            <li>
                <a href="${item.href}" class="sidebar-link ${isActive ? 'active' : ''}" ${onclickAttr}>
                    ${item.icon}
                    ${item.label}
                </a>
            </li>
        `;
    }).join('');
    
    return `
        <aside class="sidebar">
            <nav>
                <ul class="sidebar-nav">
                    ${itemsHTML}
                </ul>
            </nav>
        </aside>
    `;
}

/**
 * Generate full footer HTML
 * @returns {string} Footer HTML
 */
function generateFooterHTML() {
    return `
        <footer class="footer">
            <div class="container">
                <div class="footer-grid">
                    <div>
                        <a href="/" class="logo">
                            <img src="${LAYOUT_CONFIG.logo.src}" alt="${LAYOUT_CONFIG.logo.alt}" class="logo-img-footer">
                            <span class="logo-text">${LAYOUT_CONFIG.logo.text}</span>
                        </a>
                        <p class="footer-description">
                            Democratizing sustainability for every business through innovation and technology.
                        </p>
                        <div class="footer-social">
                            <a href="${LAYOUT_CONFIG.socialLinks.linkedin}" aria-label="LinkedIn">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                                    <rect x="2" y="9" width="4" height="12"></rect>
                                    <circle cx="4" cy="4" r="2"></circle>
                                </svg>
                            </a>
                            <a href="${LAYOUT_CONFIG.socialLinks.twitter}" aria-label="Twitter">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                                </svg>
                            </a>
                        </div>
                    </div>
                    
                    <div>
                        <h6 class="footer-title">Platform</h6>
                        <ul class="footer-links">
                            <li><a href="/about.html" class="footer-link">About Us</a></li>
                            <li><a href="/faq.html" class="footer-link">FAQ</a></li>
                        </ul>
                    </div>
                    
                    <div>
                        <h6 class="footer-title">Support</h6>
                        <ul class="footer-links">
                            <li><a href="/terms.html" class="footer-link">Terms of Service</a></li>
                            <li><a href="/privacy.html" class="footer-link">Privacy Policy</a></li>
                            <li><a href="/cookie-policy.html" class="footer-link">Cookie Policy</a></li>
                        </ul>
                    </div>
                    
                    <div class="footer-action">
                        <h6 class="footer-title">Schedule an appointment</h6>
                        <a href="#" class="btn btn-primary">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            Schedule
                        </a>
                    </div>
                </div>
                
                <div class="footer-bottom">
                    <p>&copy; ${new Date().getFullYear()} STIF - Sustainability Technology and Innovation Forum. All rights reserved.</p>
                    <p>Built with purpose for a sustainable future.</p>
                </div>
            </div>
        </footer>
    `;
}

/**
 * Generate compact footer HTML (for dashboard pages)
 * @returns {string} Compact footer HTML
 */
function generateFooterCompactHTML() {
    return `
        <footer class="footer-compact">
            <div class="container">
                <ul class="footer-compact-links">
                    <li><a href="/terms.html">Terms of Service</a></li>
                    <li><a href="/privacy.html">Privacy Policy</a></li>
                    <li><a href="/cookie-policy.html">Cookie Policy</a></li>
                </ul>
                <div class="footer-compact-cta">
                    <a href="#" class="btn btn-primary btn-sm">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        Schedule
                    </a>
                </div>
                <span class="footer-compact-copyright">&copy; ${new Date().getFullYear()} STIF</span>
            </div>
        </footer>
    `;
}

/**
 * Inject header into page
 * @param {string} containerId - Container element ID (default: 'header-root')
 * @param {Object} options - { isAuthenticated, isAdmin, champion }
 */
function injectHeader(containerId = 'header-root', options = {}) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = generateHeaderHTML(options);
    }
}

/**
 * Inject mobile menu into page
 * @param {string} containerId - Container element ID (default: 'mobile-menu-root')
 * @param {Object} options - { isAuthenticated, isAdmin }
 */
function injectMobileMenu(containerId = 'mobile-menu-root', options = {}) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = generateMobileMenuHTML(options);
    }
}

/**
 * Inject sidebar into page
 * @param {string} containerId - Container element ID (default: 'sidebar-root')
 * @param {Object} options - { isAdmin }
 */
function injectSidebar(containerId = 'sidebar-root', options = {}) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = generateSidebarHTML(options);
    }
}

/**
 * Inject footer into page
 * @param {string} containerId - Container element ID (default: 'footer-root')
 * @param {boolean} compact - Whether to use compact footer
 */
function injectFooter(containerId = 'footer-root', compact = false) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = compact ? generateFooterCompactHTML() : generateFooterHTML();
    }
}

/**
 * Initialize layout components based on auth state
 * Call this after auth is ready
 */
async function initLayout() {
    const auth = window.championAuth;
    const isAuthenticated = auth?.isAuthenticated?.() || false;
    const isAdmin = isAuthenticated ? await auth?.isAdmin?.() : false;
    const champion = isAuthenticated ? auth?.getChampion?.() : null;
    
    const options = { isAuthenticated, isAdmin, champion };
    
    // Inject components if containers exist
    injectHeader('header-root', options);
    injectMobileMenu('mobile-menu-root', options);
    injectSidebar('sidebar-root', options);
    
    // Footer - check for compact version
    const footerRoot = document.getElementById('footer-root');
    if (footerRoot) {
        const useCompact = footerRoot.dataset.compact === 'true';
        injectFooter('footer-root', useCompact);
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        LAYOUT_CONFIG,
        NAV_ITEMS,
        SIDEBAR_ITEMS,
        isPathActive,
        generateHeaderHTML,
        generateMobileMenuHTML,
        generateSidebarHTML,
        generateFooterHTML,
        generateFooterCompactHTML,
        injectHeader,
        injectMobileMenu,
        injectSidebar,
        injectFooter,
        initLayout,
    };
}

window.LAYOUT_CONFIG = LAYOUT_CONFIG;
window.injectHeader = injectHeader;
window.injectMobileMenu = injectMobileMenu;
window.injectSidebar = injectSidebar;
window.injectFooter = injectFooter;
window.initLayout = initLayout;
