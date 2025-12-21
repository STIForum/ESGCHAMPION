/**
 * Champion Indicators JavaScript
 * ESG Champions Platform
 */

class ChampionIndicators {
    constructor() {
        this.panel = null;
        this.indicators = [];
        this.selectedIndicator = null;
        this.rating = 0;
        this.clarityRating = 0;
        this.selectedIndicatorIds = [];
    }

    async init() {
        // Wait for services to be ready
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Get URL parameters
        const params = new URLSearchParams(window.location.search);
        const panelId = params.get('panel');
        const selectedIds = params.get('selected');
        
        if (!panelId) {
            window.location.href = '/champion-panels.html';
            return;
        }

        // Parse selected indicator IDs from URL
        if (selectedIds) {
            this.selectedIndicatorIds = selectedIds.split(',').filter(id => id.trim());
        }

        // Also check sessionStorage for selected indicators
        const storedSelection = sessionStorage.getItem('selectedIndicators');
        if (storedSelection && this.selectedIndicatorIds.length === 0) {
            try {
                const data = JSON.parse(storedSelection);
                this.selectedIndicatorIds = data.indicatorIds || [];
            } catch (e) {
                console.log('Could not parse stored selection');
            }
        }

        // Check if specific indicator requested for detail view
        const indicatorId = params.get('indicator');
        
        // Load panel and ONLY selected indicators
        await this.loadPanelWithSelectedIndicators(panelId);
        
        // Select indicator if specified
        if (indicatorId) {
            this.selectIndicator(indicatorId);
        }
    }

    async loadPanelWithSelectedIndicators(panelId) {
        try {
            // Get panel info
            const panel = await window.supabaseService.getPanel(panelId);
            this.panel = panel;
            
            // Get only the selected indicators
            if (this.selectedIndicatorIds.length > 0) {
                this.indicators = await window.championDB.getIndicatorsByIds(this.selectedIndicatorIds);
            } else {
                // Fallback: get all indicators for this panel if no selection
                this.indicators = await window.championDB.getIndicatorsByPanel(panelId);
            }
            
            // Update UI
            this.renderPanelHeader();
            this.renderIndicatorsList();
            
            // Show content
            document.getElementById('loading-state').classList.add('hidden');
            document.getElementById('indicators-content').classList.remove('hidden');
            
            // Log activity
            if (window.championAuth && window.championAuth.isAuthenticated()) {
                window.championDB.logActivity('view_panel', panelId);
            }
            
        } catch (error) {
            console.error('Error loading panel:', error);
            this.showError('Failed to load indicators. Please try again.');
        }
    }

    renderPanelHeader() {
        const categoryBadge = document.getElementById('panel-category-badge');
        categoryBadge.textContent = this.panel.category;
        categoryBadge.className = `badge badge-${this.panel.category}`;
        
        document.getElementById('panel-name').textContent = this.panel.name;
        document.getElementById('panel-description').textContent = this.panel.description || '';
        document.getElementById('indicator-count').textContent = this.indicators.length;
        document.getElementById('breadcrumb-panel').textContent = this.panel.name;
    }

    renderIndicatorsList() {
        const container = document.getElementById('indicators-list');
        
        if (this.indicators.length === 0) {
            container.innerHTML = '<p class="text-secondary">No indicators available for this panel yet.</p>';
            return;
        }

        container.innerHTML = this.indicators.map((indicator, index) => `
            <div class="indicator-card" data-id="${indicator.id}" onclick="indicatorsPage.selectIndicator('${indicator.id}')">
                <div class="flex-between mb-2">
                    <span class="badge badge-primary">#${index + 1}</span>
                </div>
                <h4 style="font-size: var(--text-base); margin-bottom: var(--space-1);">${indicator.name}</h4>
                <p class="text-secondary" style="font-size: var(--text-sm); margin: 0;">
                    ${this.truncate(indicator.description, 80)}
                </p>
            </div>
        `).join('');
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
        this.clarityRating = 0;

        // Update URL
        const url = new URL(window.location);
        url.searchParams.set('indicator', indicatorId);
        window.history.replaceState({}, '', url);

        // Render detail view
        await this.renderIndicatorDetail(indicator);

        // Log activity
        if (window.championAuth.isAuthenticated()) {
            window.championDB.logActivity('view_indicator', this.panel.id, indicatorId);
        }
    }

    async renderIndicatorDetail(indicator) {
        const container = document.getElementById('indicator-detail');
        const isAuthenticated = window.championAuth?.isAuthenticated() || false;

        // Get reviews for this indicator
        let reviews = [];
        try {
            const data = await window.championDB.getIndicatorWithReviews(indicator.id);
            reviews = data.reviews || [];
        } catch (error) {
            console.error('Error loading reviews:', error);
        }

        // Get framework mapping (use gri_standard or data_source)
        const frameworkMapping = indicator.gri_standard || indicator.framework_mapping || 'GRI Standard';
        const source = indicator.source || 'ESG Database';
        const sectorContext = indicator.sector_context || 'All';

        container.innerHTML = `
            <div class="indicator-detail-card">
                <div class="indicator-detail-header">
                    <h2 class="indicator-detail-title">${indicator.name}</h2>
                    <p class="indicator-detail-desc">${indicator.description || 'No description available'}</p>
                </div>
                
                <!-- Framework & Source Info -->
                <div class="indicator-meta-section">
                    <div class="meta-grid">
                        <div class="meta-item">
                            <span class="meta-label">Framework Mapping</span>
                            <span class="meta-value">${frameworkMapping}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">Source</span>
                            <span class="meta-value">${source}</span>
                        </div>
                    </div>
                    <div class="meta-item full-width">
                        <span class="meta-label">Sector Context</span>
                        <span class="meta-value">${sectorContext}</span>
                    </div>
                </div>

                ${isAuthenticated ? `
                    <!-- Assessment Questions -->
                    <div class="assessment-section">
                        <div class="form-group">
                            <label class="form-label">Is this indicator necessary?</label>
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
                            <label class="form-label">Rate the clarity and relevance</label>
                            <div class="clarity-rating" id="clarity-rating">
                                ${[1, 2, 3, 4, 5].map(n => `
                                    <button type="button" class="clarity-star" data-value="${n}" onclick="indicatorsPage.setClarityRating(${n})">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
                                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                        </svg>
                                    </button>
                                `).join('')}
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label" for="comments-input">Comments</label>
                            <textarea 
                                id="comments-input" 
                                class="form-textarea" 
                                placeholder="Enter comments or references...."
                                rows="4"
                            ></textarea>
                        </div>
                    </div>
                ` : ''}

                ${indicator.methodology ? `
                    <div class="methodology-section">
                        <h4 class="section-title">Methodology</h4>
                        <p class="methodology-text">${indicator.methodology}</p>
                        
                        <div class="methodology-grid">
                            ${indicator.data_source ? `
                                <div class="methodology-item">
                                    <span class="methodology-label">DATA SOURCE</span>
                                    <span class="methodology-value">${indicator.data_source}</span>
                                </div>
                            ` : ''}
                            ${indicator.unit ? `
                                <div class="methodology-item">
                                    <span class="methodology-label">UNIT</span>
                                    <span class="methodology-value">${indicator.unit}</span>
                                </div>
                            ` : ''}
                            ${indicator.frequency ? `
                                <div class="methodology-item">
                                    <span class="methodology-label">FREQUENCY</span>
                                    <span class="methodology-value">${indicator.frequency}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                ` : ''}

                ${isAuthenticated ? `
                    <div class="review-form">
                        <h4 class="section-title">Submit Your Review</h4>
                        <form id="review-form" onsubmit="indicatorsPage.submitReview(event)">
                            <div class="form-group">
                                <label class="form-label">Your Rating</label>
                                <div class="rating-input" id="rating-input">
                                    ${[1, 2, 3, 4, 5].map(n => `
                                        <button type="button" class="rating-star" data-value="${n}" onclick="indicatorsPage.setRating(${n})">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
                                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                            </svg>
                                        </button>
                                    `).join('')}
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label" for="review-content">Your Analysis</label>
                                <textarea 
                                    id="review-content" 
                                    class="form-textarea" 
                                    placeholder="Share your expert analysis of this indicator. Consider its relevance, methodology, data quality, and practical application..."
                                    rows="5"
                                    required
                                ></textarea>
                            </div>
                            <button type="submit" class="btn btn-primary" id="submit-review-btn">
                                Submit Review
                            </button>
                        </form>
                    </div>
                ` : `
                    <div class="alert alert-info">
                        <a href="/champion-login.html?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}">Sign in</a> to submit a review for this indicator.
                    </div>
                `}

                <!-- Existing Reviews -->
                <div class="reviews-section">
                    <h4 class="section-title">Community Reviews (${reviews.length})</h4>
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
            star.classList.toggle('active', index < value);
        });
    }

    async submitReview(event) {
        event.preventDefault();
        
        if (!window.championAuth.isAuthenticated()) {
            window.showToast('Please sign in to submit a review', 'error');
            return;
        }

        const content = document.getElementById('review-content').value.trim();
        const comments = document.getElementById('comments-input')?.value.trim() || '';
        const isNecessary = document.querySelector('input[name="is_necessary"]:checked')?.value || null;
        
        if (!content) {
            window.showToast('Please enter your review', 'error');
            return;
        }

        if (this.rating === 0) {
            window.showToast('Please select a rating', 'error');
            return;
        }

        const btn = document.getElementById('submit-review-btn');
        btn.disabled = true;
        btn.textContent = 'Submitting...';

        // Build extended review data
        const reviewData = {
            content: content,
            rating: this.rating,
            clarity_rating: this.clarityRating || null,
            is_necessary: isNecessary,
            comments: comments
        };

        try {
            await window.championDB.submitReview(
                this.selectedIndicator.id,
                content,
                this.rating,
                reviewData
            );

            window.showToast('Review submitted successfully!', 'success');
            
            // Refresh the indicator detail
            await this.selectIndicator(this.selectedIndicator.id);
            
        } catch (error) {
            console.error('Error submitting review:', error);
            window.showToast('Failed to submit review. Please try again.', 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Submit Review';
        }
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

