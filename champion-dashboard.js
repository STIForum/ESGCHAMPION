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
    }

    async init() {
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
    }

    async loadDashboard() {
        try {
            // Get dashboard stats
            const data = await this.db.getDashboardStats();
            
            // Update welcome message
            const champion = data.champion;
            const firstName = champion.full_name?.split(' ')[0] || 'Champion';
            document.getElementById('welcome-title').textContent = `Welcome back, ${firstName}!`;
            
            // Update stats
            document.getElementById('stat-credits').textContent = data.stats.credits;
            document.getElementById('stat-approved').textContent = data.stats.approvedReviews;
            document.getElementById('stat-pending').textContent = data.stats.pendingReviews;
            document.getElementById('stif-score').textContent = data.stats.credits;
            
            // Get rank
            const rank = await this.db.getChampionRank(champion.id);
            document.getElementById('stat-rank').textContent = rank ? `#${rank}` : '#--';
            
            // Load resume point
            if (data.resumePoint && data.resumePoint.panel_id) {
                this.showResumeCard(data.resumePoint);
            }
            
            // Load recent reviews
            this.renderRecentReviews(data.recentReviews);
            
            // Load STIF score breakdown
            await this.loadScoreBreakdown();
            
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

            const totalEl = document.getElementById('score-modal-total');
            if (totalEl) {
                totalEl.textContent = total;
            }
        } catch (error) {
            console.error('Error loading score breakdown:', error);
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

