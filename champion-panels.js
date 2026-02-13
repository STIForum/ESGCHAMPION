/**
 * Champion Panels JavaScript
 * ESG Champions Platform
 */

// Utility functions with fallbacks
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

class ChampionPanels {
    constructor() {
        this.panels = [];
        this.allIndicators = [];
        this.selectedIndicators = new Set();
        this.currentFilter = 'all';
        this.currentPanelId = null;
    }

    async init() {
        // Wait for services to be ready
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Check if profile is complete (especially important for LinkedIn users)
        if (window.championAuth?.isAuthenticated?.() && 
            !window.championAuth.requireCompleteProfile(true)) {
            return; // Will redirect to profile page
        }
        
        // Load panels
        await this.loadPanels();
        
        // Setup filters
        this.setupFilters();
        
        // Setup modal
        this.setupModal();
        
        // Check URL params for framework filter
        const params = new URLSearchParams(window.location.search);
        const framework = params.get('framework');
        if (framework) {
            this.filterPanels(framework);
            this.updateFilterButtons(framework);
        }
    }

    async loadPanels() {
        try {
            const panels = await window.championDB.getPanelsWithCounts();
            this.panels = panels;
            
            // Helper to normalize framework value
            const normalizeFramework = (panel) => {
                const fw = (panel.primary_framework || panel.framework || '').toLowerCase();
                if (fw === 'gri') return 'gri';
                if (fw === 'esrs') return 'esrs';
                if (fw === 'ifrs') return 'ifrs';
                // Default to GRI for legacy panels without framework
                return 'gri';
            };
            
            // Group by framework
            const gri = panels.filter(p => normalizeFramework(p) === 'gri');
            const esrs = panels.filter(p => normalizeFramework(p) === 'esrs');
            const ifrs = panels.filter(p => normalizeFramework(p) === 'ifrs');
            
            // Render each framework section
            this.renderPanelSection('gri-panels', gri, 'gri');
            this.renderPanelSection('esrs-panels', esrs, 'esrs');
            this.renderPanelSection('ifrs-panels', ifrs, 'ifrs');
            
            // Show content using centralized utility
            _hideLoading('loading-state');
            document.getElementById('panels-grid').classList.remove('hidden');
            
        } catch (error) {
            console.error('Error loading panels:', error);
            this.showError('Failed to load panels. Please refresh the page.');
        }
    }

    renderPanelSection(containerId, panels, framework) {
        const container = document.getElementById(containerId);
        
        if (!panels || panels.length === 0) {
            container.innerHTML = `<p class="text-secondary">No panels available in ${(window.FRAMEWORK_LABELS && window.FRAMEWORK_LABELS[framework]) || framework.toUpperCase()} framework.</p>`;
            return;
        }

        container.innerHTML = panels.map(panel => {
            const icon = this.getPanelIcon(panel.name, framework);
            const impactLevel = panel.impact_level || panel.impact || 'high';
            const estimatedTime = panel.estimated_time || '10-13 min';
            const points = panel.indicator_count ? panel.indicator_count * 90 : 0;
            
            // Check if panel is awaiting approval
            const panelStatus = this.getPanelReviewStatus(panel.id);
            const isAwaitingApproval = panelStatus === 'pending';
            const isApproved = panelStatus === 'approved';
            
            let statusBadge = '<span class="status-badge status-not-started">Not Started</span>';
            let buttonHtml = `<button class="btn btn-primary" style="width: 100%;">Review Panel</button>`;
            
            if (isAwaitingApproval) {
                statusBadge = '<span class="status-badge status-in-progress">⏳ Awaiting Approval</span>';
                buttonHtml = `<button class="btn btn-secondary" style="width: 100%;" disabled>Review Submitted</button>`;
            } else if (isApproved) {
                statusBadge = '<span class="status-badge status-completed">✓ Approved</span>';
                buttonHtml = `<button class="btn btn-ghost" style="width: 100%;">View Review</button>`;
            }
            
            return `
            <div class="panel-card ${framework} ${isAwaitingApproval ? 'awaiting-approval' : ''}" data-framework="${framework}" style="cursor: pointer;" onclick="panelsPage.startPanelReview('${panel.id}', '${panel.name.replace(/'/g, "\\'")}')">
                <h3 style="font-size: var(--text-xl); margin-bottom: var(--space-2); display: flex; align-items: center; gap: var(--space-2);">
                    <span style="font-size: 1.2em;">${icon}</span>
                    ${panel.name}
                </h3>
                
                <p class="text-secondary" style="margin-bottom: var(--space-3); font-size: var(--text-sm); line-height: 1.5;">
                    ${panel.description || 'Explore indicators in this panel'}
                </p>
                
                <div style="margin-bottom: var(--space-3);">
                    <span class="impact-badge impact-${(impactLevel || 'high').toLowerCase()}">${typeof impactLevel === 'string' ? impactLevel.charAt(0).toUpperCase() + impactLevel.slice(1) : 'High'}</span>
                </div>
                
                <div class="flex-between" style="margin-bottom: var(--space-3); color: var(--gray-500); font-size: var(--text-sm);">
                    <span>Estimated time</span>
                    <span style="font-weight: 500;">${estimatedTime}</span>
                </div>
                
                <div class="flex-between" style="margin-bottom: var(--space-4); padding-top: var(--space-2); border-top: 1px solid var(--gray-100);">
                    ${statusBadge}
                    <span style="color: var(--primary-500); font-weight: 600; font-size: var(--text-sm);">+${points} points</span>
                </div>
                
                ${buttonHtml}
            </div>
        `}).join('');
    }

    getPanelReviewStatus(panelId) {
        // Check sessionStorage for panel review status
        const panelReviews = JSON.parse(sessionStorage.getItem('panelReviews') || '{}');
        return panelReviews[panelId] || null;
    }

    clearPanelReviewStatus(panelId) {
        // Clear from sessionStorage
        const panelReviews = JSON.parse(sessionStorage.getItem('panelReviews') || '{}');
        delete panelReviews[panelId];
        sessionStorage.setItem('panelReviews', JSON.stringify(panelReviews));
        
        // Also remove from localStorage submissions
        const submissions = JSON.parse(localStorage.getItem('panelSubmissions') || '[]');
        const filtered = submissions.filter(s => s.panelId !== panelId);
        localStorage.setItem('panelSubmissions', JSON.stringify(filtered));
    }

    clearAllPanelStatuses() {
        // Clear all panel review statuses (useful for debugging/reset)
        sessionStorage.removeItem('panelReviews');
        sessionStorage.removeItem('reviewedIndicators');
        localStorage.removeItem('panelSubmissions');
        window.showToast?.('Panel statuses cleared. Refreshing...', 'success');
        setTimeout(() => location.reload(), 1000);
    }

    async startPanelReview(panelId, panelName) {
        // Set current panel ID for invite peers modal
        window.currentPanelId = panelId;
        
        // Check if panel is already awaiting approval
        const status = this.getPanelReviewStatus(panelId);
        if (status === 'pending') {
            // Ask user if they want to re-review or clear
            if (confirm('This panel shows as "Awaiting Approval". If the submission failed, click OK to clear and re-review.')) {
                this.clearPanelReviewStatus(panelId);
                await this.loadPanels(); // Refresh the display
            }
            return;
        }

        // Open the indicator selection modal
        await this.openIndicatorModal(panelId, panelName);
    }

    getPanelIcon(name, framework) {
        const iconMap = {
            'climate': '🌍',
            'energy': '⚡',
            'water': '💧',
            'waste': '♻️',
            'biodiversity': '🌿',
            'emissions': '🌡️',
            'human rights': '✊',
            'labor': '👷',
            'health': '🏥',
            'diversity': '🤝',
            'community': '👥',
            'ethics': '⚖️',
            'governance': '🏛️',
            'compliance': '📋',
            'risk': '🛡️',
            'supply': '🔗',
            'data': '🔒'
        };
        
        const nameLower = name.toLowerCase();
        for (const [key, icon] of Object.entries(iconMap)) {
            if (nameLower.includes(key)) return icon;
        }
        
        // Default icons by framework
        if (framework === 'gri') return '🌱';
        if (framework === 'esrs') return '📊';
        if (framework === 'ifrs') return '💼';
        return '📊';
    }

    setupFilters() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.dataset.filter;
                this.filterPanels(filter);
                this.updateFilterButtons(filter);
            });
        });
    }

    setupModal() {
        const backdrop = document.getElementById('indicator-modal-backdrop');
        const closeBtn = document.getElementById('modal-close-btn');
        const cancelBtn = document.getElementById('modal-cancel-btn');
        const selectAllBtn = document.getElementById('select-all-btn');
        const reviewBtn = document.getElementById('review-selected-btn');
        const searchInput = document.getElementById('indicator-search');

        // Close modal handlers
        closeBtn.addEventListener('click', () => this.closeModal());
        cancelBtn.addEventListener('click', () => this.closeModal());
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) this.closeModal();
        });

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && backdrop.classList.contains('active')) {
                this.closeModal();
            }
        });

        // Select all toggle
        selectAllBtn.addEventListener('click', () => this.toggleSelectAll());

        // Review selected
        reviewBtn.addEventListener('click', () => this.navigateToReview());

        // Search
        searchInput.addEventListener('input', (e) => this.filterIndicators(e.target.value));
    }

    async openIndicatorModal(panelId, panelName) {
        this.currentPanelId = panelId;
        this.currentPanelName = panelName;
        this.selectedIndicators.clear();
        this.acceptedIndicatorIds = []; // Track accepted indicators
        
        const backdrop = document.getElementById('indicator-modal-backdrop');
        const modal = document.getElementById('indicator-modal');
        const indicatorsList = document.getElementById('indicators-list');
        const reviewBtn = document.getElementById('review-selected-btn');
        const modalTitle = document.querySelector('.modal-title');
        
        // Update modal title with panel name
        if (modalTitle) {
            modalTitle.textContent = `Select Indicators for ${panelName}`;
        }
        
        // Reset UI
        reviewBtn.disabled = true;
        reviewBtn.textContent = 'Proceed to Review';
        document.getElementById('indicator-search').value = '';
        indicatorsList.innerHTML = '<div class="text-center p-6"><div class="loading-spinner"></div></div>';
        
        // Show modal (add active class for CSS visibility)
        backdrop.classList.add('active');
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        try {
            // Fetch indicators and accepted indicator IDs in parallel
            const [panelData, acceptedIds] = await Promise.all([
                window.championDB.getPanelWithIndicators(panelId),
                window.championDB.getUserAcceptedIndicatorIds(panelId)
            ]);
            
            this.allIndicators = panelData.indicators || [];
            this.acceptedIndicatorIds = acceptedIds || [];
            
            if (this.allIndicators.length === 0) {
                indicatorsList.innerHTML = `
                    <div class="text-center p-6 text-secondary">
                        <p style="margin-bottom: var(--space-2);">No indicators available for this panel.</p>
                        <p class="text-sm">The admin needs to add indicators specific to this panel before it can be reviewed.</p>
                    </div>
                `;
                return;
            }
            
            this.renderIndicatorsList(this.allIndicators);
        } catch (error) {
            console.error('Error loading indicators:', error);
            indicatorsList.innerHTML = '<div class="text-center p-6 text-secondary">Failed to load indicators. Please try again.</div>';
        }
    }

    closeModal() {
        const backdrop = document.getElementById('indicator-modal-backdrop');
        const modal = document.getElementById('indicator-modal');
        backdrop.classList.remove('active');
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    renderIndicatorsList(indicators) {
        const container = document.getElementById('indicators-list');
        
        if (!indicators || indicators.length === 0) {
            container.innerHTML = '<div class="text-center p-6 text-secondary">No indicators available.</div>';
            this.updateSelectionCount();
            return;
        }

        container.innerHTML = indicators.map(indicator => {
            const importance = indicator.importance_level || 'medium';
            const difficulty = indicator.difficulty || 'moderate';
            const timeEstimate = indicator.time_estimate || '3-5 min';
            const standardRef = indicator.gri_standard || indicator.standard_reference || '';
            const impactRating = indicator.impact_rating || 4;
            
            // Check if this indicator has been accepted
            const isAccepted = this.acceptedIndicatorIds?.includes(indicator.id);
            const disabledClass = isAccepted ? 'indicator-accepted' : '';
            const disabledAttr = isAccepted ? 'disabled' : '';
            
            return `
            <label class="indicator-checkbox-item ${disabledClass}" data-id="${indicator.id}" ${isAccepted ? 'title="Already reviewed and accepted"' : ''}>
                <input type="checkbox" value="${indicator.id}" ${this.selectedIndicators.has(indicator.id) ? 'checked' : ''} ${disabledAttr} onchange="panelsPage.toggleIndicator('${indicator.id}')">
                <div class="indicator-info">
                    <div class="indicator-name">
                        ${indicator.name}
                        ${isAccepted ? '<span class="accepted-badge">✓ Accepted</span>' : ''}
                    </div>
                    <div class="indicator-desc">${indicator.description || 'No description'}</div>
                    
                    <div class="indicator-meta-badges">
                        <span class="meta-badge importance-${importance}">${importance.charAt(0).toUpperCase() + importance.slice(1)} Importance</span>
                        <span class="meta-badge difficulty-badge">${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</span>
                        <span class="meta-badge time-badge">${timeEstimate}</span>
                        ${standardRef ? `<span class="meta-badge gri-badge">${standardRef}</span>` : ''}
                    </div>
                    
                    <div class="indicator-impact">
                        Impact: ${this.renderStars(impactRating)}
                    </div>
                </div>
            </label>
        `}).join('');

        this.updateSelectionCount();
    }

    renderStars(rating) {
        const maxStars = 5;
        let stars = '';
        for (let i = 0; i < maxStars; i++) {
            if (i < rating) {
                stars += '<span class="star filled">★</span>';
            } else {
                stars += '<span class="star empty">☆</span>';
            }
        }
        return stars;
    }

    toggleIndicator(indicatorId) {
        if (this.selectedIndicators.has(indicatorId)) {
            this.selectedIndicators.delete(indicatorId);
        } else {
            this.selectedIndicators.add(indicatorId);
        }
        this.updateSelectionCount();
    }

    toggleSelectAll() {
        const btn = document.getElementById('select-all-btn');
        const checkboxes = document.querySelectorAll('#indicators-list input[type="checkbox"]:not([disabled])');
        
        // Get selectable indicators (not accepted)
        const selectableIndicators = this.allIndicators.filter(
            ind => !this.acceptedIndicatorIds?.includes(ind.id)
        );
        
        if (this.selectedIndicators.size === selectableIndicators.length && selectableIndicators.length > 0) {
            // Deselect all
            this.selectedIndicators.clear();
            checkboxes.forEach(cb => cb.checked = false);
            btn.textContent = 'Select All';
        } else {
            // Select all (only selectable ones)
            selectableIndicators.forEach(ind => this.selectedIndicators.add(ind.id));
            checkboxes.forEach(cb => cb.checked = true);
            btn.textContent = 'Deselect All';
        }
        
        this.updateSelectionCount();
    }

    updateSelectionCount() {
        const countEl = document.getElementById('selection-count');
        const reviewBtn = document.getElementById('review-selected-btn');
        const selectAllBtn = document.getElementById('select-all-btn');
        
        // Get selectable indicators (not accepted)
        const selectableIndicators = this.allIndicators.filter(
            ind => !this.acceptedIndicatorIds?.includes(ind.id)
        );
        const acceptedCount = this.allIndicators.length - selectableIndicators.length;
        
        let countText = `${this.selectedIndicators.size} of ${selectableIndicators.length} selected`;
        if (acceptedCount > 0) {
            countText += ` (${acceptedCount} already accepted)`;
        }
        countEl.textContent = countText;
        
        reviewBtn.disabled = this.selectedIndicators.size === 0;
        
        if (this.selectedIndicators.size === selectableIndicators.length && selectableIndicators.length > 0) {
            selectAllBtn.textContent = 'Deselect All';
        } else {
            selectAllBtn.textContent = 'Select All';
        }
    }

    filterIndicators(searchTerm) {
        const term = searchTerm.toLowerCase().trim();
        
        if (!term) {
            this.renderIndicatorsList(this.allIndicators);
            return;
        }

        const filtered = this.allIndicators.filter(ind => 
            ind.name.toLowerCase().includes(term) ||
            (ind.description && ind.description.toLowerCase().includes(term)) ||
            (ind.panels?.name && ind.panels.name.toLowerCase().includes(term))
        );
        
        this.renderIndicatorsList(filtered);
    }

    navigateToReview() {
        if (this.selectedIndicators.size === 0) {
            window.showToast?.('Please select at least one indicator', 'error');
            return;
        }

        const selectedIds = Array.from(this.selectedIndicators).join(',');
        
        // Store in sessionStorage as backup
        sessionStorage.setItem('selectedIndicators', JSON.stringify({
            panelId: this.currentPanelId,
            panelName: this.currentPanelName,
            indicatorIds: Array.from(this.selectedIndicators)
        }));

        // Navigate with URL params (include panel ID for shareability)
        window.location.href = `/champion-indicators.html?panel=${this.currentPanelId}&selected=${selectedIds}`;
    }

    filterPanels(filter) {
        this.currentFilter = filter;
        
        const sections = {
            gri: document.getElementById('gri-section'),
            esrs: document.getElementById('esrs-section'),
            ifrs: document.getElementById('ifrs-section')
        };

        if (filter === 'all') {
            Object.values(sections).forEach(section => {
                if (section) section.classList.remove('hidden');
            });
        } else {
            Object.entries(sections).forEach(([framework, section]) => {
                if (section) {
                    if (framework === filter) {
                        section.classList.remove('hidden');
                    } else {
                        section.classList.add('hidden');
                    }
                }
            });
        }

        // Update URL without reload
        const url = new URL(window.location);
        if (filter === 'all') {
            url.searchParams.delete('framework');
        } else {
            url.searchParams.set('framework', filter);
        }
        window.history.replaceState({}, '', url);
    }

    updateFilterButtons(activeFilter) {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            if (btn.dataset.filter === activeFilter) {
                btn.classList.add('active');
                btn.classList.remove('btn-ghost');
                btn.classList.add('btn-primary');
            } else {
                btn.classList.remove('active');
                btn.classList.add('btn-ghost');
                btn.classList.remove('btn-primary');
            }
        });
    }

    showError(message) {
        _showErrorState('loading-state', message, () => location.reload());
    }
}

// Initialize on DOM ready
let panelsPage;
document.addEventListener('DOMContentLoaded', () => {
    panelsPage = new ChampionPanels();
    panelsPage.init();
});
