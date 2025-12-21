/**
 * Champion Panels JavaScript
 * ESG Champions Platform
 */

class ChampionPanels {
    constructor() {
        this.panels = [];
        this.currentFilter = 'all';
        this.currentPanelId = null;
        this.currentPanelName = '';
        this.indicators = [];
        this.selectedIndicators = new Set();
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
            <div class="panel-card ${panel.category}" data-panel-id="${panel.id}" data-panel-name="${panel.name}" style="cursor: pointer;">
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

        // Add click handlers to panel cards
        container.querySelectorAll('.panel-card').forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                const panelId = card.dataset.panelId;
                const panelName = card.dataset.panelName;
                this.openIndicatorModal(panelId, panelName);
            });
        });
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
        const modal = document.getElementById('indicator-modal');
        const closeBtn = document.getElementById('modal-close-btn');
        const cancelBtn = document.getElementById('modal-cancel-btn');
        const submitBtn = document.getElementById('modal-submit-btn');
        const selectAllCheckbox = document.getElementById('select-all-indicators');
        const searchInput = document.getElementById('indicator-search');

        // Close modal handlers
        closeBtn.addEventListener('click', () => this.closeModal());
        cancelBtn.addEventListener('click', () => this.closeModal());
        
        // Click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
                this.closeModal();
            }
        });

        // Select all toggle
        selectAllCheckbox.addEventListener('change', (e) => {
            this.toggleSelectAll(e.target.checked);
        });

        // Search functionality
        searchInput.addEventListener('input', (e) => {
            this.filterIndicators(e.target.value);
        });

        // Submit button
        submitBtn.addEventListener('click', () => {
            this.submitSelectedIndicators();
        });
    }

    async openIndicatorModal(panelId, panelName) {
        this.currentPanelId = panelId;
        this.currentPanelName = panelName;
        this.selectedIndicators.clear();
        
        const modal = document.getElementById('indicator-modal');
        const panelNameEl = document.getElementById('modal-panel-name');
        const indicatorsList = document.getElementById('indicators-list');
        const submitBtn = document.getElementById('modal-submit-btn');
        const selectAllCheckbox = document.getElementById('select-all-indicators');
        const searchInput = document.getElementById('indicator-search');

        // Reset state
        panelNameEl.textContent = panelName;
        searchInput.value = '';
        selectAllCheckbox.checked = false;
        submitBtn.disabled = true;
        
        // Show loading state
        indicatorsList.innerHTML = `
            <div class="modal-loading">
                <div class="loading-spinner"></div>
                <p>Loading indicators...</p>
            </div>
        `;

        // Show modal with animation
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        // Fetch indicators for this panel
        try {
            this.indicators = await window.championDB.getIndicatorsByPanel(panelId);
            this.renderIndicators(this.indicators);
        } catch (error) {
            console.error('Error loading indicators:', error);
            indicatorsList.innerHTML = `
                <div class="modal-error">
                    <p>Failed to load indicators. Please try again.</p>
                    <button class="btn btn-secondary btn-sm" onclick="location.reload()">Retry</button>
                </div>
            `;
        }
    }

    renderIndicators(indicators) {
        const indicatorsList = document.getElementById('indicators-list');
        
        if (!indicators || indicators.length === 0) {
            indicatorsList.innerHTML = `
                <div class="modal-empty">
                    <p>No indicators available for this panel.</p>
                </div>
            `;
            this.updateSelectedCount();
            return;
        }

        indicatorsList.innerHTML = indicators.map(indicator => `
            <label class="indicator-item" data-indicator-id="${indicator.id}">
                <input 
                    type="checkbox" 
                    class="indicator-checkbox" 
                    value="${indicator.id}"
                    data-name="${indicator.name}"
                >
                <div class="indicator-content">
                    <h4 class="indicator-name">${indicator.name}</h4>
                    <p class="indicator-description">${indicator.description || 'No description available'}</p>
                    ${indicator.methodology ? `
                        <span class="indicator-meta">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <path d="M12 16v-4"></path>
                                <path d="M12 8h.01"></path>
                            </svg>
                            ${indicator.methodology.substring(0, 80)}${indicator.methodology.length > 80 ? '...' : ''}
                        </span>
                    ` : ''}
                </div>
            </label>
        `).join('');

        // Add change handlers
        indicatorsList.querySelectorAll('.indicator-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.selectedIndicators.add(e.target.value);
                } else {
                    this.selectedIndicators.delete(e.target.value);
                }
                this.updateSelectedCount();
                this.updateSelectAllState();
            });
        });

        this.updateSelectedCount();
    }

    filterIndicators(searchTerm) {
        const term = searchTerm.toLowerCase().trim();
        const items = document.querySelectorAll('.indicator-item');
        
        items.forEach(item => {
            const name = item.querySelector('.indicator-name').textContent.toLowerCase();
            const description = item.querySelector('.indicator-description').textContent.toLowerCase();
            
            if (name.includes(term) || description.includes(term)) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    }

    toggleSelectAll(checked) {
        const checkboxes = document.querySelectorAll('.indicator-checkbox');
        
        checkboxes.forEach(checkbox => {
            const item = checkbox.closest('.indicator-item');
            // Only toggle visible items
            if (item.style.display !== 'none') {
                checkbox.checked = checked;
                if (checked) {
                    this.selectedIndicators.add(checkbox.value);
                } else {
                    this.selectedIndicators.delete(checkbox.value);
                }
            }
        });
        
        this.updateSelectedCount();
    }

    updateSelectAllState() {
        const checkboxes = document.querySelectorAll('.indicator-checkbox');
        const visibleCheckboxes = Array.from(checkboxes).filter(cb => 
            cb.closest('.indicator-item').style.display !== 'none'
        );
        const allChecked = visibleCheckboxes.length > 0 && 
            visibleCheckboxes.every(cb => cb.checked);
        
        document.getElementById('select-all-indicators').checked = allChecked;
    }

    updateSelectedCount() {
        const total = this.indicators.length;
        const selected = this.selectedIndicators.size;
        const countEl = document.getElementById('selected-count');
        const submitBtn = document.getElementById('modal-submit-btn');
        
        countEl.textContent = `${selected} of ${total} selected`;
        submitBtn.disabled = selected === 0;
        
        if (selected > 0) {
            submitBtn.textContent = `Review ${selected} Indicator${selected > 1 ? 's' : ''}`;
        } else {
            submitBtn.textContent = 'Review Selected Indicators';
        }
    }

    closeModal() {
        const modal = document.getElementById('indicator-modal');
        modal.classList.add('hidden');
        document.body.style.overflow = '';
        
        // Reset state
        this.currentPanelId = null;
        this.currentPanelName = '';
        this.indicators = [];
        this.selectedIndicators.clear();
    }

    submitSelectedIndicators() {
        if (this.selectedIndicators.size === 0) {
            alert('Please select at least one indicator to review.');
            return;
        }

        // Store selected indicators in sessionStorage
        const selectionData = {
            panelId: this.currentPanelId,
            panelName: this.currentPanelName,
            indicatorIds: Array.from(this.selectedIndicators),
            timestamp: Date.now()
        };
        
        sessionStorage.setItem('selectedIndicators', JSON.stringify(selectionData));
        
        // Navigate to review page
        window.location.href = `/champion-indicators.html?panel=${this.currentPanelId}&selected=${Array.from(this.selectedIndicators).join(',')}`;
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
document.addEventListener('DOMContentLoaded', () => {
    const panels = new ChampionPanels();
    panels.init();
});
