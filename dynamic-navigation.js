/**
 * Dynamic Navigation System
 * ESG Champions Platform
 * 
 * Handles role-based navigation and menu state
 */

class DynamicNavigation {
    constructor() {
        this.auth = null;
        this.initialized = false;
    }

    /**
     * Initialize navigation
     */
    async init() {
        if (this.initialized) return;
        
        // Wait for auth to be ready
        this.auth = window.championAuth;
        
        // Initial render
        await this.updateNavigation();
        
        // Listen for auth changes
        this.auth.addAuthListener((event, session) => {
            this.updateNavigation();
        });

        // Set up mobile menu
        this.setupMobileMenu();
        
        // Set up header scroll effect
        this.setupHeaderScroll();
        
        this.initialized = true;
    }

    /**
     * Update navigation based on auth state
     */
    async updateNavigation() {
        const isAuthenticated = this.auth && this.auth.isAuthenticated();
        const isAdmin = isAuthenticated ? await this.auth.isAdmin() : false;
        const champion = isAuthenticated ? this.auth.getChampion() : null;

        // Update desktop nav
        this.updateDesktopNav(isAuthenticated, isAdmin, champion);
        
        // Update mobile nav
        this.updateMobileNav(isAuthenticated, isAdmin, champion);
        
        // Update nav actions (login/register buttons)
        this.updateNavActions(isAuthenticated, champion);
    }

    /**
     * Update desktop navigation menu
     */
    updateDesktopNav(isAuthenticated, isAdmin, champion) {
        const navMenu = document.querySelector('.nav-menu');
        if (!navMenu) return;

        let menuHTML = '';

        // Public links - always visible
        menuHTML += `<li><a href="/" class="nav-link ${this.isActive('/')}" >Home</a></li>`;
        menuHTML += `<li><a href="/about.html" class="nav-link ${this.isActive('/about.html')}">About</a></li>`;
        
        if (isAuthenticated) {
            // Authenticated user links
            menuHTML += `<li><a href="/champion-dashboard.html" class="nav-link ${this.isActive('/champion-dashboard.html')}">Dashboard</a></li>`;
            menuHTML += `<li><a href="/champion-panels.html" class="nav-link ${this.isActive('/champion-panels.html')}">Panels</a></li>`;
            menuHTML += `<li><a href="/ranking.html" class="nav-link ${this.isActive('/ranking.html')}">Rankings</a></li>`;
            
            // Admin link
            if (isAdmin) {
                menuHTML += `<li><a href="/admin-review.html" class="nav-link ${this.isActive('/admin-review.html')}">Admin</a></li>`;
            }
        } else {
            // Public links for non-authenticated users
            menuHTML += `<li><a href="/faq.html" class="nav-link ${this.isActive('/faq.html')}">FAQ</a></li>`;
        }

        navMenu.innerHTML = menuHTML;
    }

    /**
     * Update mobile navigation menu
     */
    updateMobileNav(isAuthenticated, isAdmin, champion) {
        const mobileNavMenu = document.querySelector('.mobile-nav-menu');
        if (!mobileNavMenu) return;

        let menuHTML = '';

        // Public links
        menuHTML += `<li><a href="/" class="mobile-nav-link">Home</a></li>`;
        menuHTML += `<li><a href="/about.html" class="mobile-nav-link">About</a></li>`;
        
        if (isAuthenticated) {
            menuHTML += `<li><a href="/champion-dashboard.html" class="mobile-nav-link">Dashboard</a></li>`;
            menuHTML += `<li><a href="/champion-panels.html" class="mobile-nav-link">Panels</a></li>`;
            menuHTML += `<li><a href="/ranking.html" class="mobile-nav-link">Rankings</a></li>`;
            menuHTML += `<li><a href="/champion-profile.html" class="mobile-nav-link">Profile</a></li>`;
            
            if (isAdmin) {
                menuHTML += `<li><a href="/admin-review.html" class="mobile-nav-link">Admin Panel</a></li>`;
            }
            
            menuHTML += `<li><a href="#" class="mobile-nav-link" onclick="window.championAuth.logout().then(() => window.location.href = '/')">Logout</a></li>`;
        } else {
            menuHTML += `<li><a href="/faq.html" class="mobile-nav-link">FAQ</a></li>`;
            menuHTML += `<li><a href="/champion-login.html" class="mobile-nav-link">Login</a></li>`;
            menuHTML += `<li><a href="/champion-register.html" class="mobile-nav-link">Register</a></li>`;
        }

        mobileNavMenu.innerHTML = menuHTML;
    }

    /**
     * Update navigation action buttons
     */
    updateNavActions(isAuthenticated, champion) {
        const navActions = document.querySelector('.nav-actions');
        if (!navActions) return;

        if (isAuthenticated && champion) {
            navActions.innerHTML = `
                <div class="nav-notifications">
                    <button class="btn btn-icon btn-ghost" id="notifications-btn" title="Notifications">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                        </svg>
                        <span class="notification-badge hidden" id="notification-count">0</span>
                    </button>
                    <div class="notifications-dropdown hidden" id="notifications-dropdown">
                        <div class="notifications-header">
                            <h4>Notifications</h4>
                            <button class="btn btn-ghost btn-sm" id="mark-all-read-btn">Mark all read</button>
                        </div>
                        <div class="notifications-list" id="notifications-list">
                            <div class="notifications-empty">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--gray-300)" stroke-width="2">
                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                                </svg>
                                <p>No new notifications</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="nav-user-menu">
                    <button class="user-menu-trigger" id="user-menu-btn">
                        <div class="avatar">
                            ${champion.avatar_url 
                                ? `<img src="${champion.avatar_url}" alt="${champion.full_name}">`
                                : this.getInitials(champion.full_name || champion.email)
                            }
                        </div>
                    </button>
                    <div class="user-dropdown hidden" id="user-dropdown">
                        <div class="user-dropdown-header">
                            <strong>${champion.full_name || 'Champion'}</strong>
                            <span class="text-muted">${champion.email}</span>
                        </div>
                        <div class="user-dropdown-divider"></div>
                        <a href="/champion-profile.html" class="user-dropdown-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            Profile Settings
                        </a>
                        <a href="/champion-dashboard.html" class="user-dropdown-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="3" width="7" height="7"></rect>
                                <rect x="14" y="3" width="7" height="7"></rect>
                                <rect x="14" y="14" width="7" height="7"></rect>
                                <rect x="3" y="14" width="7" height="7"></rect>
                            </svg>
                            Dashboard
                        </a>
                        <div class="user-dropdown-divider"></div>
                        <a href="#" class="user-dropdown-item text-error" onclick="event.preventDefault(); window.championAuth.logout().then(() => window.location.href = '/')">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                <polyline points="16 17 21 12 16 7"></polyline>
                                <line x1="21" y1="12" x2="9" y2="12"></line>
                            </svg>
                            Logout
                        </a>
                    </div>
                </div>
            `;

            // Set up user dropdown
            this.setupUserDropdown();
            
            // Set up notifications dropdown
            this.setupNotificationsDropdown();
            
            // Load notifications
            this.loadNotifications();
        } else {
            navActions.innerHTML = `
                <a href="/champion-login.html" class="btn btn-ghost">Login</a>
                <a href="/champion-register.html" class="btn btn-primary">Get Started</a>
            `;
        }
    }

    /**
     * Set up user dropdown menu
     */
    setupUserDropdown() {
        const btn = document.getElementById('user-menu-btn');
        const dropdown = document.getElementById('user-dropdown');
        
        if (!btn || !dropdown) return;

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('hidden');
            // Close notifications dropdown when opening user menu
            document.getElementById('notifications-dropdown')?.classList.add('hidden');
        });

        // Close on outside click
        document.addEventListener('click', () => {
            dropdown.classList.add('hidden');
        });
    }

    /**
     * Set up notifications dropdown
     */
    setupNotificationsDropdown() {
        const btn = document.getElementById('notifications-btn');
        const dropdown = document.getElementById('notifications-dropdown');
        const markAllReadBtn = document.getElementById('mark-all-read-btn');
        
        if (!btn || !dropdown) return;

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('hidden');
            // Close user dropdown when opening notifications
            document.getElementById('user-dropdown')?.classList.add('hidden');
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target) && e.target !== btn) {
                dropdown.classList.add('hidden');
            }
        });

        // Close on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                dropdown.classList.add('hidden');
            }
        });

        // Mark all as read
        if (markAllReadBtn) {
            markAllReadBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.markAllNotificationsRead();
            });
        }
    }

    /**
     * Load notifications and count
     */
    async loadNotifications() {
        try {
            let notifications = [];
            let dbNotifications = [];
            
            // Try to get notifications from database
            try {
                if (window.championDB && window.championDB.getNotifications) {
                    dbNotifications = await window.championDB.getNotifications();
                    console.log('Loaded notifications from DB:', dbNotifications?.length || 0);
                }
            } catch (dbError) {
                console.warn('Could not load notifications from DB:', dbError.message);
            }

            // If we have DB notifications, normalize and use them
            if (dbNotifications && dbNotifications.length > 0) {
                // Normalize DB notification format (is_read -> read)
                notifications = dbNotifications.map(n => ({
                    ...n,
                    read: n.is_read || n.read || false
                }));
            } else {
                // No DB notifications, use mock data for demo
                notifications = this.getMockNotifications();
                // Apply saved read states from localStorage for mock data
                notifications = this.applyStoredReadStates(notifications);
            }

            this.notifications = notifications;
            this.renderNotifications(notifications);
            this.updateNotificationBadge(notifications);
            
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    }

    /**
     * Apply stored read states from localStorage to notifications
     */
    applyStoredReadStates(notifications) {
        try {
            const readStates = JSON.parse(localStorage.getItem('notificationReadStates') || '{}');
            return notifications.map(n => {
                if (readStates[n.id]) {
                    return { ...n, read: true, is_read: true };
                }
                return n;
            });
        } catch (err) {
            return notifications;
        }
    }

    /**
     * Save notification read state to localStorage
     */
    saveReadState(notificationId) {
        try {
            const readStates = JSON.parse(localStorage.getItem('notificationReadStates') || '{}');
            readStates[notificationId] = true;
            localStorage.setItem('notificationReadStates', JSON.stringify(readStates));
        } catch (err) {
            console.warn('Could not save notification read state:', err);
        }
    }

    /**
     * Get mock notifications for demo
     */
    getMockNotifications() {
        return [
            {
                id: 'mock-notif-001',
                type: 'review_accepted',
                title: 'Review Approved! 🎉',
                message: 'Your review for "Climate & GHG Emissions" panel has been approved!',
                read: false,
                is_read: false,
                created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
                data: {
                    panel_name: 'Climate & GHG Emissions',
                    admin_comment: 'Great work! Your analysis was thorough and well-structured.'
                }
            },
            {
                id: 'mock-notif-002',
                type: 'credits_awarded',
                title: 'Credits Earned! 💰',
                message: 'You earned 10 credits for your approved review of "Climate & GHG Emissions".',
                read: false,
                is_read: false,
                created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
                data: {
                    credits: 10,
                    panel_name: 'Climate & GHG Emissions'
                }
            },
            {
                id: 'mock-notif-003',
                type: 'peer_joined',
                title: 'Your Peer Joined! 🎉',
                message: 'John Doe accepted your invitation and joined STIF!',
                read: false,
                is_read: false,
                created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
                data: {
                    new_user_name: 'John Doe'
                }
            },
            {
                id: 'mock-notif-004',
                type: 'new_panel',
                title: 'New Panel Available! 📋',
                message: 'A new "Data Privacy & Cybersecurity" panel is now available for review. Start reviewing to earn credits!',
                read: true,
                is_read: true,
                created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
                data: {
                    panel_name: 'Data Privacy & Cybersecurity'
                }
            }
        ];
    }

    /**
     * Render notifications list
     */
    renderNotifications(notifications) {
        const list = document.getElementById('notifications-list');
        if (!list) return;

        const unreadNotifications = notifications.filter(n => !n.read);
        
        if (notifications.length === 0) {
            list.innerHTML = `
                <div class="notifications-empty">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--gray-300)" stroke-width="2">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                    <p>No new notifications</p>
                </div>
            `;
            return;
        }

        list.innerHTML = notifications.map(notification => `
            <div class="notification-item ${notification.read ? 'read' : 'unread'}" 
                 data-id="${notification.id}" 
                 data-type="${notification.type}"
                 data-has-details="${notification.data ? 'true' : 'false'}"
                 onclick="window.dynamicNav.handleNotificationClick('${notification.id}')">
                <div class="notification-icon ${this.getNotificationIconClass(notification.type)}">
                    ${this.getNotificationIcon(notification.type)}
                </div>
                <div class="notification-content">
                    <strong>${notification.title}</strong>
                    <p>${notification.message}</p>
                    <span class="notification-time">${this.formatTimeAgo(notification.created_at)}</span>
                </div>
                ${!notification.read ? '<span class="notification-unread-dot"></span>' : ''}
            </div>
        `).join('');
    }

    /**
     * Update notification badge count
     */
    updateNotificationBadge(notifications) {
        const badge = document.getElementById('notification-count');
        if (!badge) return;

        const unreadCount = notifications.filter(n => !n.read).length;
        
        if (unreadCount > 0) {
            badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }

    /**
     * Handle notification click - show details if available
     */
    handleNotificationClick(notificationId) {
        const notification = this.notifications?.find(n => n.id === notificationId);
        if (!notification) return;

        // Mark as read
        this.markNotificationRead(notificationId);

        // Check notification type and handle accordingly
        const reviewNotifications = ['review_accepted', 'review_rejected', 'review_approved'];
        const detailNotifications = ['credits_awarded', 'peer_joined', 'new_panel'];

        if (reviewNotifications.includes(notification.type)) {
            // Show detailed modal for review notifications
            this.showNotificationDetailModal(notification);
        } else if (detailNotifications.includes(notification.type)) {
            // Show generic detail modal for other notification types
            this.showGenericNotificationModal(notification);
        } else if (notification.link) {
            // Navigate to the link
            window.location.href = notification.link;
        }
    }

    /**
     * Show generic notification modal
     */
    showGenericNotificationModal(notification) {
        // Remove existing modal if any
        const existingModal = document.getElementById('notification-detail-modal-backdrop');
        if (existingModal) existingModal.remove();

        const icon = this.getNotificationIcon(notification.type);
        const iconClass = this.getNotificationIconClass(notification.type);
        const bgColor = iconClass === 'icon-success' ? 'var(--success-light)' 
            : iconClass === 'icon-warning' ? 'var(--warning-light)'
            : iconClass === 'icon-primary' ? 'var(--primary-50)'
            : 'var(--info-light)';
        const strokeColor = iconClass === 'icon-success' ? 'var(--success)' 
            : iconClass === 'icon-warning' ? 'var(--warning)'
            : iconClass === 'icon-primary' ? 'var(--primary-600)'
            : 'var(--info)';

        // Build action button based on type
        let actionButton = '';
        if (notification.type === 'new_panel') {
            actionButton = `<a href="/champion-panels.html" class="btn btn-primary">View Panels</a>`;
        } else if (notification.type === 'peer_joined') {
            actionButton = `<a href="/champion-dashboard.html" class="btn btn-primary">Go to Dashboard</a>`;
        } else if (notification.type === 'credits_awarded') {
            actionButton = `<a href="/champion-dashboard.html" class="btn btn-primary">View Credits</a>`;
        }

        const modalHTML = `
            <div class="modal-backdrop active" id="notification-detail-modal-backdrop">
                <div class="modal active" style="max-width: 450px;">
                    <div class="modal-header">
                        <h3 class="modal-title">${notification.title}</h3>
                        <button class="modal-close" onclick="window.dynamicNav.closeNotificationDetailModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div style="text-align: center; margin-bottom: var(--space-4);">
                            <div style="width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto var(--space-3); background: ${bgColor};">
                                <div style="color: ${strokeColor}; transform: scale(1.5);">${icon}</div>
                            </div>
                            <p class="text-secondary" style="font-size: var(--text-base);">${notification.message}</p>
                        </div>
                        ${notification.data?.credits ? `
                            <div style="background: var(--gray-50); border-radius: var(--radius-lg); padding: var(--space-3); text-align: center; margin-bottom: var(--space-4);">
                                <span class="text-secondary">Credits earned:</span>
                                <strong style="margin-left: var(--space-2); color: var(--warning); font-size: var(--text-lg);">+${notification.data.credits}</strong>
                            </div>
                        ` : ''}
                        ${notification.data?.new_user_name ? `
                            <div style="background: var(--gray-50); border-radius: var(--radius-lg); padding: var(--space-3); text-align: center; margin-bottom: var(--space-4);">
                                <span class="text-secondary">New member:</span>
                                <strong style="margin-left: var(--space-2);">${notification.data.new_user_name}</strong>
                            </div>
                        ` : ''}
                        ${notification.data?.panel_name ? `
                            <div style="background: var(--gray-50); border-radius: var(--radius-lg); padding: var(--space-3); text-align: center; margin-bottom: var(--space-4);">
                                <span class="text-secondary">Panel:</span>
                                <strong style="margin-left: var(--space-2);">${notification.data.panel_name}</strong>
                            </div>
                        ` : ''}
                    </div>
                    <div class="modal-footer">
                        ${actionButton}
                        <button type="button" class="btn btn-secondary" onclick="window.dynamicNav.closeNotificationDetailModal()">Close</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    /**
     * Show notification detail modal with admin feedback
     */
    showNotificationDetailModal(notification) {
        // Remove existing modal if any
        const existingModal = document.getElementById('notification-detail-modal-backdrop');
        if (existingModal) existingModal.remove();

        const isApproved = notification.type === 'review_accepted';
        const adminComment = notification.data?.admin_comment || notification.data?.rejection_reason || '';
        const panelName = notification.data?.panel_name || 'Panel';

        const modalHTML = `
            <div class="modal-backdrop active" id="notification-detail-modal-backdrop">
                <div class="modal active" style="max-width: 500px;">
                    <div class="modal-header">
                        <h3 class="modal-title">${notification.title}</h3>
                        <button class="modal-close" onclick="window.dynamicNav.closeNotificationDetailModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div style="text-align: center; margin-bottom: var(--space-4);">
                            <div style="width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto var(--space-3); background: ${isApproved ? 'var(--success-light)' : 'var(--warning-light)'};">
                                ${isApproved 
                                    ? '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>'
                                    : '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>'
                                }
                            </div>
                            <h4 style="margin-bottom: var(--space-2);">${isApproved ? 'Congratulations!' : 'Feedback Required'}</h4>
                            <p class="text-secondary">${notification.message}</p>
                        </div>

                        <div style="background: var(--gray-50); border-radius: var(--radius-lg); padding: var(--space-4); margin-bottom: var(--space-4);">
                            <div style="margin-bottom: var(--space-3);">
                                <span class="text-secondary">Panel:</span>
                                <strong style="margin-left: var(--space-2);">${panelName}</strong>
                            </div>
                            <div style="margin-bottom: var(--space-3);">
                                <span class="text-secondary">Status:</span>
                                <span class="badge ${isApproved ? 'badge-success' : 'badge-warning'}" style="margin-left: var(--space-2);">
                                    ${isApproved ? 'Approved' : 'Needs Changes'}
                                </span>
                            </div>
                            ${adminComment ? `
                                <div>
                                    <span class="text-secondary">Admin Feedback:</span>
                                    <div style="margin-top: var(--space-2); padding: var(--space-3); background: white; border-radius: var(--radius-md); border-left: 3px solid ${isApproved ? 'var(--success)' : 'var(--warning)'};">
                                        ${adminComment}
                                    </div>
                                </div>
                            ` : '<p class="text-muted"><em>No additional feedback provided.</em></p>'}
                        </div>
                    </div>
                    <div class="modal-footer">
                        ${!isApproved ? `
                            <a href="/champion-panels.html" class="btn btn-primary">Review Panels</a>
                        ` : ''}
                        <button type="button" class="btn btn-secondary" onclick="window.dynamicNav.closeNotificationDetailModal()">Close</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Close on backdrop click
        document.getElementById('notification-detail-modal-backdrop').addEventListener('click', (e) => {
            if (e.target.id === 'notification-detail-modal-backdrop') {
                this.closeNotificationDetailModal();
            }
        });

        // Close on Escape
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeNotificationDetailModal();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    }

    /**
     * Close notification detail modal
     */
    closeNotificationDetailModal() {
        const modal = document.getElementById('notification-detail-modal-backdrop');
        if (modal) modal.remove();
    }

    /**
     * Mark a notification as read
     */
    markNotificationRead(notificationId) {
        const notification = this.notifications?.find(n => n.id === notificationId);
        if (notification && !notification.read && !notification.is_read) {
            notification.read = true;
            notification.is_read = true;
            this.renderNotifications(this.notifications);
            this.updateNotificationBadge(this.notifications);
            
            // Save read state to localStorage for persistence
            this.saveReadState(notificationId);
            
            // Only update in database if it's a real UUID (not a mock notification)
            const isMockNotification = notificationId.startsWith('mock-');
            if (!isMockNotification) {
                try {
                    window.championDB?.markAsRead?.(notificationId);
                } catch (err) {
                    console.warn('Could not update notification in DB:', err);
                }
            }
        }
    }

    /**
     * Mark all notifications as read
     */
    markAllNotificationsRead() {
        if (this.notifications) {
            this.notifications.forEach(n => {
                n.read = true;
                n.is_read = true;
                // Save each read state to localStorage
                this.saveReadState(n.id);
            });
            this.renderNotifications(this.notifications);
            this.updateNotificationBadge(this.notifications);
            
            // Only call DB if we have real notifications (check if any don't start with mock-)
            const hasRealNotifications = this.notifications.some(n => !n.id.startsWith('mock-'));
            if (hasRealNotifications) {
                try {
                    window.championDB?.markAllAsRead?.();
                } catch (err) {
                    console.warn('Could not update notifications in DB:', err);
                }
            }
            
            window.showToast?.('All notifications marked as read', 'success');
        }
    }

    /**
     * Get notification icon based on type
     */
    getNotificationIcon(type) {
        const icons = {
            review_approved: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>',
            review_accepted: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>',
            review_rejected: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>',
            credits_earned: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path><line x1="12" y1="18" x2="12" y2="6"></line></svg>',
            credits_awarded: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path><line x1="12" y1="18" x2="12" y2="6"></line></svg>',
            peer_joined: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>',
            new_panel: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>',
            admin_message: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>',
            system: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
            default: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path></svg>'
        };
        return icons[type] || icons.default;
    }

    /**
     * Get notification icon class based on type
     */
    getNotificationIconClass(type) {
        const classes = {
            review_approved: 'icon-success',
            review_accepted: 'icon-success',
            review_rejected: 'icon-warning',
            credits_earned: 'icon-warning',
            credits_awarded: 'icon-warning',
            peer_joined: 'icon-primary',
            new_panel: 'icon-info',
            admin_message: 'icon-primary',
            system: 'icon-info'
        };
        return classes[type] || 'icon-default';
    }

    /**
     * Format time ago
     */
    formatTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
        return date.toLocaleDateString();
    }

    /**
     * Load notification count (legacy method)
     */
    async loadNotificationCount() {
        try {
            const count = await window.championDB.getUnreadCount();
            const badge = document.getElementById('notification-count');
            
            if (badge) {
                if (count > 0) {
                    badge.textContent = count > 99 ? '99+' : count;
                    badge.classList.remove('hidden');
                } else {
                    badge.classList.add('hidden');
                }
            }
        } catch (error) {
            console.error('Error loading notification count:', error);
        }
    }

    /**
     * Set up mobile menu toggle
     */
    setupMobileMenu() {
        const toggle = document.querySelector('.mobile-menu-toggle');
        const menu = document.querySelector('.mobile-menu');
        const close = document.querySelector('.mobile-menu-close');
        
        if (toggle && menu) {
            toggle.addEventListener('click', () => {
                menu.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
        }
        
        if (close && menu) {
            close.addEventListener('click', () => {
                menu.classList.remove('active');
                document.body.style.overflow = '';
            });
        }

        // Close on link click
        const mobileLinks = document.querySelectorAll('.mobile-nav-link');
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (menu) {
                    menu.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });
        });
    }

    /**
     * Set up header scroll effect
     */
    setupHeaderScroll() {
        const header = document.querySelector('.header');
        if (!header) return;

        let lastScroll = 0;
        
        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;
            
            if (currentScroll > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
            
            lastScroll = currentScroll;
        });
    }

    /**
     * Check if current path is active
     */
    isActive(path) {
        const currentPath = window.location.pathname;
        if (path === '/' || path === '/index.html') {
            return (currentPath === '/' || currentPath === '/index.html') ? 'active' : '';
        }
        return currentPath === path ? 'active' : '';
    }

    /**
     * Get initials from name
     */
    getInitials(name) {
        if (!name) return '?';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    }
}

// Add styles for dynamic elements
const dynamicNavStyles = document.createElement('style');
dynamicNavStyles.textContent = `
    .nav-notifications {
        position: relative;
    }
    
    .notification-badge {
        position: absolute;
        top: -4px;
        right: -4px;
        background: var(--error);
        color: white;
        font-size: 10px;
        font-weight: 700;
        padding: 2px 5px;
        border-radius: var(--radius-full);
        min-width: 18px;
        text-align: center;
    }
    
    .nav-user-menu {
        position: relative;
    }
    
    .user-menu-trigger {
        background: none;
        border: 2px solid var(--gray-200);
        border-radius: var(--radius-full);
        padding: 2px;
        cursor: pointer;
        transition: all var(--transition);
    }
    
    .user-menu-trigger:hover {
        border-color: var(--primary-400);
    }
    
    .user-dropdown {
        position: absolute;
        top: calc(100% + 8px);
        right: 0;
        background: white;
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-xl);
        min-width: 220px;
        z-index: var(--z-dropdown);
        overflow: hidden;
    }
    
    .user-dropdown-header {
        padding: var(--space-4);
        border-bottom: 1px solid var(--gray-100);
    }
    
    .user-dropdown-header strong {
        display: block;
        color: var(--gray-900);
    }
    
    .user-dropdown-header .text-muted {
        font-size: var(--text-sm);
        color: var(--gray-500);
    }
    
    .user-dropdown-divider {
        height: 1px;
        background: var(--gray-100);
    }
    
    .user-dropdown-item {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-3) var(--space-4);
        color: var(--gray-700);
        transition: all var(--transition);
    }
    
    .user-dropdown-item:hover {
        background: var(--gray-50);
        color: var(--gray-900);
    }
    
    .user-dropdown-item.text-error {
        color: var(--error);
    }
    
    .user-dropdown-item.text-error:hover {
        background: var(--error-bg);
    }
    
    /* Notifications Dropdown */
    .notifications-dropdown {
        position: absolute;
        top: calc(100% + 8px);
        right: 0;
        background: white;
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-xl);
        width: 360px;
        max-height: 480px;
        z-index: var(--z-dropdown);
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }
    
    .notifications-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-4);
        border-bottom: 1px solid var(--gray-100);
    }
    
    .notifications-header h4 {
        margin: 0;
        font-size: var(--text-base);
        font-weight: 600;
        color: var(--gray-900);
    }
    
    .notifications-list {
        flex: 1;
        overflow-y: auto;
        max-height: 400px;
    }
    
    .notifications-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: var(--space-8);
        color: var(--gray-400);
        text-align: center;
    }
    
    .notifications-empty p {
        margin-top: var(--space-2);
        font-size: var(--text-sm);
    }
    
    .notification-item {
        display: flex;
        gap: var(--space-3);
        padding: var(--space-3) var(--space-4);
        cursor: pointer;
        transition: background var(--transition);
        border-bottom: 1px solid var(--gray-50);
        position: relative;
    }
    
    .notification-item:hover {
        background: var(--gray-50);
    }
    
    .notification-item.unread {
        background: var(--primary-50);
    }
    
    .notification-item.unread:hover {
        background: var(--primary-100);
    }
    
    .notification-item.read {
        opacity: 0.7;
    }
    
    .notification-icon {
        width: 36px;
        height: 36px;
        border-radius: var(--radius-full);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }
    
    .notification-icon.icon-success {
        background: var(--success-bg);
        color: var(--success);
    }
    
    .notification-icon.icon-warning {
        background: var(--warning-bg);
        color: var(--warning);
    }
    
    .notification-icon.icon-primary {
        background: var(--primary-100);
        color: var(--primary-600);
    }
    
    .notification-icon.icon-info {
        background: var(--stif-blue-light, #e0f2fe);
        color: var(--stif-blue);
    }
    
    .notification-icon.icon-default {
        background: var(--gray-100);
        color: var(--gray-600);
    }
    
    .notification-content {
        flex: 1;
        min-width: 0;
    }
    
    .notification-content strong {
        display: block;
        font-size: var(--text-sm);
        font-weight: 600;
        color: var(--gray-900);
        margin-bottom: 2px;
    }
    
    .notification-content p {
        font-size: var(--text-sm);
        color: var(--gray-600);
        margin: 0;
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
    
    .notification-time {
        font-size: var(--text-xs);
        color: var(--gray-400);
        margin-top: 4px;
        display: block;
    }
    
    .notification-unread-dot {
        position: absolute;
        top: 50%;
        right: var(--space-3);
        transform: translateY(-50%);
        width: 8px;
        height: 8px;
        background: var(--stif-blue);
        border-radius: var(--radius-full);
    }
    
    @media (max-width: 480px) {
        .notifications-dropdown {
            width: calc(100vw - 32px);
            right: -60px;
        }
    }
`;
document.head.appendChild(dynamicNavStyles);

// Create and export singleton instance
window.DynamicNavigation = DynamicNavigation;
window.dynamicNav = new DynamicNavigation();

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for auth to initialize
    setTimeout(() => {
        window.dynamicNav.init();
    }, 100);
});

