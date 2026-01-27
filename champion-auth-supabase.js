/**
 * Champion Authentication Service
 * ESG Champions Platform
 * 
 * Handles user authentication, registration, and session management
 */

class ChampionAuth {
    constructor() {
        this.service = window.supabaseService;
        this.currentUser = null;
        this.currentChampion = null;
        this.authListeners = [];
    }

    /**
     * Initialize authentication
     */
    async init() {
        try {
            // Check for existing session
            const session = await this.service.getSession();
            if (session) {
                this.currentUser = session.user;
                await this.loadChampionProfile();
            }

            // Listen for auth changes
            this.service.onAuthStateChange(async (event, session) => {
                console.log('Auth state changed:', event);
                
                if (event === 'SIGNED_IN' && session) {
                    this.currentUser = session.user;
                    await this.loadChampionProfile();
                    this.notifyListeners('signed_in', session);
                } else if (event === 'SIGNED_OUT') {
                    this.currentUser = null;
                    this.currentChampion = null;
                    this.notifyListeners('signed_out', null);
                } else if (event === 'TOKEN_REFRESHED') {
                    this.notifyListeners('token_refreshed', session);
                } else if (event === 'PASSWORD_RECOVERY') {
                    this.notifyListeners('password_recovery', session);
                }
            });

            return this.currentUser;
        } catch (error) {
            console.error('Auth init error:', error);
            return null;
        }
    }

    /**
     * Load champion profile from database
     */
    async loadChampionProfile() {
        if (!this.currentUser) return null;

        try {
            this.currentChampion = await this.service.getChampion(this.currentUser.id);
        } catch (error) {
            // Champion might not exist yet, create basic profile
            if (error.code === 'PGRST116') {
                await this.createInitialProfile();
            } else {
                console.error('Error loading champion profile:', error);
            }
        }

        return this.currentChampion;
    }

    /**
     * Create initial champion profile after registration
     */
    async createInitialProfile() {
        if (!this.currentUser) return null;

        const metadata = this.currentUser.user_metadata || {};
        
        const profileData = {
            id: this.currentUser.id,
            email: this.currentUser.email,
            full_name: metadata.full_name || metadata.name || '',
            company: metadata.company || '',
            job_title: metadata.job_title || '',
            avatar_url: metadata.avatar_url || this.currentUser.user_metadata?.picture || '',
            is_verified: this.currentUser.email_confirmed_at ? true : false,
            cla_accepted: metadata.cla_accepted || false,
            nda_accepted: metadata.nda_accepted || false,
            cla_accepted_at: metadata.cla_accepted ? new Date().toISOString() : null,
            nda_accepted_at: metadata.nda_accepted ? new Date().toISOString() : null
        };

        try {
            this.currentChampion = await this.service.upsertChampion(profileData);
            return this.currentChampion;
        } catch (error) {
            console.error('Error creating champion profile:', error);
            return null;
        }
    }

    /**
     * Register a new champion
     */
    async register(email, password, metadata = {}) {
        try {
            const data = await this.service.signUp(email, password, metadata);
            
            // Note: Champion profile is created automatically by database trigger
            // when user is inserted into auth.users. We don't need to manually insert here
            // because the user isn't fully authenticated until email confirmation.
            
            if (data.user) {
                // Try to update champion profile with additional metadata
                // This may fail if email confirmation is required (RLS blocks it)
                // That's okay - the trigger created the basic profile already
                try {
                    const profileData = {
                        id: data.user.id,
                        email: email,
                        full_name: metadata.full_name || '',
                        company: metadata.company || '',
                        job_title: metadata.job_title || '',
                        linkedin_url: metadata.linkedin_url || '',
                        cla_accepted: metadata.cla_accepted || false,
                        nda_accepted: metadata.nda_accepted || false,
                        cla_accepted_at: metadata.cla_accepted ? new Date().toISOString() : null,
                        nda_accepted_at: metadata.nda_accepted ? new Date().toISOString() : null
                    };
                    await this.service.upsertChampion(profileData);
                } catch (profileError) {
                    // This is expected if email confirmation is required
                    // The database trigger already created the basic profile
                    console.log('Profile will be updated after email confirmation:', profileError.message);
                }
            }

            return {
                success: true,
                data: data,
                message: 'Registration successful! Please check your email to confirm your account.'
            };
        } catch (error) {
            console.error('Registration error:', error);
            return {
                success: false,
                error: error.message || 'Registration failed'
            };
        }
    }

    /**
     * Login with email and password
     */
    async login(email, password) {
        try {
            const data = await this.service.signIn(email, password);
            this.currentUser = data.user;
            await this.loadChampionProfile();

            // Log login activity
            if (this.currentUser) {
                await this.service.logActivity(this.currentUser.id, 'login');
            }

            return {
                success: true,
                data: data
            };
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                error: this.getAuthErrorMessage(error)
            };
        }
    }

    /**
     * Login with LinkedIn OAuth
     */
    async loginWithLinkedIn() {
        try {
            const data = await this.service.signInWithOAuth('linkedin_oidc');
            return {
                success: true,
                data: data
            };
        } catch (error) {
            console.error('LinkedIn login error:', error);
            return {
                success: false,
                error: error.message || 'LinkedIn login failed'
            };
        }
    }

    /**
     * Logout
     */
    async logout() {
        try {
            await this.service.signOut();
            this.currentUser = null;
            this.currentChampion = null;
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            return {
                success: false,
                error: error.message || 'Logout failed'
            };
        }
    }

    /**
     * Send password reset email
     */
    async sendPasswordReset(email) {
        try {
            await this.service.resetPassword(email);
            return {
                success: true,
                message: 'Password reset email sent. Please check your inbox.'
            };
        } catch (error) {
            console.error('Password reset error:', error);
            return {
                success: false,
                error: error.message || 'Failed to send reset email'
            };
        }
    }

    /**
     * Update password
     */
    async updatePassword(newPassword) {
        try {
            await this.service.updatePassword(newPassword);
            return {
                success: true,
                message: 'Password updated successfully'
            };
        } catch (error) {
            console.error('Update password error:', error);
            return {
                success: false,
                error: error.message || 'Failed to update password'
            };
        }
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return this.currentUser !== null;
    }

    /**
     * Check if user is admin
     */
    async isAdmin() {
        if (!this.currentChampion) {
            await this.loadChampionProfile();
        }
        return this.currentChampion?.is_admin === true;
    }

    /**
     * Get current user
     */
    getUser() {
        return this.currentUser;
    }

    /**
     * Get current champion profile
     */
    getChampion() {
        return this.currentChampion;
    }

    /**
     * Update champion profile
     */
    async updateProfile(updates) {
        if (!this.currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        try {
            this.currentChampion = await this.service.updateChampion(this.currentUser.id, updates);
            return {
                success: true,
                data: this.currentChampion
            };
        } catch (error) {
            console.error('Update profile error:', error);
            return {
                success: false,
                error: error.message || 'Failed to update profile'
            };
        }
    }

    /**
     * Add auth state listener
     */
    addAuthListener(callback) {
        this.authListeners.push(callback);
    }

    /**
     * Remove auth state listener
     */
    removeAuthListener(callback) {
        this.authListeners = this.authListeners.filter(cb => cb !== callback);
    }

    /**
     * Notify all listeners of auth state change
     */
    notifyListeners(event, session) {
        this.authListeners.forEach(callback => {
            try {
                callback(event, session);
            } catch (error) {
                console.error('Auth listener error:', error);
            }
        });
    }

    /**
     * Get user-friendly auth error message
     */
    getAuthErrorMessage(error) {
        const errorMessages = {
            'Invalid login credentials': 'Invalid email or password. Please try again.',
            'Email not confirmed': 'Please confirm your email address before logging in.',
            'User already registered': 'An account with this email already exists.',
            'Password should be at least 6 characters': 'Password must be at least 6 characters long.',
            'Invalid email': 'Please enter a valid email address.',
            'Email rate limit exceeded': 'Too many attempts. Please try again later.',
            'User not found': 'No account found with this email address.'
        };

        return errorMessages[error.message] || error.message || 'An unexpected error occurred';
    }

    /**
     * Require authentication - redirect to login if not authenticated
     */
    requireAuth(redirectUrl = '/champion-login.html') {
        if (!this.isAuthenticated()) {
            const currentPath = window.location.pathname + window.location.search;
            window.location.href = `${redirectUrl}?redirect=${encodeURIComponent(currentPath)}`;
            return false;
        }
        return true;
    }

    /**
     * Require admin - redirect if not admin
     */
    async requireAdmin(redirectUrl = '/champion-dashboard.html') {
        if (!this.isAuthenticated()) {
            window.location.href = '/champion-login.html';
            return false;
        }

        const isAdmin = await this.isAdmin();
        if (!isAdmin) {
            window.location.href = redirectUrl;
            return false;
        }

        return true;
    }

    /**
     * Check if profile is complete
     * Returns an object with isComplete flag and list of missing fields
     */
    getProfileCompletionStatus() {
        if (!this.currentChampion) {
            return { isComplete: false, missingFields: ['profile'], message: 'Profile not loaded' };
        }

        const requiredFields = [
            { key: 'full_name', label: 'Full Name' },
            { key: 'company', label: 'Company/Organization' },
            { key: 'job_title', label: 'Job Title' }
        ];

        const missingFields = [];

        for (const field of requiredFields) {
            const value = this.currentChampion[field.key];
            if (!value || value.trim() === '') {
                missingFields.push(field.label);
            }
        }

        const isComplete = missingFields.length === 0;

        return {
            isComplete,
            missingFields,
            message: isComplete 
                ? 'Profile is complete' 
                : `Please complete your profile: ${missingFields.join(', ')}`
        };
    }

    /**
     * Check profile completion and redirect to profile page if incomplete
     * @param {boolean} showModal - Whether to show a modal message
     * @returns {boolean} - Returns true if profile is complete, false if redirecting
     */
    requireCompleteProfile(showModal = true) {
        const status = this.getProfileCompletionStatus();

        if (!status.isComplete) {
            // Store the intended destination for after profile completion
            const currentPath = window.location.pathname + window.location.search;
            sessionStorage.setItem('profileRedirectAfter', currentPath);

            if (showModal) {
                // Show styled modal instead of browser alert
                this.showProfileCompletionModal(status.missingFields);
            } else {
                // Redirect directly
                window.location.href = '/champion-profile.html?complete=true';
            }
            return false;
        }

        return true;
    }

    /**
     * Show a styled modal prompting user to complete their profile
     */
    showProfileCompletionModal(missingFields) {
        // Wait for DOM to be ready before inserting modal
        const insertModal = () => {
            // Hide any loading spinners first
            const loadingState = document.getElementById('loading-state');
            if (loadingState) loadingState.classList.add('hidden');

            // Remove existing modal if any
            const existing = document.getElementById('profile-complete-modal-backdrop');
            if (existing) existing.remove();

            const missingList = missingFields.map(field => `
                <div class="flex" style="gap: var(--space-3); margin-bottom: var(--space-2);">
                    <div style="width: 20px; height: 20px; background: var(--warning-bg, #fef3c7); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--warning, #f59e0b)" stroke-width="3">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                    </div>
                    <span>${field}</span>
                </div>
            `).join('');

            const modalHTML = `
                <div class="modal-backdrop active" id="profile-complete-modal-backdrop" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;">
                    <div class="modal" id="profile-complete-modal" style="max-width: 480px; background: white; border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); margin: 20px;">
                        <div class="modal-header" style="border-bottom: none; padding: 20px 20px 0; display: flex; justify-content: flex-end;">
                            <button class="modal-close" id="profile-complete-modal-close" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">&times;</button>
                        </div>
                        <div class="modal-body text-center" style="padding: 0 30px 30px;">
                            <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #dbeafe, #bfdbfe); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                            </div>
                            
                            <h2 style="margin-bottom: 12px; color: #111827; font-size: 24px;">Welcome to ESG Champions!</h2>
                            <p style="color: #6b7280; margin-bottom: 20px;">
                                Please complete your profile to get started. This helps us personalize your experience.
                            </p>
                            
                            <div style="text-align: left; background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                                <p style="font-weight: 600; margin-bottom: 12px; color: #374151;">Missing information:</p>
                                ${missingList}
                            </div>
                            
                            <button class="btn btn-primary btn-lg" id="profile-complete-modal-btn" style="width: 100%; padding: 14px 24px; background: #2563eb; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer;">
                                Complete My Profile
                            </button>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHTML);

            // Add event listeners
            const backdrop = document.getElementById('profile-complete-modal-backdrop');
            const closeBtn = document.getElementById('profile-complete-modal-close');
            const completeBtn = document.getElementById('profile-complete-modal-btn');

            const redirectToProfile = () => {
                window.location.href = '/champion-profile.html?complete=true';
            };

            if (completeBtn) completeBtn.addEventListener('click', redirectToProfile);
            if (closeBtn) closeBtn.addEventListener('click', redirectToProfile);
            if (backdrop) {
                backdrop.addEventListener('click', (e) => {
                    if (e.target === backdrop) {
                        redirectToProfile();
                    }
                });
            }
        };

        // Ensure DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', insertModal);
        } else {
            // Small delay to ensure body is available
            setTimeout(insertModal, 100);
        }
    }

    /**
     * Check if user just completed their profile and should be redirected back
     * Call this on the profile page after successful save
     */
    handleProfileCompletionRedirect() {
        const redirectTo = sessionStorage.getItem('profileRedirectAfter');
        if (redirectTo) {
            sessionStorage.removeItem('profileRedirectAfter');
            window.location.href = redirectTo;
            return true;
        }
        return false;
    }
}

// Create and export singleton instance
window.ChampionAuth = ChampionAuth;
window.championAuth = new ChampionAuth();

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.championAuth.init();
});

