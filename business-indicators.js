(async function () {
    const params = new URLSearchParams(window.location.search);
    const panelId = params.get('panel');

    const loading = document.getElementById('loading-state');
    const list = document.getElementById('indicators-list');

    if (!panelId) {
        window.location.href = '/business-reporting.html';
        return;
    }

    function indicatorCode(indicator) {
        return indicator.framework_code || indicator.code || indicator.source_code || `IND-${String(indicator.id).slice(0, 8)}`;
    }

    try {
        await window.businessReportingFlow.requireBusinessAuth();

        const panelWithIndicators = await window.championDB.getPanelWithIndicators(panelId);
        const indicators = panelWithIndicators.indicators || [];
        const panelName = panelWithIndicators.name || 'Panel';

        document.getElementById('panel-title').textContent = panelName;
        document.getElementById('breadcrumb').textContent = `Business Dashboard / Sustainability Reporting / ${panelName}`;

        list.innerHTML = indicators.length
            ? indicators.map((indicator) => `
                <div class="widget mb-4">
                    <div class="widget-body" style="display:flex;justify-content:space-between;gap:var(--space-4);align-items:flex-start;">
                        <div>
                            <div class="badge badge-primary" style="width:fit-content;margin-bottom:var(--space-2);">${indicatorCode(indicator)}</div>
                            <h3 style="margin-bottom:var(--space-2);">${indicator.name}</h3>
                            <p class="text-secondary">${indicator.description || 'Indicator guidance available on the next page.'}</p>
                        </div>
                        <a class="btn btn-primary" href="/business-indicator-detail.html?indicator=${encodeURIComponent(indicator.id)}&panel=${encodeURIComponent(panelId)}">Report on this indicator</a>
                    </div>
                </div>
            `).join('')
            : '<div class="widget"><div class="widget-body">No indicators found for this panel.</div></div>';

        loading.classList.add('hidden');
        list.classList.remove('hidden');
    } catch (error) {
        loading.classList.add('hidden');
        list.classList.remove('hidden');
        list.innerHTML = `<div class="alert alert-error">Failed to load panel indicators. Please refresh.</div>`;
    }
})();
