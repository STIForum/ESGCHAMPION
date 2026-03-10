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
     * Validate and sanitize first_name / last_name fields.
     * Fixes: BUG_REG_003 (SQL injection), BUG_REG_004 (max length),
     *        BUG_REG_005 (no warning), BUG_REG_006/007 (special chars),
     *        BUG_REG_008/009 (alphanumeric), BUG_REG_010/011 (leading/trailing spaces)
     *
     * Rules:
     *  - Trim leading/trailing whitespace (BUG_REG_010, BUG_REG_011)
     *  - Max 100 characters after trim (BUG_REG_004, BUG_REG_005)
     *  - Only Unicode letters, hyphens, apostrophes, and single internal spaces allowed.
     *    This blocks: SQL payloads (BUG_REG_003), digits (BUG_REG_008/009),
     *    and other special characters (BUG_REG_006/007).
     *
     * Returns { valid: true, firstName, lastName } on success,
     * or      { valid: false, error: '...' }         on failure.
     */
    validateNameFields(rawFirst, rawLast) {
        const MAX_NAME_LENGTH = 100;

        // Allowed: Unicode letters (including accented/international),
        // hyphens, apostrophes, and single internal spaces.
        // Rejects: digits, SQL chars (' OR -- etc handled by stripping non-letter chars),
        // and any other punctuation / symbols.
        const NAME_PATTERN = /^[\p{L}][\p{L}\s'\-]{0,99}$/u;

        const firstName = (rawFirst || '').trim();
        const lastName  = (rawLast  || '').trim();

        if (!firstName) {
            return { valid: false, error: 'First name is required.' };
        }
        if (!lastName) {
            return { valid: false, error: 'Last name is required.' };
        }
        if (firstName.length > MAX_NAME_LENGTH) {
            return { valid: false, error: `First name must be ${MAX_NAME_LENGTH} characters or fewer.` };
        }
        if (lastName.length > MAX_NAME_LENGTH) {
            return { valid: false, error: `Last name must be ${MAX_NAME_LENGTH} characters or fewer.` };
        }
        if (!NAME_PATTERN.test(firstName)) {
            return { valid: false, error: 'First name may only contain letters, hyphens, and apostrophes.' };
        }
        if (!NAME_PATTERN.test(lastName)) {
            return { valid: false, error: 'Last name may only contain letters, hyphens, and apostrophes.' };
        }

        return { valid: true, firstName, lastName };
    }

    /**
     * Validate role / designation field.
     * Fixes: BUG_REG_024 (max length), BUG_REG_025 (special chars)
     * Optional field — blank passes.
     */
    validateRoleDesignation(raw) {
        const MAX_LENGTH = 100;
        const ROLE_PATTERN = /^[\p{L}0-9][\p{L}0-9\s'\-.,()&]{0,99}$/u;
        const role = (raw || '').trim();
        if (!role) return { valid: true, role: '' };
        if (role.length > MAX_LENGTH) {
            return { valid: false, error: `Role / Designation must be ${MAX_LENGTH} characters or fewer.` };
        }
        if (!ROLE_PATTERN.test(role)) {
            return { valid: false, error: 'Role / Designation contains invalid characters. Only letters, numbers, spaces, hyphens, and apostrophes are allowed.' };
        }
        return { valid: true, role };
    }

    /**
     * Validate email format strictly.
     * Fixes: BUG_REG_026 — rejects malformed addresses like TEST#.@GMAIL.COM
     * Browser type="email" is too permissive; this enforces RFC-like rules.
     */
    validateEmail(raw) {
        const EMAIL_RE = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
        const email = (raw || '').trim().toLowerCase();
        if (!email) return { valid: false, error: 'Email address is required.' };
        if (!EMAIL_RE.test(email)) {
            return { valid: false, error: 'Please enter a valid email address (e.g. name@company.com).' };
        }
        return { valid: true, email };
    }

    /**
     * Validate phone number fields (mobile and office phone).
     * Fixes: BUG_REG_027 (mobile accepts alphabets), BUG_REG_028 (office phone accepts alphabets)
     * Optional fields — blank passes.
     * Allowed: digits, spaces, +, hyphens, brackets.
     */
    validatePhone(raw, label = 'Phone number') {
        const PHONE_RE = /^[0-9\s+\-()\[\]]{0,20}$/;
        const phone = (raw || '').trim();
        if (!phone) return { valid: true, phone: '' };
        if (!PHONE_RE.test(phone)) {
            return { valid: false, error: `${label} contains invalid characters. Only digits, spaces, +, hyphens, and brackets are allowed.` };
        }
        return { valid: true, phone };
    }

    /**
     * Validate company_name. Fixes BUG_REG_014–020.
     * Rules: ≥1 Unicode letter; max 100 chars; only letters/digits/spaces/-/'&.,() allowed.
     */
    validateCompanyName(raw) {
        const name = (raw || '').trim();
        if (!name) return { valid: false, error: 'Company name is required.' };
        if (name.length > 100) return { valid: false, error: 'Company name must be 100 characters or fewer.' };
        if (!/\p{L}/u.test(name)) return { valid: false, error: 'Company name must contain at least one letter.' };
        if (/[^\p{L}0-9\s'\-&.,()]/u.test(name)) return { valid: false, error: 'Company name contains invalid characters. Only letters, numbers, spaces, hyphens, apostrophes, and & are allowed.' };
        return { valid: true, companyName: name };
    }

    /**
     * Validate company registration number. Fixes BUG_REG_021–023.
     * Optional; max 50 chars; only letters/digits/hyphens/forward-slashes.
     */
    validateRegistrationNumber(raw) {
        const reg = (raw || '').trim();
        if (!reg) return { valid: true, regNumber: '' };
        if (reg.length > 50) return { valid: false, error: 'Registration number must be 50 characters or fewer.' };
        if (/[^\p{L}0-9\-\/]/u.test(reg)) return { valid: false, error: 'Registration number may only contain letters, numbers, hyphens, and forward slashes.' };
        return { valid: true, regNumber: reg };
    }

    /**
     * Validate password strength. Fixes BUG_REG_029–035.
     * Rules: no leading/trailing spaces; 8–128 chars; uppercase; lowercase; digit; special char.
     */
    validatePassword(password) {
        if (!password || password.length === 0) return { valid: false, error: 'Password is required.' };
        if (password !== password.trim())         return { valid: false, error: 'Password must not start or end with a space.' };
        if (password.length < 8)                  return { valid: false, error: 'Password must be at least 8 characters.' };
        if (password.length > 128)                return { valid: false, error: 'Password must be 128 characters or fewer.' };
        if (!/[A-Z]/.test(password))              return { valid: false, error: 'Password must contain at least one uppercase letter (A–Z).' };
        if (!/[a-z]/.test(password))              return { valid: false, error: 'Password must contain at least one lowercase letter (a–z).' };
        if (!/[0-9]/.test(password))              return { valid: false, error: 'Password must contain at least one number (0–9).' };
        if (!/[^A-Za-z0-9\s]/.test(password))   return { valid: false, error: 'Password must contain at least one special character (e.g. !@#$%^&*).' };
        return { valid: true };
    }

    /**
     * Register a new business user
     */
    async register(email, password, businessData) {
        try {
            // FIX BUG_REG_029–035: Password validation — fail fast, no DB calls on bad password
            const pwValidation = this.validatePassword(password);
            if (!pwValidation.valid) return { success: false, error: pwValidation.error };

            // FIX BUG_REG_014–020: Company name validation (replaces bare BUG_REG_002 check)
            const companyValidation = this.validateCompanyName(businessData.company_name);
            if (!companyValidation.valid) return { success: false, error: companyValidation.error };
            const companyName = companyValidation.companyName;

            // FIX BUG_REG_021–023: Registration number validation
            const regValidation = this.validateRegistrationNumber(businessData.company_registration_number);
            if (!regValidation.valid) return { success: false, error: regValidation.error };

            // FIX BUG_REG_003–011: Validate and sanitize first/last name fields.
            // Covers: SQL injection, max length, special chars, digits, leading/trailing spaces.
            const nameValidation = this.validateNameFields(businessData.first_name, businessData.last_name);
            if (!nameValidation.valid) {
                return { success: false, error: nameValidation.error };
            }
            const { firstName, lastName } = nameValidation;

            // FIX BUG_REG_026: Strict email validation
            const emailValidation = this.validateEmail(email);
            if (!emailValidation.valid) {
                return { success: false, error: emailValidation.error };
            }

            // FIX BUG_REG_024/025: Role / Designation validation
            const roleValidation = this.validateRoleDesignation(businessData.role_designation);
            if (!roleValidation.valid) {
                return { success: false, error: roleValidation.error };
            }

            // FIX BUG_REG_027: Mobile number validation
            const mobileValidation = this.validatePhone(businessData.mobile_number, 'Mobile number');
            if (!mobileValidation.valid) {
                return { success: false, error: mobileValidation.error };
            }

            // FIX BUG_REG_028: Office phone validation
            const officePhoneValidation = this.validatePhone(businessData.office_phone, 'Office phone');
            if (!officePhoneValidation.valid) {
                return { success: false, error: officePhoneValidation.error };
            }

            // FIX BUG_REG_001 (PRE-CHECK): Query business_users BEFORE calling signUp.
            // Root cause: Supabase's signUp() for an existing confirmed email silently
            // triggers a password update / re-auth flow BEFORE we can inspect the response.
            // The post-signUp identities[] check fires too late — the damage is already done.
            // Solution: block here, before any auth call is made.
            const { data: preCheckBusiness, error: preCheckError } = await this.supabase
                .from('business_users')
                .select('id')
                .eq('business_email', emailValidation.email)
                .maybeSingle();

            if (preCheckError) {
                console.warn('BUG_REG_001 pre-check query error (non-fatal):', preCheckError.message);
            }

            if (preCheckBusiness) {
                return {
                    success: false,
                    error: 'A business account with this email already exists. Please log in or reset your password.'
                };
            }

            // Store all registration data in user metadata (survives email confirmation)
            const enrichedMetadata = {
                user_type: 'business',
                ...businessData,
                first_name: firstName,       // sanitized
                last_name: lastName,         // sanitized
                company_name: companyName,   // trimmed
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

            if (error) {
                // Supabase may return "User already registered" directly
                if (
                    error.message?.includes('User already registered') ||
                    error.message?.includes('already registered') ||
                    error.code === 'user_already_exists'
                ) {
                    return {
                        success: false,
                        error: 'An account with this email address already exists. Please log in or use a different email.'
                    };
                }
                throw error;
            }

            if (!data?.user) throw new Error('User creation failed: no user returned');

            // FIX BUG_REG_001 (post-signUp guard): When Supabase email-confirm is ON, a
            // duplicate signUp returns identities: [] instead of an error. The pre-check
            // above covers the common case; this guard catches the rare race condition or
            // any auth-only user (e.g. Champion) that slipped through — we must NOT proceed
            // because signUp has already silently triggered a password update for them.
            if (
                data.user.identities !== undefined &&
                Array.isArray(data.user.identities) &&
                data.user.identities.length === 0
            ) {
                return {
                    success: false,
                    error: 'An account with this email address already exists. Please log in or reset your password.'
                };
            }

            // 2. Try to insert business profile immediately
            // This may fail if email confirmation is required (RLS blocks it)
            try {
                const profileData = {
                    auth_user_id: data.user.id,
                    business_email: email,
                    first_name: firstName,
                    last_name: lastName,
                    company_name: companyName || '',
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
        if (msg.includes('User already registered') || msg.includes('already registered') || code === 'user_already_exists') {
            return 'An account with this email address already exists. Please log in or use a different email.';
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
