/**
 * Invitation Handler for Landing Page
 * Add this script to landing.html to handle invitation links
 * 
 * Usage: /landing.html?invitation=inv_xxx
 */

(function() {
    // Check for invitation token in URL
    const urlParams = new URLSearchParams(window.location.search);
    const invitationToken = urlParams.get('invitation') || urlParams.get('token');
    
    if (!invitationToken) {
        return; // No invitation, normal landing page flow
    }

    // Verify invitation when page loads
    async function verifyInvitation() {
        try {
            const supabase = window.getSupabase?.();
            if (!supabase) {
                console.error('Supabase not initialized');
                return;
            }

            // Look up invitation
            const { data: invitation, error } = await supabase
                .from('invitations')
                .select(`
                    *,
                    champions:invited_by (
                        full_name,
                        email
                    )
                `)
                .eq('token', invitationToken)
                .maybeSingle();

            if (error || !invitation) {
                console.error('Invalid invitation token');
                showInvitationToast('Invalid invitation link', 'error');
                return;
            }

            // Check if expired
            const expiresAt = new Date(invitation.expires_at);
            const now = new Date();
            
            if (expiresAt < now || invitation.status === 'expired') {
                // Mark as expired
                await supabase
                    .from('invitations')
                    .update({ status: 'expired' })
                    .eq('id', invitation.id);
                
                showInvitationToast('This invitation has expired', 'warning');
                return;
            }

            // Check if already accepted
            if (invitation.status === 'accepted') {
                showInvitationToast('You\'ve already joined! Please sign in.', 'info');
                // Redirect to login after 2 seconds
                setTimeout(() => {
                    window.location.href = '/champion-login.html';
                }, 2000);
                return;
            }

            // Valid invitation! Store data and show welcome message
            sessionStorage.setItem('invitation_data', JSON.stringify({
                token: invitationToken,
                email: invitation.email,
                inviter_name: invitation.champions?.full_name || 'An ESG Champion',
                inviter_id: invitation.invited_by,
                personal_message: invitation.personal_message
            }));

            // Show welcome toast
            const inviterName = invitation.champions?.full_name || 'An ESG Champion';
            showInvitationToast(`🎉 ${inviterName} invited you to join STIF!`, 'success');

            // Redirect to registration with pre-filled email after 1.5 seconds
            setTimeout(() => {
                window.location.href = `/champion-register.html?email=${encodeURIComponent(invitation.email)}&invitation=${encodeURIComponent(invitationToken)}`;
            }, 1500);

        } catch (error) {
            console.error('Error verifying invitation:', error);
            showInvitationToast('Error processing invitation', 'error');
        }
    }

    // Helper function to show toast notification
    function showInvitationToast(message, type = 'info') {
        // Use existing toast system if available
        if (window.showToast) {
            window.showToast(message, type);
            return;
        }

        // Fallback: create simple alert-style notification
        const existingToast = document.getElementById('invitation-toast');
        if (existingToast) {
            existingToast.remove();
        }

        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };

        const toast = document.createElement('div');
        toast.id = 'invitation-toast';
        toast.style.cssText = `
            position: fixed;
            top: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: white;
            color: #1f2937;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.15);
            border-left: 4px solid ${colors[type] || colors.info};
            z-index: 10000;
            max-width: 500px;
            font-size: 14px;
            animation: slideDown 0.3s ease-out;
        `;
        toast.textContent = message;

        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideDown {
                from {
                    opacity: 0;
                    transform: translateX(-50%) translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(toast);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            toast.style.animation = 'slideDown 0.3s ease-out reverse';
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }

    // Run verification
    verifyInvitation();
})();
