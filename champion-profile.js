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
     * Populate all form fields from the champion object.
     * For backward compatibility, if dedicated columns are empty but bio contains structured data,
     * parse the bio to fill the fields.
     */
    populateForm() {
        const fullName = this.champion.full_name || '';
        const parts = fullName.trim().split(' ');
        const first = parts.slice(0, -1).join(' ') || parts[0] || '';
        const last = parts.length > 1 ? parts.slice(-1).join(' ') : '';

        document.getElementById('first_name').value = first;
        document.getElementById('last_name').value = last;
        document.getElementById('full_name').value = fullName;
        document.getElementById('email').value = this.champion.email || '';
        document.getElementById('company').value = this.champion.company || '';
        document.getElementById('job_title').value = this.champion.job_title || '';
        document.getElementById('linkedin_url').value = this.champion.linkedin_url || '';

        // Set values from dedicated columns (if they exist)
        document.getElementById('mobile_number').value = this.champion.mobile_number || '';
        document.getElementById('office_phone').value = this.champion.office_phone || '';
        document.getElementById('website').value = this.champion.website || '';
        document.getElementById('competence_esg').value = this.champion.competence_esg || '';
        document.getElementById('sectors_focus').value = this.champion.sectors_focus || '';
        document.getElementById('expertise_panels').value = this.champion.expertise_panels || '';

        // For Key ESG Contributions, we use the bio field (but only the part before any structured data)
        // However, if we have already parsed bio below, we'll override this.
        let keyContributions = this.champion.bio || '';

        // If dedicated fields are empty and bio exists, try to parse bio to fill them
        const needsParsing = 
            !this.champion.mobile_number &&
            !this.champion.office_phone &&
            !this.champion.website &&
            !this.champion.competence_esg &&
            !this.champion.sectors_focus &&
            !this.champion.expertise_panels &&
            this.champion.bio;

        if (needsParsing) {
            const parsed = this.parseBio(this.champion.bio);
            // Only set fields that are currently empty in the champion object
            if (!this.champion.mobile_number && parsed.mobile_number) {
                document.getElementById('mobile_number').value = parsed.mobile_number;
            }
            if (!this.champion.office_phone && parsed.office_phone) {
                document.getElementById('office_phone').value = parsed.office_phone;
            }
            if (!this.champion.website && parsed.website) {
                document.getElementById('website').value = parsed.website;
            }
            if (!this.champion.competence_esg && parsed.competence_esg) {
                document.getElementById('competence_esg').value = parsed.competence_esg;
            }
            if (!this.champion.sectors_focus && parsed.sectors_focus) {
                document.getElementById('sectors_focus').value = parsed.sectors_focus;
            }
            if (!this.champion.expertise_panels && parsed.expertise_panels) {
                document.getElementById('expertise_panels').value = parsed.expertise_panels;
            }
            // Use the extracted key contributions (first part of bio)
            if (parsed.keyContributions) {
                keyContributions = parsed.keyContributions;
            }
        }

        // Set the Key ESG Contributions field
        document.getElementById('key_contributions').value = keyContributions;
    }

    /**
     * Parse the legacy bio string to extract structured fields.
     * Expected format (example):
     *   "gygyiuv\n\nESG Competence: beginner | Sector Focus: healthcare | Panel Expertise: environmental\n\nMobile: 12345654321 | Sector Focus: manufacturing"
     * Returns an object with possible keys: keyContributions, mobile_number, office_phone, website,
     * competence_esg, sectors_focus, expertise_panels.
     */
    parseBio(bio) {
        const result = {};
        if (!bio) return result;

        // Split by double newline to separate sections
        const sections = bio.split(/\n\s*\n/);
        
        // First non-empty section is likely the key contributions (free text)
        if (sections.length > 0 && sections[0].trim()) {
            result.keyContributions = sections[0].trim();
        }

        // Process remaining sections for key-value pairs
        for (let i = 1; i < sections.length; i++) {
            const section = sections[i].trim();
            // Split by '|' to get individual key-value pairs
            const pairs = section.split('|').map(p => p.trim());
            pairs.forEach(pair => {
                const colonIndex = pair.indexOf(':');
                if (colonIndex === -1) return;
                const key = pair.substring(0, colonIndex).trim().toLowerCase();
                const value = pair.substring(colonIndex + 1).trim();

                // Map known keys to field names
                if (key.includes('mobile')) {
                    result.mobile_number = value;
                } else if (key.includes('office')) {
                    result.office_phone = value;
                } else if (key.includes('website')) {
                    result.website = value;
                } else if (key.includes('esg competence')) {
                    result.competence_esg = value;
                } else if (key.includes('sector focus')) {
                    // If there are multiple, take the last one (or could handle as array, but for now last wins)
                    result.sectors_focus = value;
                } else if (key.includes('panel expertise')) {
                    result.expertise_panels = value;
                }
            });
        }

        return result;
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.profile-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });

        // Profile form
        document.getElementById('profile-form').addEventListener('submit', (e) => this.saveProfile(e));

        // Password form
        document.getElementById('password-form').addEventListener('submit', (e) => this.changePassword(e));

        // Delete account
        document.getElementById('delete-account-btn').addEventListener('click', () => this.deleteAccount());
        
        // Character limit + digit blocking + space warning for name & role fields
        ['first_name', 'last_name', 'job_title'].forEach(id => {
            const input = document.getElementById(id);
            const errorChar = document.getElementById(`error-${id}`);
            const errorDigit = document.getElementById(`error-${id}_digit`);
            const errorSpace = document.getElementById(`error-${id}_space`);
            if (input && errorChar && errorDigit && errorSpace) {
                input.addEventListener('input', () => {
                    // 1. Filter out digits
                    const filtered = input.value.replace(/\d/g, '');
                    if (filtered !== input.value) {
                        input.value = filtered;
                        // Show digit error
                        errorDigit.style.display = 'block';
                        // Hide it after 2 seconds
                        setTimeout(() => {
                            errorDigit.style.display = 'none';
                        }, 2000);
                    } else {
                        // If no digits, hide digit error immediately
                        errorDigit.style.display = 'none';
                    }

                    // 2. Check character limit
                    if (input.value.length > 265) {
                        errorChar.style.display = 'block';
                    } else {
                        errorChar.style.display = 'none';
                    }

                    // 3. Check leading/trailing spaces
                    if (input.value !== input.value.trim()) {
                        errorSpace.style.display = 'block';
                    } else {
                        errorSpace.style.display = 'none';
                    }
                });
            }
        });

        // Space warning for company (no digit check)
        const companyInput = document.getElementById('company');
        const companyErrorChar = document.getElementById('error-company');
        const companyErrorSpace = document.getElementById('error-company_space');
        if (companyInput && companyErrorChar && companyErrorSpace) {
            companyInput.addEventListener('input', () => {
                // Character limit
                if (companyInput.value.length > 265) {
                    companyErrorChar.style.display = 'block';
                } else {
                    companyErrorChar.style.display = 'none';
                }

                // Leading/trailing spaces
                if (companyInput.value !== companyInput.value.trim()) {
                    companyErrorSpace.style.display = 'block';
                } else {
                    companyErrorSpace.style.display = 'none';
                }
            });
        }
    }
    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.profile-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Show/hide content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });
        document.getElementById(`tab-${tabName}`).classList.remove('hidden');

        // Load tab-specific content
        if (tabName === 'reviews') {
            this.loadMyReviews();
        }
    }

    async loadMyReviews() {
        const container = document.getElementById('my-reviews-list');
        
        try {
            const reviews = await window.championDB.getMyReviews();
            
            if (reviews.length === 0) {
                container.innerHTML = `
                    <div class="text-center p-6">
                        <p class="text-secondary mb-4">You haven't submitted any reviews yet.</p>
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
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Indicator</th>
                                <th>Panel</th>
                                <th>Status</th>
                                <th>Rating</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${reviews.map(review => `
                                <tr>
                                    <td>
                                        <a href="/champion-indicators.html?panel=${review.panel_id}&indicator=${review.indicator_id}">
                                            ${review.indicators?.name || 'Unknown'}
                                        </a>
                                    </td>
                                    <td>
                                        <span class="badge badge-${review.panels?.category || 'primary'}">
                                            ${review.panels?.name || 'Unknown'}
                                        </span>
                                    </td>
                                    <td>
                                        <span class="badge badge-${statusColors[review.status] || 'primary'}">
                                            ${review.status}
                                        </span>
                                    </td>
                                    <td>${this.renderStars(review.rating)}</td>
                                    <td>${_formatDate(review.created_at)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
            
        } catch (error) {
            console.error('Error loading reviews:', error);
            container.innerHTML = '<p class="text-error">Failed to load reviews.</p>';
        }
    }

    async saveProfile(event) {
        event.preventDefault();
        
        const btn = document.getElementById('save-profile-btn');
        btn.disabled = true;
        btn.textContent = 'Saving...';

        const firstName = document.getElementById('first_name').value.trim();
        const lastName = document.getElementById('last_name').value.trim();
        const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
        document.getElementById('full_name').value = fullName; // keep hidden field in sync

        const keyContributions = document.getElementById('key_contributions').value.trim();
        const mobile = document.getElementById('mobile_number').value.trim();
        const officePhone = document.getElementById('office_phone').value.trim();
        const website = document.getElementById('website').value.trim();
        const competence = document.getElementById('competence_esg').value;
        const sector = document.getElementById('sectors_focus').value;
        const panelExpertise = document.getElementById('expertise_panels').value;
        // Character limit validation (existing)
        const longFields = [];
        ['first_name', 'last_name', 'company', 'job_title'].forEach(id => {
            const input = document.getElementById(id);
            if (input && input.value.length > 265) {
                longFields.push(id.replace('_', ' '));
                document.getElementById(`error-${id}`).style.display = 'block';
            }
        });
        // Space validation (leading/trailing)
        const spaceFields = [];
        ['first_name', 'last_name', 'company', 'job_title'].forEach(id => {
            const input = document.getElementById(id);
            if (input && input.value !== input.value.trim()) {
                spaceFields.push(id.replace('_', ' '));
                document.getElementById(`error-${id}_space`).style.display = 'block';
                // Hide after 3 seconds
                setTimeout(() => {
                    document.getElementById(`error-${id}_space`).style.display = 'none';
                }, 3000);
            }
        });

        if (spaceFields.length > 0) {
            window.showToast?.(`Fields cannot start or end with a space: ${spaceFields.join(', ')}`, 'error');
            btn.disabled = false;
            btn.textContent = 'Save Changes';
            return;
        }
        if (longFields.length > 0) {
            window.showToast?.(`Fields exceed 265 characters: ${longFields.join(', ')}`, 'error');
            btn.disabled = false;
            btn.textContent = 'Save Changes';
            return;
        }

        // Digit validation (new)
        const digitFields = [];
        ['first_name', 'last_name', 'job_title'].forEach(id => {
            const input = document.getElementById(id);
            if (input && /\d/.test(input.value)) {
                digitFields.push(id.replace('_', ' '));
                document.getElementById(`error-${id}_digit`).style.display = 'block';
                // Hide after 2 seconds (optional, but user will see the error on submit)
                setTimeout(() => {
                    document.getElementById(`error-${id}_digit`).style.display = 'none';
                }, 2000);
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
            company: document.getElementById('company').value,
            job_title: document.getElementById('job_title').value,
            linkedin_url: document.getElementById('linkedin_url').value,
            mobile_number: mobile || null,
            office_phone: officePhone || null,
            website: website || null,
            competence_esg: competence || null,
            sectors_focus: sector || null,
            expertise_panels: panelExpertise || null,
            bio: keyContributions || null   // store only key contributions in bio
        };

        try {
            const result = await window.championAuth.updateProfile(updates);
            
            if (result.success) {
                this.champion = result.data;
                this.updateProfileHeader();
                window.showToast('Profile updated successfully!', 'success');
                
                // Check if user was redirected here to complete their profile
                // If so, redirect them back to their original destination
                if (window.championAuth?.handleProfileCompletionRedirect?.()) {
                    return; // Will redirect to original page
                }
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            window.showToast('Failed to save profile. Please try again.', 'error');
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
            window.showToast('Passwords do not match', 'error');
            return;
        }

        const btn = document.getElementById('change-password-btn');
        btn.disabled = true;
        btn.textContent = 'Updating...';

        try {
            const result = await window.championAuth.updatePassword(newPassword);
            
            if (result.success) {
                window.showToast('Password updated successfully!', 'success');
                document.getElementById('password-form').reset();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error changing password:', error);
            window.showToast('Failed to update password. Please try again.', 'error');
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
            window.showToast('Account deletion cancelled', 'info');
            return;
        }

        try {
            // Note: In a real app, you'd call a server-side function to delete the account
            window.showToast('Account deletion requested. You will be logged out.', 'info');
            await window.championAuth.logout();
            window.location.href = '/landing.html';
        } catch (error) {
            console.error('Error deleting account:', error);
            window.showToast('Failed to delete account. Please contact support.', 'error');
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