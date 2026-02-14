(function () {
    async function getBusinessAccountState() {
        const supabase = window.getSupabase?.();
        if (!supabase) throw new Error('Supabase is not initialized');

        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) return { session: null, businessUser: null };

        const { data: businessUser, error } = await supabase
            .from('business_users')
            .select('*')
            .eq('auth_user_id', session.user.id)
            .maybeSingle();

        if (error) throw error;

        return { session, businessUser };
    }

    function normalizeState(businessUser) {
        const subscriptionStatus = (businessUser?.subscription_status || 'active').toLowerCase();
        const provisioningStatus = (businessUser?.provisioning_status || 'completed').toLowerCase();
        const sharepointFolderUrl = businessUser?.sharepoint_folder_url || '';

        return {
            subscriptionStatus,
            provisioningStatus,
            sharepointFolderUrl
        };
    }

    async function requireBusinessAuth() {
        const { session, businessUser } = await getBusinessAccountState();
        if (!session || !businessUser) {
            window.location.href = '/business-login.html';
            return null;
        }
        return businessUser;
    }

    async function resolveReportingRedirect() {
        const businessUser = await requireBusinessAuth();
        if (!businessUser) return;

        const state = normalizeState(businessUser);

        if (state.subscriptionStatus !== 'active') {
            window.location.href = '/business-subscription.html';
            return;
        }

        if (state.provisioningStatus !== 'completed') {
            window.location.href = '/workspace-setup.html';
            return;
        }

        if (state.sharepointFolderUrl) {
            window.location.href = state.sharepointFolderUrl;
            return;
        }

        // Fallback when provisioning says complete but URL is not yet present
        window.location.href = '/workspace-setup.html';
    }

    window.businessReportingFlow = {
        getBusinessAccountState,
        normalizeState,
        requireBusinessAuth,
        resolveReportingRedirect
    };
})();
