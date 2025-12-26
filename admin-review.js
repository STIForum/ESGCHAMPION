/**
 * Admin Review Page JavaScript
 * ESG Champions Platform
 */

class AdminReviewPage {
    constructor() {
        this.pendingReviews = [];
        this.panelReviews = [];
        this.currentTab = 'panel-reviews';
        this.selectedReview = null;
        this.selectedPanelReview = null;
    }

    async init() {
        // Wait for auth to be ready
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check if user is admin
        const isAdmin = await window.championAuth.isAdmin();
        if (!isAdmin) {
            window.location.href = '/champion-dashboard.html';
            return;
        }

        // Load initial data
        await this.loadPanelReviewQueue();
        await this.loadReviewQueue();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Show content
        document.getElementById('loading-state').classList.add('hidden');
        document.getElementById('admin-content').classList.remove('hidden');
    }

    async loadPanelReviewQueue() {
        try {
            // Get panel submissions from localStorage (in production, this would be from database)
            const submissions = JSON.parse(localStorage.getItem('panelSubmissions') || '[]');
            this.panelReviews = submissions.filter(s => s.status === 'pending');
            
            const countEl = document.getElementById('panel-pending-count');
            if (countEl) {
                countEl.textContent = this.panelReviews.length;
            }
            this.renderPanelReviewQueue(this.panelReviews);
            
        } catch (error) {
            console.error('Error loading panel review queue:', error);
        }
    }

    renderPanelReviewQueue(reviews) {
        const container = document.getElementById('panel-reviews-queue');
        if (!container) return;
        
        if (reviews.length === 0) {
            container.innerHTML = `
                <div class="text-center p-8">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--gray-300)" stroke-width="2" style="margin: 0 auto var(--space-4);">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <h3 style="color: var(--gray-600);">All caught up!</h3>
                    <p class="text-secondary">No pending panel reviews to moderate.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = reviews.map(review => `
            <div class="panel-review-card" data-id="${review.id}" onclick="adminPage.openPanelReviewModal('${review.id}')">
                <div class="flex-between mb-4">
                    <div>
                        <h3 style="margin-bottom: var(--space-1);">${review.panelName || 'Unknown Panel'}</h3>
                        <div class="text-secondary" style="font-size: var(--text-sm);">
                            ${review.indicatorCount || 0} indicators reviewed
                        </div>
                    </div>
                    <div class="text-right">
                        <span class="badge badge-warning">Pending Review</span>
                        <div class="text-muted" style="font-size: var(--text-sm); margin-top: var(--space-1);">
                            ${this.formatDate(review.submittedAt)}
                        </div>
                    </div>
                </div>
                
                <div class="flex-between">
                    <div class="text-secondary" style="font-size: var(--text-sm);">
                        Submitted by: <strong>${review.championName || 'Anonymous'}</strong>
                    </div>
                    <button class="btn btn-primary btn-sm">View Details</button>
                </div>
            </div>
        `).join('');
    }

    async openPanelReviewModal(submissionId) {
        const submission = this.panelReviews.find(r => r.id === submissionId);
        if (!submission) return;

        this.selectedPanelReview = submission;

        const backdrop = document.getElementById('panel-review-modal-backdrop');
        const modal = document.getElementById('panel-review-modal');
        const title = document.getElementById('panel-review-modal-title');
        const body = document.getElementById('panel-review-modal-body');
        const footer = document.getElementById('panel-review-modal-footer');

        title.textContent = `Review: ${submission.panelName}`;

        // Fetch indicator details
        let indicatorDetails = [];
        try {
            indicatorDetails = await window.championDB.getIndicatorsByIds(submission.indicatorIds);
        } catch (error) {
            console.error('Error fetching indicators:', error);
        }

        body.innerHTML = `
            <div style="margin-bottom: var(--space-4);">
                <div class="flex-between mb-3">
                    <span class="text-secondary">Panel:</span>
                    <strong>${submission.panelName}</strong>
                </div>
                <div class="flex-between mb-3">
                    <span class="text-secondary">Submitted by:</span>
                    <strong>${submission.championName || 'Anonymous'}</strong>
                </div>
                <div class="flex-between mb-3">
                    <span class="text-secondary">Submitted at:</span>
                    <strong>${this.formatDate(submission.submittedAt)}</strong>
                </div>
                <div class="flex-between">
                    <span class="text-secondary">Indicators reviewed:</span>
                    <strong>${submission.indicatorCount}</strong>
                </div>
            </div>
            
            <h4 style="margin-bottom: var(--space-3);">Reviewed Indicators</h4>
            <div class="indicators-reviewed-list">
                ${indicatorDetails.length > 0 ? indicatorDetails.map((ind, idx) => `
                    <div class="indicator-review-item">
                        <div class="flex-between mb-2">
                            <span class="badge badge-primary">#${idx + 1}</span>
                            ${ind.panels ? `<span class="badge badge-${ind.panels.category}">${ind.panels.category}</span>` : ''}
                        </div>
                        <h5 style="margin-bottom: var(--space-1);">${ind.name}</h5>
                        <p class="text-secondary" style="font-size: var(--text-sm); margin: 0;">${ind.description || 'No description'}</p>
                    </div>
                `).join('') : `
                    <p class="text-secondary">Unable to load indicator details.</p>
                `}
            </div>
        `;

        footer.innerHTML = `
            <button class="btn btn-ghost" onclick="adminPage.closePanelReviewModal()">Cancel</button>
            <button class="btn btn-error" onclick="adminPage.rejectPanelReview('${submissionId}')">Reject</button>
            <button class="btn btn-success" onclick="adminPage.approvePanelReview('${submissionId}')">Approve</button>
        `;

        backdrop.classList.add('active');
        modal.classList.add('active');
    }

    closePanelReviewModal() {
        const backdrop = document.getElementById('panel-review-modal-backdrop');
        const modal = document.getElementById('panel-review-modal');
        backdrop.classList.remove('active');
        modal.classList.remove('active');
        this.selectedPanelReview = null;
    }

    async approvePanelReview(submissionId) {
        try {
            // Update localStorage
            const submissions = JSON.parse(localStorage.getItem('panelSubmissions') || '[]');
            const idx = submissions.findIndex(s => s.id === submissionId);
            if (idx !== -1) {
                submissions[idx].status = 'approved';
                localStorage.setItem('panelSubmissions', JSON.stringify(submissions));
            }

            // Update panelReviews in sessionStorage
            const panelReviews = JSON.parse(sessionStorage.getItem('panelReviews') || '{}');
            const submission = submissions[idx];
            if (submission) {
                panelReviews[submission.panelId] = 'approved';
                sessionStorage.setItem('panelReviews', JSON.stringify(panelReviews));
            }

            window.showToast?.('Panel review approved successfully!', 'success');
            this.closePanelReviewModal();
            await this.loadPanelReviewQueue();
            
        } catch (error) {
            console.error('Error approving panel review:', error);
            window.showToast?.('Failed to approve. Please try again.', 'error');
        }
    }

    async rejectPanelReview(submissionId) {
        try {
            // Update localStorage
            const submissions = JSON.parse(localStorage.getItem('panelSubmissions') || '[]');
            const idx = submissions.findIndex(s => s.id === submissionId);
            if (idx !== -1) {
                submissions[idx].status = 'rejected';
                localStorage.setItem('panelSubmissions', JSON.stringify(submissions));
            }

            // Remove from panelReviews in sessionStorage
            const panelReviews = JSON.parse(sessionStorage.getItem('panelReviews') || '{}');
            const submission = submissions[idx];
            if (submission) {
                delete panelReviews[submission.panelId];
                sessionStorage.setItem('panelReviews', JSON.stringify(panelReviews));
            }

            window.showToast?.('Panel review rejected.', 'info');
            this.closePanelReviewModal();
            await this.loadPanelReviewQueue();
            
        } catch (error) {
            console.error('Error rejecting panel review:', error);
            window.showToast?.('Failed to reject. Please try again.', 'error');
        }
    }

    async loadReviewQueue() {
        try {
            const reviews = await window.adminService.getPendingReviews();
            this.pendingReviews = reviews;
            
            document.getElementById('pending-count').textContent = reviews.length;
            this.renderReviewQueue(reviews);
            
        } catch (error) {
            console.error('Error loading review queue:', error);
            this.showError('Failed to load reviews. Please refresh.');
        }
    }

    renderReviewQueue(reviews) {
        const container = document.getElementById('reviews-queue');
        
        if (reviews.length === 0) {
            container.innerHTML = `
                <div class="text-center p-8">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--gray-300)" stroke-width="2" style="margin: 0 auto var(--space-4);">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <h3 style="color: var(--gray-600);">All caught up!</h3>
                    <p class="text-secondary">No pending reviews to moderate.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = reviews.map(review => `
            <div class="review-card" data-id="${review.id}">
                <div class="flex-between mb-4">
                    <div class="flex" style="gap: var(--space-3);">
                        <div class="avatar">
                            ${review.champions?.avatar_url 
                                ? `<img src="${review.champions.avatar_url}" alt="${review.champions.full_name}">`
                                : this.getInitials(review.champions?.full_name)
                            }
                        </div>
                        <div>
                            <strong>${review.champions?.full_name || 'Anonymous'}</strong>
                            <div class="text-secondary" style="font-size: var(--text-sm);">${review.champions?.email || ''}</div>
                        </div>
                    </div>
                    <div class="text-right">
                        <span class="badge badge-${review.panels?.category || 'primary'}">${review.panels?.name || 'Unknown'}</span>
                        <div class="text-muted" style="font-size: var(--text-sm); margin-top: var(--space-1);">
                            ${this.formatDate(review.created_at)}
                        </div>
                    </div>
                </div>
                
                <h4 style="margin-bottom: var(--space-2);">${review.indicators?.name || 'Unknown Indicator'}</h4>
                
                <div class="mb-2">
                    ${this.renderStars(review.rating)}
                </div>
                
                <p style="margin-bottom: 0; color: var(--gray-600);">
                    ${this.truncate(review.content, 200)}
                </p>
                
                <div class="review-actions">
                    <button class="btn btn-primary btn-sm" onclick="adminPage.openReviewModal('${review.id}')">
                        Review
                    </button>
                    <button class="btn btn-sm" style="background: var(--success-bg); color: var(--success);" onclick="adminPage.quickAccept('${review.id}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        Accept
                    </button>
                    <button class="btn btn-sm" style="background: var(--error-bg); color: var(--error);" onclick="adminPage.quickReject('${review.id}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                        Reject
                    </button>
                </div>
            </div>
        `).join('');
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });

        // Export button
        document.getElementById('export-btn').addEventListener('click', () => this.exportData());

        // Modal close - Indicator Review
        document.getElementById('review-modal-close').addEventListener('click', () => this.closeModal());
        document.getElementById('review-modal-backdrop').addEventListener('click', (e) => {
            if (e.target === document.getElementById('review-modal-backdrop')) {
                this.closeModal();
            }
        });

        // Modal close - Panel Review
        const panelModalClose = document.getElementById('panel-review-modal-close');
        const panelModalBackdrop = document.getElementById('panel-review-modal-backdrop');
        if (panelModalClose) {
            panelModalClose.addEventListener('click', () => this.closePanelReviewModal());
        }
        if (panelModalBackdrop) {
            panelModalBackdrop.addEventListener('click', (e) => {
                if (e.target === panelModalBackdrop) {
                    this.closePanelReviewModal();
                }
            });
        }
    }

    async switchTab(tabName) {
        this.currentTab = tabName;
        
        // Update tab buttons
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Show/hide content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });
        document.getElementById(`tab-${tabName}`).classList.remove('hidden');

        // Load tab-specific content
        switch (tabName) {
            case 'panels':
                await this.loadPanels();
                break;
            case 'indicators':
                await this.loadIndicators();
                break;
            case 'champions':
                await this.loadChampions();
                break;
        }
    }

    async loadPanels() {
        const container = document.getElementById('panels-list');
        container.innerHTML = '<div class="loading-spinner" style="margin: var(--space-8) auto;"></div>';

        try {
            const panels = await window.adminService.getAllPanels();
            
            container.innerHTML = `
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${panels.map(panel => `
                                <tr>
                                    <td><strong>${panel.name}</strong></td>
                                    <td><span class="badge badge-${panel.category}">${panel.category}</span></td>
                                    <td>
                                        <span class="badge badge-${panel.is_active ? 'success' : 'error'}">
                                            ${panel.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <button class="btn btn-ghost btn-sm" onclick="adminPage.editPanel('${panel.id}')">Edit</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } catch (error) {
            console.error('Error loading panels:', error);
            container.innerHTML = '<p class="text-error">Failed to load panels.</p>';
        }
    }

    async loadIndicators() {
        const container = document.getElementById('indicators-list');
        container.innerHTML = '<div class="loading-spinner" style="margin: var(--space-8) auto;"></div>';

        try {
            const indicators = await window.adminService.getAllIndicators();
            
            container.innerHTML = `
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Panel</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${indicators.map(indicator => `
                                <tr>
                                    <td><strong>${indicator.name}</strong></td>
                                    <td>
                                        <span class="badge badge-${indicator.panels?.category || 'primary'}">
                                            ${indicator.panels?.name || 'Unknown'}
                                        </span>
                                    </td>
                                    <td>
                                        <span class="badge badge-${indicator.is_active ? 'success' : 'error'}">
                                            ${indicator.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <button class="btn btn-ghost btn-sm" onclick="adminPage.editIndicator('${indicator.id}')">Edit</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } catch (error) {
            console.error('Error loading indicators:', error);
            container.innerHTML = '<p class="text-error">Failed to load indicators.</p>';
        }
    }

    async loadChampions() {
        const container = document.getElementById('champions-list');
        container.innerHTML = '<div class="loading-spinner" style="margin: var(--space-8) auto;"></div>';

        try {
            const champions = await window.adminService.getAllChampions();
            
            container.innerHTML = `
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Company</th>
                                <th>Credits</th>
                                <th>Admin</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${champions.map(champion => `
                                <tr>
                                    <td>
                                        <div class="flex" style="gap: var(--space-2); align-items: center;">
                                            <div class="avatar" style="width: 32px; height: 32px; font-size: var(--text-xs);">
                                                ${champion.avatar_url 
                                                    ? `<img src="${champion.avatar_url}" alt="${champion.full_name}">`
                                                    : this.getInitials(champion.full_name)
                                                }
                                            </div>
                                            <strong>${champion.full_name || 'Anonymous'}</strong>
                                        </div>
                                    </td>
                                    <td>${champion.email}</td>
                                    <td>${champion.company || '-'}</td>
                                    <td>${champion.credits || 0}</td>
                                    <td>
                                        <span class="badge badge-${champion.is_admin ? 'primary' : 'secondary'}">
                                            ${champion.is_admin ? 'Admin' : 'Champion'}
                                        </span>
                                    </td>
                                    <td>
                                        <button class="btn btn-ghost btn-sm" onclick="adminPage.toggleAdminStatus('${champion.id}', ${!champion.is_admin})">
                                            ${champion.is_admin ? 'Remove Admin' : 'Make Admin'}
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } catch (error) {
            console.error('Error loading champions:', error);
            container.innerHTML = '<p class="text-error">Failed to load champions.</p>';
        }
    }

    openReviewModal(reviewId) {
        const review = this.pendingReviews.find(r => r.id === reviewId);
        if (!review) return;

        this.selectedReview = review;

        const modal = document.getElementById('review-modal');
        const backdrop = document.getElementById('review-modal-backdrop');
        const body = document.getElementById('review-modal-body');
        const footer = document.getElementById('review-modal-footer');

        body.innerHTML = `
            <div class="mb-4">
                <span class="badge badge-${review.panels?.category || 'primary'}">${review.panels?.name || 'Unknown'}</span>
                <span class="badge badge-primary" style="margin-left: var(--space-2);">${review.indicators?.name || 'Unknown'}</span>
            </div>
            
            <div class="flex" style="gap: var(--space-3); margin-bottom: var(--space-4);">
                <div class="avatar">
                    ${review.champions?.avatar_url 
                        ? `<img src="${review.champions.avatar_url}" alt="${review.champions.full_name}">`
                        : this.getInitials(review.champions?.full_name)
                    }
                </div>
                <div>
                    <strong>${review.champions?.full_name || 'Anonymous'}</strong>
                    <div class="text-secondary" style="font-size: var(--text-sm);">${review.champions?.email || ''}</div>
                </div>
            </div>
            
            <div class="mb-4">
                ${this.renderStars(review.rating)}
            </div>
            
            <div class="p-4" style="background: var(--gray-50); border-radius: var(--radius-lg); margin-bottom: var(--space-4);">
                <p style="margin: 0; white-space: pre-wrap;">${review.content}</p>
            </div>
            
            <div class="form-group">
                <label class="form-label" for="rejection-reason">Feedback / Rejection Reason (optional)</label>
                <textarea id="rejection-reason" class="form-textarea" rows="3" placeholder="Provide feedback to the champion..."></textarea>
            </div>
        `;

        footer.innerHTML = `
            <button class="btn btn-ghost" onclick="adminPage.closeModal()">Cancel</button>
            <button class="btn" style="background: var(--error-bg); color: var(--error);" onclick="adminPage.rejectReview()">
                Reject
            </button>
            <button class="btn btn-primary" onclick="adminPage.acceptReview()">
                Accept (+10 credits)
            </button>
        `;

        modal.classList.add('active');
        backdrop.classList.add('active');
    }

    closeModal() {
        document.getElementById('review-modal').classList.remove('active');
        document.getElementById('review-modal-backdrop').classList.remove('active');
        this.selectedReview = null;
    }

    async acceptReview() {
        if (!this.selectedReview) return;

        try {
            await window.adminService.acceptReview(this.selectedReview.id);
            window.showToast('Review accepted! Champion awarded 10 credits.', 'success');
            this.closeModal();
            await this.loadReviewQueue();
        } catch (error) {
            console.error('Error accepting review:', error);
            window.showToast('Failed to accept review. Please try again.', 'error');
        }
    }

    async rejectReview() {
        if (!this.selectedReview) return;

        const reason = document.getElementById('rejection-reason')?.value || '';

        try {
            await window.adminService.rejectReview(this.selectedReview.id, reason);
            window.showToast('Review rejected.', 'info');
            this.closeModal();
            await this.loadReviewQueue();
        } catch (error) {
            console.error('Error rejecting review:', error);
            window.showToast('Failed to reject review. Please try again.', 'error');
        }
    }

    async quickAccept(reviewId) {
        if (!confirm('Accept this review and award 10 credits?')) return;

        try {
            await window.adminService.acceptReview(reviewId);
            window.showToast('Review accepted!', 'success');
            await this.loadReviewQueue();
        } catch (error) {
            console.error('Error accepting review:', error);
            window.showToast('Failed to accept review.', 'error');
        }
    }

    async quickReject(reviewId) {
        const reason = prompt('Rejection reason (optional):');
        if (reason === null) return; // Cancelled

        try {
            await window.adminService.rejectReview(reviewId, reason);
            window.showToast('Review rejected.', 'info');
            await this.loadReviewQueue();
        } catch (error) {
            console.error('Error rejecting review:', error);
            window.showToast('Failed to reject review.', 'error');
        }
    }

    async toggleAdminStatus(championId, makeAdmin) {
        const action = makeAdmin ? 'grant admin privileges to' : 'remove admin privileges from';
        if (!confirm(`Are you sure you want to ${action} this champion?`)) return;

        try {
            await window.adminService.toggleAdmin(championId, makeAdmin);
            window.showToast(`Admin status ${makeAdmin ? 'granted' : 'revoked'}.`, 'success');
            await this.loadChampions();
        } catch (error) {
            console.error('Error toggling admin:', error);
            window.showToast('Failed to update admin status.', 'error');
        }
    }

    async exportData() {
        try {
            const btn = document.getElementById('export-btn');
            btn.disabled = true;
            btn.innerHTML = '<span class="loading-spinner" style="width: 20px; height: 20px;"></span> Exporting...';

            await window.adminService.exportData();
            window.showToast('Data exported successfully!', 'success');
        } catch (error) {
            console.error('Export error:', error);
            window.showToast('Failed to export data.', 'error');
        } finally {
            const btn = document.getElementById('export-btn');
            btn.disabled = false;
            btn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Export Data
            `;
        }
    }

    editPanel(panelId) {
        window.showToast('Panel editing coming soon!', 'info');
    }

    editIndicator(indicatorId) {
        window.showToast('Indicator editing coming soon!', 'info');
    }

    renderStars(rating) {
        return Array.from({ length: 5 }, (_, i) => 
            `<span style="color: ${i < rating ? 'var(--accent-400)' : 'var(--gray-300)'}; font-size: var(--text-lg);">★</span>`
        ).join('');
    }

    truncate(str, length) {
        if (!str) return '';
        return str.length > length ? str.substring(0, length) + '...' : str;
    }

    getInitials(name) {
        if (!name) return '?';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    showError(message) {
        document.getElementById('loading-state').innerHTML = `
            <div class="text-center">
                <div class="alert alert-error">${message}</div>
                <button class="btn btn-primary mt-4" onclick="location.reload()">Retry</button>
            </div>
        `;
    }
}

// Initialize on DOM ready
let adminPage;
document.addEventListener('DOMContentLoaded', () => {
    adminPage = new AdminReviewPage();
    adminPage.init();
});

