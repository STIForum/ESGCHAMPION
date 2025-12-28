/**
 * Admin Service
 * ESG Champions Platform
 * 
 * Admin-specific API calls and functionality
 */

class AdminService {
    constructor() {
        this.supabase = window.supabaseService;
    }

    // =====================================================
    // REVIEWS
    // =====================================================

    /**
     * Get pending reviews for moderation
     */
    async getPendingReviews() {
        return await this.supabase.getPendingReviews();
    }

    /**
     * Get all reviews with filters
     */
    async getAllReviews(options = {}) {
        const client = window.getSupabase();
        let query = client
            .from('reviews')
            .select('*, champions(id, full_name, email, avatar_url), indicators(name), panels(name, category)')
            .order('created_at', { ascending: false });

        if (options.status) {
            query = query.eq('status', options.status);
        }

        if (options.limit) {
            query = query.limit(options.limit);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    }

    /**
     * Accept a review
     */
    async acceptReview(reviewId) {
        const user = window.championAuth.getUser();
        return await this.supabase.acceptReview(reviewId, user.id);
    }

    /**
     * Reject a review
     */
    async rejectReview(reviewId, reason) {
        const client = window.getSupabase();
        const user = window.championAuth.getUser();

        const { data, error } = await client
            .from('reviews')
            .update({
                status: 'rejected',
                feedback: reason,
                reviewed_by: user.id,
                reviewed_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', reviewId)
            .select()
            .single();

        if (error) throw error;

        // Log admin action
        await this.logAction('reject_review', 'review', reviewId, { reason });

        return data;
    }

    /**
     * Delete a review (soft delete)
     */
    async deleteReview(reviewId, reason) {
        const user = window.championAuth.getUser();
        return await this.supabase.deleteReview(reviewId, user.id, reason);
    }

    // =====================================================
    // PANELS
    // =====================================================

    /**
     * Get all panels (including inactive)
     */
    async getAllPanels() {
        const client = window.getSupabase();
        const { data, error } = await client
            .from('panels')
            .select('*')
            .order('order_index');
        if (error) throw error;
        return data;
    }

    /**
     * Create a new panel
     */
    async createPanel(panelData) {
        const data = await this.supabase.createPanel(panelData);
        await this.logAction('create_panel', 'panel', data.id, { name: panelData.name });
        return data;
    }

    /**
     * Update a panel
     */
    async updatePanel(panelId, updates) {
        const data = await this.supabase.updatePanel(panelId, updates);
        await this.logAction('update_panel', 'panel', panelId, updates);
        return data;
    }

    /**
     * Delete a panel (soft delete by deactivating)
     */
    async deletePanel(panelId) {
        const data = await this.supabase.updatePanel(panelId, { is_active: false });
        await this.logAction('delete_panel', 'panel', panelId);
        return data;
    }

    /**
     * Permanently delete a panel from the database
     */
    async permanentlyDeletePanel(panelId) {
        const client = window.getSupabase();
        
        // First delete all indicators associated with this panel
        await client
            .from('indicators')
            .delete()
            .eq('panel_id', panelId);

        // Then delete the panel itself
        const { data, error } = await client
            .from('panels')
            .delete()
            .eq('id', panelId)
            .select()
            .single();

        if (error) throw error;
        
        await this.logAction('permanent_delete_panel', 'panel', panelId);
        return data;
    }

    // =====================================================
    // INDICATORS
    // =====================================================

    /**
     * Get all indicators (including inactive)
     */
    async getAllIndicators() {
        const client = window.getSupabase();
        const { data, error } = await client
            .from('indicators')
            .select('*, panels(name, category)')
            .order('order_index');
        if (error) throw error;
        return data;
    }

    /**
     * Create a new indicator
     */
    async createIndicator(indicatorData) {
        const data = await this.supabase.createIndicator(indicatorData);
        await this.logAction('create_indicator', 'indicator', data.id, { name: indicatorData.name });
        return data;
    }

    /**
     * Update an indicator
     */
    async updateIndicator(indicatorId, updates) {
        const data = await this.supabase.updateIndicator(indicatorId, updates);
        await this.logAction('update_indicator', 'indicator', indicatorId, updates);
        return data;
    }

    /**
     * Delete an indicator (soft delete by deactivating)
     */
    async deleteIndicator(indicatorId) {
        const data = await this.supabase.updateIndicator(indicatorId, { is_active: false });
        await this.logAction('delete_indicator', 'indicator', indicatorId);
        return data;
    }

    /**
     * Move indicator to different panel
     */
    async moveIndicator(indicatorId, newPanelId) {
        const data = await this.supabase.updateIndicator(indicatorId, { panel_id: newPanelId });
        await this.logAction('move_indicator', 'indicator', indicatorId, { new_panel_id: newPanelId });
        return data;
    }

    // =====================================================
    // CHAMPIONS
    // =====================================================

    /**
     * Get all champions
     */
    async getAllChampions() {
        return await this.supabase.getChampions({ orderBy: 'created_at' });
    }

    /**
     * Update champion (admin privileges)
     */
    async updateChampion(championId, updates) {
        const data = await this.supabase.updateChampion(championId, updates);
        await this.logAction('update_champion', 'champion', championId, updates);
        return data;
    }

    /**
     * Toggle admin status
     */
    async toggleAdmin(championId, isAdmin) {
        const data = await this.supabase.updateChampion(championId, { is_admin: isAdmin });
        await this.logAction(isAdmin ? 'grant_admin' : 'revoke_admin', 'champion', championId);
        return data;
    }

    // =====================================================
    // ADMIN ACTIONS LOG
    // =====================================================

    /**
     * Log an admin action
     */
    async logAction(actionType, targetType, targetId, details = {}) {
        try {
            const user = window.championAuth.getUser();
            await this.supabase.logAdminAction(user.id, actionType, targetType, targetId, details);
        } catch (error) {
            console.error('Error logging admin action:', error);
        }
    }

    /**
     * Get admin actions log
     */
    async getAdminActionsLog(limit = 100) {
        return await this.supabase.getAdminActions(limit);
    }

    // =====================================================
    // EXPORT
    // =====================================================

    /**
     * Export data to Excel/CSV
     */
    async exportData() {
        try {
            const [reviews, panels, indicators, champions] = await Promise.all([
                this.getAllReviews(),
                this.getAllPanels(),
                this.getAllIndicators(),
                this.getAllChampions()
            ]);

            // Create CSV content
            const csvContent = this.generateCSV({
                reviews,
                panels,
                indicators,
                champions
            });

            // Download file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `esg-champions-export-${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            return true;
        } catch (error) {
            console.error('Export error:', error);
            throw error;
        }
    }

    generateCSV(data) {
        let csv = '';

        // Reviews section
        csv += '=== REVIEWS ===\n';
        csv += 'ID,Champion,Email,Indicator,Panel,Status,Rating,Created At\n';
        data.reviews.forEach(r => {
            csv += `"${r.id}","${r.champions?.full_name || ''}","${r.champions?.email || ''}","${r.indicators?.name || ''}","${r.panels?.name || ''}","${r.status}","${r.rating || ''}","${r.created_at}"\n`;
        });

        csv += '\n=== PANELS ===\n';
        csv += 'ID,Name,Category,Active\n';
        data.panels.forEach(p => {
            csv += `"${p.id}","${p.name}","${p.category}","${p.is_active}"\n`;
        });

        csv += '\n=== INDICATORS ===\n';
        csv += 'ID,Name,Panel,Active\n';
        data.indicators.forEach(i => {
            csv += `"${i.id}","${i.name}","${i.panels?.name || ''}","${i.is_active}"\n`;
        });

        csv += '\n=== CHAMPIONS ===\n';
        csv += 'ID,Name,Email,Company,Credits,Reviews,Admin,Created At\n';
        data.champions.forEach(c => {
            csv += `"${c.id}","${c.full_name || ''}","${c.email}","${c.company || ''}","${c.credits || 0}","${c.total_reviews || 0}","${c.is_admin}","${c.created_at}"\n`;
        });

        return csv;
    }

    // =====================================================
    // STATISTICS
    // =====================================================

    /**
     * Get admin dashboard statistics
     */
    async getStatistics() {
        const client = window.getSupabase();

        const [
            { count: totalReviews },
            { count: pendingReviews },
            { count: totalChampions },
            { count: totalPanels },
            { count: totalIndicators }
        ] = await Promise.all([
            client.from('reviews').select('*', { count: 'exact', head: true }),
            client.from('reviews').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            client.from('champions').select('*', { count: 'exact', head: true }),
            client.from('panels').select('*', { count: 'exact', head: true }).eq('is_active', true),
            client.from('indicators').select('*', { count: 'exact', head: true }).eq('is_active', true)
        ]);

        return {
            totalReviews: totalReviews || 0,
            pendingReviews: pendingReviews || 0,
            totalChampions: totalChampions || 0,
            totalPanels: totalPanels || 0,
            totalIndicators: totalIndicators || 0
        };
    }
}

// Create and export singleton instance
window.AdminService = AdminService;
window.adminService = new AdminService();

