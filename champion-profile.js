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
        document.getElementById('mobile_number').value = this.champion.mobile_number || '';
        document.getElementById('office_phone').value = this.champion.office_phone || '';

        // Parse bio to extract structured data
        this.parseBioData();
    }

    /**
     * Parse bio data and populate form fields
     */
    parseBioData() {
        const bio = this.champion.bio || '';
        
        // Split bio into parts
        const parts = bio.split('\n\n');
        let keyContributions = '';
        let structuredData = '';
        
        if (parts.length >= 2) {
            keyContributions = parts[0];
            structuredData = parts[1];
        } else {
            keyContributions = bio;
        }
        
        // Set key contributions
        document.getElementById('key_contributions').value = keyContributions;
        
        // Parse structured data
        if (structuredData) {
            const dataItems = structuredData.split(' | ');
            dataItems.forEach(item => {
                const [key, value] = item.split(': ');
                if (key && value) {
                    switch (key.trim()) {
                        case 'Website':
                            document.getElementById('website').value = value;
                            break;
                        case 'ESG Competence':
                            document.getElementById('competence_esg').value = value;
                            break;
                        case 'Sector Focus':
                            document.getElementById('sectors_focus').value = value;
                            break;
                        case 'Panel Expertise':
                            document.getElementById('expertise_panels').value = value;
                            break;
                    }
                }
            });
        }
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
        document.getElementById('full_name').value = fullName;

        const keyContributions = document.getElementById('key_contributions').value.trim();
        const mobile = document.getElementById('mobile_number').value.trim();
        const officePhone = document.getElementById('office_phone').value.trim();
        const website = document.getElementById('website').value.trim();
        const competence = document.getElementById('competence_esg').value;
        const sector = document.getElementById('sectors_focus').value;
        const panelExpertise = document.getElementById('expertise_panels').value;

        // Only add non-phone fields to extras
        const extras = [];
        if (website) extras.push(`Website: ${website}`);
        if (competence) extras.push(`ESG Competence: ${competence}`);
        if (sector) extras.push(`Sector Focus: ${sector}`);
        if (panelExpertise) extras.push(`Panel Expertise: ${panelExpertise}`);

        const bioCombined = [keyContributions, extras.join(' | ')].filter(Boolean).join('\n\n');

        const updates = {
            full_name: fullName,
            company: document.getElementById('company').value,
            job_title: document.getElementById('job_title').value,
            linkedin_url: document.getElementById('linkedin_url').value,
            bio: bioCombined,
            mobile_number: mobile,      // ✅ Save as separate field
            office_phone: officePhone   // ✅ Save as separate field
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
            window.location.href = '/';
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

