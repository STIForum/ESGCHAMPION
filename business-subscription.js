(async function () {
    const statusEl = document.getElementById('current-subscription-status');
    const messageEl = document.getElementById('subscription-message');
    const buttons = document.querySelectorAll('.subscribe-btn');

    let businessUser = null;

    function setMessage(type, text) {
        messageEl.innerHTML = `<div class="alert alert-${type}">${text}</div>`;
    }

    function formatStatus(status) {
        if (!status) return 'Unknown';
        return status.charAt(0).toUpperCase() + status.slice(1);
    }

    async function loadBusinessUser() {
        const supabase = window.getSupabase();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user?.id) {
            window.location.href = '/business-login.html';
            return null;
        }

        const { data, error } = await supabase
            .from('business_users')
            .select('*')
            .eq('auth_user_id', session.user.id)
            .maybeSingle();

        if (error || !data) {
            window.location.href = '/business-login.html';
            return null;
        }

        return data;
    }

    async function activateSubscription(plan) {
        if (!businessUser) return;

        buttons.forEach(btn => {
            btn.disabled = true;
            btn.textContent = 'Processing...';
        });

        try {
            const supabase = window.getSupabase();
            const { error } = await supabase
                .from('business_users')
                .update({ subscription_status: 'active' })
                .eq('id', businessUser.id);

            if (error) throw error;

            await window.supabaseService?.createBusinessNotification?.(
                businessUser.id,
                'subscription',
                'Subscription activated',
                'Your subscription is now active. You can continue with sustainability reporting.',
                '/business-reporting.html',
                { plan }
            );

            statusEl.textContent = 'Active';
            setMessage('success', `Subscription activated (${plan}). Redirecting to your dashboard...`);

            setTimeout(() => {
                window.location.href = '/business-dashboard.html';
            }, 1200);
        } catch (err) {
            setMessage('error', err.message || 'Failed to activate subscription. Please try again.');
            buttons.forEach((btn) => {
                btn.disabled = false;
                btn.textContent = btn.dataset.plan === 'annual' ? 'Subscribe Annual' : 'Subscribe Monthly';
            });
        }
    }

    try {
        businessUser = await loadBusinessUser();
        if (!businessUser) return;

        const currentStatus = (businessUser.subscription_status || 'inactive').toLowerCase();
        statusEl.textContent = formatStatus(currentStatus);

        if (currentStatus === 'active') {
            setMessage('success', 'Your subscription is already active. Continue to the next step below.');
            buttons.forEach((btn) => {
                btn.classList.add('hidden');
            });

            messageEl.insertAdjacentHTML('beforeend', `
                <div style="margin-top: var(--space-4);">
                    <a href="/business-reporting.html" class="btn btn-primary">Continue to Sustainability Reporting</a>
                </div>
            `);
            return;
        }

        buttons.forEach((btn) => {
            btn.addEventListener('click', () => {
                const plan = btn.dataset.plan === 'annual' ? 'Annual plan' : 'Monthly plan';
                activateSubscription(plan);
            });
        });
    } catch (error) {
        statusEl.textContent = 'Unavailable';
        setMessage('error', 'Unable to load subscription details. Please refresh.');
    }
})();
