/**
 * Champion Indicators JavaScript
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
                <a href="/champion-panels.html" class="btn btn-primary mt-4">Back to Panels</a>
            </div>
        `;
    }
}

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

        // Option sets for the assessment form
        this.smeSizeOptions = [
            { value: 'micro', label: 'Micro (0–9 employees / <£1.6m revenue)' },
            { value: 'small', label: 'Small (10–49 / £1.6–£8m revenue)' },
            { value: 'medium', label: 'Medium (50–249 / £8–£40m revenue)' },
            { value: 'upper_medium', label: 'Upper-medium (250–499 / £40–£200m revenue)' }
        ];

        this.sectorOptions = [
            { value: 'agriculture_forestry_fishing', label: 'Agriculture, Forestry and Fishing' },
            { value: 'mining_quarrying_utilities', label: 'Mining and Quarrying; Electricity, Gas and Air Conditioning Supply; Water Supply; Sewerage, Waste Management and Remediation Activities' },
            { value: 'manufacturing', label: 'Manufacturing' },
            { value: 'construction', label: 'Construction' },
            { value: 'wholesale_retail_repair', label: 'Wholesale and Retail Trade; Repair of Motor Vehicles and Motorcycles' },
            { value: 'transportation_storage', label: 'Transportation and Storage' },
            { value: 'accommodation_food', label: 'Accommodation and Food Service Activities' },
            { value: 'information_communication', label: 'Information and Communication' },
            { value: 'financial_insurance', label: 'Financial and Insurance Activities' },
            { value: 'real_estate', label: 'Real Estate Activities' },
            { value: 'professional_scientific_technical', label: 'Professional, Scientific and Technical Activities' },
            { value: 'administrative_support', label: 'Administrative and Support Service Activities' },
            { value: 'education', label: 'Education' },
            { value: 'human_health_social_work', label: 'Human Health and Social Work Activities' },
            { value: 'arts_entertainment_recreation', label: 'Arts, Entertainment and Recreation' },
            { value: 'other_services', label: 'Other Service Activities' }
        ];

        this.frameworkOptions = [
            { value: 'gri', label: 'GRI' },
            { value: 'esrs', label: 'ESRS' },
            { value: 'ifrs', label: 'IFRS' }
        ];

        this.geographicFootprintOptions = [
            { value: 'uk_only', label: 'UK Only' },
            { value: 'uk_eu', label: 'UK + EU' },
            { value: 'global', label: 'Global' }
        ];

        this.estimatedTimeOptions = [
            { value: 'under_30', label: '<30 min' },
            { value: '30_to_90', label: '30–90 min' },
            { value: 'over_90', label: '>90 min' }
        ];

        this.supportRequiredOptions = [
            { value: 'none', label: 'None' },
            { value: 'basic_guidance', label: 'Basic Guidance (online references and AI)' },
            { value: 'external_consultant', label: 'External Consultant' }
        ];

        this.stakeholderPriorityOptions = [
            { value: 'customers', label: 'Customers' },
            { value: 'investors', label: 'Investors' },
            { value: 'regulators', label: 'Regulators' },
            { value: 'employees', label: 'Employees' }
        ];

        this.esgClasses = [
            { value: 'environment', label: 'Environment' },
            { value: 'social', label: 'Social' },
            { value: 'governance', label: 'Governance' }
        ];

        this.sdgOptions = Array.from({ length: 17 }, (_, idx) => {
            const n = idx + 1;
            const names = [
                'No Poverty',
                'Zero Hunger',
                'Good Health and Well-Being',
                'Quality Education',
                'Gender Equality',
                'Clean Water and Sanitation',
                'Affordable and Clean Energy',
                'Decent Work and Economic Growth',
                'Industry, Innovation and Infrastructure',
                'Reduced Inequalities',
                'Sustainable Cities and Communities',
                'Responsible Consumption and Production',
                'Climate Action',
                'Life Below Water',
                'Life on Land',
                'Peace, Justice and Strong Institutions',
                'Partnerships for the Goals'
            ];
            return { value: n, label: `SDG ${n} – ${names[idx]}` };
        });

        this.triLevelOptions = [
            { value: 'high', label: 'High' },
            { value: 'medium', label: 'Medium' },
            { value: 'low', label: 'Low' }
        ];

        this.regulatoryOptions = [
            { value: 'mandatory', label: 'Mandatory' },
            { value: 'strongly_expected', label: 'Strongly Expected' },
            { value: 'optional', label: 'Optional' }
        ];

        this.tierOptions = [
            { value: 'core', label: 'Core' },
            { value: 'recommended', label: 'Recommended' },
            { value: 'optional', label: 'Optional' }
        ];

        this.helpText = {
            smeSize: 'Select the size band of SMEs you have in mind when scoring this indicator. This anchors feasibility, cost, and relevance to a realistic resource level (e.g., micro vs medium firms will differ strongly).',
            sector: 'Choose the main industry or sector for which you are validating this indicator. STIF uses this to understand sector-specific materiality (e.g., water for food, emissions for manufacturing).',
            geographicFootprint: 'Select the geographic scope for this validation. Different regions have different regulatory requirements.',
            indicatorTitle: 'This is the human-readable name of the indicator. It helps SMEs and reviewers understand what is being measured without reading the full framework text.',
            indicatorDescription: 'Short description of the description of the indicator.',
            frameworkCodes: 'These are the official framework references (e.g., GRI, ESRS, IFRS). They allow STIF to cross-link to standards and ensure regulatory alignment.',
            primaryFramework: 'Select the main standard that defines this indicator. This helps normalise overlapping indicators across frameworks and determine regulatory weight.',
            esgClass: 'Classify the indicator as Environment, Social, or Governance. This supports high-level reporting structure and balance across ESG pillars.',
            sdgs: 'Select the SDGs that this indicator meaningfully contributes to. STIF uses SDG links to slightly uplift indicators aligned with an SME\'s declared SDG priorities, without overriding mandatory requirements.',
            relevance: 'Assess how material this indicator typically is for SMEs of this size and sector. High = core to the SME\'s material impacts or value creation in this sector; Low = usually peripheral or not relevant.',
            regulatory: 'Judge the strength of external expectations (law, ESRS/IFRS/GRI, key customers, certifications). Mandatory indicators must stay in the Core tier regardless of other scores.',
            feasibility: 'Rate how realistic it is for this SME profile to measure the indicator within 6–12 months, using typical systems and processes in that sector and size band.',
            cost: 'Estimate the proportional effort and cost for this SME profile (internal time, tools, external support). High cost means the indicator is heavy relative to typical SME resources.',
            estimatedTime: 'Time required to report on this indicator by businesses.',
            supportRequired: 'This explains the level of support required to report on this indicator by SMEs (small and medium businesses).',
            misreporting: 'Assess how likely it is that SMEs mis-measure or mis-communicate this indicator. High risk covers ambiguous definitions, heavy estimation, or high reputational/regulatory stakes if wrong.',
            tier: 'Given your ratings above, choose the tier you believe this indicator should have for this SME size and sector.',
            stakeholderPriority: 'This priority explains to which stakeholder in the business that this indicator matters the most.',
            rationale: 'Add a brief justification for your tier choice, focusing on relevance and regulatory necessity vs cost and feasibility. This supports transparency and later audit or refinement of the rules.',
            tags: 'If relevant, tag specific sub-sectors (e.g., Meat processing, Software, Apparel). This allows finer-grained use of your assessment in particular niches.',
            notes: 'Capture any important conditions or exceptions (e.g., only feasible in water-stressed regions).'
        };
    }

    async init() {
        // Wait for services to be ready
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Check if profile is complete (especially important for LinkedIn users)
        if (window.championAuth?.isAuthenticated?.() && 
            !window.championAuth.requireCompleteProfile(true)) {
            return; // Will redirect to profile page
        }
        
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

    getEmptyReviewState() {
        return {
            indicatorId: null,
            indicatorName: '',
            sme_size_band: '',
            primary_sector: '',
            geographic_footprint: '',
            primary_framework: '',
            esg_class: '',
            sdgs: [],
            relevance: '',
            regulatory_necessity: '',
            operational_feasibility: '',
            cost_to_collect: '',
            estimated_time: '',
            support_required: '',
            misreporting_risk: '',
            suggested_tier: '',
            stakeholder_priority: '',
            rationale: '',
            optional_tags: [],
            notes: '',
            completed: false
        };
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
            
            // Show content using centralized utility
            _hideLoading('loading-state');
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
        const savedReview = this.reviewsData[indicator.id];
        const hasLocalReview = savedReview && savedReview.completed;

        let reviews = [];
        try {
            const data = await window.championDB.getIndicatorWithReviews(indicator.id);
            reviews = data.reviews || [];
        } catch (error) {
            console.error('Error loading reviews:', error);
        }

        const frameworkMapping = indicator.gri_standard || indicator.framework_mapping || 'GRI 305-1 / ISSB S2';
        const frameworkCodeDisplay = indicator.framework_code || frameworkMapping;
        const source = indicator.source || 'SME Hub';
        const sectorContext = indicator.sector_context || 'All';

        const state = {
            ...this.getEmptyReviewState(),
            ...savedReview,
            indicatorId: indicator.id,
            indicatorName: indicator.name
        };

        const scoringLocked = !(state.sme_size_band && state.primary_sector);
        const tierLocked = !(
            state.relevance &&
            state.regulatory_necessity &&
            state.operational_feasibility &&
            state.cost_to_collect &&
            state.misreporting_risk
        );

        const formHtml = `
            <form id="review-form" onsubmit="indicatorsPage.saveIndicatorReview(event)">
                <input type="hidden" id="indicator_id" value="${indicator.id}" />

                <div class="section-block">
                    <div class="section-title">A. SME Context for This Validation</div>
                    <div class="field-row">
                        <div class="field-header">
                            <label class="form-label" for="sme_size_band">SME Size Band <span style="color: var(--error);">*</span></label>
                            ${this.renderInfo('smeSize', indicator.id)}
                        </div>
                        <select id="sme_size_band" class="form-select" required>
                            <option value="" disabled selected>Select...</option>
                            ${this.smeSizeOptions.map(opt => `<option value="${opt.value}" ${state.sme_size_band === opt.value ? 'selected' : ''}>${opt.label}</option>`).join('')}
                        </select>
                    </div>
                    <div class="field-row">
                        <div class="field-header">
                            <label class="form-label" for="primary_sector">Primary Industry / Sector <span style="color: var(--error);">*</span></label>
                            ${this.renderInfo('sector', indicator.id)}
                        </div>
                        <select id="primary_sector" class="form-select" required>
                            <option value="" disabled selected>Select...</option>
                            ${this.sectorOptions.map(opt => `<option value="${opt.value}" ${state.primary_sector === opt.value ? 'selected' : ''}>${opt.label}</option>`).join('')}
                        </select>
                    </div>
                    <div class="field-row">
                        <div class="field-header">
                            <label class="form-label">Geographic Footprint</label>
                            ${this.renderInfo('geographicFootprint', indicator.id)}
                        </div>
                        ${this.renderSingleChips('geographic_footprint', this.geographicFootprintOptions, state.geographic_footprint, false)}
                    </div>
                </div>

                <div class="section-block">
                    <div class="section-title">B. Indicator Basics (Mostly Pre-filled)</div>
                    <div class="field-row">
                        <div class="field-header">
                            <label class="form-label">Indicator Title</label>
                            ${this.renderInfo('indicatorTitle', indicator.id)}
                        </div>
                        <input type="text" class="form-input" value="${indicator.name || ''}" readonly>
                        <span class="pill-muted">Read-only</span>
                    </div>
                    <div class="field-row">
                        <div class="field-header">
                            <label class="form-label">Framework Code(s)</label>
                            ${this.renderInfo('frameworkCodes', indicator.id)}
                        </div>
                        <input type="text" class="form-input" value="${frameworkCodeDisplay}" readonly>
                        <span class="pill-muted">Read-only</span>
                    </div>
                    <div class="field-row">
                        <div class="field-header">
                            <label class="form-label">Indicator Description</label>
                            ${this.renderInfo('indicatorDescription', indicator.id)}
                        </div>
                        <textarea class="form-input" rows="3" readonly style="resize: none;">${indicator.description || ''}</textarea>
                        <span class="pill-muted">Read-only</span>
                    </div>
                    <div class="grid" style="grid-template-columns: 1fr 1fr; gap: var(--space-4);">
                        <div class="field-row">
                            <div class="field-header">
                                <label class="form-label" for="primary_framework">Primary Framework</label>
                                ${this.renderInfo('primaryFramework', indicator.id)}
                            </div>
                            <select id="primary_framework" class="form-select">
                                <option value="" disabled selected>Select...</option>
                                ${this.frameworkOptions.map(opt => `<option value="${opt.value}" ${state.primary_framework === opt.value ? 'selected' : ''}>${opt.label}</option>`).join('')}
                            </select>
                        </div>
                        <div class="field-row">
                            <div class="field-header">
                                <label class="form-label" for="esg_class">ESG Class</label>
                                ${this.renderInfo('esgClass', indicator.id)}
                            </div>
                            <select id="esg_class" class="form-select">
                                <option value="" disabled selected>Select...</option>
                                ${this.esgClasses.map(opt => `<option value="${opt.value}" ${state.esg_class === opt.value ? 'selected' : ''}>${opt.label}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="field-row">
                        <div class="field-header">
                            <label class="form-label">Related SDGs</label>
                            ${this.renderInfo('sdgs', indicator.id)}
                        </div>
                        ${this.renderSdgChips(state.sdgs)}
                        <span class="inline-helper">Multi-select chips</span>
                    </div>
                </div>

                <div class="section-block">
                    <div class="section-title">C. Five-Dimension Scoring (For This SME Size & Industry)</div>
                    <p class="inline-helper" style="margin-bottom: var(--space-3);">Use 3-level chips per row; one click each.</p>

                    <div class="field-row">
                        <div class="field-header">
                            <label class="form-label">Relevance for This SME Profile <span style="color: var(--error);">*</span></label>
                            ${this.renderInfo('relevance', indicator.id)}
                        </div>
                        ${this.renderSingleChips('relevance', this.triLevelOptions, state.relevance, scoringLocked)}
                    </div>

                    <div class="field-row">
                        <div class="field-header">
                            <label class="form-label">Regulatory Necessity <span style="color: var(--error);">*</span></label>
                            ${this.renderInfo('regulatory', indicator.id)}
                        </div>
                        ${this.renderSingleChips('regulatory_necessity', this.regulatoryOptions, state.regulatory_necessity, scoringLocked)}
                    </div>

                    <div class="field-row">
                        <div class="field-header">
                            <label class="form-label">Operational Feasibility (For This SME Profile) <span style="color: var(--error);">*</span></label>
                            ${this.renderInfo('feasibility', indicator.id)}
                        </div>
                        ${this.renderSingleChips('operational_feasibility', this.triLevelOptions, state.operational_feasibility, scoringLocked)}
                    </div>

                    <div class="field-row">
                        <div class="field-header">
                            <label class="form-label">Cost-to-Collect (Relative for This SME Size) <span style="color: var(--error);">*</span></label>
                            ${this.renderInfo('cost', indicator.id)}
                        </div>
                        ${this.renderSingleChips('cost_to_collect', this.triLevelOptions, state.cost_to_collect, scoringLocked)}
                    </div>

                    <div class="field-row">
                        <div class="field-header">
                            <label class="form-label">Misreporting Risk <span style="color: var(--error);">*</span></label>
                            ${this.renderInfo('misreporting', indicator.id)}
                        </div>
                        ${this.renderSingleChips('misreporting_risk', this.triLevelOptions, state.misreporting_risk, scoringLocked)}
                    </div>

                    <div class="field-row">
                        <div class="field-header">
                            <label class="form-label">Estimated Time to Collect</label>
                            ${this.renderInfo('estimatedTime', indicator.id)}
                        </div>
                        ${this.renderSingleChips('estimated_time', this.estimatedTimeOptions, state.estimated_time, false)}
                    </div>

                    <div class="field-row">
                        <div class="field-header">
                            <label class="form-label">Support Required to Report This Indicator</label>
                            ${this.renderInfo('supportRequired', indicator.id)}
                        </div>
                        ${this.renderSingleChips('support_required', this.supportRequiredOptions, state.support_required, false)}
                    </div>
                </div>

                <div class="section-block">
                    <div class="section-title">D. Overall Tier and Short Rationale</div>

                    <div class="field-row">
                        <div class="field-header">
                            <label class="form-label">Stakeholder Priority</label>
                            ${this.renderInfo('stakeholderPriority', indicator.id)}
                        </div>
                        ${this.renderMultiChips('stakeholder_priority', this.stakeholderPriorityOptions, state.stakeholder_priority)}
                        <span class="inline-helper">Multi-select chips</span>
                    </div>

                    <div class="field-row">
                        <div class="field-header">
                            <label class="form-label" for="suggested_tier">Suggested STIF Tier</label>
                            ${this.renderInfo('tier', indicator.id)}
                        </div>
                        <select id="suggested_tier" class="form-select" ${tierLocked ? 'disabled' : ''}>
                            <option value="" disabled selected>Select...</option>
                            ${this.tierOptions.map(opt => `<option value="${opt.value}" ${state.suggested_tier === opt.value ? 'selected' : ''}>${opt.label}</option>`).join('')}
                        </select>
                        <div id="tier-lock-hint" class="locked-hint" style="${tierLocked ? '' : 'display:none;'}">Score all five dimensions to unlock tier selection.</div>
                        <div id="mandatory-note" class="badge-note" style="${state.regulatory_necessity === 'mandatory' ? '' : 'display:none;'}">Regulatory Necessity = Mandatory — Core is expected (not auto-enforced).</div>
                    </div>

                    <div class="field-row">
                        <div class="field-header">
                            <label class="form-label" for="rationale">One-Line Rationale <span style="color: var(--error);">*</span></label>
                            ${this.renderInfo('rationale', indicator.id)}
                        </div>
                        <input type="text" id="rationale" class="form-input" maxlength="150" placeholder="e.g., Mandatory under ESRS, high relevance in food manufacturing, low data effort." value="${state.rationale || ''}" required>
                        <div class="inline-helper">Short text, max 150 characters</div>
                    </div>
                </div>

                <div class="section-block">
                    <details id="optional-section">
                        <summary class="section-title" style="cursor: pointer;">E. Optional Extra Tags (Collapsed)</summary>
                        <div class="field-row">
                            <div class="field-header">
                                <label class="form-label" for="optional_tags_input">More Specific Sector / NACE Tags</label>
                                ${this.renderInfo('tags', indicator.id)}
                            </div>
                            <div class="chip-group" id="optional-tags-chips"></div>
                            <input type="text" id="optional_tags_input" class="form-input" placeholder="Optional chips — type a tag and press Enter" />
                        </div>
                        <div class="field-row">
                            <div class="field-header">
                                <label class="form-label" for="notes">Notes / Caveats</label>
                                ${this.renderInfo('notes', indicator.id)}
                            </div>
                            <textarea id="notes" class="form-textarea" rows="3" placeholder="Optional short text">${state.notes || ''}</textarea>
                        </div>
                    </details>
                </div>

                <div class="flex-between" style="margin-top: var(--space-4); gap: var(--space-3);">
                    <div class="pill-muted">Save takes ~1–2 minutes per indicator</div>
                    <button type="submit" class="btn btn-primary" id="save-review-btn">Save Indicator Assessment</button>
                </div>
            </form>
        `;

        const savedSummaryHtml = `
            <div class="review-saved-card">
                <div class="review-saved-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                </div>
                <h4 class="review-saved-title">Assessment Saved</h4>
                <p class="review-saved-text">Your assessment is saved locally. Complete all indicators then submit the panel review.</p>
                <div class="review-saved-summary">
                    <div><strong>SME Size:</strong> ${this.smeSizeOptions.find(o => o.value === state.sme_size_band)?.label || '-'}</div>
                    <div><strong>Sector:</strong> ${this.sectorOptions.find(o => o.value === state.primary_sector)?.label || '-'}</div>
                    <div><strong>Tier:</strong> ${this.tierOptions.find(o => o.value === state.suggested_tier)?.label || '—'}</div>
                    <div style="margin-top: var(--space-2);"><strong>Rationale:</strong> ${this.truncate(state.rationale || '', 120)}</div>
                </div>
                <button class="btn btn-ghost btn-sm" style="margin-top: var(--space-3);" onclick="indicatorsPage.editReview('${indicator.id}')">Edit Assessment</button>
            </div>
        `;

        container.innerHTML = `
            <div class="indicator-header">
                <h2 style="margin-bottom: var(--space-2); color: var(--gray-800);">${indicator.name}</h2>
                <p class="text-secondary">${indicator.description || 'No description available'}</p>
            </div>
            <div class="indicator-body">
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

                ${!isAuthenticated ? `
                    <div class="alert alert-info">
                        <a href="/champion-login.html?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}">Sign in</a> to submit an assessment for this indicator.
                    </div>
                ` : this.hasUserReviewed(indicator.id) ? `
                    <div class="review-submitted-card">
                        <div class="review-submitted-icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                        </div>
                        <h4 class="review-submitted-title">Assessment Submitted</h4>
                        <p class="review-submitted-text">Thank you! This assessment is awaiting admin approval.</p>
                        <div class="review-submitted-badge">
                            <span class="badge badge-warning">Pending Review</span>
                        </div>
                    </div>
                ` : hasLocalReview ? savedSummaryHtml : formHtml}

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

        // Bind interactions for the freshly rendered form
        if (isAuthenticated && !hasLocalReview && !this.hasUserReviewed(indicator.id)) {
            this.bindAssessmentForm(state);
        }
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
                                ${_formatDate(review.created_at)}
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
            window.showToast('Please sign in to submit an assessment', 'error');
            return;
        }

        const state = this.buildStateFromForm();
        state.indicatorId = this.selectedIndicator?.id;
        state.indicatorName = this.selectedIndicator?.name;

        const validation = this.validateState(state);
        if (!validation.valid) {
            return;
        }

        state.completed = true;
        this.reviewsData[state.indicatorId] = state;

        window.showToast('Assessment saved! Continue to the next indicator.', 'success');

        // Update UI/progress
        this.renderIndicatorsList();

        const currentIndex = this.indicators.findIndex(i => i.id === this.selectedIndicator.id);
        const nextIndicator = this.indicators[currentIndex + 1];

        if (nextIndicator && !this.reviewsData[nextIndicator.id]?.completed) {
            setTimeout(() => this.selectIndicator(nextIndicator.id), 400);
        } else {
            await this.renderIndicatorDetail(this.selectedIndicator);
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
                sme_size_band: review.sme_size_band,
                primary_sector: review.primary_sector,
                geographic_footprint: review.geographic_footprint || null,
                primary_framework: review.primary_framework,
                esg_class: review.esg_class,
                sdgs: review.sdgs || [],
                relevance: review.relevance,
                regulatory_necessity: review.regulatory_necessity,
                operational_feasibility: review.operational_feasibility,
                cost_to_collect: review.cost_to_collect,
                misreporting_risk: review.misreporting_risk,
                estimated_time: review.estimated_time || null,
                support_required: review.support_required || null,
                stakeholder_priority: review.stakeholder_priority || [],
                suggested_tier: review.suggested_tier,
                rationale: review.rationale,
                optional_tags: review.optional_tags || [],
                notes: review.notes || null
            }));

            console.log('Submitting panel review with indicator reviews:', indicatorReviews);

            // Submit to database - this must succeed before we update any local state
            const result = await window.championDB.createPanelReviewSubmission(
                this.currentPanelId,
                indicatorReviews
            );

            console.log('Panel review submission result:', result);

            // Verify both submission AND indicator reviews were saved
            if (result && result.submission && result.submission.id) {
                // Check if indicator reviews were actually saved
                if (!result.indicatorReviews || result.indicatorReviews.length === 0) {
                    console.error('Submission created but indicator reviews not saved!');
                    throw new Error('Failed to save indicator reviews. Please try again.');
                }

                console.log(`Successfully saved ${result.indicatorReviews.length} indicator reviews`);

                // Mark indicators as reviewed in session
                for (const review of reviewsToSubmit) {
                    this.markIndicatorAsReviewed(review.indicatorId);
                }

                // Clear local review data
                this.reviewsData = {};
                
                // Mark this panel as awaiting approval (with database ID)
                this.markPanelAsAwaitingApproval(result.submission.id);
                
                // Show success state
                this.showPanelReviewSuccess(reviewsToSubmit.length);
            } else {
                throw new Error('No submission returned from database');
            }

        } catch (error) {
            console.error('Error submitting panel review:', error);
            
            // Check if it's a database table not found error
            const errorMessage = error.message || error.toString();
            if (errorMessage.includes('does not exist') || errorMessage.includes('relation')) {
                window.showToast('Database not configured. Please run the SQL migration first.', 'error');
            } else {
                window.showToast('Failed to submit panel review. Please try again.', 'error');
            }
            
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
        const existing = this.reviewsData[indicatorId];
        if (existing) {
            this.reviewsData[indicatorId] = { ...existing, completed: false };
        }
        this.renderIndicatorsList();
        this.selectIndicator(indicatorId);
    }

    markPanelAsAwaitingApproval(submissionId) {
        if (!this.currentPanelId) return;
        
        // Store in sessionStorage - used for UI display on panels page
        const panelReviews = JSON.parse(sessionStorage.getItem('panelReviews') || '{}');
        panelReviews[this.currentPanelId] = 'pending';
        sessionStorage.setItem('panelReviews', JSON.stringify(panelReviews));
        
        // Also store reference to the database submission for admin fallback
        const panelSubmissions = JSON.parse(localStorage.getItem('panelSubmissions') || '[]');
        const submission = {
            id: submissionId, // Use the real database submission ID
            panelId: this.currentPanelId,
            panelName: this.currentPanelName,
            indicatorIds: this.selectedIndicatorIds,
            indicatorCount: this.indicators.length,
            submittedAt: new Date().toISOString(),
            status: 'pending',
            championId: window.championAuth?.getUser()?.id || null,
            championName: window.championAuth?.getUser()?.user_metadata?.full_name || 'Anonymous'
        };
        panelSubmissions.push(submission);
        localStorage.setItem('panelSubmissions', JSON.stringify(panelSubmissions));
    }

    clearPanelAwaitingApproval() {
        if (!this.currentPanelId) return;
        
        // Remove from sessionStorage
        const panelReviews = JSON.parse(sessionStorage.getItem('panelReviews') || '{}');
        delete panelReviews[this.currentPanelId];
        sessionStorage.setItem('panelReviews', JSON.stringify(panelReviews));
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

    isScoringUnlocked(state) {
        return Boolean(state.sme_size_band && state.primary_sector);
    }

    areDimensionsComplete(state) {
        return (
            state.relevance &&
            state.regulatory_necessity &&
            state.operational_feasibility &&
            state.cost_to_collect &&
            state.misreporting_risk
        );
    }

    bindAssessmentForm(state) {
        this.currentFormState = state;

        // Info popovers now work via CSS hover - no JS needed

        // Chip interactions (single-select + SDGs)
        document.querySelectorAll('.chip-group').forEach(group => {
            group.addEventListener('click', (event) => {
                const target = event.target.closest('.chip');
                if (!target) return;
                const field = target.getAttribute('data-field');
                const value = target.getAttribute('data-value');
                const isLocked = group.getAttribute('data-locked') === 'true';

                if (isLocked && field !== 'sdgs') {
                    window.showToast?.('Complete SME Size Band and Primary Industry first.', 'warning');
                    return;
                }

                if (field === 'sdgs') {
                    const numericValue = parseInt(value, 10);
                    const set = new Set(this.currentFormState.sdgs || []);
                    if (set.has(numericValue)) {
                        set.delete(numericValue);
                        target.classList.remove('selected');
                    } else {
                        set.add(numericValue);
                        target.classList.add('selected');
                    }
                    this.currentFormState.sdgs = Array.from(set).sort((a, b) => a - b);
                } else {
                    // Single select
                    group.querySelectorAll('.chip').forEach(chip => chip.classList.remove('selected'));
                    target.classList.add('selected');
                    this.currentFormState[field] = value;
                }

                this.refreshFormUI(this.currentFormState);
            });
        });

        const smeSize = document.getElementById('sme_size_band');
        const primarySector = document.getElementById('primary_sector');
        const primaryFramework = document.getElementById('primary_framework');
        const esgClass = document.getElementById('esg_class');
        const suggestedTier = document.getElementById('suggested_tier');
        const rationaleInput = document.getElementById('rationale');
        const notesInput = document.getElementById('notes');

        const handleSelectChange = (field, el) => {
            el.addEventListener('change', () => {
                this.currentFormState[field] = el.value;
                this.refreshFormUI(this.currentFormState);
            });
        };

        if (smeSize) handleSelectChange('sme_size_band', smeSize);
        if (primarySector) handleSelectChange('primary_sector', primarySector);
        if (primaryFramework) handleSelectChange('primary_framework', primaryFramework);
        if (esgClass) handleSelectChange('esg_class', esgClass);
        if (suggestedTier) handleSelectChange('suggested_tier', suggestedTier);

        if (rationaleInput) {
            rationaleInput.addEventListener('input', () => {
                this.currentFormState.rationale = rationaleInput.value.trim();
                this.refreshFormUI(this.currentFormState);
            });
        }

        if (notesInput) {
            notesInput.addEventListener('input', () => {
                this.currentFormState.notes = notesInput.value.trim();
            });
        }

        // Optional tags
        this.syncOptionalTags(this.currentFormState.optional_tags || []);
        const tagsInput = document.getElementById('optional_tags_input');
        if (tagsInput) {
            tagsInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const value = tagsInput.value.trim();
                    if (value) {
                        this.addOptionalTag(value);
                        tagsInput.value = '';
                    }
                }
            });
        }

        const tagChipContainer = document.getElementById('optional-tags-chips');
        if (tagChipContainer) {
            tagChipContainer.addEventListener('click', (e) => {
                const chip = e.target.closest('[data-tag-index]');
                if (!chip) return;
                const idx = parseInt(chip.getAttribute('data-tag-index'), 10);
                this.removeOptionalTag(idx);
            });
        }

        this.refreshFormUI(this.currentFormState);
    }

    refreshFormUI(state) {
        const scoringUnlocked = this.isScoringUnlocked(state);

        // Fields that require SME context to be filled first
        const scoringFields = ['relevance', 'regulatory_necessity', 'operational_feasibility', 'cost_to_collect', 'misreporting_risk'];
        // Fields that are always unlocked (optional context fields)
        const alwaysUnlockedFields = ['estimated_time', 'support_required', 'geographic_footprint', 'stakeholder_priority', 'sdgs'];
        
        document.querySelectorAll('.chip-group').forEach(group => {
            const field = group.getAttribute('data-field');
            
            // Skip always-unlocked fields
            if (alwaysUnlockedFields.includes(field)) {
                group.setAttribute('data-locked', 'false');
                group.querySelectorAll('.chip').forEach(chip => chip.classList.remove('disabled'));
                // Remove locked hint if present
                const hint = group.nextElementSibling;
                if (hint && hint.classList.contains('locked-hint')) {
                    hint.style.display = 'none';
                }
                return;
            }
            
            // Lock/unlock scoring fields based on SME context
            if (scoringFields.includes(field)) {
                if (scoringUnlocked) {
                    group.setAttribute('data-locked', 'false');
                    group.querySelectorAll('.chip').forEach(chip => chip.classList.remove('disabled'));
                    // Hide locked hint
                    const hint = group.nextElementSibling;
                    if (hint && hint.classList.contains('locked-hint')) {
                        hint.style.display = 'none';
                    }
                } else {
                    group.setAttribute('data-locked', 'true');
                    group.querySelectorAll('.chip').forEach(chip => chip.classList.add('disabled'));
                    // Show locked hint
                    const hint = group.nextElementSibling;
                    if (hint && hint.classList.contains('locked-hint')) {
                        hint.style.display = '';
                    }
                }
            }
        });

        const tierSelect = document.getElementById('suggested_tier');
        const tierHint = document.getElementById('tier-lock-hint');
        const tierUnlocked = this.areDimensionsComplete(state);
        if (tierSelect) tierSelect.disabled = !tierUnlocked;
        if (tierHint) tierHint.style.display = tierUnlocked ? 'none' : '';

        // Regulatory necessity note
        let mandatoryNote = document.getElementById('mandatory-note');
        if (!mandatoryNote && tierSelect) {
            mandatoryNote = document.createElement('div');
            mandatoryNote.id = 'mandatory-note';
            mandatoryNote.className = 'badge-note';
            mandatoryNote.style.display = 'none';
            mandatoryNote.textContent = 'Regulatory Necessity = Mandatory — Core is expected (not auto-enforced).';
            tierSelect.insertAdjacentElement('afterend', mandatoryNote);
        }
        if (mandatoryNote) {
            mandatoryNote.style.display = state.regulatory_necessity === 'mandatory' ? 'inline-flex' : 'none';
        }

        this.updateSaveButtonState(state);
    }

    updateSaveButtonState(state) {
        const saveBtn = document.getElementById('save-review-btn');
        if (!saveBtn) return;
        const validation = this.validateState(state, { silent: true });
        saveBtn.disabled = !validation.valid;
    }

    syncOptionalTags(tags) {
        const container = document.getElementById('optional-tags-chips');
        if (!container) return;

        if (!tags || tags.length === 0) {
            container.innerHTML = '<span class="inline-helper">No tags added</span>';
            return;
        }

        container.innerHTML = tags.map((tag, idx) => `
            <span class="chip selected" data-tag-index="${idx}" title="Click to remove">${tag} ✕</span>
        `).join('');
    }

    addOptionalTag(tag) {
        const trimmed = tag.trim();
        if (!trimmed) return;
        const tags = this.currentFormState.optional_tags || [];
        if (!tags.includes(trimmed)) {
            tags.push(trimmed);
            this.currentFormState.optional_tags = tags;
            this.syncOptionalTags(tags);
        }
    }

    removeOptionalTag(index) {
        const tags = this.currentFormState.optional_tags || [];
        if (index >= 0 && index < tags.length) {
            tags.splice(index, 1);
            this.currentFormState.optional_tags = tags;
            this.syncOptionalTags(tags);
        }
    }

    buildStateFromForm() {
        const state = {
            ...(this.currentFormState || this.getEmptyReviewState())
        };

        state.sme_size_band = document.getElementById('sme_size_band')?.value || '';
        state.primary_sector = document.getElementById('primary_sector')?.value || '';
        state.primary_framework = document.getElementById('primary_framework')?.value || '';
        state.esg_class = document.getElementById('esg_class')?.value || '';
        state.suggested_tier = document.getElementById('suggested_tier')?.value || '';
        state.rationale = document.getElementById('rationale')?.value?.trim() || '';
        state.notes = document.getElementById('notes')?.value?.trim() || '';

        // Chips
        const sdgButtons = document.querySelectorAll('.chip[data-field="sdgs"].selected');
        state.sdgs = Array.from(sdgButtons).map(btn => parseInt(btn.getAttribute('data-value'), 10)).filter(Boolean);

        // Stakeholder priority multi-select chips
        const stakeholderButtons = document.querySelectorAll('.chip[data-field="stakeholder_priority"].selected');
        state.stakeholder_priority = Array.from(stakeholderButtons).map(btn => btn.getAttribute('data-value')).filter(Boolean);

        // Dimension chips single select
        const singleFields = ['relevance', 'regulatory_necessity', 'operational_feasibility', 'cost_to_collect', 'misreporting_risk', 'geographic_footprint', 'estimated_time', 'support_required'];
        singleFields.forEach(field => {
            const selected = document.querySelector(`.chip[data-field="${field}"].selected`);
            state[field] = selected ? selected.getAttribute('data-value') : '';
        });

        return state;
    }

    validateState(state, options = {}) {
        const { silent = false } = options;
        const requiredFields = [
            ['sme_size_band', 'SME Size Band'],
            ['primary_sector', 'Primary Industry / Sector'],
            ['relevance', 'Relevance'],
            ['regulatory_necessity', 'Regulatory Necessity'],
            ['operational_feasibility', 'Operational Feasibility'],
            ['cost_to_collect', 'Cost-to-Collect'],
            ['misreporting_risk', 'Misreporting Risk'],
            ['suggested_tier', 'Suggested Tier'],
            ['rationale', 'One-Line Rationale']
        ];

        for (const [key, label] of requiredFields) {
            if (!state[key]) {
                const message = `${label} is required.`;
                if (!silent) window.showToast?.(message, 'error');
                return { valid: false, message };
            }
        }

        if (!this.isScoringUnlocked(state)) {
            const message = 'Complete SME Context before scoring.';
            if (!silent) window.showToast?.(message, 'error');
            return { valid: false, message };
        }

        if (!this.areDimensionsComplete(state)) {
            const message = 'Score all five dimensions.';
            if (!silent) window.showToast?.(message, 'error');
            return { valid: false, message };
        }

        if (state.rationale && state.rationale.length > 150) {
            const message = 'Rationale must be 150 characters or fewer.';
            if (!silent) window.showToast?.(message, 'error');
            return { valid: false, message };
        }

        return { valid: true };
    }

    renderInfo(fieldKey, suffix = '') {
        const id = `${fieldKey}${suffix ? '-' + suffix : ''}-info`;
        const text = this.helpText[fieldKey] || '';
        return `
            <span class="info-wrapper">
                <button type="button" class="info-button" aria-label="More info">ⓘ</button>
                <div class="info-popover" id="${id}">
                    <strong>Help Text</strong>
                    <div>${text}</div>
                </div>
            </span>
        `;
    }

    renderSingleChips(field, options, selected, locked = false) {
        return `
            <div class="chip-group" data-field="${field}" ${locked ? 'data-locked="true"' : ''}>
                ${options.map(opt => `
                    <button type="button" class="chip ${selected === opt.value ? 'selected' : ''} ${locked ? 'disabled' : ''}" data-value="${opt.value}" data-field="${field}">
                        ${opt.label}
                    </button>
                `).join('')}
            </div>
            ${locked ? '<div class="locked-hint">Complete SME Size Band and Primary Industry first.</div>' : ''}
        `;
    }

    renderSdgChips(selectedValues = []) {
        const selectedSet = new Set(selectedValues || []);
        return `
            <div class="chip-group" data-field="sdgs" data-multi="true">
                ${this.sdgOptions.map(opt => `
                    <button type="button" class="chip sdg-chip ${selectedSet.has(opt.value) ? 'selected' : ''}" data-value="${opt.value}" data-field="sdgs">
                        <span class="sdg-dot"></span>
                        <span>${opt.label}</span>
                    </button>
                `).join('')}
            </div>
        `;
    }

    renderMultiChips(field, options, selectedValues = []) {
        const selectedSet = new Set(selectedValues || []);
        return `
            <div class="chip-group" data-field="${field}" data-multi="true">
                ${options.map(opt => `
                    <button type="button" class="chip ${selectedSet.has(opt.value) ? 'selected' : ''}" data-value="${opt.value}" data-field="${field}">
                        ${opt.label}
                    </button>
                `).join('')}
            </div>
        `;
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
        _showErrorState('loading-state', message, () => window.location.href = '/champion-panels.html');
    }
}

// Initialize on DOM ready
let indicatorsPage;
document.addEventListener('DOMContentLoaded', () => {
    indicatorsPage = new ChampionIndicators();
    indicatorsPage.init();
});
