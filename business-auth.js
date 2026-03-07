/**
 * Business Authentication Service
 * STIF SME Portal
 * 
 * Handles business user authentication, registration, and session management
 */
class BusinessAuth {
    constructor() {
        this.supabase = window.getSupabase();
        this.currentUser = null;
        this.currentBusiness = null;
        this.authListeners = [];
    }

    /**
     * Initialize authentication
     */
    async init() {
        try {
            // Check for existing session
            const { data: { session } } = await this.supabase.auth.getSession();
            if (session) {
                this.currentUser = session.user;
                await this.loadBusinessProfile();
            }

            // Listen for auth changes
            this.supabase.auth.onAuthStateChange(async (event, session) => {
                console.log('Business auth state changed:', event);
                
                if (event === 'SIGNED_IN' && session) {
                    this.currentUser = session.user;
                    await this.loadBusinessProfile();
                    this.notifyListeners('signed_in', session);
                } else if (event === 'SIGNED_OUT') {
                    this.currentUser = null;
                    this.currentBusiness = null;
                    this.notifyListeners('signed_out', null);
                } else if (event === 'TOKEN_REFRESHED') {
                    this.notifyListeners('token_refreshed', session);
                } else if (event === 'PASSWORD_RECOVERY') {
                    this.notifyListeners('password_recovery', session);
                }
            });

            return this.currentUser;
        } catch (error) {
            console.error('Business auth init error:', error);
            return null;
        }
    }

    /**
     * Load business profile from database
     */
    async loadBusinessProfile() {
        if (!this.currentUser) return null;

        try {
            const { data, error } = await this.supabase
                .from('business_users')
                .select('*')
                .eq('auth_user_id', this.currentUser.id)
                .maybeSingle();

            if (error) throw error;
            this.currentBusiness = data;
            
            // If profile doesn't exist, try to create from metadata
            if (!this.currentBusiness) {
                await this.createInitialProfile();
            }
        } catch (error) {
            console.error('Error loading business profile:', error);
        }

        return this.currentBusiness;
    }

    /**
     * Create initial business profile from user metadata (after email confirmation)
     */
    async createInitialProfile() {
        if (!this.currentUser) return null;

        const metadata = this.currentUser.user_metadata || {};
        
        const profileData = {
            auth_user_id: this.currentUser.id,
            business_email: this.currentUser.email,
            first_name: metadata.first_name || '',
            last_name: metadata.last_name || '',
            company_name: metadata.company_name || '',
            subscription_status: 'active',
            account_status: 'complete'
        };

        try {
            const { data, error } = await this.supabase
                .from('business_users')
                .insert(profileData)
                .select()
                .single();

            if (error) throw error;
            this.currentBusiness = data;
            console.log('Business profile created from metadata');
        } catch (error) {
            console.error('Error creating business profile:', error);
        }

        return this.currentBusiness;
    }

    /**
     * Register a new business user
     */
    async register(email, password, businessData) {
        try {
            // 0. Check for duplicate email BEFORE calling signUp().
            // Supabase auth.signUp() silently "succeeds" for duplicate emails
            // (returns a user but sends no confirmation email), so we must
            // detect this ourselves by querying business_users first.
            const { data: existingUser } = await this.supabase
                .from('business_users')
                .select('id')
                .eq('business_email', email.toLowerCase().trim())
                .maybeSingle();

            if (existingUser?.id) {
                return {
                    success: false,
                    error: 'An account with this email already exists. Please log in or use a different email.'
                };
            }

            // Store all registration data in user metadata (survives email confirmation)
            const enrichedMetadata = {
                user_type: 'business',
                ...businessData,
                registration_complete: true,
                registration_timestamp: new Date().toISOString()
            };

            console.log('Registering business with metadata:', enrichedMetadata);

            // 1. Sign up the user
            const { data, error } = await this.supabase.auth.signUp({
                email,
                password,
                options: {
                    data: enrichedMetadata,
                    emailRedirectTo: `${window.location.origin}/verify.html`
                }
            });

            if (error) throw error;
            if (!data?.user) throw new Error('User creation failed: no user returned');

            // Supabase silently "succeeds" for duplicate auth emails —
            // the returned user has an empty identities array.
            if (data.user.identities && data.user.identities.length === 0) {
                return {
                    success: false,
                    error: 'An account with this email already exists. Please log in or use a different email.'
                };
            }


            // 2. Try to insert business profile immediately
            // This may fail if email confirmation is required (RLS blocks it)
            try {
                const profileData = {
                    auth_user_id: data.user.id,
                    business_email: email,
                    first_name: businessData.first_name || '',
                    last_name: businessData.last_name || '',
                    company_name: businessData.company_name || '',
                    company_registration_number: businessData.company_registration_number || null,
                    role_designation: businessData.role_designation || null,
                    industry: businessData.industry || null,
                    reporting_year: businessData.reporting_year || new Date().getFullYear(),
                    mobile_number: businessData.mobile_number || null,
                    office_phone: businessData.office_phone || null,
                    linkedin_url: businessData.linkedin_url || null,
                    website: businessData.website || null,
                    company_size: businessData.company_size || null,
                    country: businessData.country || null,
                    business_address: businessData.business_address || null,
                    primary_esg_focus: businessData.primary_esg_focus || null,
                    ongoing_esg_initiatives: businessData.ongoing_esg_initiatives || null,
                    subscription_status: 'active',
                    account_status: 'complete'
                };

                const { error: insertError } = await this.supabase
                    .from('business_users')
                    .insert(profileData);

                if (insertError) {
                    // If it's a foreign key violation or RLS, it's expected – profile will be created after confirmation
                    console.log('Business profile will be created after email confirmation:', insertError.message);
                } else {
                    console.log('Business profile created immediately');
                }
            } catch (profileError) {
                console.log('Profile creation deferred (expected if email confirmation required):', profileError.message);
            }

            return {
                success: true,
                data: data,
                message: 'Registration successful! Please check your email to confirm your account.'
            };
        } catch (error) {
            console.error('Business registration error:', error);
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
            // 1. Authenticate with Supabase
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;
            this.currentUser = data.user;

            // 2. Load business profile
            await this.loadBusinessProfile();

            // 3. Verify this is actually a business account
            if (!this.currentBusiness) {
                // Not a business account – sign out and throw error
                await this.supabase.auth.signOut();
                this.currentUser = null;
                throw new Error('This email is not registered as a business account. Please login as a Champion instead.');
            }

            // 4. Log activity (optional – you could add a business_activity table later)
            // await this.logActivity('login');

            return {
                success: true,
                data
            };
        } catch (error) {
            console.error('Business login error:', error);
            return {
                success: false,
                error: this.getAuthErrorMessage(error)
            };
        }
    }

    /**
     * Logout
     */
    async logout() {
        try {
            const { error } = await this.supabase.auth.signOut();
            if (error) throw error;
            this.currentUser = null;
            this.currentBusiness = null;
            return { success: true };
        } catch (error) {
            console.error('Business logout error:', error);
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
            const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/business-reset-password.html`
            });
            if (error) throw error;
            return {
                success: true,
                message: 'Password reset email sent. Please check your inbox.'
            };
        } catch (error) {
            console.error('Business password reset error:', error);
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
            const { error } = await this.supabase.auth.updateUser({
                password: newPassword
            });
            if (error) throw error;
            return {
                success: true,
                message: 'Password updated successfully'
            };
        } catch (error) {
            console.error('Business update password error:', error);
            return {
                success: false,
                error: error.message || 'Failed to update password'
            };
        }
    }

    /**
     * Update business profile
     */
    async updateProfile(updates) {
        if (!this.currentUser) {
            return { success: false, error: 'Not authenticated' };
        }
        if (!this.currentBusiness) {
            return { success: false, error: 'Business profile not loaded' };
        }

        // Whitelist allowed fields (same as in the insert)
        const allowedFields = [
            'first_name', 'last_name', 'company_name', 'company_registration_number',
            'role_designation', 'industry', 'reporting_year', 'mobile_number',
            'office_phone', 'linkedin_url', 'website', 'company_size', 'country',
            'business_address', 'primary_esg_focus', 'ongoing_esg_initiatives',
            'avatar_url', 'subscription_status', 'account_status'
        ];

        const safeUpdates = {};
        for (const key of allowedFields) {
            if (updates[key] !== undefined) {
                safeUpdates[key] = updates[key];
            }
        }
        safeUpdates.updated_at = new Date().toISOString();

        try {
            const { data, error } = await this.supabase
                .from('business_users')
                .update(safeUpdates)
                .eq('auth_user_id', this.currentUser.id)
                .select()
                .single();

            if (error) throw error;
            this.currentBusiness = data;
            return {
                success: true,
                data: this.currentBusiness
            };
        } catch (error) {
            console.error('Business update profile error:', error);
            return {
                success: false,
                error: error.message || 'Failed to update profile'
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
     * Get current user
     */
    getUser() {
        return this.currentUser;
    }

    /**
     * Get current business profile
     */
    getBusiness() {
        return this.currentBusiness;
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
                console.error('Business auth listener error:', error);
            }
        });
    }

    /**
     * Get user-friendly auth error message
     */
    getAuthErrorMessage(error) {
        const msg = error?.message || '';
        const code = error?.code || error?.status;

        if (msg.includes('Invalid login credentials') || code === 'invalid_credentials') {
            return 'Invalid email or password. Please try again.';
        }
        if (msg.includes('Email not confirmed')) {
            return 'Please verify your email address before logging in.';
        }
        if (msg.includes('User already registered')) {
            return 'An account with this email already exists.';
        }
        if (msg.includes('Password should be at least 6 characters')) {
            return 'Password must be at least 6 characters long.';
        }
        if (msg.includes('Invalid email')) {
            return 'Please enter a valid email address.';
        }
        if (msg.includes('Email rate limit exceeded')) {
            return 'Too many attempts. Please try again later.';
        }
        return error.message || 'An unexpected error occurred';
    }

    /**
     * Require authentication – redirect to login if not authenticated
     */
    requireAuth(redirectUrl = '/business-login.html') {
        if (!this.isAuthenticated()) {
            const currentPath = window.location.pathname + window.location.search;
            window.location.href = `${redirectUrl}?redirect=${encodeURIComponent(currentPath)}`;
            return false;
        }
        return true;
    }

    /**
     * Check if profile is complete (basic required fields)
     */
    getProfileCompletionStatus() {
        if (!this.currentBusiness) {
            return { isComplete: false, missingFields: ['profile'], message: 'Profile not loaded' };
        }

        const requiredFields = [
            { key: 'first_name', label: 'First Name' },
            { key: 'last_name', label: 'Last Name' },
            { key: 'company_name', label: 'Company Name' }
        ];

        const missingFields = [];

        for (const field of requiredFields) {
            const value = this.currentBusiness[field.key];
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
     * Require complete profile – redirect to profile page if incomplete
     */
    requireCompleteProfile(showModal = true) {
        const status = this.getProfileCompletionStatus();

        if (!status.isComplete) {
            // Store intended destination
            const currentPath = window.location.pathname + window.location.search;
            sessionStorage.setItem('businessProfileRedirectAfter', currentPath);

            if (showModal) {
                this.showProfileCompletionModal(status.missingFields);
            } else {
                window.location.href = '/business-profile.html?complete=true';
            }
            return false;
        }
        return true;
    }

    /**
     * Show a modal prompting user to complete their profile
     */
    showProfileCompletionModal(missingFields) {
        // Wait for DOM to be ready
        const insertModal = () => {
            // Remove existing modal if any
            const existing = document.getElementById('business-profile-complete-modal-backdrop');
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
                <div id="business-profile-complete-modal-backdrop" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 99999;">
                    <div style="max-width: 480px; width: 90%; background: white; border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); overflow: hidden;">
                        <div style="padding: 20px 24px 0; display: flex; justify-content: flex-end;">
                            <button onclick="window.location.href='/business-profile.html?complete=true'" style="background: none; border: none; font-size: 28px; cursor: pointer; color: #9ca3af; line-height: 1;">&times;</button>
                        </div>
                        <div style="padding: 0 32px 32px; text-align: center;">
                            <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #dbeafe, #bfdbfe); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2">
                                    <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5m-4 0h4"></path>
                                </svg>
                            </div>
                            
                            <h2 style="margin: 0 0 12px; color: #111827; font-size: 24px; font-weight: 700;">Welcome to STIF Business Portal!</h2>
                            <p style="color: #6b7280; margin: 0 0 24px; font-size: 16px; line-height: 1.5;">
                                Please complete your business profile to get started.
                            </p>
                            
                            <div style="text-align: left; background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                                <p style="font-weight: 600; margin: 0 0 16px; color: #374151; font-size: 14px;">Missing information:</p>
                                ${missingList}
                            </div>
                            
                            <button onclick="window.location.href='/business-profile.html?complete=true'" style="width: 100%; padding: 16px 24px; background: #2563eb; color: white; border: none; border-radius: 10px; font-size: 16px; font-weight: 600; cursor: pointer; transition: background 0.2s;">
                                Complete My Profile
                            </button>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHTML);
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', insertModal);
        } else {
            insertModal();
        }
    }

    /**
     * Handle redirect after profile completion
     */
    handleProfileCompletionRedirect() {
        const redirectTo = sessionStorage.getItem('businessProfileRedirectAfter');
        if (redirectTo) {
            sessionStorage.removeItem('businessProfileRedirectAfter');
            window.location.href = redirectTo;
            return true;
        }
        return false;
    }
}

// Create and export singleton instance
window.BusinessAuth = BusinessAuth;
window.businessAuth = new BusinessAuth();

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.businessAuth.init();
});
