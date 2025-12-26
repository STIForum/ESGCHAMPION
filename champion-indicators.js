/**
 * Champion Indicators JavaScript
 * ESG Champions Platform
 */

class ChampionIndicators {
    constructor() {
        this.indicators = [];
        this.selectedIndicatorIds = [];
        this.selectedIndicator = null;
        this.rating = 0;
        this.clarityRating = 0;
        this.currentPanelId = null;
        this.currentPanelName = null;
        this.reviewsData = {}; // Store reviews for each indicator
        this.currentIndicatorIndex = 0;
    }

    async init() {
        // Wait for services to be ready
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Get selected indicator IDs from URL
        const params = new URLSearchParams(window.location.search);
        const selectedParam = params.get('selected');
        
        // Get panel ID from URL or sessionStorage
        const panelParam = params.get('panel');
        
        if (selectedParam) {
            this.selectedIndicatorIds = selectedParam.split(',').filter(id => id.trim());
        }
        
        // Get panel context from sessionStorage
        const stored = sessionStorage.getItem('selectedIndicators');
        if (stored) {
            try {
                const data = JSON.parse(stored);
                if (!this.selectedIndicatorIds.length) {
                    this.selectedIndicatorIds = data.indicatorIds || [];
                }
                // Set the panel ID and name from stored data
                this.currentPanelId = data.panelId || panelParam || null;
                this.currentPanelName = data.panelName || 'Panel Review';
            } catch (e) {
                console.error('Error parsing stored indicators:', e);
            }
        } else if (panelParam) {
            this.currentPanelId = panelParam;
        }

        if (this.selectedIndicatorIds.length === 0) {
            // No indicators selected, redirect to panels
            window.location.href = '/champion-panels.html';
            return;
        }

        // Load selected indicators
        await this.loadIndicators();
    }

    async loadIndicators() {
        try {
            // Fetch only the selected indicators
            this.indicators = await window.championDB.getIndicatorsByIds(this.selectedIndicatorIds);
            
            if (this.indicators.length === 0) {
                this.showError('No indicators found. Please go back and select indicators.');
                return;
            }
            
            // Update UI
            this.renderHeader();
            this.renderIndicatorsList();
            
            // Show content
            document.getElementById('loading-state').classList.add('hidden');
            document.getElementById('indicators-content').classList.remove('hidden');
            
            // Select first indicator by default
            if (this.indicators.length > 0) {
                this.selectIndicator(this.indicators[0].id);
            }
            
        } catch (error) {
            console.error('Error loading indicators:', error);
            this.showError('Failed to load indicators. Please try again.');
        }
    }

    renderHeader() {
        const countEl = document.getElementById('indicator-count');
        if (countEl) {
            countEl.textContent = this.indicators.length;
        }
        
        // Update breadcrumb
        const breadcrumb = document.getElementById('breadcrumb-panel');
        if (breadcrumb) {
            breadcrumb.textContent = this.currentPanelName || 'Panel Review';
        }
        
        // Update panel name to show panel being reviewed
        const panelName = document.getElementById('panel-name');
        if (panelName) {
            panelName.textContent = this.currentPanelName || `Reviewing ${this.indicators.length} Indicator${this.indicators.length > 1 ? 's' : ''}`;
        }
        
        const panelDesc = document.getElementById('panel-description');
        if (panelDesc) {
            panelDesc.textContent = `Review ${this.indicators.length} indicator${this.indicators.length > 1 ? 's' : ''} in this panel. Complete all reviews and submit.`;
        }

        const categoryBadge = document.getElementById('panel-category-badge');
        if (categoryBadge) {
            categoryBadge.textContent = 'Panel Review';
            categoryBadge.className = 'badge badge-primary';
        }
    }

    renderIndicatorsList() {
        const container = document.getElementById('indicators-list');
        
        if (this.indicators.length === 0) {
            container.innerHTML = '<p class="text-secondary">No indicators selected.</p>';
            return;
        }

        container.innerHTML = this.indicators.map((indicator, index) => {
            const hasReview = this.reviewsData[indicator.id] && this.reviewsData[indicator.id].completed;
            const statusBadge = hasReview 
                ? '<span class="badge badge-success" style="font-size: 10px;">✓ Completed</span>'
                : '<span class="badge badge-warning" style="font-size: 10px;">Pending</span>';
            
            return `
            <div class="indicator-card ${hasReview ? 'reviewed' : ''}" data-id="${indicator.id}" onclick="indicatorsPage.selectIndicator('${indicator.id}')">
                <div class="flex-between mb-2">
                    <span class="badge badge-primary">#${index + 1}</span>
                    ${statusBadge}
                </div>
                <h4 style="font-size: var(--text-base); margin-bottom: var(--space-1);">${indicator.name}</h4>
                <p class="text-secondary" style="font-size: var(--text-sm); margin: 0;">
                    ${this.truncate(indicator.description, 80)}
                </p>
            </div>
        `}).join('');
        
        // Update the progress counter and submit button
        this.updateProgress();
    }

    updateProgress() {
        const completedCount = Object.values(this.reviewsData).filter(r => r.completed).length;
        const totalCount = this.indicators.length;
        const allCompleted = completedCount === totalCount && totalCount > 0;
        
        // Update progress counter
        const progressCounter = document.getElementById('progress-counter');
        if (progressCounter) {
            progressCounter.textContent = `${completedCount}/${totalCount} completed`;
        }
        
        // Update progress bar
        const progressBar = document.getElementById('progress-bar');
        if (progressBar) {
            const percentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
            progressBar.style.width = `${percentage}%`;
            progressBar.style.background = allCompleted ? 'var(--success)' : 'var(--primary-500)';
        }
        
        // Update submit button
        const submitBtn = document.getElementById('submit-panel-review-btn');
        const helperText = document.getElementById('submit-helper-text');
        
        if (submitBtn) {
            submitBtn.disabled = !allCompleted;
            if (allCompleted) {
                submitBtn.textContent = 'Submit Panel Review';
                submitBtn.classList.add('pulse-animation');
            } else {
                submitBtn.textContent = `Submit Panel Review (${completedCount}/${totalCount})`;
                submitBtn.classList.remove('pulse-animation');
            }
        }
        
        if (helperText) {
            if (allCompleted) {
                helperText.textContent = 'All indicators completed! Ready to submit.';
                helperText.style.color = 'var(--success-500)';
            } else {
                helperText.textContent = `Complete ${totalCount - completedCount} more indicator${totalCount - completedCount !== 1 ? 's' : ''} to submit`;
                helperText.style.color = '';
            }
        }
    }

    async selectIndicator(indicatorId) {
        // Update active state
        document.querySelectorAll('.indicator-card').forEach(card => {
            card.classList.toggle('active', card.dataset.id === indicatorId);
        });

        const indicator = this.indicators.find(i => i.id === indicatorId);
        if (!indicator) return;

        this.selectedIndicator = indicator;
        this.rating = 0;

        // Update URL
        const url = new URL(window.location);
        url.searchParams.set('indicator', indicatorId);
        window.history.replaceState({}, '', url);

        // Render detail view
        await this.renderIndicatorDetail(indicator);

        // Log activity
        if (window.championAuth?.isAuthenticated()) {
            window.championDB.logActivity('view_indicator', indicator.panel_id, indicatorId);
        }
    }

    async renderIndicatorDetail(indicator) {
        const container = document.getElementById('indicator-detail');
        const isAuthenticated = window.championAuth?.isAuthenticated() || false;
        
        // Check if this indicator has a local review saved (not yet submitted)
        const savedReview = this.reviewsData[indicator.id];
        const hasLocalReview = savedReview && savedReview.completed;

        // Get reviews for this indicator
        let reviews = [];
        try {
            const data = await window.championDB.getIndicatorWithReviews(indicator.id);
            reviews = data.reviews || [];
        } catch (error) {
            console.error('Error loading reviews:', error);
        }

        // Default values for metadata
        const frameworkMapping = indicator.gri_standard || indicator.framework_mapping || 'GRI 305-1 / ISSB S2';
        const source = indicator.source || 'SME Hub';
        const sectorContext = indicator.sector_context || 'All';

        container.innerHTML = `
            <div class="indicator-header">
                <h2 style="margin-bottom: var(--space-2); color: var(--gray-800);">${indicator.name}</h2>
                <p class="text-secondary">${indicator.description || 'No description available'}</p>
            </div>
            <div class="indicator-body">
                <!-- Metadata Section -->
                <div class="indicator-metadata-card">
                    <div class="metadata-grid">
                        <div class="metadata-item">
                            <div class="metadata-label">Framework Mapping</div>
                            <div class="metadata-value">${frameworkMapping}</div>
                        </div>
                        <div class="metadata-item">
                            <div class="metadata-label">Source</div>
                            <div class="metadata-value">${source}</div>
                        </div>
                    </div>
                    <div class="metadata-item" style="margin-top: var(--space-3);">
                        <div class="metadata-label">Sector Context</div>
                        <div class="metadata-value">${sectorContext}</div>
                    </div>
                </div>

                ${isAuthenticated && !this.hasUserReviewed(indicator.id) && !hasLocalReview ? `
                    <!-- Assessment Questions -->
                    <div class="assessment-section">
                        <div class="form-group">
                            <label class="form-label" style="color: var(--gray-700); font-weight: 500;">Is this indicator necessary?</label>
                            <div class="radio-group">
                                <label class="radio-option">
                                    <input type="radio" name="is_necessary" value="yes">
                                    <span>Yes</span>
                                </label>
                                <label class="radio-option">
                                    <input type="radio" name="is_necessary" value="no">
                                    <span>No</span>
                                </label>
                                <label class="radio-option">
                                    <input type="radio" name="is_necessary" value="not_sure">
                                    <span>Not sure</span>
                                </label>
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label" style="color: var(--gray-700); font-weight: 500;">Rate the clarity and relevance</label>
                            <div class="clarity-rating" id="clarity-rating">
                                ${[1, 2, 3, 4, 5].map(n => `
                                    <button type="button" class="clarity-star" data-value="${n}" onclick="indicatorsPage.setClarityRating(${n})">
                                        <span class="star-icon">☆</span>
                                    </button>
                                `).join('')}
                            </div>
                        </div>

                    </div>

                    <div class="review-form">
                        <form id="review-form" onsubmit="indicatorsPage.saveIndicatorReview(event)">
                            <div class="form-group">
                                <label class="form-label" for="review-content">Comment</label>
                                <textarea 
                                    id="review-content" 
                                    class="form-textarea" 
                                    placeholder="Share your expert analysis of this indicator. Consider its relevance, methodology, data quality, and practical application..."
                                    rows="5"
                                    required
                                ></textarea>
                            </div>
                            <button type="submit" class="btn btn-primary" id="save-review-btn">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: var(--space-2); vertical-align: middle;">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                                Save & Continue
                            </button>
                        </form>
                    </div>
                ` : isAuthenticated && hasLocalReview ? `
                    <!-- Review Saved State (not yet submitted) -->
                    <div class="review-saved-card">
                        <div class="review-saved-icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                        </div>
                        <h4 class="review-saved-title">Review Saved</h4>
                        <p class="review-saved-text">Your review for this indicator has been saved. Complete reviewing other indicators and click "Submit All Reviews" to submit.</p>
                        <div class="review-saved-summary">
                            <div><strong>Your Rating:</strong> ${'★'.repeat(savedReview.rating)}${'☆'.repeat(5 - savedReview.rating)}</div>
                            <div style="margin-top: var(--space-2);"><strong>Your Comment:</strong> ${this.truncate(savedReview.content, 100)}</div>
                        </div>
                        <button class="btn btn-ghost btn-sm" style="margin-top: var(--space-3);" onclick="indicatorsPage.editReview('${indicator.id}')">Edit Review</button>
                    </div>
                ` : isAuthenticated && this.hasUserReviewed(indicator.id) ? `
                    <!-- Review Submitted State -->
                    <div class="review-submitted-card">
                        <div class="review-submitted-icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                        </div>
                        <h4 class="review-submitted-title">Review Awaiting Approval</h4>
                        <p class="review-submitted-text">Thank you for your review! Your submission is being reviewed by our team and will be published once approved.</p>
                        <div class="review-submitted-badge">
                            <span class="badge badge-warning">Pending Review</span>
                        </div>
                    </div>
                ` : `
                    <div class="alert alert-info">
                        <a href="/champion-login.html?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}">Sign in</a> to submit a review for this indicator.
                    </div>
                `}

                <!-- Existing Reviews -->
                <div class="mt-8">
                    <h4 style="margin-bottom: var(--space-4);">Community Reviews (${reviews.length})</h4>
                    ${reviews.length > 0 ? `
                        <div id="reviews-list">
                            ${reviews.map(review => this.renderReview(review)).join('')}
                        </div>
                    ` : `
                        <p class="text-secondary">No reviews yet. Be the first to share your expertise!</p>
                    `}
                </div>
            </div>
        `;
    }

    renderReview(review) {
        const champion = review.champions || {};
        const initials = this.getInitials(champion.full_name || 'Anonymous');
        
        return `
            <div class="review-item">
                <div class="flex" style="gap: var(--space-4);">
                    <div class="avatar" style="flex-shrink: 0;">
                        ${champion.avatar_url 
                            ? `<img src="${champion.avatar_url}" alt="${champion.full_name}">`
                            : initials
                        }
                    </div>
                    <div class="flex-1">
                        <div class="flex-between mb-2">
                            <div>
                                <strong>${champion.full_name || 'Anonymous'}</strong>
                                <span class="badge badge-${review.status === 'approved' ? 'success' : review.status === 'pending' ? 'warning' : 'error'}" style="margin-left: var(--space-2);">
                                    ${review.status}
                                </span>
                            </div>
                            <div class="text-muted" style="font-size: var(--text-sm);">
                                ${this.formatDate(review.created_at)}
                            </div>
                        </div>
                        <div class="mb-2">
                            ${this.renderStars(review.rating)}
                        </div>
                        <p style="margin-bottom: var(--space-3);">${review.content}</p>
                        <div class="flex" style="gap: var(--space-4); font-size: var(--text-sm);">
                            <button class="btn btn-ghost btn-sm" onclick="indicatorsPage.vote('${review.id}', 'upvote')">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                                </svg>
                                ${review.upvotes || 0}
                            </button>
                            <button class="btn btn-ghost btn-sm" onclick="indicatorsPage.vote('${review.id}', 'downvote')">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path>
                            </svg>
                                ${review.downvotes || 0}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderStars(rating) {
        return Array.from({ length: 5 }, (_, i) => `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="${i < rating ? 'var(--accent-400)' : 'none'}" stroke="${i < rating ? 'var(--accent-400)' : 'var(--gray-300)'}" stroke-width="2" style="display: inline-block;">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
        `).join('');
    }

    setRating(value) {
        this.rating = value;
        
        document.querySelectorAll('.rating-star').forEach((star, index) => {
            star.classList.toggle('active', index < value);
        });
    }

    setClarityRating(value) {
        this.clarityRating = value;
        
        document.querySelectorAll('.clarity-star').forEach((star, index) => {
            const starIcon = star.querySelector('.star-icon');
            if (index < value) {
                star.classList.add('active');
                starIcon.textContent = '★';
            } else {
                star.classList.remove('active');
                starIcon.textContent = '☆';
            }
        });
    }

    async saveIndicatorReview(event) {
        event.preventDefault();
        
        if (!window.championAuth.isAuthenticated()) {
            window.showToast('Please sign in to submit a review', 'error');
            return;
        }

        const content = document.getElementById('review-content').value.trim();
        
        if (!content) {
            window.showToast('Please enter your review', 'error');
            return;
        }

        if (this.clarityRating === 0) {
            window.showToast('Please rate the clarity and relevance', 'error');
            return;
        }

        // Get additional form data
        const isNecessary = document.querySelector('input[name="is_necessary"]:checked')?.value || null;

        // Save review data locally (not submit yet)
        this.reviewsData[this.selectedIndicator.id] = {
            indicatorId: this.selectedIndicator.id,
            indicatorName: this.selectedIndicator.name,
            content: content,
            rating: this.clarityRating,
            clarityRating: this.clarityRating,
            isNecessary: isNecessary,
            analysis: content,
            completed: true
        };

        window.showToast('Review saved! Continue to the next indicator.', 'success');
        
        // Update the indicators list to show this one as reviewed
        this.renderIndicatorsList();
        
        // Move to next indicator if available
        const currentIndex = this.indicators.findIndex(i => i.id === this.selectedIndicator.id);
        const nextIndicator = this.indicators[currentIndex + 1];
        
        if (nextIndicator && !this.reviewsData[nextIndicator.id]?.completed) {
            // Auto-select next unreviewed indicator
            setTimeout(() => this.selectIndicator(nextIndicator.id), 500);
        } else {
            // Show the reviewed state for current indicator
            await this.renderIndicatorDetail(this.selectedIndicator);
            
            // Check if all are complete
            const allComplete = Object.values(this.reviewsData).filter(r => r.completed).length === this.indicators.length;
            if (allComplete) {
                window.showToast('All indicators reviewed! Click "Submit Panel Review" to submit.', 'success');
            }
        }
    }

    async submitPanelReview() {
        const reviewsToSubmit = Object.values(this.reviewsData).filter(r => r.completed);
        
        if (reviewsToSubmit.length === 0) {
            window.showToast('No reviews to submit', 'error');
            return;
        }

        if (reviewsToSubmit.length !== this.indicators.length) {
            window.showToast('Please complete all indicator reviews before submitting', 'error');
            return;
        }

        const btn = document.getElementById('submit-panel-review-btn');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="loading-spinner-sm"></span> Submitting...';
        }

        try {
            // Create panel review submission with all indicator reviews
            const indicatorReviews = reviewsToSubmit.map(review => ({
                indicatorId: review.indicatorId,
                isNecessary: review.isNecessary,
                clarityRating: review.clarityRating || review.rating,
                analysis: review.analysis || review.content
            }));

            await window.championDB.createPanelReviewSubmission(
                this.currentPanelId,
                indicatorReviews
            );

            // Mark indicators as reviewed in session
            for (const review of reviewsToSubmit) {
                this.markIndicatorAsReviewed(review.indicatorId);
            }

            // Clear local review data
            this.reviewsData = {};
            
            // Mark this panel as awaiting approval
            this.markPanelAsAwaitingApproval();
            
            // Show success state
            this.showPanelReviewSuccess(reviewsToSubmit.length);

        } catch (error) {
            console.error('Error submitting panel review:', error);
            window.showToast('Failed to submit panel review. Please try again.', 'error');
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Submit Panel Review';
            }
        }
    }

    showPanelReviewSuccess(count) {
        const container = document.getElementById('indicator-detail');
        const sidebar = document.querySelector('.indicators-sidebar');
        
        // Hide sidebar
        if (sidebar) {
            sidebar.style.display = 'none';
        }
        
        // Show success message
        container.innerHTML = `
            <div class="panel-review-success">
                <div class="success-icon">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="9 12 12 15 16 10"></polyline>
                    </svg>
                </div>
                <h2 class="success-title">Reviews Submitted Successfully!</h2>
                <p class="success-text">
                    You have submitted ${count} review${count !== 1 ? 's' : ''} for <strong>${this.currentPanelName || 'this panel'}</strong>.
                    <br><br>
                    Your reviews are now awaiting approval from the admin team.
                </p>
                <div class="success-badge">
                    <span class="badge badge-warning" style="font-size: 14px; padding: 8px 16px;">⏳ Awaiting Approval</span>
                </div>
                <div style="margin-top: var(--space-6);">
                    <a href="/champion-panels.html" class="btn btn-primary">Review Another Panel</a>
                    <a href="/champion-dashboard.html" class="btn btn-ghost" style="margin-left: var(--space-3);">Go to Dashboard</a>
                </div>
            </div>
        `;
        
        // Hide submit all container
        const submitAllContainer = document.getElementById('submit-all-container');
        if (submitAllContainer) {
            submitAllContainer.remove();
        }
    }

    editReview(indicatorId) {
        // Remove the saved review to allow editing
        delete this.reviewsData[indicatorId];
        this.renderIndicatorsList();
        this.selectIndicator(indicatorId);
    }

    markPanelAsAwaitingApproval() {
        if (!this.currentPanelId) return;
        
        // Store in sessionStorage
        const panelReviews = JSON.parse(sessionStorage.getItem('panelReviews') || '{}');
        panelReviews[this.currentPanelId] = 'pending';
        sessionStorage.setItem('panelReviews', JSON.stringify(panelReviews));
        
        // Also store the panel review submission for admin
        const panelSubmissions = JSON.parse(localStorage.getItem('panelSubmissions') || '[]');
        const submission = {
            id: `${this.currentPanelId}-${Date.now()}`,
            panelId: this.currentPanelId,
            panelName: this.currentPanelName,
            indicatorIds: this.selectedIndicatorIds,
            indicatorCount: this.indicators.length,
            submittedAt: new Date().toISOString(),
            status: 'pending',
            championId: window.championAuth?.getCurrentUser()?.id || null,
            championName: window.championAuth?.getCurrentUser()?.user_metadata?.full_name || 'Anonymous'
        };
        panelSubmissions.push(submission);
        localStorage.setItem('panelSubmissions', JSON.stringify(panelSubmissions));
    }

    markIndicatorAsReviewed(indicatorId) {
        // Store reviewed indicators with panel context in session
        // Key format: "panelId:indicatorId"
        const panelId = this.currentPanelId || 'default';
        const reviewKey = `${panelId}:${indicatorId}`;
        
        let reviewedIndicators = JSON.parse(sessionStorage.getItem('reviewedIndicators') || '[]');
        if (!reviewedIndicators.includes(reviewKey)) {
            reviewedIndicators.push(reviewKey);
            sessionStorage.setItem('reviewedIndicators', JSON.stringify(reviewedIndicators));
        }
    }

    hasUserReviewed(indicatorId) {
        // Check if user has reviewed this indicator for the current panel
        const panelId = this.currentPanelId || 'default';
        const reviewKey = `${panelId}:${indicatorId}`;
        
        const reviewedIndicators = JSON.parse(sessionStorage.getItem('reviewedIndicators') || '[]');
        return reviewedIndicators.includes(reviewKey);
    }

    async vote(reviewId, type) {
        if (!window.championAuth.isAuthenticated()) {
            window.showToast('Please sign in to vote', 'error');
            return;
        }

        try {
            if (type === 'upvote') {
                await window.championDB.upvote(reviewId);
            } else {
                await window.championDB.downvote(reviewId);
            }
            
            // Refresh reviews
            await this.selectIndicator(this.selectedIndicator.id);
            
        } catch (error) {
            console.error('Error voting:', error);
            window.showToast('Failed to vote. Please try again.', 'error');
        }
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
        const loadingState = document.getElementById('loading-state');
        loadingState.innerHTML = `
            <div class="text-center">
                <div class="alert alert-error">${message}</div>
                <a href="/champion-panels.html" class="btn btn-primary mt-4">Back to Panels</a>
            </div>
        `;
    }
}

// Initialize on DOM ready
let indicatorsPage;
document.addEventListener('DOMContentLoaded', () => {
    indicatorsPage = new ChampionIndicators();
    indicatorsPage.init();
});
