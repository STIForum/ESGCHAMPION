(async function () {
    const messageEl = document.getElementById('setup-message');
    const spinnerEl = document.getElementById('setup-spinner');
    const goBtn = document.getElementById('go-workspace-btn');
    const errorEl = document.getElementById('setup-error');

    const POLL_MS = 5000;
    let pollTimer = null;

    function setState(state, sharepointUrl = '') {
        if (state === 'completed') {
            messageEl.textContent = 'Your reporting workspace is ready.';
            spinnerEl.classList.add('hidden');
            errorEl.classList.add('hidden');
            goBtn.classList.remove('hidden');
            goBtn.href = sharepointUrl || '#';
            if (pollTimer) clearInterval(pollTimer);
            return;
        }

        if (state === 'failed') {
            messageEl.textContent = 'Workspace setup encountered a problem.';
            spinnerEl.classList.add('hidden');
            goBtn.classList.add('hidden');
            errorEl.classList.remove('hidden');
            if (pollTimer) clearInterval(pollTimer);
            return;
        }

        // in_progress default
        messageEl.textContent = 'We are setting up your reporting workspace.';
        spinnerEl.classList.remove('hidden');
        goBtn.classList.add('hidden');
        errorEl.classList.add('hidden');
    }

    async function checkProvisioning() {
        try {
            const businessUser = await window.businessReportingFlow.requireBusinessAuth();
            if (!businessUser) return;

            const { provisioningStatus, sharepointFolderUrl } = window.businessReportingFlow.normalizeState(businessUser);

            if (provisioningStatus === 'completed') {
                setState('completed', sharepointFolderUrl);
                return;
            }

            if (provisioningStatus === 'failed') {
                setState('failed');
                return;
            }

            setState('in_progress');
        } catch (error) {
            setState('failed');
        }
    }

    await checkProvisioning();
    pollTimer = setInterval(checkProvisioning, POLL_MS);
})();
