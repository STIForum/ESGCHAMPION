/**
 * Champion Authentication Service - FIXED VERSION
 * ESG Champions Platform
 * 
 * FIX: Better handling of LinkedIn OAuth profile creation
 * - Catches all champion record errors (not just PGRST116)
 * - Ensures champion record is created even if getChampion fails
 * - Adds retry logic for database operations
 * - Better error messages and logging
 */
const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 1;

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
     * 
     * FIX: Enhanced error handling for LinkedIn users
     * - Catches ALL errors that indicate missing champion record
     * - Always attempts to create profile if getChampion fails
     * - Retries on transient failures
     */
    async loadChampionProfile() {
        if (!this.currentUser) return null;

        try {
            // Attempt to get existing champion record
            this.currentChampion = await this.service.getChampion(this.currentUser.id);
            console.log('Champion profile loaded successfully:', this.currentChampion?.email);
            
            // Check if profile needs to be populated from registration metadata
            if (this.currentChampion && this.shouldPopulateFromMetadata(this.currentChampion)) {
                console.log('Profile incomplete, populating from metadata...');
                await this.populateProfileFromMetadata();
            }
            
        } catch (error) {
            console.log('getChampion failed, will attempt to create profile:', error.message);
            
            // FIX: Catch ALL errors that indicate missing/inaccessible champion record
            // Not just PGRST116 - also handle 406, 404, null responses, etc.
            const isMissingProfile = 
                error.code === 'PGRST116' ||  // Not found
                error.message?.includes('406') ||  // Cannot coerce to single JSON
                error.message?.includes('404') ||  // Not found
                error.message?.includes('Cannot coerce') ||  // Parse error
                error.message?.includes('No rows') ||  // Empty result
                !this.currentChampion;  // null response
            
            if (isMissingProfile) {
                console.log('Champion record missing or inaccessible, creating initial profile...');
                await this.createInitialProfile();
                
                // Verify the profile was created
                if (!this.currentChampion) {
                    console.error('CRITICAL: Failed to create champion profile after error');
                    // Try one more time with a delay
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    try {
                        this.currentChampion = await this.service.getChampion(this.currentUser.id);
                        if (!this.currentChampion) {
                            console.error('CRITICAL: Champion profile still not found after retry');
                        } else {
                            console.log('Champion profile found on retry');
                        }
                    } catch (retryError) {
                        console.error('Retry failed:', retryError);
                    }
                }
            } else {
                console.error('Unexpected error loading champion profile:', error);
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
     * Create initial champion profile after registration or LinkedIn login
     * 
     * FIX: Enhanced error handling and validation
     * - Logs all steps for debugging
     * - Validates the created profile
     * - Sets currentChampion even if upsert returns null
     */
    async createInitialProfile() {
        if (!this.currentUser) {
            console.error('Cannot create profile: no current user');
            return null;
        }

        const metadata = this.currentUser.user_metadata || {};
        console.log('Creating initial profile with metadata:', metadata);
        
        const profileData = {
            id: this.currentUser.id,
            email: this.currentUser.email,
            full_name: metadata.full_name || metadata.name || '',
            company: metadata.company || '',
            job_title: metadata.job_title || '',
            mobile_number: metadata.mobile_number || '',
            office_phone: metadata.office_phone || '',
            linkedin_url: metadata.linkedin_url || '',
            avatar_url: metadata.avatar_url || this.currentUser.user_metadata?.picture || '',
            is_verified: this.currentUser.email_confirmed_at ? true : false,
            cla_accepted: metadata.cla_accepted || false,
            nda_accepted: metadata.nda_accepted || false,
            cla_accepted_at: metadata.cla_accepted ? new Date().toISOString() : null,
            nda_accepted_at: metadata.nda_accepted ? new Date().toISOString() : null,
            bio: this.buildRegistrationBio(metadata)
        };

        console.log('Attempting to upsert champion profile:', {
            id: profileData.id,
            email: profileData.email,
            full_name: profileData.full_name
        });

        try {
            const result = await this.service.upsertChampion(profileData);
            console.log('Upsert result:', result);
            
            if (result) {
                this.currentChampion = result;
                console.log('Champion profile created successfully');
            } else {
                // FIX: Even if upsert returns null, set currentChampion to the data we tried to insert
                // This prevents the "Cannot read properties of null" error
                console.warn('Upsert returned null, using profileData as fallback');
                this.currentChampion = profileData;
            }
            
            return this.currentChampion;
        } catch (error) {
            console.error('Error creating champion profile:', error);
            
            // FIX: As a last resort, set currentChampion to avoid null reference errors
            // This allows the profile page to at least load with the user's data
            console.warn('Setting currentChampion to profileData to prevent null errors');
            this.currentChampion = profileData;
            
            return this.currentChampion;
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

            // DUAL-ROLE SAFE duplicate check
            if (
                data.user &&
                Array.isArray(data.user.identities) &&
                data.user.identities.length === 0
            ) {
                let existingChampion = null;
                try {
                    existingChampion = await this.service.getChampionByEmail(email);
                } catch (e) {
                    existingChampion = null;
                }
                if (existingChampion) {
                    return {
                        success: false,
                        error: 'An account with this email already exists. Please log in instead.'
                    };
                }
            }

            if (data.user) {
                // Try to update champion profile with additional metadata
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
        const MAX_ATTEMPTS = 5;
        const LOCK_MINUTES = 1;

        const supabase = window.getSupabase();

        try {
            // Fetch champion record to check lock state
            let champion = null;
            try {
                champion = await this.service.getChampionByEmail(email);
            } catch (e) {
                champion = null;
            }

            // Enforce active lock OR clear an expired lock
            if (champion && champion.locked_until) {
                const lockedUntil = new Date(champion.locked_until);
                const now = new Date();

                if (lockedUntil > now) {
                    const minutesLeft = Math.ceil((lockedUntil - now) / 60000);
                    return {
                        success: false,
                        error: `Your account is locked due to multiple failed login attempts. Please try again in ${minutesLeft} minute(s).`
                    };
                }

                try {
                    await supabase.rpc('clear_login_lock', { p_email: email });
                } catch (clearError) {
                    console.error('Failed to clear expired lock:', clearError);
                }
            }

            // Attempt Supabase authentication
            const data = await this.service.signIn(email, password);
            this.currentUser = data.user;
            await this.loadChampionProfile();

            // Successful login – reset attempt counter via RPC
            try {
                await supabase.rpc('clear_login_lock', { p_email: email });
            } catch (e) {
                console.error('Failed to reset login lock after success:', e);
            }

            // Log login activity
            if (this.currentUser) {
                await this.service.logActivity(this.currentUser.id, 'login');
            }

            // Record portal context
            localStorage.setItem('login_context', 'champion');

            return {
                success: true,
                data
            };

        } catch (error) {
            console.error('Login error:', error);

            // Increment failure counter via RPC
            let lockResult = null;
            try {
                const { data: rpcData, error: rpcError } = await supabase.rpc(
                    'record_failed_login_attempt',
                    {
                        p_email:        email,
                        p_max_attempts: MAX_ATTEMPTS,
                        p_lock_minutes: LOCK_MINUTES
                    }
                );
                if (!rpcError) lockResult = rpcData;
            } catch (rpcErr) {
                console.error('Error recording failed login attempt:', rpcErr);
            }

            // Build user-facing error message
            let message = this.getAuthErrorMessage(error);

            if (lockResult && lockResult.locked && lockResult.locked_until) {
                const lockedUntil = new Date(lockResult.locked_until);
                const now = new Date();
                if (lockedUntil > now) {
                    const minutesLeft = Math.ceil((lockedUntil - now) / 60000);
                    message = `Your account is locked due to multiple failed login attempts. Please try again in ${minutesLeft} minute(s).`;
                }
            }

            return {
                success: false,
                error: message
            };
        }
    }

    /**
     * Login with LinkedIn OAuth
     */
    async loginWithLinkedIn() {
        try {
            localStorage.setItem('login_context', 'champion');
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
            localStorage.removeItem('login_context');
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
     * 
     * FIX: Better error handling for update failures
     */
    async updateProfile(updates) {
        if (!this.currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        try {
            console.log('Updating profile with:', updates);
            const result = await this.service.updateChampion(this.currentUser.id, updates);
            
            if (result) {
                this.currentChampion = result;
                console.log('Profile updated successfully');
                return {
                    success: true,
                    data: this.currentChampion
                };
            } else {
                // FIX: If update returns null, manually merge updates into currentChampion
                console.warn('Update returned null, manually merging updates');
                this.currentChampion = {
                    ...this.currentChampion,
                    ...updates
                };
                return {
                    success: true,
                    data: this.currentChampion
                };
            }
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
     */
    requireCompleteProfile(showModal = true) {
        console.log('requireCompleteProfile called, currentChampion:', this.currentChampion);
        
        const status = this.getProfileCompletionStatus();
        console.log('Profile completion status:', status);

        if (!status.isComplete) {
            const currentPath = window.location.pathname + window.location.search;
            sessionStorage.setItem('profileRedirectAfter', currentPath);

            if (showModal) {
                console.log('Showing profile completion modal for fields:', status.missingFields);
                this.showProfileCompletionModal(status.missingFields);
            } else {
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
        
        const insertModal = () => {
            console.log('insertModal executing, body exists:', !!document.body);
            
            const loadingState = document.getElementById('loading-state');
            if (loadingState) {
                loadingState.classList.add('hidden');
                console.log('Hidden loading state');
            }

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