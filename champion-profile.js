/**
 * Champion Profile JavaScript
 * ESG Champions Platform
 */

// Utility functions with fallbacks
function _formatDate(dateString) {
    if (window.formatDate) return window.formatDate(dateString);
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function _hideLoading(elementId) {
    if (window.hideLoading) return window.hideLoading(elementId);
    const el = document.getElementById(elementId);
    if (el) el.classList.add('hidden');
}

function _showErrorState(elementId, message, onRetry) {
    if (window.showErrorState) return window.showErrorState(elementId, message, onRetry);
    const el = document.getElementById(elementId);
    if (el) {
        el.innerHTML = `
            <div class="text-center">
                <div class="alert alert-error">${message}</div>
                <button class="btn btn-primary mt-4" onclick="location.reload()">Retry</button>
            </div>
        `;
    }
}

class ChampionProfile {
    constructor() {
        this.champion = null;
    }

    async init() {
        // Wait for auth to be ready
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check authentication
        if (!window.championAuth?.isAuthenticated?.()) {
            window.location.href = '/champion-login.html?redirect=/champion-profile.html';
            return;
        }

        // Load profile
        await this.loadProfile();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Check if user was redirected here to complete profile
        this.showProfileCompletionBanner();
    }

    /**
     * Show a banner if user was redirected to complete their profile
     */
    showProfileCompletionBanner() {
        const urlParams = new URLSearchParams(window.location.search);
        const isCompletionMode = urlParams.get('complete') === 'true';
        
        if (isCompletionMode || sessionStorage.getItem('profileRedirectAfter')) {
            const status = window.championAuth?.getProfileCompletionStatus?.();
            
            if (status && !status.isComplete) {
                // Create and show completion banner
                const banner = document.createElement('div');
                banner.id = 'profile-completion-banner';
                banner.className = 'alert alert-warning mb-4';
                banner.innerHTML = `
                    <div class="flex items-center gap-3">
                        <span style="font-size: 1.5rem;">👋</span>
                        <div>
                            <strong>Welcome to ESG Champions!</strong>
                            <p class="mb-0">Please complete your profile to continue. Missing fields: <strong>${status.missingFields.join(', ')}</strong></p>
                        </div>
                    </div>
                `;
                
                // Insert at the top of profile content
                const profileContent = document.getElementById('profile-content');
                if (profileContent) {
                    profileContent.insertBefore(banner, profileContent.firstChild);
                }
                
                // Highlight required fields
                this.highlightRequiredFields(status.missingFields);
            }
        }
    }

    /**
     * Highlight empty required fields
     */
    highlightRequiredFields(missingFields) {
        const fieldMap = {
            'Full Name': ['first_name', 'last_name'],
            'Company/Organization': ['company'],
            'Job Title': ['job_title']
        };
        
        missingFields.forEach(field => {
            const inputIds = fieldMap[field] || [];
            inputIds.forEach(id => {
                const input = document.getElementById(id);
                if (input) {
                    input.style.borderColor = '#e74c3c';
                    input.style.boxShadow = '0 0 0 2px rgba(231, 76, 60, 0.2)';
                }
            });
        });
    }

    async loadProfile() {
        try {
            this.champion = window.championAuth.getChampion();
            const user = window.championAuth.getUser();
            
            if (!this.champion) {
                await window.championAuth.loadChampionProfile();
                this.champion = window.championAuth.getChampion();
            }

            // Update header
            this.updateProfileHeader();
            
            // Update stats
            await this.updateStats();
            
            // Populate form
            this.populateForm();
            
            // Show content using fallback utility
            _hideLoading('loading-state');
            document.getElementById('profile-content').classList.remove('hidden');
            
        } catch (error) {
            console.error('Error loading profile:', error);
            this.showError('Failed to load profile. Please refresh.');
        }
    }

    updateProfileHeader() {
        const avatar = document.getElementById('profile-avatar');
        const name = this.champion.full_name || 'Champion';
        
        if (this.champion.avatar_url) {
            avatar.innerHTML = `<img src="${this.champion.avatar_url}" alt="${name}">`;
        } else {
            avatar.textContent = this.getInitials(name);
        }

        document.getElementById('profile-name').textContent = name;
        document.getElementById('profile-title').textContent = this.champion.job_title || 'ESG Champion';
        document.getElementById('profile-company').textContent = this.champion.company || 'Independent';
        document.getElementById('profile-email').textContent = this.champion.email;
        document.getElementById('profile-joined').textContent = `Joined ${_formatDate(this.champion.created_at)}`;
    }

    async updateStats() {
        try {
            const stats = await window.championDB.getDashboardStats();
            const rank = await window.championDB.getChampionRank(this.champion.id);
            
            document.getElementById('profile-credits').textContent = stats.stats.credits;
            document.getElementById('profile-reviews').textContent = stats.stats.totalReviews;
            document.getElementById('profile-accepted').textContent = stats.stats.approvedReviews;
            document.getElementById('profile-rank').textContent = rank ? `#${rank}` : '#--';
            
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    /**
     * Sanitize value by trimming and removing excessive whitespace
     */
    sanitizeValue(value) {
        if (!value) return '';
        // Trim leading/trailing whitespace and collapse multiple spaces to single space
        return value.trim().replace(/\s+/g, ' ');
    }

    /**
     * Populate all form fields from the champion object.
     * For backward compatibility, if dedicated columns are empty but bio contains structured data,
     * parse the bio to fill the fields.
     * 
     * FIX: Auto-sanitize values from LinkedIn to prevent validation errors
     */
    populateForm() {
        const fullName = this.sanitizeValue(this.champion.full_name || '');
        const parts = fullName.split(' ');
        const first = parts.slice(0, -1).join(' ') || parts[0] || '';
        const last = parts.length > 1 ? parts.slice(-1).join(' ') : '';

        // Sanitize all values before setting them
        document.getElementById('first_name').value = this.sanitizeValue(first);
        document.getElementById('last_name').value = this.sanitizeValue(last);
        document.getElementById('full_name').value = fullName;
        
        // FIX: Enable email field for editing (important for LinkedIn users who may need to update)
        const emailField = document.getElementById('email');
        emailField.value = this.champion.email || '';
        emailField.disabled = false; // Make sure it's editable
        
        document.getElementById('company').value = this.sanitizeValue(this.champion.company || '');
        document.getElementById('job_title').value = this.sanitizeValue(this.champion.job_title || '');
        document.getElementById('linkedin_url').value = this.sanitizeValue(this.champion.linkedin_url || '');

        // Set values from dedicated columns (if they exist)
        document.getElementById('mobile_number').value = this.sanitizeValue(this.champion.mobile_number || '');
        document.getElementById('office_phone').value = this.sanitizeValue(this.champion.office_phone || '');
        document.getElementById('website').value = this.sanitizeValue(this.champion.website || '');
        document.getElementById('competence_esg').value = this.champion.competence_esg || '';
        document.getElementById('sectors_focus').value = this.champion.sectors_focus || '';
        document.getElementById('expertise_panels').value = this.champion.expertise_panels || '';

        // Handle the key_contributions field
        const bio = this.champion.bio || '';
        
        // Try to extract key contributions from bio
        // If bio was structured from registration, it might contain "Key Contributions:" section
        let keyContributions = '';
        
        if (bio) {
            // Check if bio is structured with metadata
            const lines = bio.split('\n');
            const contributionLines = [];
            let inContributions = false;
            
            for (const line of lines) {
                if (line.includes('Website:') || line.includes('ESG Competence:') || 
                    line.includes('Sector Focus:') || line.includes('Panel Expertise:')) {
                    inContributions = false;
                    continue;
                }
                if (!inContributions) {
                    inContributions = true;
                }
                if (inContributions && line.trim()) {
                    contributionLines.push(line);
                }
            }
            
            keyContributions = contributionLines.join('\n').trim();
        }
        
        document.getElementById('key_contributions').value = keyContributions;

        // Clear any existing validation errors on load
        this.clearValidationErrors();
        
        // FIX: Remove red borders from fields after loading
        ['first_name', 'last_name', 'company', 'job_title', 'email'].forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.style.borderColor = '';
                input.style.boxShadow = '';
            }
        });
    }

    /**
     * Clear all validation error messages
     */
    clearValidationErrors() {
        const errorFields = [
            'error-first_name', 'error-first_name_digit', 'error-first_name_space',
            'error-last_name', 'error-last_name_digit', 'error-last_name_space',
            'error-company', 'error-company_space',
            'error-job_title', 'error-job_title_digit', 'error-job_title_space'
        ];
        
        errorFields.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.profile-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const targetTab = e.target.dataset.tab;
                
                // Update active tab
                document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                
                // Show target content
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.add('hidden');
                });
                document.getElementById(`tab-${targetTab}`).classList.remove('hidden');
                
                // Load reviews if switching to reviews tab
                if (targetTab === 'reviews') {
                    this.loadMyReviews();
                }
            });
        });

        // Profile form submission
        document.getElementById('profile-form').addEventListener('submit', (e) => this.saveProfile(e));
        
        // Password form submission
        document.getElementById('password-form').addEventListener('submit', (e) => this.changePassword(e));
        
        // Delete account
        document.getElementById('delete-account-btn').addEventListener('click', () => this.deleteAccount());

        // FIX: Add real-time validation to clear errors as user types
        ['first_name', 'last_name', 'company', 'job_title'].forEach(fieldId => {
            const input = document.getElementById(fieldId);
            if (input) {
                input.addEventListener('input', () => {
                    // Clear validation errors for this field
                    this.clearFieldErrors(fieldId);
                    
                    // Auto-trim on input to prevent trailing space issues
                    const cursorPos = input.selectionStart;
                    const trimmed = input.value.trimStart();
                    if (trimmed !== input.value) {
                        input.value = trimmed;
                        input.setSelectionRange(cursorPos - 1, cursorPos - 1);
                    }
                });
            }
        });
    }

    /**
     * Clear validation errors for a specific field
     */
    clearFieldErrors(fieldId) {
        ['', '_digit', '_space'].forEach(suffix => {
            const errorEl = document.getElementById(`error-${fieldId}${suffix}`);
            if (errorEl) errorEl.style.display = 'none';
        });
        
        const input = document.getElementById(fieldId);
        if (input) {
            input.style.borderColor = '';
            input.style.boxShadow = '';
        }
    }

    async loadMyReviews() {
        const container = document.getElementById('my-reviews-list');
        container.innerHTML = '<p class="text-secondary text-center p-6">Loading reviews...</p>';

        try {
            const reviews = await window.championDB.getChampionReviews(this.champion.id);
            
            if (!reviews || reviews.length === 0) {
                container.innerHTML = `
                    <div class="text-center p-6">
                        <p class="text-secondary mb-4">No reviews yet. Start by exploring ESG panels!</p>
                        <a href="/champion-panels.html" class="btn btn-primary">Browse Panels</a>
                    </div>
                `;
                return;
            }

            const statusColors = {
                pending: 'warning',
                approved: 'success',
                rejected: 'error'
            };

            container.innerHTML = `
                <ul class="activity-feed">
                    ${reviews.map(review => `
                        <li class="activity-item">
                            <div class="activity-icon" style="background: var(--${statusColors[review.status] || 'primary'}-bg); color: var(--${statusColors[review.status] || 'primary'});">
                                ${this.getStatusIcon(review.status)}
                            </div>
                            <div class="activity-content">
                                <div class="activity-title">${review.indicators?.name || 'Unknown Indicator'}</div>
                                <div class="activity-time">
                                    <span class="badge badge-${review.panels?.category || 'primary'}" style="font-size: 10px;">
                                        ${review.panels?.name || 'Unknown Panel'}
                                    </span>
                                </div>
                            </div>
                            <span class="badge badge-${statusColors[review.status] || 'primary'}">
                                ${review.status}
                            </span>
                        </li>
                    `).join('')}
                </ul>
            `;
        } catch (error) {
            console.error('Error loading reviews:', error);
            container.innerHTML = '<p class="text-error text-center p-6">Failed to load reviews</p>';
        }
    }

    getStatusIcon(status) {
        const icons = {
            pending: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
            approved: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>',
            rejected: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'
        };
        return icons[status] || icons.pending;
    }

    /**
     * Save profile updates
     * FIX: Better validation and error handling for LinkedIn users
     */
    async saveProfile(event) {
        event.preventDefault();
        
        const btn = document.getElementById('save-profile-btn');
        btn.disabled = true;
        btn.textContent = 'Saving...';

        // FIX: Sanitize all inputs before validation
        const firstName = this.sanitizeValue(document.getElementById('first_name').value);
        const lastName = this.sanitizeValue(document.getElementById('last_name').value);
        const company = this.sanitizeValue(document.getElementById('company').value);
        const jobTitle = this.sanitizeValue(document.getElementById('job_title').value);
        
        // Update the form fields with sanitized values
        document.getElementById('first_name').value = firstName;
        document.getElementById('last_name').value = lastName;
        document.getElementById('company').value = company;
        document.getElementById('job_title').value = jobTitle;
        
        const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
        document.getElementById('full_name').value = fullName;

        const keyContributions = document.getElementById('key_contributions').value.trim();
        const mobile = this.sanitizeValue(document.getElementById('mobile_number').value);
        const officePhone = this.sanitizeValue(document.getElementById('office_phone').value);
        const website = this.sanitizeValue(document.getElementById('website').value);
        const competence = document.getElementById('competence_esg').value;
        const sector = document.getElementById('sectors_focus').value;
        const panelExpertise = document.getElementById('expertise_panels').value;
        
        // Clear previous errors
        this.clearValidationErrors();
        
        // Character limit validation
        const longFields = [];
        const fieldsToCheck = [
            { id: 'first_name', value: firstName, label: 'First Name' },
            { id: 'last_name', value: lastName, label: 'Last Name' },
            { id: 'company', value: company, label: 'Company' },
            { id: 'job_title', value: jobTitle, label: 'Job Title' }
        ];
        
        fieldsToCheck.forEach(field => {
            if (field.value.length > 265) {
                longFields.push(field.label);
                document.getElementById(`error-${field.id}`).style.display = 'block';
            }
        });

        if (longFields.length > 0) {
            window.showToast?.(`Fields exceed 265 characters: ${longFields.join(', ')}`, 'error');
            btn.disabled = false;
            btn.textContent = 'Save Changes';
            return;
        }

        // Digit validation for name fields
        const digitFields = [];
        const nameFields = [
            { id: 'first_name', value: firstName, label: 'First Name' },
            { id: 'last_name', value: lastName, label: 'Last Name' },
            { id: 'job_title', value: jobTitle, label: 'Job Title' }
        ];
        
        nameFields.forEach(field => {
            if (/\d/.test(field.value)) {
                digitFields.push(field.label);
                document.getElementById(`error-${field.id}_digit`).style.display = 'block';
            }
        });

        if (digitFields.length > 0) {
            window.showToast?.(`Digits are not allowed in: ${digitFields.join(', ')}`, 'error');
            btn.disabled = false;
            btn.textContent = 'Save Changes';
            return;
        }

        // Build updates object with dedicated columns
        const updates = {
            full_name: fullName,
            company: company,
            job_title: jobTitle,
            linkedin_url: this.sanitizeValue(document.getElementById('linkedin_url').value),
            mobile_number: mobile || null,
            office_phone: officePhone || null,
            website: website || null,
            competence_esg: competence || null,
            sectors_focus: sector || null,
            expertise_panels: panelExpertise || null,
            bio: keyContributions || null
        };

        try {
            const result = await window.championAuth.updateProfile(updates);
            
            if (result.success) {
                this.champion = result.data;
                this.updateProfileHeader();
                window.showToast?.('Profile updated successfully!', 'success');
                
                // Remove completion banner if it exists
                const banner = document.getElementById('profile-completion-banner');
                if (banner) banner.remove();
                
                // Check if user was redirected here to complete their profile
                if (window.championAuth?.handleProfileCompletionRedirect?.()) {
                    return; // Will redirect to original page
                }
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            window.showToast?.('Failed to save profile. Please try again.', 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Save Changes';
        }
    }

    async changePassword(event) {
        event.preventDefault();
        
        const newPassword = document.getElementById('new_password').value;
        const confirmPassword = document.getElementById('confirm_password').value;

        if (newPassword !== confirmPassword) {
            window.showToast?.('Passwords do not match', 'error');
            return;
        }

        const btn = document.getElementById('change-password-btn');
        btn.disabled = true;
        btn.textContent = 'Updating...';

        try {
            const result = await window.championAuth.updatePassword(newPassword);
            
            if (result.success) {
                window.showToast?.('Password updated successfully!', 'success');
                document.getElementById('password-form').reset();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error changing password:', error);
            window.showToast?.('Failed to update password. Please try again.', 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Update Password';
        }
    }

    async deleteAccount() {
        if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            return;
        }

        if (!confirm('This will permanently delete all your data. Type "DELETE" to confirm.')) {
            return;
        }

        const confirmation = prompt('Please type DELETE to confirm:');
        if (confirmation !== 'DELETE') {
            window.showToast?.('Account deletion cancelled', 'info');
            return;
        }

        try {
            window.showToast?.('Account deletion requested. You will be logged out.', 'info');
            await window.championAuth.logout();
            window.location.href = '/landing.html';
        } catch (error) {
            console.error('Error deleting account:', error);
            window.showToast?.('Failed to delete account. Please contact support.', 'error');
        }
    }

    renderStars(rating) {
        return Array.from({ length: 5 }, (_, i) => 
            `<span style="color: ${i < rating ? 'var(--accent-400)' : 'var(--gray-300)'};">★</span>`
        ).join('');
    }

    getInitials(name) {
        if (!name) return '?';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    }

    showError(message) {
        _showErrorState('loading-state', message, () => location.reload());
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    const profile = new ChampionProfile();
    profile.init();
});