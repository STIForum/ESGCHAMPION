/**
 * Champion Panels JavaScript
 * ESG Champions Platform
 */

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
        
        // Load panels
        await this.loadPanels();
        
        // Setup filters
        this.setupFilters();
        
        // Setup modal
        this.setupModal();
        
        // Check URL params for category filter
        const params = new URLSearchParams(window.location.search);
        const category = params.get('category');
        if (category) {
            this.filterPanels(category);
            this.updateFilterButtons(category);
        }
    }

    async loadPanels() {
        try {
            const panels = await window.championDB.getPanelsWithCounts();
            this.panels = panels;
            
            // Group by category
            const environmental = panels.filter(p => p.category === 'environmental');
            const social = panels.filter(p => p.category === 'social');
            const governance = panels.filter(p => p.category === 'governance');
            
            // Render each category
            this.renderPanelCategory('environmental-panels', environmental);
            this.renderPanelCategory('social-panels', social);
            this.renderPanelCategory('governance-panels', governance);
            
            // Show content
            document.getElementById('loading-state').classList.add('hidden');
            document.getElementById('panels-grid').classList.remove('hidden');
            
        } catch (error) {
            console.error('Error loading panels:', error);
            this.showError('Failed to load panels. Please refresh the page.');
        }
    }

    renderPanelCategory(containerId, panels) {
        const container = document.getElementById(containerId);
        
        if (!panels || panels.length === 0) {
            container.innerHTML = '<p class="text-secondary">No panels available in this category.</p>';
            return;
        }

        container.innerHTML = panels.map(panel => `
            <div class="panel-card ${panel.category}" style="cursor: pointer;" onclick="panelsPage.openIndicatorModal('${panel.id}', '${panel.name}')">
                <div class="flex-between mb-4">
                    <span class="badge badge-${panel.category}">${panel.category}</span>
                    <span class="text-muted" style="font-size: var(--text-sm);">
                        ${panel.indicator_count || 0} indicators
                    </span>
                </div>
                <h3 style="font-size: var(--text-xl); margin-bottom: var(--space-2);">${panel.name}</h3>
                <p class="text-secondary" style="margin-bottom: var(--space-4); font-size: var(--text-sm);">
                    ${panel.description || 'Explore indicators in this panel'}
                </p>
                <div class="flex-between">
                    <span class="btn btn-secondary btn-sm">Select Indicators</span>
                </div>
            </div>
        `).join('');
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
        this.selectedIndicators.clear();
        
        const backdrop = document.getElementById('indicator-modal-backdrop');
        const modal = document.getElementById('indicator-modal');
        const indicatorsList = document.getElementById('indicators-list');
        const reviewBtn = document.getElementById('review-selected-btn');
        
        // Reset UI
        reviewBtn.disabled = true;
        document.getElementById('indicator-search').value = '';
        indicatorsList.innerHTML = '<div class="text-center p-6"><div class="loading-spinner"></div></div>';
        
        // Show modal (add active class for CSS visibility)
        backdrop.classList.add('active');
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        try {
            // Fetch ALL indicators (not panel-specific)
            this.allIndicators = await window.championDB.getAllIndicators();
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

        container.innerHTML = indicators.map(indicator => `
            <label class="indicator-checkbox-item" data-id="${indicator.id}">
                <input type="checkbox" value="${indicator.id}" ${this.selectedIndicators.has(indicator.id) ? 'checked' : ''} onchange="panelsPage.toggleIndicator('${indicator.id}')">
                <div class="indicator-info">
                    <div class="indicator-name">${indicator.name}</div>
                    <div class="indicator-desc">${indicator.description || 'No description'}</div>
                    ${indicator.panels ? `<div class="indicator-panel">Panel: ${indicator.panels.name}</div>` : ''}
                </div>
            </label>
        `).join('');

        this.updateSelectionCount();
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
        const checkboxes = document.querySelectorAll('#indicators-list input[type="checkbox"]');
        
        if (this.selectedIndicators.size === this.allIndicators.length) {
            // Deselect all
            this.selectedIndicators.clear();
            checkboxes.forEach(cb => cb.checked = false);
            btn.textContent = 'Select All';
        } else {
            // Select all
            this.allIndicators.forEach(ind => this.selectedIndicators.add(ind.id));
            checkboxes.forEach(cb => cb.checked = true);
            btn.textContent = 'Deselect All';
        }
        
        this.updateSelectionCount();
    }

    updateSelectionCount() {
        const countEl = document.getElementById('selection-count');
        const reviewBtn = document.getElementById('review-selected-btn');
        const selectAllBtn = document.getElementById('select-all-btn');
        
        countEl.textContent = `${this.selectedIndicators.size} of ${this.allIndicators.length} selected`;
        reviewBtn.disabled = this.selectedIndicators.size === 0;
        
        if (this.selectedIndicators.size === this.allIndicators.length && this.allIndicators.length > 0) {
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
            indicatorIds: Array.from(this.selectedIndicators)
        }));

        // Navigate with URL params
        window.location.href = `/champion-indicators.html?selected=${selectedIds}`;
    }

    filterPanels(filter) {
        this.currentFilter = filter;
        
        const sections = {
            environmental: document.getElementById('environmental-section'),
            social: document.getElementById('social-section'),
            governance: document.getElementById('governance-section')
        };

        if (filter === 'all') {
            Object.values(sections).forEach(section => {
                section.classList.remove('hidden');
            });
        } else {
            Object.entries(sections).forEach(([category, section]) => {
                if (category === filter) {
                    section.classList.remove('hidden');
                } else {
                    section.classList.add('hidden');
                }
            });
        }

        // Update URL without reload
        const url = new URL(window.location);
        if (filter === 'all') {
            url.searchParams.delete('category');
        } else {
            url.searchParams.set('category', filter);
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
        const loadingState = document.getElementById('loading-state');
        loadingState.innerHTML = `
            <div class="text-center">
                <div class="alert alert-error">${message}</div>
                <button class="btn btn-primary mt-4" onclick="location.reload()">Retry</button>
            </div>
        `;
    }
}

// Initialize on DOM ready
let panelsPage;
document.addEventListener('DOMContentLoaded', () => {
    panelsPage = new ChampionPanels();
    panelsPage.init();
});
