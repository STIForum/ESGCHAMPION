(async function () {
    const loading = document.getElementById('loading-state');
    const content = document.getElementById('content');

    function panelCard(panel) {
        const framework = (panel.primary_framework || panel.framework || 'gri').toUpperCase();
        const count = panel.indicator_count || 0;
        return `
            <div class="feature-card" style="display:flex;flex-direction:column;gap:var(--space-3);">
                <div class="badge badge-primary" style="width:fit-content;">${framework}</div>
                <h3>${panel.name}</h3>
                <p class="text-secondary">${panel.description || 'Panel guidance and indicator set for SME reporting.'}</p>
                <div class="text-secondary" style="font-size: var(--text-sm);">${count} indicators</div>
                <a class="btn btn-primary" href="/business-indicators.html?panel=${encodeURIComponent(panel.id)}">View</a>
            </div>
        `;
    }

    function groupPanels(panels) {
        const buckets = { gri: [], esrs: [], ifrs: [] };
        panels.forEach((panel) => {
            const fw = (panel.primary_framework || panel.framework || 'gri').toLowerCase();
            if (!buckets[fw]) buckets[fw] = [];
            buckets[fw].push(panel);
        });
        return buckets;
    }

    try {
        await window.businessReportingFlow.requireBusinessAuth();

        const panels = await window.championDB.getPanelsWithCounts();
        const grouped = groupPanels(panels || []);

        content.innerHTML = Object.entries(grouped)
            .filter(([, list]) => list.length)
            .map(([framework, list]) => `
                <section class="mb-8">
                    <h2 class="mb-4">${framework.toUpperCase()}</h2>
                    <div class="features-grid">
                        ${list.map(panelCard).join('')}
                    </div>
                </section>
            `)
            .join('') || '<div class="widget"><div class="widget-body">No panels available yet.</div></div>';

        loading.classList.add('hidden');
        content.classList.remove('hidden');
    } catch (error) {
        loading.classList.add('hidden');
        content.classList.remove('hidden');
        content.innerHTML = `<div class="alert alert-error">Failed to load frameworks and panels. Please refresh.</div>`;
    }
})();
