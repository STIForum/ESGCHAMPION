/**
 * Invite Peers Modal
 * ESG Champions Platform
 * 
 * Shared modal for inviting peers via email or LinkedIn
 */

class InvitePeersModal {
    constructor() {
        this.context = {
            page: 'sidebar',
            panelId: null
        };
        this.init();
    }

    init() {
        // Create modal HTML if it doesn't exist
        if (!document.getElementById('invite-peers-modal-backdrop')) {
            this.createModalHTML();
        }
        this.bindEvents();
    }

    createModalHTML() {
        const modalHTML = `
            <div class="modal-backdrop" id="invite-peers-modal-backdrop">
                <div class="modal" id="invite-peers-modal" style="max-width: 550px;">
                    <div class="modal-header">
                        <div>
                            <h3 class="modal-title" style="margin-bottom: var(--space-1);">Invite Peers</h3>
                            <p class="text-secondary" style="font-size: var(--text-sm); margin: 0;">Earn 2 credits for every review completed by your peers.</p>
                        </div>
                        <button class="modal-close" id="invite-peers-modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="invite-peers-form">
                            <!-- Email addresses -->
                            <div class="form-group">
                                <label class="form-label">Email addresses</label>
                                <input type="text" class="form-input" id="invite-emails" name="emails" placeholder="Enter email address(es)...">
                                <p class="form-helper">Separate multiple emails with commas</p>
                                <span class="form-error" id="invite-emails-error"></span>
                            </div>

                            <!-- Message -->
                            <div class="form-group">
                                <label class="form-label">Message (optional)</label>
                                <textarea class="form-textarea" id="invite-message" name="message" rows="4">I'm inviting you to review an ESG indicator.
Thanks!</textarea>
                            </div>

                            <!-- Invitation Preview -->
                            <div class="form-group">
                                <div style="background: var(--gray-50); border-radius: var(--radius-lg); padding: var(--space-4); border: 1px solid var(--gray-200);">
                                    <h4 style="font-size: var(--text-sm); font-weight: 600; color: var(--stif-blue); margin-bottom: var(--space-3);">Invitation Preview</h4>
                                    <div id="invite-preview" style="font-size: var(--text-sm); color: var(--gray-600); white-space: pre-wrap;">Hello,

I'm inviting you to review an ESG indicator.
Thanks!</div>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer" style="display: flex; gap: var(--space-3);">
                        <button type="button" class="btn btn-primary" id="send-invitations-btn">Send Invitations</button>
                        <button type="button" class="btn btn-secondary" id="share-linkedin-btn" style="display: flex; align-items: center; gap: var(--space-2);">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                            </svg>
                            Share via LinkedIn
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    bindEvents() {
        // Close button
        const closeBtn = document.getElementById('invite-peers-modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        // Backdrop click
        const backdrop = document.getElementById('invite-peers-modal-backdrop');
        if (backdrop) {
            backdrop.addEventListener('click', (e) => {
                if (e.target === backdrop) {
                    this.close();
                }
            });
        }

        // Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.close();
            }
        });

        // Send invitations button
        const sendBtn = document.getElementById('send-invitations-btn');
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendInvitations());
        }

        // LinkedIn share button
        const linkedInBtn = document.getElementById('share-linkedin-btn');
        if (linkedInBtn) {
            linkedInBtn.addEventListener('click', () => this.shareViaLinkedIn());
        }

        // Message input - update preview
        const messageInput = document.getElementById('invite-message');
        if (messageInput) {
            messageInput.addEventListener('input', () => this.updatePreview());
        }

        // Email input - clear error on input
        const emailInput = document.getElementById('invite-emails');
        if (emailInput) {
            emailInput.addEventListener('input', () => {
                emailInput.classList.remove('error');
                document.getElementById('invite-emails-error').textContent = '';
            });
        }
    }

    open(context = { page: 'sidebar', panelId: null }) {
        this.context = context;

        const backdrop = document.getElementById('invite-peers-modal-backdrop');
        const modal = document.getElementById('invite-peers-modal');

        if (backdrop && modal) {
            // Reset form
            this.resetForm();
            
            backdrop.classList.add('active');
            modal.classList.add('active');

            // Focus email input
            setTimeout(() => {
                document.getElementById('invite-emails')?.focus();
            }, 100);
        }
    }

    close() {
        const backdrop = document.getElementById('invite-peers-modal-backdrop');
        const modal = document.getElementById('invite-peers-modal');

        if (backdrop && modal) {
            backdrop.classList.remove('active');
            modal.classList.remove('active');
        }
    }

    resetForm() {
        const emailInput = document.getElementById('invite-emails');
        const messageInput = document.getElementById('invite-message');
        const errorEl = document.getElementById('invite-emails-error');

        if (emailInput) {
            emailInput.value = '';
            emailInput.classList.remove('error');
        }
        if (messageInput) {
            messageInput.value = `I'm inviting you to review an ESG indicator.
Thanks!`;
        }
        if (errorEl) {
            errorEl.textContent = '';
        }

        this.updatePreview();
    }

    updatePreview() {
        const messageInput = document.getElementById('invite-message');
        const preview = document.getElementById('invite-preview');

        if (messageInput && preview) {
            const message = messageInput.value.trim() || 'I\'m inviting you to review an ESG indicator.\nThanks!';
            preview.textContent = `Hello,\n\n${message}`;
        }
    }

    validateEmails(emailString) {
        if (!emailString || !emailString.trim()) {
            return { valid: false, emails: [], error: 'Please enter at least one email address' };
        }

        const emails = emailString
            .split(',')
            .map(e => e.trim().toLowerCase())
            .filter(e => e.length > 0);

        // Remove duplicates
        const uniqueEmails = [...new Set(emails)];

        // Email regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const invalidEmails = uniqueEmails.filter(e => !emailRegex.test(e));

        if (invalidEmails.length > 0) {
            return { 
                valid: false, 
                emails: uniqueEmails, 
                error: `Invalid email(s): ${invalidEmails.join(', ')}` 
            };
        }

        return { valid: true, emails: uniqueEmails, error: null };
    }

    async sendInvitations() {
        const emailInput = document.getElementById('invite-emails');
        const messageInput = document.getElementById('invite-message');
        const errorEl = document.getElementById('invite-emails-error');
        const sendBtn = document.getElementById('send-invitations-btn');

        const emailString = emailInput.value;
        const validation = this.validateEmails(emailString);

        if (!validation.valid) {
            emailInput.classList.add('error');
            errorEl.textContent = validation.error;
            return;
        }

        // Disable button and show loading
        sendBtn.disabled = true;
        sendBtn.innerHTML = '<span class="loading-spinner-sm" style="width: 16px; height: 16px; margin-right: var(--space-2);"></span> Sending...';

        const payload = {
            emails: validation.emails,
            message: messageInput.value.trim(),
            context: this.context
        };

        try {
            // Get current user ID
            const currentUser = window.supabaseService?.currentUser;
            const championId = currentUser?.id;

            if (championId && window.supabaseService?.supabase) {
                // Save invitations to database
                const invitationPromises = validation.emails.map(async (email) => {
                    const token = this.generateInviteToken();
                    const expiresAt = new Date();
                    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

                    return window.supabaseService.supabase
                        .from('invitations')
                        .insert({
                            email: email.toLowerCase(),
                            invited_by: championId,
                            token: token,
                            expires_at: expiresAt.toISOString(),
                            status: 'pending'
                        });
                });

                await Promise.allSettled(invitationPromises);
                console.log('Invitations saved to database');
            }

            // TODO: Implement actual email sending via backend
            console.log('Invite Peers Payload:', payload);

            window.showToast?.('Invitations sent successfully!', 'success') || alert('Invitations sent successfully!');
            this.close();

        } catch (error) {
            console.error('Error sending invitations:', error);
            window.showToast?.('Failed to send invitations. Please try again.', 'error') || alert('Failed to send invitations. Please try again.');
        } finally {
            sendBtn.disabled = false;
            sendBtn.innerHTML = 'Send Invitations';
        }
    }

    /**
     * Generate a unique invite token
     */
    generateInviteToken() {
        return 'inv_' + Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15) + 
               '_' + Date.now().toString(36);
    }

    shareViaLinkedIn() {
        let shareUrl = window.location.href;

        // If we have a panel context, include it
        if (this.context.panelId) {
            shareUrl = `${window.location.origin}/champion-panels.html?panel=${this.context.panelId}`;
        }

        const shareText = encodeURIComponent('Join me in reviewing ESG indicators on STIF - Sustainability Technology and Innovation Forum. Help shape the future of sustainable business practices!');
        const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;

        window.open(linkedInUrl, '_blank', 'width=600,height=600');
    }
}

// Create global instance
window.invitePeersModal = new InvitePeersModal();

// Helper function to open modal
window.openInvitePeersModal = function(context) {
    window.invitePeersModal.open(context);
};

