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
        this.frameworks = [];
        this.allIndicators = [];
        this.selectedIndicators = new Set();
        this.currentFilter = 'all';
        this.currentPanelId = null;
        this.filterHandlerBound = false;
    }

    async isBusinessUserSession() {
        try {
            if (!window.getSupabase) return false;
            const supabase = window.getSupabase();
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user?.id) return false;

            const { data, error } = await supabase
                .from('business_users')
                .select('id')
                .eq('auth_user_id', session.user.id)
                .maybeSingle();

            return !error && !!data?.id;
        } catch (err) {
            return false;
        }
    }

    async init() {
        // Wait for services to be ready
        await new Promise(resolve => setTimeout(resolve, 300));

        const isBusinessUser = await this.isBusinessUserSession();
        
        // Check if profile is complete (especially important for LinkedIn users)
        if (!isBusinessUser && window.championAuth?.isAuthenticated?.() && 
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
            await this.loadFrameworks();
            const panels = await window.championDB.getPanelsWithCounts();
            this.panels = panels;

            this.renderFrameworkFilters();
            this.renderFrameworkSections();

            const availableFrameworkCodes = this.frameworks.map(f => f.code);
            for (const frameworkCode of availableFrameworkCodes) {
                const frameworkPanels = panels.filter(p => this.normalizeFramework(p) === frameworkCode);
                this.renderPanelSection(`${frameworkCode}-panels`, frameworkPanels, frameworkCode);
            }
            
            // Show content using centralized utility
            _hideLoading('loading-state');
            document.getElementById('panels-grid').classList.remove('hidden');
            
        } catch (error) {
            console.error('Error loading panels:', error);
            this.showError('Failed to load panels. Please refresh the page.');
        }
    }

    async loadFrameworks() {
        try {
            const supabase = window.getSupabase?.();
            if (!supabase) throw new Error('Supabase client not available');

            const { data, error } = await supabase
                .from('frameworks')
                .select('name, code, status, is_active, order_index')
                .eq('is_active', true)
                .order('order_index', { ascending: true })
                .order('name', { ascending: true });

            if (error) throw error;

            this.frameworks = (data || []).map(f => ({
                ...f,
                code: String(f.code || '').toLowerCase()
            })).filter(f => f.code);
        } catch (error) {
            console.warn('Could not load frameworks from database, using defaults:', error);
            this.frameworks = [
                { name: 'GRI', code: 'gri' },
                { name: 'ESRS', code: 'esrs' },
                { name: 'IFRS', code: 'ifrs' }
            ];
        }

        if (!this.frameworks.length) {
            this.frameworks = [
                { name: 'GRI', code: 'gri' },
                { name: 'ESRS', code: 'esrs' },
                { name: 'IFRS', code: 'ifrs' }
            ];
        }
    }

    normalizeFramework(panel) {
        const framework = String(panel?.primary_framework || panel?.framework || '').toLowerCase();
        if (this.frameworks.some(f => f.code === framework)) {
            return framework;
        }
        return this.frameworks[0]?.code || 'gri';
    }

    getFrameworkMeta(frameworkCode) {
        const fallbackName = frameworkCode ? frameworkCode.toUpperCase() : 'Framework';
        return this.frameworks.find(f => f.code === frameworkCode) || { code: frameworkCode, name: fallbackName };
    }

    renderFrameworkFilters() {
        const dropdown = document.getElementById('framework-dropdown');
        if (!dropdown) return;

        // Populate dropdown with framework options
        const optionsHtml = [
            '<option value="" disabled selected>Select Framework</option>',
            ...this.frameworks.map(framework =>
                `<option value="${framework.code}">${framework.name}</option>`
            )
        ];

        dropdown.innerHTML = optionsHtml.join('');
    }

    renderFrameworkSections() {
        const container = document.getElementById('framework-sections');
        if (!container) return;

        container.innerHTML = this.frameworks.map(framework => {
            const color = this.getSectionColor(framework.code);
            const iconPath = this.getSectionIconPath(framework.code);
            return `
                <section id="${framework.code}-section" class="mb-8" data-framework-section="${framework.code}">
                    <h2 class="mb-4" style="color: ${color};">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block; vertical-align: middle; margin-right: 8px;">
                            ${iconPath}
                        </svg>
                        ${framework.name}
                    </h2>
                    <div class="features-grid" id="${framework.code}-panels"></div>
                </section>
            `;
        }).join('');
    }

    getSectionColor(frameworkCode) {
        const colors = {
            gri: 'var(--primary-600)',
            esrs: 'var(--secondary-600)',
            ifrs: 'var(--accent-600)'
        };
        return colors[frameworkCode] || 'var(--primary-600)';
    }

    getSectionIconPath(frameworkCode) {
        const icons = {
            gri: '<path d="M12 22c4-4 8-7.5 8-12a8 8 0 1 0-16 0c0 4.5 4 8 8 12z"></path>',
            esrs: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle>',
            ifrs: '<path d="M3 21h18"></path><path d="M3 10h18"></path><path d="M5 6l7-3 7 3"></path>'
        };
        return icons[frameworkCode] || '<circle cx="12" cy="12" r="9"></circle>';
    }

    renderPanelSection(containerId, panels, framework) {
        const container = document.getElementById(containerId);
        const frameworkMeta = this.getFrameworkMeta(framework);
        
        if (!panels || panels.length === 0) {
            container.innerHTML = `<p class="text-secondary">No panels available in ${frameworkMeta.name} framework.</p>`;
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
        if (this.filterHandlerBound) return;

        // Handle "All Frameworks" button click
        const allBtn = document.getElementById('all-frameworks-btn');
        if (allBtn) {
            allBtn.addEventListener('click', () => {
                this.filterPanels('all');
                this.updateFilterButtons('all');
            });
        }

        // Handle framework dropdown change
        const dropdown = document.getElementById('framework-dropdown');
        if (dropdown) {
            dropdown.addEventListener('change', (event) => {
                const filter = event.target.value;
                if (filter) {
                    this.filterPanels(filter);
                    this.updateFilterButtons(filter);
                }
            });
        }

        this.filterHandlerBound = true;
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
            // Fetch indicators, accepted IDs, and rejected IDs in parallel
            const [panelData, acceptedIds, rejectedIds] = await Promise.all([
                window.championDB.getPanelWithIndicators(panelId),
                window.championDB.getUserAcceptedIndicatorIds(panelId),
                window.championDB.getUserRejectedIndicatorIds(panelId)
            ]);
            
            this.allIndicators = panelData.indicators || [];
            this.acceptedIndicatorIds = acceptedIds || [];
            this.rejectedIndicatorIds = rejectedIds || [];
            
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
            
            // Check if this indicator has been submitted (pending or accepted)
            const isSubmitted = this.acceptedIndicatorIds?.includes(indicator.id);
            // Check if this indicator was rejected (can be resubmitted)
            const isRejected = this.rejectedIndicatorIds?.includes(indicator.id);
            const disabledClass = isSubmitted ? 'indicator-submitted' : (isRejected ? 'indicator-rejected' : '');
            const disabledAttr = isSubmitted ? 'disabled' : '';
            
            let statusBadge = '';
            if (isSubmitted) {
                statusBadge = '<span class="submitted-badge">✓ Submitted</span>';
            } else if (isRejected) {
                statusBadge = '<span class="rejected-badge">↻ Resubmit</span>';
            }
            
            return `
            <label class="indicator-checkbox-item ${disabledClass}" data-id="${indicator.id}" ${isSubmitted ? 'title="Already submitted for review"' : (isRejected ? 'title="Previously rejected - select to resubmit"' : '')}>
                <input type="checkbox" value="${indicator.id}" ${this.selectedIndicators.has(indicator.id) ? 'checked' : ''} ${disabledAttr} onchange="panelsPage.toggleIndicator('${indicator.id}')">
                <div class="indicator-info">
                    <div class="indicator-name">
                        ${indicator.name}
                        ${statusBadge}
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

        const sections = document.querySelectorAll('[data-framework-section]');
        sections.forEach(section => {
            const frameworkCode = section.getAttribute('data-framework-section');
            const shouldShow = filter === 'all' || frameworkCode === filter;
            section.classList.toggle('hidden', !shouldShow);
        });

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
        const allBtn = document.getElementById('all-frameworks-btn');
        const dropdown = document.getElementById('framework-dropdown');

        if (activeFilter === 'all') {
            // Activate "All Frameworks" button
            if (allBtn) {
                allBtn.classList.add('active', 'btn-primary');
                allBtn.classList.remove('btn-ghost');
            }
            // Reset dropdown selection
            if (dropdown) {
                dropdown.value = '';
                dropdown.selectedIndex = 0;
            }
        } else {
            // Deactivate "All Frameworks" button
            if (allBtn) {
                allBtn.classList.remove('active', 'btn-primary');
                allBtn.classList.add('btn-ghost');
            }
            // Set dropdown to selected framework
            if (dropdown) {
                dropdown.value = activeFilter;
            }
        }
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
