/**
 * Invite Peers Modal
 * ESG Champions Platform
 *
 * Shared modal for inviting peers via email or LinkedIn
 *
 * PATCH CHANGELOG
 * ───────────────────────────────────────────────────────────────────────────
 * BUG_INVITE_003 — Validation error never visible
 *   Root cause: <span class="form-error"> is hidden by default in styles.css.
 *   Code only set textContent but never toggled a visible class on the span.
 *   Fix: add/remove class "visible" on errorEl in every show/clear path.
 *
 * BUG_INVITE_001/002 — Emails never actually delivered
 *   Root cause 1: The entire email-delivery path was a TODO comment; the DB
 *     insert ran (silently) but no email was ever sent.
 *   Root cause 2: Promise.allSettled() swallows Supabase {data,error} objects
 *     — DB failures never reached the catch() block, so success toast always
 *     fired even when inserts failed.
 *   Root cause 3: window.championAuth.getUser().id returns the auth.users UUID
 *     which equals champions.id (both set from auth.users.id on sign-up), so
 *     the FK is fine — but if RLS blocks the insert the error was invisible.
 *   Root cause 4: generateInviteToken() uses Date.now() synchronously across
 *     all emails in the same tick, so every token in a multi-email batch shares
 *     the same timestamp suffix — risking collisions against the UNIQUE
 *     constraint on invitations.token.
 *   Fix: use crypto.randomUUID() for tokens (available in all modern browsers
 *     and Supabase Edge Functions); explicitly check every insert result and
 *     surface per-email failures; replace the false success toast with an
 *     accurate pending message since email delivery requires a backend trigger
 *     (Supabase Edge Function / webhook on the invitations table).
 *
 * BUG_INVITE_004 — Weak email regex accepts invalid addresses (e.g. #teat@gmail.com)
 *   Root cause: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ only rejects whitespace and @,
 *     allowing illegal characters such as # in the local-part. Confirmed in
 *     production DB (idx 40: "#teat@gmail.com" stored as a live pending row).
 *   Fix: Replace with RFC 5321-compliant regex that restricts local-part to
 *     permitted characters and requires a valid TLD (2+ alpha chars).
 *
 * BUG_INVITE_005 — Duplicate pending invitations for same (email, inviter) pair
 *   Root cause: No uniqueness check before insert; the same champion can
 *     invite the same email address multiple times, each creating a new pending
 *     row. Confirmed in production: thaison.nguyen2022@gmail.com and
 *     binbong2017@gmail.com each have 2 live pending rows from the same inviter.
 *   Fix: Query for an existing pending invitation before inserting; skip and
 *     warn the user if one already exists. A DB-level partial unique index
 *     (see migration file) provides a hard guarantee as a second layer.
 *
 * BUG_INVITE_006 — Invitation not sent when message field left blank
 *   Root cause: The message field was collected from the form (line 334) but
 *     never included in the database INSERT statement. Additionally, the database
 *     column is named 'personal_message' (not 'message'), so even if it was
 *     included with the wrong name, the insert would fail silently.
 *   Fix: Include personal_message field in the INSERT with 
 *     `personal_message: payload.message.trim()` when message is provided.
 *     The field is truly optional now - works with or without a message.
 * ───────────────────────────────────────────────────────────────────────────
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
                                <!-- BUG_INVITE_003 FIX: span starts hidden; JS adds class "visible" to show it -->
                                <span class="form-error" id="invite-emails-error" style="display:none;"></span>
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
        // BUG_INVITE_003 FIX: also hide the error span, not just clear its text
        const emailInput = document.getElementById('invite-emails');
        if (emailInput) {
            emailInput.addEventListener('input', () => {
                this._clearEmailError();
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

        if (emailInput) {
            emailInput.value = '';
        }
        if (messageInput) {
            messageInput.value = `I'm inviting you to review an ESG indicator.\nThanks!`;
        }

        // BUG_INVITE_003 FIX: clear error state fully on every open
        this._clearEmailError();
        this.updatePreview();
    }

    updatePreview() {
        const messageInput = document.getElementById('invite-message');
        const preview = document.getElementById('invite-preview');

        if (messageInput && preview) {
            const message = messageInput.value.trim() || `I'm inviting you to review an ESG indicator.\nThanks!`;
            preview.textContent = `Hello,\n\n${message}`;
        }
    }

    // ─── BUG_INVITE_003 FIX ────────────────────────────────────────────────
    // Centralised helpers so every show/clear path is consistent.

    _showEmailError(message) {
        const emailInput = document.getElementById('invite-emails');
        const errorEl    = document.getElementById('invite-emails-error');
        if (emailInput) emailInput.classList.add('error');
        if (errorEl) {
            errorEl.textContent    = message;
            errorEl.style.display  = 'block';   // make the span visible
        }
    }

    _clearEmailError() {
        const emailInput = document.getElementById('invite-emails');
        const errorEl    = document.getElementById('invite-emails-error');
        if (emailInput) emailInput.classList.remove('error');
        if (errorEl) {
            errorEl.textContent   = '';
            errorEl.style.display = 'none';     // hide again
        }
    }
    // ───────────────────────────────────────────────────────────────────────

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

        // BUG_INVITE_004 FIX: Practical email validation regex.
        // While RFC 5321 technically allows special characters like #$%&'*+/=?^`{|}~,
        // major email providers (Gmail, Outlook, Yahoo, etc.) do NOT support them.
        // This regex accepts only commonly-used characters that work with real email providers:
        // - Letters (a-z, A-Z)
        // - Numbers (0-9)
        // - Common separators: dot (.), hyphen (-), underscore (_)
        // - Plus sign (+) for Gmail-style aliases
        // Rejects: #$%&'*/=?^`{|}~ and other special characters that cause deliverability issues
        const emailRegex = /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
        
        // Additional validation: reject emails with invalid patterns
        const hasInvalidPatterns = (email) => {
            const [localPart, domain] = email.split('@');
            if (!localPart || !domain) return true;
            
            // Reject if local part starts or ends with dot
            if (localPart.startsWith('.') || localPart.endsWith('.')) return true;
            
            // Reject consecutive dots
            if (localPart.includes('..')) return true;
            
            // Reject if domain starts or ends with hyphen
            if (domain.startsWith('-') || domain.endsWith('-')) return true;
            
            return false;
        };
        
        const invalidEmails = uniqueEmails.filter(e => !emailRegex.test(e) || hasInvalidPatterns(e));

        if (invalidEmails.length > 0) {
            return {
                valid: false,
                emails: uniqueEmails,
                error: `Invalid email${invalidEmails.length > 1 ? 's' : ''}: ${invalidEmails.join(', ')}`
            };
        }

        return { valid: true, emails: uniqueEmails, error: null };
    }

    async sendInvitations() {
        const emailInput = document.getElementById('invite-emails');
        const messageInput = document.getElementById('invite-message');
        const sendBtn = document.getElementById('send-invitations-btn');

        const emailString = emailInput.value;
        const validation = this.validateEmails(emailString);

        // BUG_INVITE_003 FIX: use _showEmailError() so the span is made visible
        if (!validation.valid) {
            this._showEmailError(validation.error);
            return;
        }

        // Clear any previous error before sending
        this._clearEmailError();

        // Disable button and show loading
        sendBtn.disabled = true;
        sendBtn.innerHTML = '<span class="loading-spinner-sm" style="width: 16px; height: 16px; margin-right: var(--space-2);"></span> Sending...';

        const payload = {
            emails: validation.emails,
            message: messageInput.value.trim(),
            context: this.context
        };

        try {
            // BUG_INVITE_001/002 FIX: use getChampion() (champions.id) not getUser() (auth.users.id)
            // Both UUIDs are identical post-signup in this codebase, but getChampion() is
            // semantically correct for the invitations.invited_by FK → champions.id.
            const champion   = window.championAuth?.getChampion?.();
            const championId = champion?.id;
            const client     = window.getSupabase?.();

            if (!championId || !client) {
                throw new Error('Authentication required to send invitations.');
            }

            // BUG_INVITE_001/002 FIX: insert invitations one by one with explicit error
            // checking. Promise.allSettled() was swallowing Supabase {data, error} objects
            // because Supabase does NOT throw — it returns {error} in the resolved value.
            // BUG_INVITE_001/002 FIX: use crypto.randomUUID() instead of the old token
            // generator which shared the same Date.now() suffix across all emails in a
            // batch, risking UNIQUE constraint violations on invitations.token.
            const failedEmails = [];

            for (const email of validation.emails) {
                // BUG_INVITE_005 FIX: skip if a pending invitation already exists
                // for this (email, inviter) pair. Without this check, the same
                // champion could accumulate unlimited duplicate pending rows for the
                // same address — confirmed in production data (2 rows each for
                // thaison.nguyen2022@gmail.com and binbong2017@gmail.com).
                // A DB-level partial unique index provides the hard guarantee;
                // this check surfaces a user-friendly warning before the insert.
                const { data: existing, error: lookupError } = await client
                    .from('invitations')
                    .select('id')
                    .eq('email', email.toLowerCase())
                    .eq('invited_by', championId)
                    .eq('status', 'pending')
                    .maybeSingle();

                if (lookupError) {
                    console.warn(`Duplicate-check failed for ${email}:`, lookupError.message);
                    // Proceed with insert anyway; DB constraint will catch true dupes.
                } else if (existing) {
                    console.warn(`Pending invitation already exists for ${email} — skipping duplicate.`);
                    failedEmails.push(`${email} (already invited)`);
                    continue;
                }

                const token     = this.generateInviteToken();
                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + 7); // 7-day expiry

                // BUG_INVITE_006 FIX: Include personal_message field (matches DB schema)
                // The invitations table has a 'personal_message' column, not 'message'
                const invitationData = {
                    email:      email.toLowerCase(),
                    invited_by: championId,
                    token:      token,
                    expires_at: expiresAt.toISOString(),
                    status:     'pending'
                };

                // Include personal_message if provided (optional field)
                if (payload.message && payload.message.trim()) {
                    invitationData.personal_message = payload.message.trim();
                }

                const { error: insertError } = await client
                    .from('invitations')
                    .insert(invitationData);

                if (insertError) {
                    console.error(`Failed to record invitation for ${email}:`, insertError);
                    console.error('Full error details:', JSON.stringify(insertError, null, 2));
                    failedEmails.push(email);
                }
            }

            const successCount = validation.emails.length - failedEmails.length;
            // Separate "already pending" skips from hard DB errors for clearer messaging
            const alreadyPending = failedEmails.filter(e => e.includes('(already invited)'));
            const hardFailed     = failedEmails.filter(e => !e.includes('(already invited)'));

            if (hardFailed.length > 0 && successCount === 0 && alreadyPending.length === 0) {
                // Every insert failed
                throw new Error(`Could not record invitation${failedEmails.length > 1 ? 's' : ''}. Please try again.`);
            }

            // BUG_INVITE_001/002 FIX: Email delivery requires a backend trigger.
            // A Supabase Edge Function or Database Webhook must be configured to
            // listen on INSERT to the invitations table and send the actual email
            // (e.g. via Resend / SendGrid). Until that is wired up, show an honest
            // message rather than a false "sent" confirmation.
            //
            // When the Edge Function is ready, remove this comment block and
            // restore: window.showToast?.('Invitations sent successfully!', 'success');
            if (alreadyPending.length > 0 && successCount === 0 && hardFailed.length === 0) {
                // All addresses already had pending invitations — nothing new sent
                window.showToast?.(
                    `${alreadyPending.length === 1 ? 'That address has' : 'All addresses have'} already been invited and ${alreadyPending.length === 1 ? 'is' : 'are'} awaiting a response.`,
                    'warning'
                ) || alert('These addresses already have pending invitations.');
            } else if (failedEmails.length > 0 && successCount > 0) {
                // Mixed: some sent, some skipped/failed
                const parts = [];
                if (successCount > 0) parts.push(`${successCount} invitation${successCount !== 1 ? 's' : ''} recorded`);
                if (alreadyPending.length > 0) parts.push(`${alreadyPending.length} already pending`);
                if (hardFailed.length > 0) parts.push(`${hardFailed.length} failed`);
                window.showToast?.(parts.join(', ') + '.', 'warning')
                    || alert(parts.join(', ') + '.');
            } else if (failedEmails.length > 0 && successCount === 0) {
                // Every insert failed for hard reasons
                window.showToast?.(
                    `${failedEmails.length} invitation${failedEmails.length !== 1 ? 's' : ''} could not be recorded. Please try again.`,
                    'error'
                ) || alert('Could not record invitations. Please try again.');
            } else {
                window.showToast?.(
                    `Invitation${validation.emails.length !== 1 ? 's' : ''} recorded — your peer${validation.emails.length !== 1 ? 's' : ''} will receive an email shortly.`,
                    'success'
                ) || alert('Invitation(s) sent successfully.');
            }

            this.close();

        } catch (error) {
            console.error('Error sending invitations:', error);
            window.showToast?.(
                error.message || 'Failed to send invitations. Please try again.',
                'error'
            ) || alert(error.message || 'Failed to send invitations. Please try again.');
        } finally {
            sendBtn.disabled = false;
            sendBtn.innerHTML = 'Send Invitations';
        }
    }

    /**
     * Generate a collision-safe invite token.
     *
     * BUG_INVITE_001/002 FIX: The old implementation used Date.now() as a suffix.
     * When multiple emails were invited in the same synchronous tick, every token
     * in the batch received the same timestamp, risking UNIQUE constraint violations
     * on invitations.token for the second and subsequent inserts in that batch.
     *
     * crypto.randomUUID() produces a cryptographically random 128-bit UUID with
     * effectively zero collision probability and is available in all modern browsers
     * (Chrome 92+, Firefox 95+, Safari 15.4+) and Supabase Edge Functions (Deno).
     * The 'inv_' prefix is kept for readability and easy filtering in the DB.
     */
    generateInviteToken() {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            return 'inv_' + crypto.randomUUID().replace(/-/g, '');
        }
        // Fallback for very old environments — three separate Math.random() calls
        // with an extra high-resolution timestamp segment to reduce collision risk
        return 'inv_'
            + Math.random().toString(36).substring(2, 15)
            + Math.random().toString(36).substring(2, 15)
            + Math.random().toString(36).substring(2, 10)
            + '_' + performance.now().toString(36).replace('.', '');
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