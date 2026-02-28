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
            
            // Check if profile needs to be populated from registration metadata
            if (this.currentChampion && this.shouldPopulateFromMetadata(this.currentChampion)) {
                console.log('Profile incomplete, populating from metadata...');
                await this.populateProfileFromMetadata();
            }
            
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
     * Check if profile should be populated from metadata
     */
    shouldPopulateFromMetadata(champion) {
        const metadata = this.currentUser.user_metadata || {};
        
        // If user has registration_complete flag but profile is missing key fields
        if (metadata.registration_complete) {
            const hasBasicInfo = champion.company && champion.job_title && champion.mobile_number;
            if (!hasBasicInfo) {
                console.log('Profile missing registration data, should populate from metadata');
                return true;
            }
        }
        return false;
    }

    /**
     * Populate profile from user metadata (after email confirmation)
     */
    async populateProfileFromMetadata() {
        const metadata = this.currentUser.user_metadata || {};
        console.log('Populating profile from metadata:', metadata);
        
        const updates = {
            full_name: metadata.full_name || '',
            company: metadata.company || '',
            job_title: metadata.job_title || '',
            mobile_number: metadata.mobile_number || '',
            office_phone: metadata.office_phone || '',
            linkedin_url: metadata.linkedin_url || '',
            bio: this.buildRegistrationBio(metadata),
            // Mark that profile has been populated
            profile_populated_from_metadata: true,
            profile_populated_at: new Date().toISOString()
        };
        
        try {
            console.log('Updating profile with metadata:', updates);
            this.currentChampion = await this.service.updateChampion(this.currentUser.id, updates);
            console.log('Profile populated from metadata successfully');
        } catch (error) {
            console.error('Error populating profile from metadata:', error);
        }
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
            mobile_number: metadata.mobile_number || '',           // ✅ Add missing field
            office_phone: metadata.office_phone || '',             // ✅ Add missing field
            linkedin_url: metadata.linkedin_url || '',             // ✅ Add missing field
            avatar_url: metadata.avatar_url || this.currentUser.user_metadata?.picture || '',
            is_verified: this.currentUser.email_confirmed_at ? true : false,
            cla_accepted: metadata.cla_accepted || false,
            nda_accepted: metadata.nda_accepted || false,
            cla_accepted_at: metadata.cla_accepted ? new Date().toISOString() : null,
            nda_accepted_at: metadata.nda_accepted ? new Date().toISOString() : null,
            bio: this.buildRegistrationBio(metadata)               // ✅ Add structured bio
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
            // Store ALL registration data in user metadata so it survives email confirmation
            const enrichedMetadata = {
                ...metadata,
                // Ensure all form fields are in metadata
                registration_complete: true,
                registration_timestamp: new Date().toISOString()
            };

            console.log('Registering with metadata:', enrichedMetadata);

            const data = await this.service.signUp(email, password, enrichedMetadata);
            
            if (data.user) {
                // Try to update champion profile with additional metadata
                // This may fail if email confirmation is required (RLS blocks it)
                try {
                    const profileData = {
                        id: data.user.id,
                        email: email,
                        full_name: metadata.full_name || '',
                        company: metadata.company || '',
                        job_title: metadata.job_title || '',
                        mobile_number: metadata.mobile_number || '',
                        office_phone: metadata.office_phone || '',
                        linkedin_url: metadata.linkedin_url || '',
                        cla_accepted: metadata.cla_accepted || false,
                        nda_accepted: metadata.nda_accepted || false,
                        cla_accepted_at: metadata.cla_accepted ? new Date().toISOString() : null,
                        nda_accepted_at: metadata.nda_accepted ? new Date().toISOString() : null,
                        bio: this.buildRegistrationBio(metadata)
                    };
                    
                    console.log('Attempting to save profile data:', profileData);
                    await this.service.upsertChampion(profileData);
                    console.log('Profile data saved successfully during registration');
                } catch (profileError) {
                    // This is expected if email confirmation is required
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
     * Build bio from registration metadata
     */
    buildRegistrationBio(metadata) {
        const bioParts = [];
        
        // Add ESG contributions if provided
        if (metadata.esg_contributions) {
            bioParts.push(metadata.esg_contributions);
        }
        
        // Add other metadata as structured info
        const extras = [];
        if (metadata.website) extras.push(`Website: ${metadata.website}`);
        if (metadata.competence_level) extras.push(`ESG Competence: ${metadata.competence_level}`);
        if (metadata.primary_sector) extras.push(`Sector Focus: ${metadata.primary_sector}`);
        if (metadata.expertise_area) extras.push(`Panel Expertise: ${metadata.expertise_area}`);
        
        if (extras.length > 0) {
            bioParts.push(extras.join(' | '));
        }
        
        return bioParts.filter(Boolean).join('\n\n');
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
        console.log('requireCompleteProfile called, currentChampion:', this.currentChampion);
        
        const status = this.getProfileCompletionStatus();
        console.log('Profile completion status:', status);

        if (!status.isComplete) {
            // Store the intended destination for after profile completion
            const currentPath = window.location.pathname + window.location.search;
            sessionStorage.setItem('profileRedirectAfter', currentPath);

            if (showModal) {
                // Show styled modal instead of browser alert
                console.log('Showing profile completion modal for fields:', status.missingFields);
                this.showProfileCompletionModal(status.missingFields);
            } else {
                // Redirect directly
                window.location.href = '/champion-profile.html?complete=true';
            }
            return false;
        }

        console.log('Profile is complete, continuing...');
        return true;
    }

    /**
     * Show a styled modal prompting user to complete their profile
     */
    showProfileCompletionModal(missingFields) {
        console.log('showProfileCompletionModal called');
        
        // Wait for DOM to be ready before inserting modal
        const insertModal = () => {
            console.log('insertModal executing, body exists:', !!document.body);
            
            // Hide any loading spinners first
            const loadingState = document.getElementById('loading-state');
            if (loadingState) {
                loadingState.classList.add('hidden');
                console.log('Hidden loading state');
            }

            // Remove existing modal if any
            const existing = document.getElementById('profile-complete-modal-backdrop');
            if (existing) existing.remove();

            const missingList = missingFields.map(field => `
                <div style="display: flex; gap: 12px; margin-bottom: 8px; align-items: center;">
                    <div style="width: 20px; height: 20px; background: #fef3c7; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                        <span style="color: #f59e0b; font-weight: bold;">!</span>
                    </div>
                    <span>${field}</span>
                </div>
            `).join('');

            const modalHTML = `
                <div id="profile-complete-modal-backdrop" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 99999;">
                    <div style="max-width: 480px; width: 90%; background: white; border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); overflow: hidden;">
                        <div style="padding: 20px 24px 0; display: flex; justify-content: flex-end;">
                            <button onclick="window.location.href='/champion-profile.html?complete=true'" style="background: none; border: none; font-size: 28px; cursor: pointer; color: #9ca3af; line-height: 1;">&times;</button>
                        </div>
                        <div style="padding: 0 32px 32px; text-align: center;">
                            <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #dbeafe, #bfdbfe); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                            </div>
                            
                            <h2 style="margin: 0 0 12px; color: #111827; font-size: 24px; font-weight: 700;">Welcome to ESG Champions!</h2>
                            <p style="color: #6b7280; margin: 0 0 24px; font-size: 16px; line-height: 1.5;">
                                Please complete your profile to get started. This helps us personalize your experience.
                            </p>
                            
                            <div style="text-align: left; background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                                <p style="font-weight: 600; margin: 0 0 16px; color: #374151; font-size: 14px;">Missing information:</p>
                                ${missingList}
                            </div>
                            
                            <button onclick="window.location.href='/champion-profile.html?complete=true'" style="width: 100%; padding: 16px 24px; background: #2563eb; color: white; border: none; border-radius: 10px; font-size: 16px; font-weight: 600; cursor: pointer; transition: background 0.2s;">
                                Complete My Profile
                            </button>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHTML);
            console.log('Modal inserted into DOM');
        };

        // Ensure DOM is ready
        if (document.readyState === 'loading') {
            console.log('DOM still loading, waiting...');
            document.addEventListener('DOMContentLoaded', insertModal);
        } else {
            console.log('DOM ready, inserting modal immediately');
            insertModal();
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

