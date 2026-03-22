/**
 * Champion Dashboard JavaScript
 * ESG Champions Platform
 */

// Utility functions with fallbacks
function _formatRelativeTime(dateString) {
    if (window.formatRelativeTime) return window.formatRelativeTime(dateString);
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) {
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        if (diffHours === 0) {
            const diffMins = Math.floor(diffMs / (1000 * 60));
            return diffMins <= 1 ? 'Just now' : `${diffMins} minutes ago`;
        }
        return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

class ChampionDashboard {
    constructor() {
        this.auth = null;
        this.db = null;
        this.productTourStorageKey = 'stif_champion_dashboard_tour_seen_v1';
        this.currentTourStep = 0;
        this.activeTourTarget = null;
        this.tourSteps = [
            {
                title: 'Use the Sidebar to Navigate',
                description: 'This menu is your quick path to Dashboard, ESG Panels, Rankings, Profile, and Invite Peers.',
                tip: 'Dashboard keeps you in your command center, while Panels is where you submit reviews.',
                targets: ['.sidebar', '.sidebar-nav']
            },
            {
                title: 'Track Your Progress Fast',
                description: 'Use the stats row to monitor credits, approvals, pending reviews, and your leaderboard rank at a glance.',
                tip: 'If your rank looks unchanged, refresh after a new approved review.',
                targets: ['#stats-grid']
            },
            {
                title: 'Resume Incomplete Work',
                description: 'When available, this card jumps you directly back to the exact panel or indicator where you paused.',
                tip: 'No resume card yet? It appears automatically after you start and leave an in-progress review.',
                targets: ['#resume-card', '#stats-grid']
            },
            {
                title: 'Review Recent Activity',
                description: 'Your latest outcomes appear here, including rejected submissions that can be resubmitted quickly.',
                tip: 'Rejected items show a resubmit hint to help you recover quickly.',
                targets: ['#recent-reviews-list']
            },
            {
                title: 'Understand Your STIF Score',
                description: 'Open the score details to see how completed fields and approved reviews contribute to your total score.',
                tip: 'Use this breakdown to focus on actions that increase credits fastest.',
                targets: ['#score-info-btn', '#stif-score']
            }
        ];
    }

    async init() {
        // If this session belongs to a business user, send them to the right place
        // immediately — before loading any champion auth — to prevent redirect loops.
        const loginContext = localStorage.getItem('login_context');
        if (loginContext === 'business') {
            window.location.href = '/business-dashboard.html';
            return;
        }

        // Ensure auth service exists
        if (!window.championAuth || !window.championAuth.init) {
            console.error('championAuth not initialized');
            window.location.href = '/champion-login.html?redirect=/champion-dashboard.html';
            return;
        }

        // Explicitly (re)initialize auth so it picks up the session from the verify‑email redirect
        try {
            await window.championAuth.init();
        } catch (e) {
            console.error('Auth init failed on dashboard:', e);
        }

        this.auth = window.championAuth;
        this.db = window.championDB;

        // Check authentication AFTER init
        if (!this.auth?.isAuthenticated?.()) {
            window.location.href = '/champion-login.html?redirect=/champion-dashboard.html';
            return;
        }

        // Check if profile is complete (especially important for LinkedIn users)
        if (!this.auth.requireCompleteProfile(true)) {
            return; // Will redirect to profile page
        }

        // Load dashboard data
        await this.loadDashboard();
        
        // Setup event listeners
        this.setupEventListeners();

        // Offer a first-time tour after the dashboard is fully visible.
        this.maybeShowProductTour();
    }

    async loadDashboard() {
        try {
            // Get dashboard stats
            const data = await this.db.getDashboardStats();
            
            // Update welcome message
            const champion = data.champion;
            const firstName = champion.full_name?.split(' ')[0] || 'Champion';
            document.getElementById('welcome-title').textContent = `Welcome back, ${firstName}!`;
            
            // Load STIF score breakdown first — use computed total (not stale DB
            // champion.credits column) for stat card and score widget (BUG_DASH_021/022/025)
            const scoreData = await this.loadScoreBreakdown();
            const computedCredits = (scoreData && scoreData.totalScore != null)
                ? scoreData.totalScore
                : data.stats.credits;

            // Update stats
            document.getElementById('stat-credits').textContent = computedCredits;
            document.getElementById('stat-approved').textContent = data.stats.approvedReviews;
            document.getElementById('stat-pending').textContent = data.stats.pendingReviews;
            document.getElementById('stif-score').textContent = computedCredits;
            
            // Get rank
            const rank = await this.db.getChampionRank(champion.id);
            document.getElementById('stat-rank').textContent = rank ? `#${rank}` : '#--';
            
            // Load resume point
            if (data.resumePoint && data.resumePoint.panel_id) {
                this.showResumeCard(data.resumePoint);
            }
            
            // Load recent reviews
            this.renderRecentReviews(data.recentReviews);
            
            // Show dashboard using centralized utility
            _hideLoading('loading-state');
            document.getElementById('dashboard-content').classList.remove('hidden');
            
        } catch (error) {
            console.error('Error loading dashboard:', error);
            this.showError('Failed to load dashboard. Please refresh the page.');
        }
    }

    showResumeCard(resumePoint) {
        const card = document.getElementById('resume-card');
        const description = document.getElementById('resume-description');
        const link = document.getElementById('resume-link');
        
        let text = '';
        if (resumePoint.indicator_name) {
            text = `Continue reviewing "${resumePoint.indicator_name}" in ${resumePoint.panel_name}`;
            link.href = `/champion-indicators.html?panel=${resumePoint.panel_id}&indicator=${resumePoint.indicator_id}`;
        } else if (resumePoint.panel_name) {
            text = `Continue exploring "${resumePoint.panel_name}" panel`;
            link.href = `/champion-indicators.html?panel=${resumePoint.panel_id}`;
        }
        
        if (text) {
            description.textContent = text;
            card.classList.remove('hidden');
        }
    }

    renderRecentReviews(reviews) {
        const container = document.getElementById('recent-reviews-list');
        
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
                ${reviews.map(review => {
                    const isRejected = review.status === 'rejected';
                    const clickableClass = isRejected ? 'clickable-review' : '';
                    const clickHandler = isRejected ? `onclick="window.location.href='/champion-indicators.html?panel=${review.panel_id}&indicator=${review.indicator_id}&resubmit=true'"` : '';
                    const cursorStyle = isRejected ? 'cursor: pointer;' : '';
                    const titleSuffix = isRejected ? ' (Click to resubmit)' : '';
                    
                    return `
                    <li class="activity-item ${clickableClass}" ${clickHandler} style="${cursorStyle}" title="${review.indicators?.name || 'Indicator'}${titleSuffix}">
                        <div class="activity-icon" style="background: var(--${statusColors[review.status] || 'primary'}-bg); color: var(--${statusColors[review.status] || 'primary'});">
                            ${this.getStatusIcon(review.status)}
                        </div>
                        <div class="activity-content">
                            <div class="activity-title">
                                ${review.indicators?.name || 'Unknown Indicator'}
                                ${isRejected ? '<span class="resubmit-hint">Click to resubmit</span>' : ''}
                            </div>
                            <div class="activity-time">
                                <span class="badge badge-${review.panels?.category || 'primary'}" style="font-size: 10px;">
                                    ${review.panels?.name || 'Unknown Panel'}
                                </span>
                                <span style="margin-left: 8px;">${_formatRelativeTime(review.created_at)}</span>
                            </div>
                        </div>
                        <span class="badge badge-${statusColors[review.status] || 'primary'}">
                            ${review.status}
                        </span>
                    </li>
                `}).join('')}
            </ul>
        `;
    }

    getStatusIcon(status) {
        const icons = {
            pending: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
            approved: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>',
            rejected: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'
        };
        return icons[status] || icons.pending;
    }

    async loadScoreBreakdown() {
        try {
            const scoreData = await this.db.getSTIFScore();
            const total = scoreData.totalScore || 0;
            const breakdown = scoreData.breakdown || {};

            // Update total in modal
            const totalEl = document.getElementById('score-modal-total');
            if (totalEl) {
                totalEl.textContent = total;
            }

            // Update breakdown details if elements exist
            const mandatoryEl = document.getElementById('score-mandatory-credits');
            if (mandatoryEl) {
                mandatoryEl.textContent = breakdown.mandatoryFields || 0;
            }

            const optionalEl = document.getElementById('score-optional-credits');
            if (optionalEl) {
                optionalEl.textContent = breakdown.optionalFields || 0;
            }

            const reviewsEl = document.getElementById('score-approved-reviews');
            if (reviewsEl) {
                reviewsEl.textContent = breakdown.approvedReviews || 0;
            }

            // Update score info tooltip / helper text
            const maxEl = document.getElementById('score-max-per-review');
            if (maxEl) {
                maxEl.textContent = breakdown.maxPerReview || 27;
            }

            // Return scoreData so loadDashboard() can use the computed total
            // for the stat card and STIF score widget without a second DB call.
            return scoreData;
        } catch (error) {
            console.error('Error loading score breakdown:', error);
            return null;
        }
    }

    setupEventListeners() {
        // Score info modal
        const modal = document.getElementById('score-modal');
        const backdrop = document.getElementById('score-modal-backdrop');
        const openBtn = document.getElementById('score-info-btn');
        const closeBtn = document.getElementById('score-modal-close');

        openBtn?.addEventListener('click', () => {
            modal.classList.add('active');
            backdrop.classList.add('active');
        });

        closeBtn?.addEventListener('click', () => {
            modal.classList.remove('active');
            backdrop.classList.remove('active');
        });

        backdrop?.addEventListener('click', (e) => {
            if (e.target === backdrop) {
                modal.classList.remove('active');
                backdrop.classList.remove('active');
            }
        });

        // Product tour modal
        const tourModal = document.getElementById('champion-tour-modal');
        const tourBackdrop = document.getElementById('champion-tour-modal-backdrop');
        const tourOpenBtn = document.getElementById('dashboard-tour-btn');
        const tourCloseBtn = document.getElementById('champion-tour-modal-close');
        const tourSkipBtn = document.getElementById('champion-tour-skip-btn');
        const tourPrevBtn = document.getElementById('champion-tour-prev-btn');
        const tourNextBtn = document.getElementById('champion-tour-next-btn');
        const tourDontShow = document.getElementById('champion-tour-dont-show');

        tourOpenBtn?.addEventListener('click', () => {
            this.openProductTour(0, 'manual');
        });

        tourCloseBtn?.addEventListener('click', () => {
            this.closeProductTour('closed');
        });

        tourSkipBtn?.addEventListener('click', () => {
            this.trackProductTourEvent('tour_skipped', {
                step: this.currentTourStep + 1,
                totalSteps: this.tourSteps.length
            });
            this.closeProductTour('skipped');
        });

        tourPrevBtn?.addEventListener('click', () => {
            this.goToTourStep(this.currentTourStep - 1);
        });

        tourNextBtn?.addEventListener('click', () => {
            const isLastStep = this.currentTourStep >= this.tourSteps.length - 1;
            if (isLastStep) {
                this.markProductTourSeen();
                this.trackProductTourEvent('tour_completed', {
                    totalSteps: this.tourSteps.length
                });
                this.closeProductTour('completed');
                return;
            }
            this.goToTourStep(this.currentTourStep + 1);
        });

        tourDontShow?.addEventListener('change', (event) => {
            if (event.target.checked) {
                this.markProductTourSeen();
            } else {
                localStorage.removeItem(this.productTourStorageKey);
            }
        });

        tourBackdrop?.addEventListener('click', (e) => {
            if (e.target === tourBackdrop) {
                this.closeProductTour('backdrop');
            }
        });

        if (tourModal) {
            tourModal.addEventListener('keydown', (event) => {
                if (event.key === 'Escape') {
                    this.closeProductTour('escape');
                }
            });
        }
    }

    maybeShowProductTour() {
        const hasSeenTour = localStorage.getItem(this.productTourStorageKey) === 'true';
        if (!hasSeenTour) {
            setTimeout(() => this.openProductTour(0, 'auto'), 500);
        }
    }

    openProductTour(stepIndex = 0, source = 'manual') {
        const modal = document.getElementById('champion-tour-modal');
        const backdrop = document.getElementById('champion-tour-modal-backdrop');
        const dontShow = document.getElementById('champion-tour-dont-show');

        if (!modal || !backdrop) {
            return;
        }

        const hasSeenTour = localStorage.getItem(this.productTourStorageKey) === 'true';
        if (dontShow) {
            dontShow.checked = hasSeenTour;
        }

        modal.classList.add('active');
        backdrop.classList.add('active');
        modal.setAttribute('tabindex', '-1');
        modal.focus();

        this.goToTourStep(stepIndex);
        this.trackProductTourEvent('tour_opened', {
            source,
            totalSteps: this.tourSteps.length
        });
    }

    closeProductTour(reason = 'closed') {
        const modal = document.getElementById('champion-tour-modal');
        const backdrop = document.getElementById('champion-tour-modal-backdrop');
        const dontShow = document.getElementById('champion-tour-dont-show');

        if (dontShow?.checked) {
            this.markProductTourSeen();
        }

        modal?.classList.remove('active');
        backdrop?.classList.remove('active');
        this.clearTourHighlight();

        this.trackProductTourEvent('tour_closed', {
            reason,
            step: this.currentTourStep + 1,
            totalSteps: this.tourSteps.length
        });
    }

    markProductTourSeen() {
        localStorage.setItem(this.productTourStorageKey, 'true');
    }

    goToTourStep(stepIndex) {
        if (!this.tourSteps.length) {
            return;
        }

        const clampedIndex = Math.max(0, Math.min(stepIndex, this.tourSteps.length - 1));
        this.currentTourStep = clampedIndex;

        const step = this.tourSteps[clampedIndex];
        const titleEl = document.getElementById('champion-tour-step-title');
        const descriptionEl = document.getElementById('champion-tour-step-description');
        const tipEl = document.getElementById('champion-tour-step-tip');
        const counterEl = document.getElementById('champion-tour-step-counter');
        const prevBtn = document.getElementById('champion-tour-prev-btn');
        const nextBtn = document.getElementById('champion-tour-next-btn');

        if (titleEl) titleEl.textContent = step.title;
        if (descriptionEl) descriptionEl.textContent = step.description;
        if (tipEl) tipEl.textContent = `Tip: ${step.tip}`;
        if (counterEl) counterEl.textContent = `Step ${clampedIndex + 1} of ${this.tourSteps.length}`;

        if (prevBtn) {
            prevBtn.disabled = clampedIndex === 0;
            prevBtn.setAttribute('aria-disabled', String(clampedIndex === 0));
        }

        if (nextBtn) {
            nextBtn.textContent = clampedIndex >= this.tourSteps.length - 1 ? 'Finish Tour' : 'Next';
        }

        const target = this.resolveTourTarget(step.targets || []);
        this.highlightTourTarget(target);

        this.trackProductTourEvent('tour_step_viewed', {
            step: clampedIndex + 1,
            title: step.title
        });
    }

    resolveTourTarget(selectors) {
        for (const selector of selectors) {
            const candidate = document.querySelector(selector);
            if (!candidate) {
                continue;
            }
            if (this.isTourTargetVisible(candidate)) {
                return candidate;
            }
        }
        return null;
    }

    isTourTargetVisible(element) {
        if (!element || element.classList.contains('hidden')) {
            return false;
        }

        const styles = window.getComputedStyle(element);
        if (styles.display === 'none' || styles.visibility === 'hidden' || styles.opacity === '0') {
            return false;
        }

        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
    }

    highlightTourTarget(element) {
        this.clearTourHighlight();
        if (!element) {
            return;
        }

        this.activeTourTarget = element;
        element.classList.add('dashboard-tour-highlight');
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    clearTourHighlight() {
        if (this.activeTourTarget) {
            this.activeTourTarget.classList.remove('dashboard-tour-highlight');
            this.activeTourTarget = null;
        }
    }

    trackProductTourEvent(eventName, details = {}) {
        const payload = {
            event: `champion_dashboard_${eventName}`,
            timestamp: new Date().toISOString(),
            ...details
        };

        if (Array.isArray(window.dataLayer)) {
            window.dataLayer.push(payload);
        }

        window.dispatchEvent(new CustomEvent('champion-dashboard-tour-event', {
            detail: payload
        }));
    }

    showError(message) {
        _showErrorState('loading-state', message, () => location.reload());
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new ChampionDashboard();
    dashboard.init();
});