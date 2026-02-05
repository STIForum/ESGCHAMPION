/**
 * Admin Review Page JavaScript
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

class AdminReviewPage {
    constructor() {
        this.pendingReviews = [];
        this.panelReviews = [];
        this.currentTab = 'panel-reviews';
        this.selectedReview = null;
        this.selectedPanelReview = null;
        this.currentEditingPanel = null;
        this.currentEditingIndicator = null;
        this.panelsList = [];

        this.labelMaps = {
            sme_size_band: {
                micro: 'Micro (0–9 / <£1.6m)',
                small: 'Small (10–49 / £1.6–£8m)',
                medium: 'Medium (50–249 / £8–£40m)',
                upper_medium: 'Upper-medium (250–499 / £40–£200m)'
            },
            primary_sector: {
                agriculture_forestry_fishing: 'Agriculture, Forestry and Fishing',
                mining_quarrying_utilities: 'Mining & Quarrying; Utilities; Waste / Remediation',
                manufacturing: 'Manufacturing',
                construction: 'Construction',
                wholesale_retail_repair: 'Wholesale & Retail; Motor Vehicle Repair',
                transportation_storage: 'Transportation and Storage',
                accommodation_food: 'Accommodation and Food Service Activities',
                information_communication: 'Information and Communication',
                financial_insurance: 'Financial and Insurance Activities',
                real_estate: 'Real Estate Activities',
                professional_scientific_technical: 'Professional, Scientific and Technical Activities',
                administrative_support: 'Administrative and Support Service Activities',
                education: 'Education',
                human_health_social_work: 'Human Health and Social Work Activities',
                arts_entertainment_recreation: 'Arts, Entertainment and Recreation',
                other_services: 'Other Service Activities'
            },
            primary_framework: {
                gri: 'GRI',
                esrs: 'ESRS',
                ifrs: 'IFRS',
                sector: 'Sector',
                other: 'Other'
            },
            esg_class: {
                environment: 'Environment',
                social: 'Social',
                governance: 'Governance'
            },
            tri_level: {
                high: 'High',
                medium: 'Medium',
                low: 'Low'
            },
            regulatory: {
                mandatory: 'Mandatory',
                strongly_expected: 'Strongly Expected',
                optional: 'Optional'
            },
            tier: {
                core: 'Core',
                recommended: 'Recommended',
                optional: 'Optional'
            }
        };
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
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Show content using centralized utility
        _hideLoading('loading-state');
        document.getElementById('admin-content').classList.remove('hidden');
    }

    async loadPanelReviewQueue() {
        try {
            // Fetch panel review submissions from database
            const submissions = await window.championDB.getAdminPanelReviewSubmissions('pending');
            this.panelReviews = submissions || [];
            
            const countEl = document.getElementById('panel-pending-count');
            if (countEl) {
                countEl.textContent = this.panelReviews.length;
            }
            this.renderPanelReviewQueue(this.panelReviews);
            
        } catch (error) {
            console.error('Error loading panel review queue:', error);
            // Fallback to localStorage for backwards compatibility
            try {
                const localSubmissions = JSON.parse(localStorage.getItem('panelSubmissions') || '[]');
                this.panelReviews = localSubmissions.filter(s => s.status === 'pending');
                this.renderPanelReviewQueue(this.panelReviews);
            } catch (e) {
                console.error('Fallback also failed:', e);
            }
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

        container.innerHTML = reviews.map(review => {
            // Handle both database schema and legacy localStorage format
            const panelName = review.panels?.name || review.panelName || 'Unknown Panel';
            const panelFramework = (review.panels?.primary_framework || review.panels?.framework || '').toLowerCase();
            const frameworkLabel = window.FRAMEWORK_LABELS?.[panelFramework] || panelFramework.toUpperCase() || 'N/A';
            const championName = review.champions?.full_name || review.championName || 'Anonymous';
            const submittedAt = review.created_at || review.submittedAt;
            const indicatorCount = review.indicatorCount || '—';
            
            return `
            <div class="panel-review-card" data-id="${review.id}" onclick="adminPage.openPanelReviewModal('${review.id}')">
                <div class="flex-between mb-4">
                    <div>
                        <span class="badge badge-${panelFramework || 'primary'}" style="margin-bottom: var(--space-2);">${frameworkLabel}</span>
                        <h3 style="margin-bottom: var(--space-1);">${panelName}</h3>
                        <div class="text-secondary" style="font-size: var(--text-sm);">
                            ${indicatorCount} indicators reviewed
                        </div>
                    </div>
                    <div class="text-right">
                        <span class="badge badge-warning">Pending Review</span>
                        <div class="text-muted" style="font-size: var(--text-sm); margin-top: var(--space-1);">
                            ${_formatDate(submittedAt)}
                        </div>
                    </div>
                </div>
                
                <div class="flex-between">
                    <div class="text-secondary" style="font-size: var(--text-sm);">
                        Submitted by: <strong>${championName}</strong>
                    </div>
                    <button class="btn btn-primary btn-sm">View Details</button>
                </div>
            </div>
        `}).join('');
    }

    async openPanelReviewModal(submissionId) {
        const backdrop = document.getElementById('panel-review-modal-backdrop');
        const modal = document.getElementById('panel-review-modal');
        const title = document.getElementById('panel-review-modal-title');
        const body = document.getElementById('panel-review-modal-body');
        const footer = document.getElementById('panel-review-modal-footer');

        // Show loading state
        body.innerHTML = '<div class="flex-center p-8"><div class="loading-spinner"></div></div>';
        backdrop.classList.add('active');
        modal.classList.add('active');

        try {
            // Try to fetch from database first
            let submission;
            try {
                submission = await window.championDB.getSubmissionWithIndicatorReviews(submissionId);
            } catch (dbError) {
                console.warn('Database fetch failed, trying localStorage:', dbError);
                // Fallback to localStorage
                submission = this.panelReviews.find(r => r.id === submissionId);
            }

            if (!submission) {
                body.innerHTML = '<p class="text-error">Submission not found.</p>';
                return;
            }

            this.selectedPanelReview = submission;

            // Handle both database and localStorage formats
            const panelName = submission.panels?.name || submission.panelName || 'Unknown Panel';
            const panelFramework = (submission.panels?.primary_framework || submission.panels?.framework || '').toLowerCase();
            const frameworkLabel = window.FRAMEWORK_LABELS?.[panelFramework] || panelFramework.toUpperCase() || 'N/A';
            const championName = submission.champions?.full_name || submission.championName || 'Anonymous';
            const championEmail = submission.champions?.email || '';
            const submittedAt = submission.created_at || submission.submittedAt;
            const indicatorReviews = submission.indicatorReviews || [];

            title.textContent = `Review: ${panelName}`;

            body.innerHTML = `
                <div style="margin-bottom: var(--space-4); background: var(--gray-50); border-radius: var(--radius-lg); padding: var(--space-4);">
                    <div class="flex-between mb-3">
                        <span class="text-secondary">Panel:</span>
                        <span><span class="badge badge-${panelFramework || 'primary'}">${frameworkLabel}</span> <strong>${panelName}</strong></span>
                    </div>
                    <div class="flex-between mb-3">
                        <span class="text-secondary">Submitted by:</span>
                        <div class="text-right">
                            <strong>${championName}</strong>
                            ${championEmail ? `<div class="text-muted" style="font-size: var(--text-sm);">${championEmail}</div>` : ''}
                        </div>
                    </div>
                    <div class="flex-between mb-3">
                        <span class="text-secondary">Submitted at:</span>
                        <strong>${_formatDate(submittedAt)}</strong>
                    </div>
                    <div class="flex-between">
                        <span class="text-secondary">Indicators reviewed:</span>
                        <strong>${indicatorReviews.length}</strong>
                    </div>
                </div>
                
                <h4 style="margin-bottom: var(--space-3);">Indicator Reviews</h4>
                <div class="indicators-reviewed-list">
                    ${indicatorReviews.length > 0 ? indicatorReviews.map((review, idx) => {
                        const indicator = review.indicators || {};
                        const sizeLabel = this.formatLabel('sme_size_band', review.sme_size_band);
                        const sectorLabel = this.formatLabel('primary_sector', review.primary_sector);
                        const frameworkLabel = this.formatLabel('primary_framework', review.primary_framework);
                        const esgLabel = this.formatLabel('esg_class', review.esg_class);
                        const tierLabel = this.formatLabel('tier', review.suggested_tier);
                        const relevanceLabel = this.formatLabel('tri_level', review.relevance);
                        const regulatoryLabel = this.formatLabel('regulatory', review.regulatory_necessity);
                        const feasibilityLabel = this.formatLabel('tri_level', review.operational_feasibility);
                        const costLabel = this.formatLabel('tri_level', review.cost_to_collect);
                        const riskLabel = this.formatLabel('tri_level', review.misreporting_risk);
                        const sdgList = this.formatSdgs(review.sdgs);
                        const tags = (review.optional_tags || []).join(', ') || '—';
                        const notes = review.notes || '—';

                        return `
                        <div class="indicator-review-item">
                            <div class="flex-between mb-2">
                                <span class="badge badge-primary">#${idx + 1}</span>
                                <span style="background: var(--gray-100); color: var(--gray-600); border-radius: var(--radius-full); padding: 4px 10px; font-size: var(--text-xs);">${tierLabel !== '—' ? `Tier: ${tierLabel}` : 'Tier not set'}</span>
                            </div>
                            <h5 style="margin-bottom: var(--space-1);">${indicator.name || 'Unknown Indicator'}</h5>
                            <p class="text-secondary" style="font-size: var(--text-sm); margin-bottom: var(--space-3);">${indicator.description || ''}</p>
                            <div class="methodology-section" style="margin-bottom: var(--space-3);">
                                <div class="methodology-grid" style="grid-template-columns: 1fr 1fr; gap: var(--space-3);">
                                    <div class="methodology-item">
                                        <div class="metadata-label">SME Size</div>
                                        <div class="metadata-value">${sizeLabel}</div>
                                    </div>
                                    <div class="methodology-item">
                                        <div class="metadata-label">Primary Sector</div>
                                        <div class="metadata-value">${sectorLabel}</div>
                                    </div>
                                    <div class="methodology-item">
                                        <div class="metadata-label">Primary Framework</div>
                                        <div class="metadata-value">${frameworkLabel}</div>
                                    </div>
                                    <div class="methodology-item">
                                        <div class="metadata-label">ESG Class</div>
                                        <div class="metadata-value">${esgLabel}</div>
                                    </div>
                                    <div class="methodology-item" style="grid-column: span 2;">
                                        <div class="metadata-label">Related SDGs</div>
                                        <div class="metadata-value">${sdgList}</div>
                                    </div>
                                </div>
                            </div>

                            <div class="methodology-section" style="margin-bottom: var(--space-3);">
                                <div class="methodology-grid" style="grid-template-columns: repeat(2, 1fr); gap: var(--space-3);">
                                    <div class="methodology-item">
                                        <div class="metadata-label">Relevance</div>
                                        <div class="metadata-value">${relevanceLabel}</div>
                                    </div>
                                    <div class="methodology-item">
                                        <div class="metadata-label">Regulatory Necessity</div>
                                        <div class="metadata-value">${regulatoryLabel}</div>
                                    </div>
                                    <div class="methodology-item">
                                        <div class="metadata-label">Operational Feasibility</div>
                                        <div class="metadata-value">${feasibilityLabel}</div>
                                    </div>
                                    <div class="methodology-item">
                                        <div class="metadata-label">Cost-to-Collect</div>
                                        <div class="metadata-value">${costLabel}</div>
                                    </div>
                                    <div class="methodology-item">
                                        <div class="metadata-label">Misreporting Risk</div>
                                        <div class="metadata-value">${riskLabel}</div>
                                    </div>
                                </div>
                            </div>

                            <div class="methodology-section">
                                <div class="metadata-label">Suggested Tier</div>
                                <div class="metadata-value">${tierLabel}</div>
                                <div class="metadata-label" style="margin-top: var(--space-2);">Rationale</div>
                                <p style="margin: 0; font-size: var(--text-sm);">${review.rationale || review.analysis || '—'}</p>
                                <div class="metadata-label" style="margin-top: var(--space-2);">Tags</div>
                                <div class="metadata-value">${tags}</div>
                                <div class="metadata-label" style="margin-top: var(--space-2);">Notes</div>
                                <p style="margin: 0; font-size: var(--text-sm);">${notes}</p>
                            </div>
                        </div>
                    `}).join('') : `
                        <p class="text-secondary">No indicator reviews found.</p>
                    `}
                </div>
            `;

            footer.innerHTML = `
                <div style="width: 100%; margin-bottom: var(--space-3);">
                    <label class="form-label" style="font-weight: 500;">Admin Comment (optional)</label>
                    <textarea id="admin-review-comment" class="form-textarea" placeholder="Add your feedback or comments about this review..." rows="2" style="width: 100%; resize: vertical;"></textarea>
                </div>
                <div style="display: flex; gap: var(--space-3); justify-content: flex-end;">
                    <button class="btn btn-ghost" onclick="adminPage.closePanelReviewModal()">Cancel</button>
                    <button class="btn btn-error" onclick="adminPage.rejectPanelReview('${submissionId}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: var(--space-1);">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                        Reject
                    </button>
                    <button class="btn btn-success" onclick="adminPage.approvePanelReview('${submissionId}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: var(--space-1);">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        Approve Panel Review
                    </button>
                </div>
            `;

        } catch (error) {
            console.error('Error opening panel review modal:', error);
            body.innerHTML = '<p class="text-error">Failed to load submission details.</p>';
        }
    }

    closePanelReviewModal() {
        const backdrop = document.getElementById('panel-review-modal-backdrop');
        const modal = document.getElementById('panel-review-modal');
        backdrop.classList.remove('active');
        modal.classList.remove('active');
        this.selectedPanelReview = null;
        
        // Clear admin comment field
        const commentField = document.getElementById('admin-review-comment');
        if (commentField) {
            commentField.value = '';
        }
    }

    async approvePanelReview(submissionId) {
        const approveBtn = document.querySelector('.modal-footer .btn-success');
        if (approveBtn) {
            approveBtn.disabled = true;
            approveBtn.innerHTML = '<span class="loading-spinner-sm"></span> Approving...';
        }

        try {
            // Get admin comment
            const adminComment = document.getElementById('admin-review-comment')?.value?.trim() || '';
            
            // Get current admin user
            const adminUser = window.championAuth.getUser();
            const adminId = adminUser?.id || null;

            // Get submission details for notification
            const submission = this.selectedPanelReview;
            const championId = submission?.reviewer_user_id || submission?.championId;
            const panelName = submission?.panels?.name || submission?.panelName || 'Panel';

            // Update submission and indicator reviews in database
            await window.championDB.approveSubmissionWithComment(submissionId, adminComment, adminId);

            // Send notification to the champion
            if (championId) {
                try {
                    await window.championDB.createNotification(
                        championId,
                        'review_accepted',
                        'Review Approved! 🎉',
                        `Your review for "${panelName}" has been approved!${adminComment ? ' Admin feedback: ' + adminComment : ''}`,
                        '/champion-dashboard.html',
                        { 
                            submission_id: submissionId, 
                            panel_name: panelName,
                            admin_comment: adminComment 
                        }
                    );
                } catch (notifError) {
                    console.warn('Failed to send notification:', notifError);
                }
            }

            // Also update localStorage for backwards compatibility
            const submissions = JSON.parse(localStorage.getItem('panelSubmissions') || '[]');
            const idx = submissions.findIndex(s => s.id === submissionId);
            if (idx !== -1) {
                submissions[idx].status = 'approved';
                submissions[idx].admin_notes = adminComment;
                localStorage.setItem('panelSubmissions', JSON.stringify(submissions));
                
                // Update panelReviews in sessionStorage
                const panelReviews = JSON.parse(sessionStorage.getItem('panelReviews') || '{}');
                panelReviews[submissions[idx].panelId] = 'approved';
                sessionStorage.setItem('panelReviews', JSON.stringify(panelReviews));
            }

            window.showToast?.('Panel review approved successfully!', 'success');
            this.closePanelReviewModal();
            await this.loadPanelReviewQueue();
            
        } catch (error) {
            console.error('Error approving panel review:', error);
            window.showToast?.('Failed to approve. Please try again.', 'error');
            if (approveBtn) {
                approveBtn.disabled = false;
                approveBtn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: var(--space-1);">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Approve Panel Review
                `;
            }
        }
    }

    async rejectPanelReview(submissionId) {
        const rejectBtn = document.querySelector('.modal-footer .btn-error');
        if (rejectBtn) {
            rejectBtn.disabled = true;
            rejectBtn.innerHTML = '<span class="loading-spinner-sm"></span> Rejecting...';
        }

        try {
            // Get admin comment (rejection reason)
            const adminComment = document.getElementById('admin-review-comment')?.value?.trim() || '';
            
            // Get current admin user
            const adminUser = window.championAuth.getUser();
            const adminId = adminUser?.id || null;
            
            // Get submission details for notification
            const submission = this.selectedPanelReview;
            const championId = submission?.reviewer_user_id || submission?.championId;
            const panelName = submission?.panels?.name || submission?.panelName || 'Panel';

            // Update in database with rejection comment
            await window.championDB.rejectSubmissionWithComment(submissionId, adminComment, adminId);

            // Send notification to the champion
            if (championId) {
                try {
                    await window.championDB.createNotification(
                        championId,
                        'review_rejected',
                        'Review Requires Changes',
                        `Your review for "${panelName}" needs some changes.${adminComment ? ' Feedback: ' + adminComment : ' Please review and resubmit.'}`,
                        '/champion-panels.html',
                        { 
                            submission_id: submissionId, 
                            panel_name: panelName,
                            admin_comment: adminComment,
                            rejection_reason: adminComment
                        }
                    );
                } catch (notifError) {
                    console.warn('Failed to send notification:', notifError);
                }
            }

            // Also update localStorage for backwards compatibility
            const submissions = JSON.parse(localStorage.getItem('panelSubmissions') || '[]');
            const idx = submissions.findIndex(s => s.id === submissionId);
            if (idx !== -1) {
                submissions[idx].status = 'rejected';
                submissions[idx].admin_notes = adminComment;
                localStorage.setItem('panelSubmissions', JSON.stringify(submissions));
                
                // Remove from panelReviews in sessionStorage
                const panelReviews = JSON.parse(sessionStorage.getItem('panelReviews') || '{}');
                delete panelReviews[submissions[idx].panelId];
                sessionStorage.setItem('panelReviews', JSON.stringify(panelReviews));
            }

            window.showToast?.('Panel review rejected.', 'info');
            this.closePanelReviewModal();
            await this.loadPanelReviewQueue();
            
        } catch (error) {
            console.error('Error rejecting panel review:', error);
            window.showToast?.('Failed to reject. Please try again.', 'error');
            if (rejectBtn) {
                rejectBtn.disabled = false;
                rejectBtn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: var(--space-1);">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                    Reject
                `;
            }
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
                        <span class="badge badge-${(review.panels?.primary_framework || '').toLowerCase() || 'primary'}">${review.panels?.name || 'Unknown'}</span>
                        <div class="text-muted" style="font-size: var(--text-sm); margin-top: var(--space-1);">
                            ${_formatDate(review.created_at)}
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

        // Add Panel Modal
        const addPanelBtn = document.getElementById('add-panel-btn');
        const addPanelModalClose = document.getElementById('add-panel-modal-close');
        const addPanelModalBackdrop = document.getElementById('add-panel-modal-backdrop');
        const savePanelBtn = document.getElementById('save-panel-btn');
        const cancelPanelBtn = document.getElementById('cancel-panel-btn');

        if (addPanelBtn) {
            addPanelBtn.addEventListener('click', () => this.openAddPanelModal());
        }
        if (addPanelModalClose) {
            addPanelModalClose.addEventListener('click', () => this.closeAddPanelModal());
        }
        if (addPanelModalBackdrop) {
            addPanelModalBackdrop.addEventListener('click', (e) => {
                if (e.target === addPanelModalBackdrop) {
                    this.closeAddPanelModal();
                }
            });
        }
        if (savePanelBtn) {
            savePanelBtn.addEventListener('click', () => this.savePanel());
        }
        if (cancelPanelBtn) {
            cancelPanelBtn.addEventListener('click', () => this.closeAddPanelModal());
        }

        // Escape key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closePanelReviewModal();
                this.closeAddPanelModal();
                this.closeEditPanelModal();
                this.closeDeleteConfirmModal();
                this.closeAddIndicatorModal();
                this.closeEditIndicatorModal();
                this.closeDeleteIndicatorConfirmModal();
            }
        });

        // Clear validation errors on input
        const addPanelForm = document.getElementById('add-panel-form');
        if (addPanelForm) {
            addPanelForm.querySelectorAll('input, select, textarea').forEach(field => {
                field.addEventListener('input', () => this.clearFieldError(field));
                field.addEventListener('change', () => this.clearFieldError(field));
            });
        }

        // Edit Panel Modal
        const editPanelModalClose = document.getElementById('edit-panel-modal-close');
        const editPanelModalBackdrop = document.getElementById('edit-panel-modal-backdrop');
        const updatePanelBtn = document.getElementById('update-panel-btn');
        const cancelEditPanelBtn = document.getElementById('cancel-edit-panel-btn');
        const deletePanelBtn = document.getElementById('delete-panel-btn');

        if (editPanelModalClose) {
            editPanelModalClose.addEventListener('click', () => this.closeEditPanelModal());
        }
        if (editPanelModalBackdrop) {
            editPanelModalBackdrop.addEventListener('click', (e) => {
                if (e.target === editPanelModalBackdrop) {
                    this.closeEditPanelModal();
                }
            });
        }
        if (updatePanelBtn) {
            updatePanelBtn.addEventListener('click', () => this.updatePanel());
        }
        if (cancelEditPanelBtn) {
            cancelEditPanelBtn.addEventListener('click', () => this.closeEditPanelModal());
        }
        if (deletePanelBtn) {
            deletePanelBtn.addEventListener('click', () => this.deleteCurrentPanel());
        }

        // Toggle Panel Visibility Button
        const toggleVisibilityBtn = document.getElementById('toggle-panel-visibility-btn');
        if (toggleVisibilityBtn) {
            toggleVisibilityBtn.addEventListener('click', () => this.togglePanelVisibility());
        }

        // Clear validation errors on input for edit form
        const editPanelForm = document.getElementById('edit-panel-form');
        if (editPanelForm) {
            editPanelForm.querySelectorAll('input, select, textarea').forEach(field => {
                field.addEventListener('input', () => this.clearFieldError(field));
                field.addEventListener('change', () => this.clearFieldError(field));
            });
        }

        // Delete Confirmation Modal
        const deleteConfirmModalClose = document.getElementById('delete-confirm-modal-close');
        const deleteConfirmModalBackdrop = document.getElementById('delete-confirm-modal-backdrop');
        const deleteConfirmCancelBtn = document.getElementById('delete-confirm-cancel-btn');
        const deleteConfirmBtn = document.getElementById('delete-confirm-btn');
        const deleteConfirmInput = document.getElementById('delete-confirm-input');

        if (deleteConfirmModalClose) {
            deleteConfirmModalClose.addEventListener('click', () => this.closeDeleteConfirmModal());
        }
        if (deleteConfirmModalBackdrop) {
            deleteConfirmModalBackdrop.addEventListener('click', (e) => {
                if (e.target === deleteConfirmModalBackdrop) {
                    this.closeDeleteConfirmModal();
                }
            });
        }
        if (deleteConfirmCancelBtn) {
            deleteConfirmCancelBtn.addEventListener('click', () => this.closeDeleteConfirmModal());
        }
        if (deleteConfirmBtn) {
            deleteConfirmBtn.addEventListener('click', () => this.confirmDeletePanel());
        }
        if (deleteConfirmInput) {
            deleteConfirmInput.addEventListener('input', (e) => {
                const isValid = e.target.value.toUpperCase() === 'DELETE';
                deleteConfirmBtn.disabled = !isValid;
                if (isValid) {
                    document.getElementById('delete-confirm-error').textContent = '';
                }
            });
        }

        // =====================================================
        // INDICATOR MODAL EVENT LISTENERS
        // =====================================================

        // Add Indicator Modal
        const addIndicatorBtn = document.getElementById('add-indicator-btn');
        const addIndicatorModalClose = document.getElementById('add-indicator-modal-close');
        const addIndicatorModalBackdrop = document.getElementById('add-indicator-modal-backdrop');
        const saveIndicatorBtn = document.getElementById('save-indicator-btn');
        const cancelIndicatorBtn = document.getElementById('cancel-indicator-btn');

        if (addIndicatorBtn) {
            addIndicatorBtn.addEventListener('click', () => this.openAddIndicatorModal());
        }
        if (addIndicatorModalClose) {
            addIndicatorModalClose.addEventListener('click', () => this.closeAddIndicatorModal());
        }
        if (addIndicatorModalBackdrop) {
            addIndicatorModalBackdrop.addEventListener('click', (e) => {
                if (e.target === addIndicatorModalBackdrop) {
                    this.closeAddIndicatorModal();
                }
            });
        }
        if (saveIndicatorBtn) {
            saveIndicatorBtn.addEventListener('click', () => this.saveIndicator());
        }
        if (cancelIndicatorBtn) {
            cancelIndicatorBtn.addEventListener('click', () => this.closeAddIndicatorModal());
        }

        // CSV Import
        const csvImportInput = document.getElementById('csv-import-input');
        const downloadCsvTemplateBtn = document.getElementById('download-csv-template-btn');
        
        if (csvImportInput) {
            csvImportInput.addEventListener('change', (e) => this.handleCsvImport(e));
        }
        if (downloadCsvTemplateBtn) {
            downloadCsvTemplateBtn.addEventListener('click', () => this.downloadCsvTemplate());
        }

        // Edit Indicator Modal
        const editIndicatorModalClose = document.getElementById('edit-indicator-modal-close');
        const editIndicatorModalBackdrop = document.getElementById('edit-indicator-modal-backdrop');
        const updateIndicatorBtn = document.getElementById('update-indicator-btn');
        const cancelEditIndicatorBtn = document.getElementById('cancel-edit-indicator-btn');
        const deleteIndicatorBtn = document.getElementById('delete-indicator-btn');
        const toggleIndicatorVisibilityBtn = document.getElementById('toggle-indicator-visibility-btn');

        if (editIndicatorModalClose) {
            editIndicatorModalClose.addEventListener('click', () => this.closeEditIndicatorModal());
        }
        if (editIndicatorModalBackdrop) {
            editIndicatorModalBackdrop.addEventListener('click', (e) => {
                if (e.target === editIndicatorModalBackdrop) {
                    this.closeEditIndicatorModal();
                }
            });
        }
        if (updateIndicatorBtn) {
            updateIndicatorBtn.addEventListener('click', () => this.updateIndicator());
        }
        if (cancelEditIndicatorBtn) {
            cancelEditIndicatorBtn.addEventListener('click', () => this.closeEditIndicatorModal());
        }
        if (deleteIndicatorBtn) {
            deleteIndicatorBtn.addEventListener('click', () => this.deleteCurrentIndicator());
        }
        if (toggleIndicatorVisibilityBtn) {
            toggleIndicatorVisibilityBtn.addEventListener('click', () => this.toggleIndicatorVisibility());
        }

        // Delete Indicator Confirmation Modal
        const deleteIndicatorConfirmModalClose = document.getElementById('delete-indicator-confirm-modal-close');
        const deleteIndicatorConfirmModalBackdrop = document.getElementById('delete-indicator-confirm-modal-backdrop');
        const deleteIndicatorConfirmCancelBtn = document.getElementById('delete-indicator-confirm-cancel-btn');
        const deleteIndicatorConfirmBtn = document.getElementById('delete-indicator-confirm-btn');
        const deleteIndicatorConfirmInput = document.getElementById('delete-indicator-confirm-input');

        if (deleteIndicatorConfirmModalClose) {
            deleteIndicatorConfirmModalClose.addEventListener('click', () => this.closeDeleteIndicatorConfirmModal());
        }
        if (deleteIndicatorConfirmModalBackdrop) {
            deleteIndicatorConfirmModalBackdrop.addEventListener('click', (e) => {
                if (e.target === deleteIndicatorConfirmModalBackdrop) {
                    this.closeDeleteIndicatorConfirmModal();
                }
            });
        }
        if (deleteIndicatorConfirmCancelBtn) {
            deleteIndicatorConfirmCancelBtn.addEventListener('click', () => this.closeDeleteIndicatorConfirmModal());
        }
        if (deleteIndicatorConfirmBtn) {
            deleteIndicatorConfirmBtn.addEventListener('click', () => this.confirmDeleteIndicator());
        }
        if (deleteIndicatorConfirmInput) {
            deleteIndicatorConfirmInput.addEventListener('input', (e) => {
                const isValid = e.target.value.toUpperCase() === 'DELETE';
                deleteIndicatorConfirmBtn.disabled = !isValid;
                if (isValid) {
                    document.getElementById('delete-indicator-confirm-error').textContent = '';
                }
            });
        }

        // Clear validation errors on input for indicator forms
        const addIndicatorForm = document.getElementById('add-indicator-form');
        if (addIndicatorForm) {
            addIndicatorForm.querySelectorAll('input, select, textarea').forEach(field => {
                field.addEventListener('input', () => this.clearFieldError(field));
                field.addEventListener('change', () => this.clearFieldError(field));
            });
        }

        const editIndicatorForm = document.getElementById('edit-indicator-form');
        if (editIndicatorForm) {
            editIndicatorForm.querySelectorAll('input, select, textarea').forEach(field => {
                field.addEventListener('input', () => this.clearFieldError(field));
                field.addEventListener('change', () => this.clearFieldError(field));
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
            
            // Helper to get framework display
            const getFramework = (panel) => {
                const fw = (panel.primary_framework || panel.framework || '').toLowerCase();
                return window.FRAMEWORK_LABELS?.[fw] || fw.toUpperCase() || 'N/A';
            };
            
            container.innerHTML = `
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Framework</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${panels.map(panel => {
                                const framework = getFramework(panel);
                                const fwLower = (panel.primary_framework || panel.framework || '').toLowerCase();
                                return `
                                <tr>
                                    <td><strong>${panel.name}</strong></td>
                                    <td><span class="badge badge-${fwLower || 'primary'}">${framework}</span></td>
                                    <td>
                                        <span class="badge badge-${panel.is_active ? 'success' : 'error'}">
                                            ${panel.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <button class="btn btn-ghost btn-sm" onclick="adminPage.editPanel('${panel.id}')">Edit</button>
                                    </td>
                                </tr>
                            `}).join('')}
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
            
            // Helper to get framework display
            const getFramework = (indicator) => {
                const fw = (indicator.primary_framework || indicator.framework || indicator.panels?.primary_framework || '').toLowerCase();
                return window.FRAMEWORK_LABELS?.[fw] || fw.toUpperCase() || '';
            };
            
            container.innerHTML = `
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Panel</th>
                                <th>Framework</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${indicators.map(indicator => {
                                const framework = getFramework(indicator);
                                const fwLower = (indicator.primary_framework || indicator.framework || indicator.panels?.primary_framework || '').toLowerCase();
                                return `
                                <tr>
                                    <td><strong>${indicator.name}</strong></td>
                                    <td>${indicator.panels?.name || 'Unknown'}</td>
                                    <td><span class="badge badge-${fwLower || 'primary'}">${framework || 'N/A'}</span></td>
                                    <td>
                                        <span class="badge badge-${indicator.is_active ? 'success' : 'error'}">
                                            ${indicator.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <button class="btn btn-ghost btn-sm" onclick="adminPage.editIndicator('${indicator.id}')">Edit</button>
                                    </td>
                                </tr>
                            `}).join('')}
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
                <span class="badge badge-${(review.panels?.primary_framework || '').toLowerCase() || 'primary'}">${review.panels?.name || 'Unknown'}</span>
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
            window.showToast('Approved reviews exported successfully!', 'success');
        } catch (error) {
            console.error('Export error:', error);
            window.showToast(error.message || 'Failed to export data.', 'error');
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

    editIndicator(indicatorId) {
        window.showToast('Indicator editing coming soon!', 'info');
    }

    // =====================================================
    // EDIT PANEL MODAL
    // =====================================================

    async editPanel(panelId) {
        const backdrop = document.getElementById('edit-panel-modal-backdrop');
        const modal = document.getElementById('edit-panel-modal');
        
        if (!backdrop || !modal) return;

        // Show modal with loading state
        backdrop.classList.add('active');
        modal.classList.add('active');

        try {
            // Fetch panel data
            const panels = await window.adminService.getAllPanels();
            const panel = panels.find(p => p.id === panelId);

            if (!panel) {
                window.showToast?.('Panel not found.', 'error');
                this.closeEditPanelModal();
                return;
            }

            this.currentEditingPanel = panel;

            // Normalize framework value to lowercase
            const normalizedFramework = (panel.primary_framework || panel.framework || '').toLowerCase();

            // Populate form fields
            document.getElementById('edit-panel-id').value = panel.id;
            document.getElementById('edit-panel-title').value = panel.name || '';
            document.getElementById('edit-panel-category').value = panel.category || '';
            document.getElementById('edit-panel-impact').value = panel.impact || '';
            document.getElementById('edit-panel-description').value = panel.description || '';
            document.getElementById('edit-panel-esg-classification').value = panel.esg_classification || '';
            document.getElementById('edit-panel-framework').value = normalizedFramework;
            document.getElementById('edit-panel-purpose').value = panel.purpose || '';
            document.getElementById('edit-panel-unicode').value = panel.unicode || '';
            document.getElementById('edit-panel-icon').value = panel.icon || '';
            document.getElementById('edit-panel-active').checked = panel.is_active !== false;

            // Set selected SDGs
            const sdgsSelect = document.getElementById('edit-panel-sdgs');
            const relatedSdgs = panel.related_sdgs || [];
            Array.from(sdgsSelect.options).forEach(option => {
                option.selected = relatedSdgs.includes(option.value);
            });

            // Update visibility toggle button state
            this.updateVisibilityButtonState(panel.is_active !== false);

            // Focus first input
            setTimeout(() => document.getElementById('edit-panel-title').focus(), 100);

        } catch (error) {
            console.error('Error loading panel:', error);
            window.showToast?.('Failed to load panel data.', 'error');
            this.closeEditPanelModal();
        }
    }

    closeEditPanelModal() {
        const backdrop = document.getElementById('edit-panel-modal-backdrop');
        const modal = document.getElementById('edit-panel-modal');
        
        if (backdrop && modal) {
            backdrop.classList.remove('active');
            modal.classList.remove('active');
            this.resetEditPanelForm();
            this.currentEditingPanel = null;
        }
    }

    resetEditPanelForm() {
        const form = document.getElementById('edit-panel-form');
        if (form) {
            form.reset();
            form.querySelectorAll('.form-input, .form-select, .form-textarea').forEach(field => {
                field.classList.remove('error');
            });
            form.querySelectorAll('.form-error').forEach(error => {
                error.textContent = '';
            });
        }
    }

    validateEditPanelForm() {
        const requiredFields = [
            { id: 'edit-panel-title', label: 'Panel Title' },
            { id: 'edit-panel-category', label: 'Panel Category' },
            { id: 'edit-panel-impact', label: 'Impact' },
            { id: 'edit-panel-esg-classification', label: 'ESG Classification' },
            { id: 'edit-panel-framework', label: 'Primary Framework' }
        ];

        let isValid = true;

        requiredFields.forEach(({ id, label }) => {
            const field = document.getElementById(id);
            if (!field || !field.value.trim()) {
                this.showFieldError(id, `${label} is required`);
                isValid = false;
            } else {
                this.clearFieldError(field);
            }
        });

        return isValid;
    }

    async updatePanel() {
        if (!this.validateEditPanelForm()) {
            return;
        }

        const updateBtn = document.getElementById('update-panel-btn');
        if (updateBtn) {
            updateBtn.disabled = true;
            updateBtn.innerHTML = '<span class="loading-spinner-sm" style="width: 16px; height: 16px; margin-right: var(--space-2);"></span> Updating...';
        }

        try {
            const panelId = document.getElementById('edit-panel-id').value;
            const title = document.getElementById('edit-panel-title').value.trim();
            const category = document.getElementById('edit-panel-category').value;
            const impact = document.getElementById('edit-panel-impact').value;
            const description = document.getElementById('edit-panel-description').value.trim();
            const esgClassification = document.getElementById('edit-panel-esg-classification').value;
            const primaryFramework = document.getElementById('edit-panel-framework').value;
            const purpose = document.getElementById('edit-panel-purpose').value.trim();
            const unicode = document.getElementById('edit-panel-unicode').value.trim();
            const icon = document.getElementById('edit-panel-icon').value.trim();
            const isActive = document.getElementById('edit-panel-active').checked;

            // Get selected SDGs
            const sdgsSelect = document.getElementById('edit-panel-sdgs');
            const relatedSdgs = Array.from(sdgsSelect.selectedOptions).map(opt => opt.value);

            // Build update object
            const updates = {
                name: title,
                category: category,
                impact: impact,
                description: description || null,
                esg_classification: esgClassification,
                primary_framework: primaryFramework,
                related_sdgs: relatedSdgs.length > 0 ? relatedSdgs : null,
                purpose: purpose || null,
                unicode: unicode || null,
                icon: icon || null,
                is_active: isActive
            };

            // Update via admin service
            await window.adminService.updatePanel(panelId, updates);

            window.showToast?.('Panel updated successfully!', 'success');
            
            this.closeEditPanelModal();

            // Refresh panels list
            if (this.currentTab === 'panels') {
                await this.loadPanels();
            }

        } catch (error) {
            console.error('Error updating panel:', error);
            window.showToast?.('Failed to update panel. Please try again.', 'error');
        } finally {
            if (updateBtn) {
                updateBtn.disabled = false;
                updateBtn.innerHTML = 'Update Panel';
            }
        }
    }

    deleteCurrentPanel() {
        if (!this.currentEditingPanel) return;

        // Show confirmation modal
        this.openDeleteConfirmModal();
    }

    openDeleteConfirmModal() {
        const backdrop = document.getElementById('delete-confirm-modal-backdrop');
        const modal = document.getElementById('delete-confirm-modal');
        const panelNameEl = document.getElementById('delete-panel-name');
        const confirmInput = document.getElementById('delete-confirm-input');
        const confirmBtn = document.getElementById('delete-confirm-btn');
        const errorEl = document.getElementById('delete-confirm-error');

        if (backdrop && modal && this.currentEditingPanel) {
            // Set panel name
            panelNameEl.textContent = this.currentEditingPanel.name;
            
            // Reset input and button
            confirmInput.value = '';
            confirmBtn.disabled = true;
            errorEl.textContent = '';

            // Show modal
            backdrop.classList.add('active');
            modal.classList.add('active');

            // Focus input
            setTimeout(() => confirmInput.focus(), 100);
        }
    }

    closeDeleteConfirmModal() {
        const backdrop = document.getElementById('delete-confirm-modal-backdrop');
        const modal = document.getElementById('delete-confirm-modal');
        const confirmInput = document.getElementById('delete-confirm-input');

        if (backdrop && modal) {
            backdrop.classList.remove('active');
            modal.classList.remove('active');
            confirmInput.value = '';
        }
    }

    async confirmDeletePanel() {
        const confirmInput = document.getElementById('delete-confirm-input');
        const confirmBtn = document.getElementById('delete-confirm-btn');
        const errorEl = document.getElementById('delete-confirm-error');

        // Validate input
        if (confirmInput.value.toUpperCase() !== 'DELETE') {
            errorEl.textContent = 'Please type DELETE to confirm';
            return;
        }

        if (!this.currentEditingPanel) return;

        // Disable button and show loading
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<span class="loading-spinner-sm" style="width: 16px; height: 16px; margin-right: var(--space-2);"></span> Deleting...';

        try {
            // Permanently delete from database
            await window.adminService.permanentlyDeletePanel(this.currentEditingPanel.id);

            window.showToast?.('Panel permanently deleted from database!', 'success');
            
            // Close both modals
            this.closeDeleteConfirmModal();
            this.closeEditPanelModal();

            // Refresh panels list
            if (this.currentTab === 'panels') {
                await this.loadPanels();
            }

        } catch (error) {
            console.error('Error deleting panel:', error);
            window.showToast?.('Failed to delete panel. Please try again.', 'error');
            errorEl.textContent = 'Failed to delete. Please try again.';
        } finally {
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                Delete Panel
            `;
        }
    }

    // =====================================================
    // PANEL VISIBILITY TOGGLE
    // =====================================================

    updateVisibilityButtonState(isActive) {
        const btn = document.getElementById('toggle-panel-visibility-btn');
        const btnText = document.getElementById('visibility-btn-text');
        const icon = document.getElementById('visibility-icon');

        if (btn && btnText && icon) {
            if (isActive) {
                // Panel is active - show "Hide" option
                btnText.textContent = 'Hide';
                btn.style.background = 'var(--gray-100)';
                btn.style.color = 'var(--gray-700)';
                icon.innerHTML = `
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                `;
            } else {
                // Panel is inactive - show "Show" option
                btnText.textContent = 'Show';
                btn.style.background = 'var(--success-bg)';
                btn.style.color = 'var(--success)';
                icon.innerHTML = `
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                `;
            }
        }
    }

    async togglePanelVisibility() {
        if (!this.currentEditingPanel) return;

        const btn = document.getElementById('toggle-panel-visibility-btn');
        const btnText = document.getElementById('visibility-btn-text');
        const currentState = this.currentEditingPanel.is_active !== false;
        const newState = !currentState;

        if (btn) {
            btn.disabled = true;
            btnText.textContent = newState ? 'Showing...' : 'Hiding...';
        }

        try {
            // Update only the is_active field
            await window.adminService.updatePanel(this.currentEditingPanel.id, { is_active: newState });

            // Update local state
            this.currentEditingPanel.is_active = newState;

            // Update the checkbox in the form
            document.getElementById('edit-panel-active').checked = newState;

            // Update button state
            this.updateVisibilityButtonState(newState);

            window.showToast?.(
                newState ? 'Panel is now visible to champions!' : 'Panel is now hidden from champions.',
                'success'
            );

            // Refresh panels list
            if (this.currentTab === 'panels') {
                await this.loadPanels();
            }

        } catch (error) {
            console.error('Error toggling panel visibility:', error);
            window.showToast?.('Failed to update panel visibility.', 'error');
        } finally {
            if (btn) {
                btn.disabled = false;
                this.updateVisibilityButtonState(this.currentEditingPanel.is_active);
            }
        }
    }

    // =====================================================
    // ADD PANEL MODAL
    // =====================================================

    openAddPanelModal() {
        const backdrop = document.getElementById('add-panel-modal-backdrop');
        const modal = document.getElementById('add-panel-modal');
        
        if (backdrop && modal) {
            backdrop.classList.add('active');
            modal.classList.add('active');
            
            // Focus trap - focus first input
            const firstInput = document.getElementById('panel-title');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    }

    closeAddPanelModal() {
        const backdrop = document.getElementById('add-panel-modal-backdrop');
        const modal = document.getElementById('add-panel-modal');
        
        if (backdrop && modal) {
            backdrop.classList.remove('active');
            modal.classList.remove('active');
            this.resetAddPanelForm();
        }
    }

    resetAddPanelForm() {
        const form = document.getElementById('add-panel-form');
        if (form) {
            form.reset();
            // Clear all error states
            form.querySelectorAll('.form-input, .form-select, .form-textarea').forEach(field => {
                field.classList.remove('error');
            });
            form.querySelectorAll('.form-error').forEach(error => {
                error.textContent = '';
            });
        }
    }

    clearFieldError(field) {
        field.classList.remove('error');
        const errorEl = document.getElementById(`${field.id}-error`);
        if (errorEl) {
            errorEl.textContent = '';
        }
    }

    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const errorEl = document.getElementById(`${fieldId}-error`);
        
        if (field) {
            field.classList.add('error');
        }
        if (errorEl) {
            errorEl.textContent = message;
        }
    }

    validateAddPanelForm() {
        const requiredFields = [
            { id: 'panel-title', label: 'Panel Title' },
            { id: 'panel-category', label: 'Panel Category' },
            { id: 'panel-impact', label: 'Impact' },
            { id: 'panel-esg-classification', label: 'ESG Classification' },
            { id: 'panel-framework', label: 'Primary Framework' }
        ];

        let isValid = true;

        requiredFields.forEach(({ id, label }) => {
            const field = document.getElementById(id);
            if (!field || !field.value.trim()) {
                this.showFieldError(id, `${label} is required`);
                isValid = false;
            } else {
                this.clearFieldError(field);
            }
        });

        return isValid;
    }

    async savePanel() {
        if (!this.validateAddPanelForm()) {
            return;
        }

        const saveBtn = document.getElementById('save-panel-btn');
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<span class="loading-spinner-sm" style="width: 16px; height: 16px; margin-right: var(--space-2);"></span> Saving...';
        }

        try {
            // Collect form values
            const title = document.getElementById('panel-title').value.trim();
            const category = document.getElementById('panel-category').value;
            const impact = document.getElementById('panel-impact').value;
            const description = document.getElementById('panel-description').value.trim();
            const esgClassification = document.getElementById('panel-esg-classification').value;
            const primaryFramework = document.getElementById('panel-framework').value;
            const purpose = document.getElementById('panel-purpose').value.trim();
            const unicode = document.getElementById('panel-unicode').value.trim();
            const icon = document.getElementById('panel-icon').value.trim();

            // Get selected SDGs
            const sdgsSelect = document.getElementById('panel-sdgs');
            const relatedSdgs = Array.from(sdgsSelect.selectedOptions).map(opt => opt.value);

            // Build panel data object for API
            const panelData = {
                name: title,
                category: category,
                impact: impact,
                description: description || null,
                esg_classification: esgClassification,
                primary_framework: primaryFramework,
                related_sdgs: relatedSdgs.length > 0 ? relatedSdgs : null,
                purpose: purpose || null,
                unicode: unicode || null,
                icon: icon || null,
                is_active: true,
                order_index: 0 // Will be set by backend or can be adjusted later
            };

            // Save to database via admin service
            const savedPanel = await window.adminService.createPanel(panelData);

            window.showToast?.('Panel created successfully!', 'success');
            
            // Close modal and reset form
            this.closeAddPanelModal();

            // Refresh the panels list if we're on the panels tab
            if (this.currentTab === 'panels') {
                await this.loadPanels();
            }

        } catch (error) {
            console.error('Error creating panel:', error);
            window.showToast?.('Failed to create panel. Please try again.', 'error');
        } finally {
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = 'Save Panel';
            }
        }
    }

    // =====================================================
    // ADD INDICATOR MODAL
    // =====================================================

    async openAddIndicatorModal() {
        const backdrop = document.getElementById('add-indicator-modal-backdrop');
        const modal = document.getElementById('add-indicator-modal');
        
        if (backdrop && modal) {
            backdrop.classList.add('active');
            modal.classList.add('active');
            
            // Load panels for dropdown
            await this.loadPanelDropdown();
            
            // Clear CSV import status
            const csvStatus = document.getElementById('csv-import-status');
            if (csvStatus) {
                csvStatus.style.display = 'none';
                csvStatus.innerHTML = '';
            }
            
            // Focus panel dropdown first
            setTimeout(() => document.getElementById('indicator-panel')?.focus(), 100);
        }
    }

    /**
     * Load panels into the indicator panel dropdown
     */
    async loadPanelDropdown() {
        const panelSelect = document.getElementById('indicator-panel');
        if (!panelSelect) return;

        try {
            const panels = await window.adminService.getAllPanels();
            
            panelSelect.innerHTML = '<option value="">Select a panel for this indicator</option>';
            
            if (panels && panels.length > 0) {
                // Group by framework
                const frameworks = { gri: [], esrs: [], ifrs: [], other: [] };
                panels.forEach(panel => {
                    if (panel.is_active !== false) {
                        const fw = (panel.primary_framework || '').toLowerCase();
                        if (frameworks[fw]) {
                            frameworks[fw].push(panel);
                        } else {
                            frameworks.other.push(panel);
                        }
                    }
                });

                // Add options grouped by framework
                for (const [fw, fwPanels] of Object.entries(frameworks)) {
                    if (fwPanels.length > 0) {
                        const optgroup = document.createElement('optgroup');
                        optgroup.label = fw.toUpperCase() || 'Other';
                        fwPanels.forEach(panel => {
                            const option = document.createElement('option');
                            option.value = panel.id;
                            option.textContent = panel.name;
                            optgroup.appendChild(option);
                        });
                        panelSelect.appendChild(optgroup);
                    }
                }
            }
        } catch (error) {
            console.error('Error loading panels for dropdown:', error);
            panelSelect.innerHTML = '<option value="">Error loading panels</option>';
        }
    }

    closeAddIndicatorModal() {
        const backdrop = document.getElementById('add-indicator-modal-backdrop');
        const modal = document.getElementById('add-indicator-modal');
        
        if (backdrop && modal) {
            backdrop.classList.remove('active');
            modal.classList.remove('active');
            this.resetAddIndicatorForm();
        }
    }

    resetAddIndicatorForm() {
        const form = document.getElementById('add-indicator-form');
        if (form) {
            form.reset();
            form.querySelectorAll('.form-input, .form-select, .form-textarea').forEach(field => {
                field.classList.remove('error');
            });
            form.querySelectorAll('.form-error').forEach(error => {
                error.textContent = '';
            });
        }
        
        // Also reset CSV input
        const csvInput = document.getElementById('csv-import-input');
        if (csvInput) csvInput.value = '';
        
        const csvStatus = document.getElementById('csv-import-status');
        if (csvStatus) {
            csvStatus.style.display = 'none';
            csvStatus.innerHTML = '';
        }
    }

    validateAddIndicatorForm() {
        const requiredFields = [
            { id: 'indicator-panel', label: 'Panel' },
            { id: 'indicator-title', label: 'Indicator Title' }
        ];

        let isValid = true;

        requiredFields.forEach(({ id, label }) => {
            const field = document.getElementById(id);
            if (!field || !field.value.trim()) {
                this.showFieldError(id, `${label} is required`);
                isValid = false;
            } else {
                this.clearFieldError(field);
            }
        });

        return isValid;
    }

    async saveIndicator() {
        if (!this.validateAddIndicatorForm()) {
            return;
        }

        const saveBtn = document.getElementById('save-indicator-btn');
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<span class="loading-spinner-sm" style="width: 16px; height: 16px; margin-right: var(--space-2);"></span> Saving...';
        }

        try {
            // Collect form values
            const indicatorData = {
                panel_id: document.getElementById('indicator-panel').value,
                name: document.getElementById('indicator-title').value.trim(),
                unit: document.getElementById('indicator-unit').value.trim() || null,
                formula_required: document.getElementById('indicator-formula-required').checked,
                code: document.getElementById('indicator-code').value.trim() || null,
                primary_framework: document.getElementById('indicator-framework').value || null,
                framework_version: document.getElementById('indicator-framework-version').value.trim() || null,
                description: document.getElementById('indicator-description').value.trim() || null,
                why_it_matters: document.getElementById('indicator-why-matters').value.trim() || null,
                impact_level: document.getElementById('indicator-impact').value || null,
                difficulty_level: document.getElementById('indicator-difficulty').value || null,
                estimated_time: document.getElementById('indicator-estimated-time').value.trim() || null,
                esg_class: document.getElementById('indicator-esg-class').value || null,
                validation_question: document.getElementById('indicator-validation-question').value.trim() || null,
                response_type: document.getElementById('indicator-response-type').value || null,
                tags: document.getElementById('indicator-tags').value.trim() || null,
                icon: document.getElementById('indicator-icon').value.trim() || null,
                is_active: true,
                order_index: 0
            };

            // Get selected SDGs
            const sdgsSelect = document.getElementById('indicator-sdgs');
            const relatedSdgs = Array.from(sdgsSelect.selectedOptions).map(opt => opt.value);
            indicatorData.related_sdgs = relatedSdgs.length > 0 ? relatedSdgs : null;

            // Save via admin service
            await window.adminService.createIndicator(indicatorData);

            window.showToast?.('Indicator created successfully!', 'success');
            
            this.closeAddIndicatorModal();

            if (this.currentTab === 'indicators') {
                await this.loadIndicators();
            }

        } catch (error) {
            console.error('Error creating indicator:', error);
            window.showToast?.('Failed to create indicator. Please try again.', 'error');
        } finally {
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = 'Save Indicator';
            }
        }
    }

    // =====================================================
    // CSV IMPORT FOR INDICATORS
    // =====================================================

    /**
     * Download CSV template for indicator import
     */
    downloadCsvTemplate() {
        const headers = [
            'name',
            'code',
            'description',
            'unit',
            'primary_framework',
            'framework_version',
            'esg_class',
            'impact_level',
            'difficulty_level',
            'estimated_time',
            'validation_question',
            'response_type',
            'why_it_matters',
            'related_sdgs',
            'tags',
            'formula_required'
        ];

        const sampleRow = [
            'Scope 1 GHG Emissions',
            'GRI 305-1',
            'Direct GHG emissions from owned or controlled sources',
            'tCO2e',
            'gri',
            '2021',
            'Environment',
            'High',
            'Moderate',
            '5-10 minutes',
            'What are your total Scope 1 emissions in tonnes CO2e?',
            'Short Text',
            'Critical for climate action and regulatory compliance',
            'SDG 13; SDG 7',
            'emissions; climate; carbon',
            'false'
        ];

        const csvContent = headers.join(',') + '\n' + sampleRow.map(v => `"${v}"`).join(',');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'indicator-import-template.csv';
        link.click();
        URL.revokeObjectURL(link.href);
        
        window.showToast?.('CSV template downloaded', 'success');
    }

    /**
     * Handle CSV file import
     */
    async handleCsvImport(event) {
        const file = event.target.files?.[0];
        if (!file) return;

        const statusDiv = document.getElementById('csv-import-status');
        const panelId = document.getElementById('indicator-panel')?.value;

        if (!panelId) {
            statusDiv.style.display = 'block';
            statusDiv.innerHTML = `
                <div style="padding: var(--space-3); background: var(--warning-light); border-radius: var(--radius-md); color: var(--warning-dark);">
                    <strong>⚠️ Please select a panel first</strong>
                    <p style="margin-top: var(--space-1); font-size: var(--text-sm);">You must choose a panel before importing indicators.</p>
                </div>
            `;
            event.target.value = '';
            return;
        }

        statusDiv.style.display = 'block';
        statusDiv.innerHTML = `
            <div style="padding: var(--space-3); background: var(--primary-light); border-radius: var(--radius-md);">
                <span class="loading-spinner-sm" style="width: 14px; height: 14px; margin-right: var(--space-2);"></span>
                Processing CSV file...
            </div>
        `;

        try {
            const text = await file.text();
            const indicators = this.parseCsv(text);

            if (indicators.length === 0) {
                throw new Error('No valid indicators found in CSV');
            }

            // Import indicators
            let successCount = 0;
            let errorCount = 0;
            const errors = [];

            for (const indicator of indicators) {
                try {
                    await window.adminService.createIndicator({
                        ...indicator,
                        panel_id: panelId,
                        is_active: true,
                        order_index: 0
                    });
                    successCount++;
                } catch (err) {
                    errorCount++;
                    errors.push(`${indicator.name || 'Unknown'}: ${err.message}`);
                }
            }

            // Show results
            if (successCount > 0 && errorCount === 0) {
                statusDiv.innerHTML = `
                    <div style="padding: var(--space-3); background: var(--success-light); border-radius: var(--radius-md); color: var(--success-dark);">
                        <strong>✅ Import Successful!</strong>
                        <p style="margin-top: var(--space-1); font-size: var(--text-sm);">${successCount} indicator(s) imported successfully.</p>
                    </div>
                `;
                window.showToast?.(`${successCount} indicators imported successfully!`, 'success');
                
                // Refresh indicators list after import
                if (this.currentTab === 'indicators') {
                    await this.loadIndicators();
                }
            } else if (successCount > 0 && errorCount > 0) {
                statusDiv.innerHTML = `
                    <div style="padding: var(--space-3); background: var(--warning-light); border-radius: var(--radius-md); color: var(--warning-dark);">
                        <strong>⚠️ Partial Import</strong>
                        <p style="margin-top: var(--space-1); font-size: var(--text-sm);">${successCount} imported, ${errorCount} failed.</p>
                        <details style="margin-top: var(--space-2);">
                            <summary style="cursor: pointer;">Show errors</summary>
                            <ul style="margin-top: var(--space-2); font-size: var(--text-xs);">
                                ${errors.slice(0, 5).map(e => `<li>${e}</li>`).join('')}
                                ${errors.length > 5 ? `<li>... and ${errors.length - 5} more</li>` : ''}
                            </ul>
                        </details>
                    </div>
                `;
            } else {
                throw new Error(`All ${errorCount} indicators failed to import`);
            }

        } catch (error) {
            console.error('CSV import error:', error);
            statusDiv.innerHTML = `
                <div style="padding: var(--space-3); background: var(--error-light); border-radius: var(--radius-md); color: var(--error-dark);">
                    <strong>❌ Import Failed</strong>
                    <p style="margin-top: var(--space-1); font-size: var(--text-sm);">${error.message}</p>
                </div>
            `;
        }

        event.target.value = '';
    }

    /**
     * Parse CSV content to indicator objects
     */
    parseCsv(csvText) {
        const lines = csvText.split('\n').map(line => line.trim()).filter(line => line);
        if (lines.length < 2) return [];

        // Parse headers
        const headers = this.parseCsvLine(lines[0]).map(h => h.toLowerCase().trim());
        
        // Map headers to indicator fields
        const headerMap = {
            'name': 'name',
            'title': 'name',
            'indicator_title': 'name',
            'code': 'code',
            'indicator_code': 'code',
            'description': 'description',
            'unit': 'unit',
            'primary_framework': 'primary_framework',
            'framework': 'primary_framework',
            'framework_version': 'framework_version',
            'version': 'framework_version',
            'esg_class': 'esg_class',
            'esg': 'esg_class',
            'impact_level': 'impact_level',
            'impact': 'impact_level',
            'difficulty_level': 'difficulty_level',
            'difficulty': 'difficulty_level',
            'estimated_time': 'estimated_time',
            'time': 'estimated_time',
            'validation_question': 'validation_question',
            'question': 'validation_question',
            'response_type': 'response_type',
            'why_it_matters': 'why_it_matters',
            'why_matters': 'why_it_matters',
            'related_sdgs': 'related_sdgs',
            'sdgs': 'related_sdgs',
            'tags': 'tags',
            'formula_required': 'formula_required',
            'icon': 'icon'
        };

        const indicators = [];

        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCsvLine(lines[i]);
            if (values.length === 0 || values.every(v => !v)) continue;

            const indicator = {};
            
            headers.forEach((header, index) => {
                const field = headerMap[header];
                if (field && values[index] !== undefined) {
                    let value = values[index].trim();
                    
                    // Handle special fields
                    if (field === 'related_sdgs' && value) {
                        indicator[field] = value.split(';').map(s => s.trim()).filter(s => s);
                    } else if (field === 'formula_required') {
                        indicator[field] = value.toLowerCase() === 'true' || value === '1';
                    } else if (value) {
                        indicator[field] = value;
                    }
                }
            });

            // Only add if has at least a name
            if (indicator.name) {
                indicators.push(indicator);
            }
        }

        return indicators;
    }

    /**
     * Parse a single CSV line handling quoted values
     */
    parseCsvLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current);
        return result;
    }

    // =====================================================
    // EDIT INDICATOR MODAL
    // =====================================================

    async editIndicator(indicatorId) {
        const backdrop = document.getElementById('edit-indicator-modal-backdrop');
        const modal = document.getElementById('edit-indicator-modal');
        
        if (!backdrop || !modal) return;

        backdrop.classList.add('active');
        modal.classList.add('active');

        try {
            // Fetch indicator data
            const indicators = await window.adminService.getAllIndicators();
            const indicator = indicators.find(i => i.id === indicatorId);

            if (!indicator) {
                window.showToast?.('Indicator not found.', 'error');
                this.closeEditIndicatorModal();
                return;
            }

            this.currentEditingIndicator = indicator;

            // Populate form fields
            document.getElementById('edit-indicator-id').value = indicator.id;
            document.getElementById('edit-indicator-title').value = indicator.name || '';
            document.getElementById('edit-indicator-unit').value = indicator.unit || '';
            document.getElementById('edit-indicator-formula-required').checked = indicator.formula_required || false;
            document.getElementById('edit-indicator-code').value = indicator.code || '';
            document.getElementById('edit-indicator-framework').value = indicator.primary_framework || '';
            document.getElementById('edit-indicator-framework-version').value = indicator.framework_version || '';
            document.getElementById('edit-indicator-description').value = indicator.description || '';
            document.getElementById('edit-indicator-why-matters').value = indicator.why_it_matters || '';
            document.getElementById('edit-indicator-impact').value = indicator.impact_level || '';
            document.getElementById('edit-indicator-difficulty').value = indicator.difficulty_level || '';
            document.getElementById('edit-indicator-estimated-time').value = indicator.estimated_time || '';
            document.getElementById('edit-indicator-esg-class').value = indicator.esg_class || '';
            document.getElementById('edit-indicator-validation-question').value = indicator.validation_question || '';
            document.getElementById('edit-indicator-response-type').value = indicator.response_type || '';
            document.getElementById('edit-indicator-tags').value = indicator.tags || '';
            document.getElementById('edit-indicator-icon').value = indicator.icon || '';

            // Set selected SDGs
            const sdgsSelect = document.getElementById('edit-indicator-sdgs');
            const relatedSdgs = indicator.related_sdgs || [];
            Array.from(sdgsSelect.options).forEach(option => {
                option.selected = relatedSdgs.includes(option.value);
            });

            // Update visibility toggle button
            this.updateIndicatorVisibilityButtonState(indicator.is_active !== false);

            setTimeout(() => document.getElementById('edit-indicator-title').focus(), 100);

        } catch (error) {
            console.error('Error loading indicator:', error);
            window.showToast?.('Failed to load indicator data.', 'error');
            this.closeEditIndicatorModal();
        }
    }

    closeEditIndicatorModal() {
        const backdrop = document.getElementById('edit-indicator-modal-backdrop');
        const modal = document.getElementById('edit-indicator-modal');
        
        if (backdrop && modal) {
            backdrop.classList.remove('active');
            modal.classList.remove('active');
            this.resetEditIndicatorForm();
            this.currentEditingIndicator = null;
        }
    }

    resetEditIndicatorForm() {
        const form = document.getElementById('edit-indicator-form');
        if (form) {
            form.reset();
            form.querySelectorAll('.form-input, .form-select, .form-textarea').forEach(field => {
                field.classList.remove('error');
            });
            form.querySelectorAll('.form-error').forEach(error => {
                error.textContent = '';
            });
        }
    }

    validateEditIndicatorForm() {
        const requiredFields = [
            { id: 'edit-indicator-title', label: 'Indicator Title' }
        ];

        let isValid = true;

        requiredFields.forEach(({ id, label }) => {
            const field = document.getElementById(id);
            if (!field || !field.value.trim()) {
                this.showFieldError(id, `${label} is required`);
                isValid = false;
            } else {
                this.clearFieldError(field);
            }
        });

        return isValid;
    }

    async updateIndicator() {
        if (!this.validateEditIndicatorForm()) {
            return;
        }

        const updateBtn = document.getElementById('update-indicator-btn');
        if (updateBtn) {
            updateBtn.disabled = true;
            updateBtn.innerHTML = '<span class="loading-spinner-sm" style="width: 16px; height: 16px; margin-right: var(--space-2);"></span> Updating...';
        }

        try {
            const indicatorId = document.getElementById('edit-indicator-id').value;

            const updates = {
                name: document.getElementById('edit-indicator-title').value.trim(),
                unit: document.getElementById('edit-indicator-unit').value.trim() || null,
                formula_required: document.getElementById('edit-indicator-formula-required').checked,
                code: document.getElementById('edit-indicator-code').value.trim() || null,
                primary_framework: document.getElementById('edit-indicator-framework').value || null,
                framework_version: document.getElementById('edit-indicator-framework-version').value.trim() || null,
                description: document.getElementById('edit-indicator-description').value.trim() || null,
                why_it_matters: document.getElementById('edit-indicator-why-matters').value.trim() || null,
                impact_level: document.getElementById('edit-indicator-impact').value || null,
                difficulty_level: document.getElementById('edit-indicator-difficulty').value || null,
                estimated_time: document.getElementById('edit-indicator-estimated-time').value.trim() || null,
                esg_class: document.getElementById('edit-indicator-esg-class').value || null,
                validation_question: document.getElementById('edit-indicator-validation-question').value.trim() || null,
                response_type: document.getElementById('edit-indicator-response-type').value || null,
                tags: document.getElementById('edit-indicator-tags').value.trim() || null,
                icon: document.getElementById('edit-indicator-icon').value.trim() || null
            };

            // Get selected SDGs
            const sdgsSelect = document.getElementById('edit-indicator-sdgs');
            const relatedSdgs = Array.from(sdgsSelect.selectedOptions).map(opt => opt.value);
            updates.related_sdgs = relatedSdgs.length > 0 ? relatedSdgs : null;

            await window.adminService.updateIndicator(indicatorId, updates);

            window.showToast?.('Indicator updated successfully!', 'success');
            
            this.closeEditIndicatorModal();

            if (this.currentTab === 'indicators') {
                await this.loadIndicators();
            }

        } catch (error) {
            console.error('Error updating indicator:', error);
            window.showToast?.('Failed to update indicator. Please try again.', 'error');
        } finally {
            if (updateBtn) {
                updateBtn.disabled = false;
                updateBtn.innerHTML = 'Update Indicator';
            }
        }
    }

    // =====================================================
    // INDICATOR VISIBILITY TOGGLE
    // =====================================================

    updateIndicatorVisibilityButtonState(isActive) {
        const btn = document.getElementById('toggle-indicator-visibility-btn');
        const btnText = document.getElementById('indicator-visibility-btn-text');
        const icon = document.getElementById('indicator-visibility-icon');

        if (btn && btnText && icon) {
            if (isActive) {
                btnText.textContent = 'Hide';
                btn.style.background = 'var(--gray-100)';
                btn.style.color = 'var(--gray-700)';
                icon.innerHTML = `
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                `;
            } else {
                btnText.textContent = 'Show';
                btn.style.background = 'var(--success-bg)';
                btn.style.color = 'var(--success)';
                icon.innerHTML = `
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                `;
            }
        }
    }

    async toggleIndicatorVisibility() {
        if (!this.currentEditingIndicator) return;

        const btn = document.getElementById('toggle-indicator-visibility-btn');
        const btnText = document.getElementById('indicator-visibility-btn-text');
        const currentState = this.currentEditingIndicator.is_active !== false;
        const newState = !currentState;

        if (btn) {
            btn.disabled = true;
            btnText.textContent = newState ? 'Showing...' : 'Hiding...';
        }

        try {
            await window.adminService.updateIndicator(this.currentEditingIndicator.id, { is_active: newState });

            this.currentEditingIndicator.is_active = newState;
            this.updateIndicatorVisibilityButtonState(newState);

            window.showToast?.(
                newState ? 'Indicator is now visible!' : 'Indicator is now hidden.',
                'success'
            );

            if (this.currentTab === 'indicators') {
                await this.loadIndicators();
            }

        } catch (error) {
            console.error('Error toggling indicator visibility:', error);
            window.showToast?.('Failed to update indicator visibility.', 'error');
        } finally {
            if (btn) {
                btn.disabled = false;
                this.updateIndicatorVisibilityButtonState(this.currentEditingIndicator.is_active);
            }
        }
    }

    // =====================================================
    // DELETE INDICATOR CONFIRMATION
    // =====================================================

    deleteCurrentIndicator() {
        if (!this.currentEditingIndicator) return;
        this.openDeleteIndicatorConfirmModal();
    }

    openDeleteIndicatorConfirmModal() {
        const backdrop = document.getElementById('delete-indicator-confirm-modal-backdrop');
        const modal = document.getElementById('delete-indicator-confirm-modal');
        const nameEl = document.getElementById('delete-indicator-name');
        const confirmInput = document.getElementById('delete-indicator-confirm-input');
        const confirmBtn = document.getElementById('delete-indicator-confirm-btn');
        const errorEl = document.getElementById('delete-indicator-confirm-error');

        if (backdrop && modal && this.currentEditingIndicator) {
            nameEl.textContent = this.currentEditingIndicator.name;
            confirmInput.value = '';
            confirmBtn.disabled = true;
            errorEl.textContent = '';

            backdrop.classList.add('active');
            modal.classList.add('active');

            setTimeout(() => confirmInput.focus(), 100);
        }
    }

    closeDeleteIndicatorConfirmModal() {
        const backdrop = document.getElementById('delete-indicator-confirm-modal-backdrop');
        const modal = document.getElementById('delete-indicator-confirm-modal');
        const confirmInput = document.getElementById('delete-indicator-confirm-input');

        if (backdrop && modal) {
            backdrop.classList.remove('active');
            modal.classList.remove('active');
            confirmInput.value = '';
        }
    }

    async confirmDeleteIndicator() {
        const confirmInput = document.getElementById('delete-indicator-confirm-input');
        const confirmBtn = document.getElementById('delete-indicator-confirm-btn');
        const errorEl = document.getElementById('delete-indicator-confirm-error');

        if (confirmInput.value.toUpperCase() !== 'DELETE') {
            errorEl.textContent = 'Please type DELETE to confirm';
            return;
        }

        if (!this.currentEditingIndicator) return;

        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<span class="loading-spinner-sm" style="width: 16px; height: 16px; margin-right: var(--space-2);"></span> Deleting...';

        try {
            await window.adminService.permanentlyDeleteIndicator(this.currentEditingIndicator.id);

            window.showToast?.('Indicator permanently deleted!', 'success');
            
            this.closeDeleteIndicatorConfirmModal();
            this.closeEditIndicatorModal();

            if (this.currentTab === 'indicators') {
                await this.loadIndicators();
            }

        } catch (error) {
            console.error('Error deleting indicator:', error);
            window.showToast?.('Failed to delete indicator. Please try again.', 'error');
            errorEl.textContent = 'Failed to delete. Please try again.';
        } finally {
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                Delete Indicator
            `;
        }
    }

    renderStars(rating) {
        return Array.from({ length: 5 }, (_, i) => 
            `<span style="color: ${i < rating ? 'var(--accent-400)' : 'var(--gray-300)'}; font-size: var(--text-lg);">★</span>`
        ).join('');
    }

    formatLabel(mapKey, value) {
        if (!value) return '—';
        const map = this.labelMaps[mapKey] || {};
        return map[value] || value;
    }

    formatSdgs(sdgs) {
        if (!sdgs || sdgs.length === 0) return '—';
        const sorted = [...sdgs].sort((a, b) => a - b);
        return sorted.map(n => `SDG ${n}`).join(', ');
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

    showError(message) {
        _showErrorState('loading-state', message, () => location.reload());
    }
}

// Initialize on DOM ready
let adminPage;
document.addEventListener('DOMContentLoaded', () => {
    adminPage = new AdminReviewPage();
    adminPage.init();
});

