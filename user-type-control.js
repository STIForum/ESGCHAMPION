// User Type Control Modal & Navigation Enforcement
// ESG Champions Platform

(function() {
    if (window.__userTypeGuardInitialized) return;
    window.__userTypeGuardInitialized = true;

    // Utility: Show modal
    function showUserTypeModal(message, redirectUrl) {
        // Remove existing modal if any
        document.getElementById('user-type-modal-backdrop')?.remove();
        const modalHTML = `
            <div id="user-type-modal-backdrop" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:99999;">
                <div style="max-width:400px;width:90%;background:white;border-radius:16px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);overflow:hidden;">
                    <div style="padding:24px 32px;text-align:center;">
                        <div style="width:64px;height:64px;background:linear-gradient(135deg,#dbeafe,#bfdbfe);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
                        </div>
                        <h2 style="margin:0 0 12px;color:#111827;font-size:22px;font-weight:700;">Access Restricted</h2>
                        <p style="color:#6b7280;margin:0 0 24px;font-size:15px;line-height:1.5;">${message}</p>
                        <button id="user-type-modal-btn" style="width:100%;padding:14px 0;background:#2563eb;color:white;border:none;border-radius:10px;font-size:16px;font-weight:600;cursor:pointer;">Go to My Dashboard</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.getElementById('user-type-modal-btn').onclick = function() {
            window.location.href = redirectUrl;
        };
    }

    // Utility: Get user type (champion or business)
    async function getUserType() {
        // Try business user first
        if (window.getSupabase) {
            const supabase = window.getSupabase();
            const { data: { session } } = await supabase.auth.getSession();
            if (session && session.user) {
                // Check if business user exists
                const { data: businessUser, error } = await supabase
                    .from('business_users')
                    .select('id')
                    .eq('auth_user_id', session.user.id)
                    .maybeSingle();

                // No matching row is valid (user is not a business account)
                if (!error && businessUser && businessUser.id) return 'business';
            }
        }
        // Then try champion
        if (window.championAuth && window.championAuth.isAuthenticated && window.championAuth.isAuthenticated()) {
            const champ = window.championAuth.getChampion && window.championAuth.getChampion();
            if (champ && champ.id) return 'champion';
        }
        return null;
    }

    // Enforce dashboard/page access
    async function enforceUserTypeAccess() {
        const userType = await getUserType();
        const path = window.location.pathname;
        const isDashboardPath = (p) => p === '/business-dashboard.html' || p === '/champion-dashboard.html' || p === '/dashboard.html' || p === '/dashboard';

        if (userType === 'champion' && isDashboardPath(path) && path !== '/champion-dashboard.html') {
            showUserTypeModal('You are logged in as a Champion user. Opening your dashboard.', '/champion-dashboard.html');
            return false;
        }

        if (userType === 'business' && isDashboardPath(path) && path !== '/business-dashboard.html') {
            showUserTypeModal('You are logged in as a Business user. Opening your dashboard.', '/business-dashboard.html');
            return false;
        }

        if (userType === 'business' && path.startsWith('/champion-profile.html')) {
            showUserTypeModal('You are logged in as a Business user. Opening your business profile.', '/business-settings.html');
            return false;
        }

        if (userType === 'champion' && path.startsWith('/business-settings.html')) {
            showUserTypeModal('You are logged in as a Champion user. Opening your profile.', '/champion-profile.html');
            return false;
        }

        // Intercept dashboard nav clicks
        document.querySelectorAll('a.nav-link, a.sidebar-link, a.mobile-nav-link').forEach(link => {
            link.addEventListener('click', async function(e) {
                const href = link.getAttribute('href');
                if (!href) return;

                if (userType === 'champion' && isDashboardPath(href) && !href.startsWith('/champion-dashboard.html')) {
                    e.preventDefault();
                    showUserTypeModal('You are logged in as a Champion user. Opening your dashboard.', '/champion-dashboard.html');
                }

                if (userType === 'business' && isDashboardPath(href) && !href.startsWith('/business-dashboard.html')) {
                    e.preventDefault();
                    showUserTypeModal('You are logged in as a Business user. Opening your dashboard.', '/business-dashboard.html');
                }

                if (userType === 'business' && href.startsWith('/champion-profile.html')) {
                    e.preventDefault();
                    showUserTypeModal('You are logged in as a Business user. Opening your business profile.', '/business-settings.html');
                }

                if (userType === 'champion' && href.startsWith('/business-settings.html')) {
                    e.preventDefault();
                    showUserTypeModal('You are logged in as a Champion user. Opening your profile.', '/champion-profile.html');
                }
            });
        });
        return true;
    }

    // Run on DOM ready
    document.addEventListener('DOMContentLoaded', enforceUserTypeAccess);
})();
