(async function () {
    const params = new URLSearchParams(window.location.search);
    const indicatorId = params.get('indicator');
    const panelId = params.get('panel');

    const loading = document.getElementById('loading-state');
    const content = document.getElementById('indicator-content');

    if (!indicatorId) {
        window.location.href = '/business-reporting.html';
        return;
    }

    try {
        await window.businessReportingFlow.requireBusinessAuth();

        const indicator = await window.supabaseService.getIndicator(indicatorId);

        const title = indicator?.name || 'Indicator';
        const panelName = indicator?.panels?.name || 'Panel';

        document.getElementById('indicator-title').textContent = title;
        document.getElementById('indicator-summary').textContent = indicator?.description || 'Review this guidance before reporting in SharePoint.';
        document.getElementById('meaning-text').textContent = indicator?.description || 'This indicator describes a measurable ESG reporting requirement for your business.';
        document.getElementById('evidence-text').textContent = indicator?.methodology || indicator?.data_source || 'Collect source records, calculations, and supporting evidence that validate this indicator for the selected reporting year.';
        document.getElementById('breadcrumb').textContent = `Business Dashboard / Sustainability Reporting / ${panelName} / ${title}`;

        const backTarget = panelId ? `/business-indicators.html?panel=${encodeURIComponent(panelId)}` : '/business-reporting.html';
        document.getElementById('back-link').setAttribute('href', backTarget);

        if (indicator?.source_url) {
            const guidanceCard = document.getElementById('guidance-card');
            const guidanceLink = document.getElementById('guidance-link');
            guidanceCard.style.display = '';
            guidanceLink.href = indicator.source_url;
        }

        document.getElementById('go-sharepoint-btn').addEventListener('click', async () => {
            await window.businessReportingFlow.resolveReportingRedirect();
        });

        loading.classList.add('hidden');
        content.classList.remove('hidden');
    } catch (error) {
        loading.classList.add('hidden');
        content.classList.remove('hidden');
        content.innerHTML = `<div class="alert alert-error">Failed to load indicator guidance. Please refresh.</div>`;
    }
})();
