/**
 * Champion Database Service
 * ESG Champions Platform
 * 
 * Database helper functions for champion-related operations
 */

class ChampionDB {
    constructor() {
        this.service = window.supabaseService;
    }

    // =====================================================
    // PANELS & INDICATORS
    // =====================================================

    /**
     * Get all panels with indicator counts
     */
    async getPanelsWithCounts() {
        try {
            const panels = await this.service.getPanels();
            
            // Get indicator counts for each panel
            const panelsWithCounts = await Promise.all(
                panels.map(async (panel) => {
                    const indicators = await this.service.getIndicatorsByPanel(panel.id);
                    return {
                        ...panel,
                        indicator_count: indicators.length
                    };
                })
            );

            return panelsWithCounts;
        } catch (error) {
            console.error('Error getting panels with counts:', error);
            throw error;
        }
    }

    /**
     * Get panel with its indicators
     */
    async getPanelWithIndicators(panelId) {
        try {
            const [panel, indicators] = await Promise.all([
                this.service.getPanel(panelId),
                this.service.getIndicatorsByPanel(panelId)
            ]);

            return {
                ...panel,
                indicators
            };
        } catch (error) {
            console.error('Error getting panel with indicators:', error);
            throw error;
        }
    }

    /**
     * Get ALL indicators (system-wide, not panel-specific)
     */
    async getAllIndicators() {
        try {
            return await this.service.getAllIndicators();
        } catch (error) {
            console.error('Error getting all indicators:', error);
            throw error;
        }
    }

    /**
     * Get indicators by their IDs
     */
    async getIndicatorsByIds(ids) {
        try {
            return await this.service.getIndicatorsByIds(ids);
        } catch (error) {
            console.error('Error getting indicators by IDs:', error);
            throw error;
        }
    }

    /**
     * Get indicator with reviews and stats
     */
    async getIndicatorWithReviews(indicatorId) {
        try {
            const [indicator, reviews] = await Promise.all([
                this.service.getIndicator(indicatorId),
                this.service.getReviewsByIndicator(indicatorId)
            ]);

            // Get votes for each review
            const reviewsWithVotes = await Promise.all(
                reviews.map(async (review) => {
                    const votes = await this.service.getVotes(review.id);
                    const upvotes = votes.filter(v => v.vote_type === 'upvote').length;
                    const downvotes = votes.filter(v => v.vote_type === 'downvote').length;
                    return {
                        ...review,
                        upvotes,
                        downvotes,
                        score: upvotes - downvotes
                    };
                })
            );

            return {
                ...indicator,
                reviews: reviewsWithVotes,
                review_count: reviews.length
            };
        } catch (error) {
            console.error('Error getting indicator with reviews:', error);
            throw error;
        }
    }

    // =====================================================
    // REVIEWS
    // =====================================================

    /**
     * Submit a new review
     */
    async submitReview(indicatorId, content, rating) {
        const auth = window.championAuth;
        if (!auth.isAuthenticated()) {
            throw new Error('Must be authenticated to submit a review');
        }

        const champion = auth.getChampion();
        const indicator = await this.service.getIndicator(indicatorId);

        try {
            const review = await this.service.createReview({
                champion_id: champion.id,
                indicator_id: indicatorId,
                panel_id: indicator.panel_id,
                content: content,
                rating: rating,
                status: 'pending'
            });

            // Update progress tracking
            await this.service.updateProgress(champion.id, indicator.panel_id, indicatorId);

            return review;
        } catch (error) {
            console.error('Error submitting review:', error);
            throw error;
        }
    }

    /**
     * Get champion's reviews with stats
     */
    async getMyReviews() {
        const auth = window.championAuth;
        if (!auth.isAuthenticated()) {
            throw new Error('Must be authenticated');
        }

        try {
            const reviews = await this.service.getReviewsByChampion(auth.getUser().id);
            
            // Get vote counts for each review
            const reviewsWithVotes = await Promise.all(
                reviews.map(async (review) => {
                    const votes = await this.service.getVotes(review.id);
                    return {
                        ...review,
                        upvotes: votes.filter(v => v.vote_type === 'upvote').length,
                        downvotes: votes.filter(v => v.vote_type === 'downvote').length
                    };
                })
            );

            return reviewsWithVotes;
        } catch (error) {
            console.error('Error getting my reviews:', error);
            throw error;
        }
    }

    /**
     * Get review with comments
     */
    async getReviewWithComments(reviewId) {
        try {
            const comments = await this.service.getComments(reviewId);
            const votes = await this.service.getVotes(reviewId);

            return {
                comments,
                votes,
                upvotes: votes.filter(v => v.vote_type === 'upvote').length,
                downvotes: votes.filter(v => v.vote_type === 'downvote').length
            };
        } catch (error) {
            console.error('Error getting review with comments:', error);
            throw error;
        }
    }

    // =====================================================
    // VOTING
    // =====================================================

    /**
     * Upvote a review
     */
    async upvote(reviewId) {
        const auth = window.championAuth;
        if (!auth.isAuthenticated()) {
            throw new Error('Must be authenticated to vote');
        }

        return await this.service.vote(reviewId, auth.getUser().id, 'upvote');
    }

    /**
     * Downvote a review
     */
    async downvote(reviewId) {
        const auth = window.championAuth;
        if (!auth.isAuthenticated()) {
            throw new Error('Must be authenticated to vote');
        }

        return await this.service.vote(reviewId, auth.getUser().id, 'downvote');
    }

    /**
     * Remove vote
     */
    async removeVote(reviewId) {
        const auth = window.championAuth;
        if (!auth.isAuthenticated()) {
            throw new Error('Must be authenticated');
        }

        return await this.service.removeVote(reviewId, auth.getUser().id);
    }

    // =====================================================
    // COMMENTS
    // =====================================================

    /**
     * Add a comment to a review
     */
    async addComment(reviewId, content, parentId = null) {
        const auth = window.championAuth;
        if (!auth.isAuthenticated()) {
            throw new Error('Must be authenticated to comment');
        }

        return await this.service.createComment({
            review_id: reviewId,
            champion_id: auth.getUser().id,
            content: content,
            parent_id: parentId
        });
    }

    // =====================================================
    // DASHBOARD STATS
    // =====================================================

    /**
     * Get champion dashboard stats
     */
    async getDashboardStats() {
        const auth = window.championAuth;
        if (!auth.isAuthenticated()) {
            throw new Error('Must be authenticated');
        }

        const championId = auth.getUser().id;

        try {
            const [champion, reviews, acceptedReviews, resumePoint, panelSubmissions] = await Promise.all([
                this.service.getChampion(championId),
                this.service.getReviewsByChampion(championId),
                this.service.getAcceptedReviews({ championId }),
                this.service.getResumePoint(championId),
                this.service.getUserPanelReviewSubmissions(championId)
            ]);

            // Get indicator reviews from panel submissions
            let panelIndicatorReviews = [];
            if (panelSubmissions && panelSubmissions.length > 0) {
                for (const submission of panelSubmissions) {
                    try {
                        const fullSubmission = await this.service.getSubmissionWithIndicatorReviews(submission.id);
                        if (fullSubmission && fullSubmission.indicatorReviews) {
                            // Map panel reviews to match the format expected by the dashboard
                            const mappedReviews = fullSubmission.indicatorReviews.map(review => ({
                                id: review.id,
                                status: submission.status, // Use submission status
                                created_at: review.created_at || submission.created_at,
                                indicators: review.indicators,
                                panels: fullSubmission.panels,
                                rating: review.clarity_rating,
                                content: review.analysis
                            }));
                            panelIndicatorReviews.push(...mappedReviews);
                        }
                    } catch (err) {
                        console.warn('Error fetching submission details:', err);
                    }
                }
            }

            // Combine old reviews and panel reviews
            const allReviews = [...reviews, ...panelIndicatorReviews];
            
            // Sort by created_at descending
            allReviews.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            const pendingReviews = allReviews.filter(r => r.status === 'pending');
            const approvedReviews = allReviews.filter(r => r.status === 'approved');
            const rejectedReviews = allReviews.filter(r => r.status === 'rejected');

            return {
                champion,
                stats: {
                    totalReviews: allReviews.length,
                    pendingReviews: pendingReviews.length,
                    approvedReviews: approvedReviews.length,
                    rejectedReviews: rejectedReviews.length,
                    credits: champion.credits || 0,
                    acceptedReviewsCount: acceptedReviews.length
                },
                recentReviews: allReviews.slice(0, 5),
                resumePoint
            };
        } catch (error) {
            console.error('Error getting dashboard stats:', error);
            throw error;
        }
    }

    /**
     * Get STIF score breakdown
     */
    async getSTIFScore() {
        const auth = window.championAuth;
        if (!auth.isAuthenticated()) {
            throw new Error('Must be authenticated');
        }

        try {
            const champion = await this.service.getChampion(auth.getUser().id);
            const reviews = await this.service.getReviewsByChampion(auth.getUser().id);
            const acceptedReviews = await this.service.getAcceptedReviews({ championId: auth.getUser().id });

            // Calculate STIF score components
            const reviewCredits = acceptedReviews.reduce((sum, r) => sum + (r.credits_awarded || 0), 0);
            
            // Get vote stats
            let totalUpvotes = 0;
            for (const review of reviews) {
                const votes = await this.service.getVotes(review.id);
                totalUpvotes += votes.filter(v => v.vote_type === 'upvote').length;
            }

            const voteCredits = totalUpvotes * 2;
            
            return {
                totalScore: champion.credits || 0,
                breakdown: {
                    reviews: reviewCredits,
                    votes: voteCredits,
                    participation: champion.credits - reviewCredits - voteCredits
                },
                rank: await this.getChampionRank(champion.id)
            };
        } catch (error) {
            console.error('Error getting STIF score:', error);
            throw error;
        }
    }

    /**
     * Get champion's rank
     */
    async getChampionRank(championId) {
        try {
            const leaderboard = await this.service.getLeaderboard(1000);
            const rank = leaderboard.findIndex(c => c.id === championId) + 1;
            return rank || null;
        } catch (error) {
            console.error('Error getting champion rank:', error);
            return null;
        }
    }

    // =====================================================
    // LEADERBOARD
    // =====================================================

    /**
     * Get leaderboard data
     */
    async getLeaderboard(period = '30days', limit = 50) {
        try {
            return await this.service.getLeaderboard(limit, period);
        } catch (error) {
            console.error('Error getting leaderboard:', error);
            throw error;
        }
    }

    // =====================================================
    // NOTIFICATIONS
    // =====================================================

    /**
     * Get notifications
     */
    async getNotifications() {
        try {
            const auth = window.championAuth;
            if (!auth || !auth.isAuthenticated()) {
                console.log('getNotifications: not authenticated');
                return [];
            }

            const userId = auth.getUser()?.id;
            if (!userId) {
                console.log('getNotifications: no user ID');
                return [];
            }

            return await this.service.getNotifications(userId);
        } catch (error) {
            console.warn('getNotifications error:', error.message);
            return [];
        }
    }

    /**
     * Get unread count
     */
    async getUnreadCount() {
        const auth = window.championAuth;
        if (!auth.isAuthenticated()) {
            return 0;
        }

        return await this.service.getUnreadNotificationCount(auth.getUser().id);
    }

    /**
     * Mark notification as read
     */
    async markAsRead(notificationId) {
        return await this.service.markNotificationRead(notificationId);
    }

    /**
     * Mark all as read
     */
    async markAllAsRead() {
        return await this.service.markAllNotificationsRead();
    }

    /**
     * Create a notification
     */
    async createNotification(championId, type, title, message, link = null, data = null) {
        return await this.service.createNotification(championId, type, title, message, link, data);
    }

    // =====================================================
    // PROGRESS
    // =====================================================

    /**
     * Get resume point for "Continue where you left off"
     */
    async getResumePoint() {
        const auth = window.championAuth;
        if (!auth.isAuthenticated()) {
            return null;
        }

        return await this.service.getResumePoint(auth.getUser().id);
    }

    /**
     * Log activity
     */
    async logActivity(activityType, panelId = null, indicatorId = null, reviewId = null, metadata = null) {
        const auth = window.championAuth;
        if (!auth.isAuthenticated()) {
            return;
        }

        try {
            await this.service.logActivity(
                auth.getUser().id,
                activityType,
                panelId,
                indicatorId,
                reviewId,
                metadata
            );
        } catch (error) {
            console.error('Error logging activity:', error);
        }
    }

    // =====================================================
    // PANEL REVIEW SUBMISSIONS
    // =====================================================

    /**
     * Create a panel review submission with all indicator reviews
     */
    async createPanelReviewSubmission(panelId, indicatorReviews) {
        const auth = window.championAuth;
        if (!auth.isAuthenticated()) {
            throw new Error('User must be authenticated');
        }

        if (!indicatorReviews || indicatorReviews.length === 0) {
            throw new Error('No indicator reviews provided');
        }

        try {
            const userId = auth.getUser().id;
            
            console.log('Creating panel review submission:', { panelId, userId, reviewCount: indicatorReviews.length });
            console.log('Indicator reviews data:', indicatorReviews);
            
            // Create the submission
            const submission = await this.service.createPanelReviewSubmission(panelId, userId);
            console.log('Submission created:', submission);
            
            if (!submission || !submission.id) {
                throw new Error('Failed to create submission - no ID returned');
            }
            
            // Add indicator reviews
            const reviews = await this.service.addIndicatorReviewsToSubmission(
                submission.id,
                indicatorReviews,
                userId
            );
            
            console.log('Indicator reviews inserted:', reviews);
            
            if (!reviews || reviews.length === 0) {
                console.warn('Warning: No indicator reviews were inserted');
            }

            return {
                submission,
                indicatorReviews: reviews || []
            };
        } catch (error) {
            console.error('Error creating panel review submission:', error);
            throw error;
        }
    }

    /**
     * Get all panel review submissions for admin
     */
    async getAdminPanelReviewSubmissions(status = null) {
        try {
            return await this.service.getAdminPanelReviewSubmissions(status);
        } catch (error) {
            console.error('Error getting admin panel submissions:', error);
            throw error;
        }
    }

    /**
     * Get submission with indicator reviews
     */
    async getSubmissionWithIndicatorReviews(submissionId) {
        try {
            return await this.service.getSubmissionWithIndicatorReviews(submissionId);
        } catch (error) {
            console.error('Error getting submission with reviews:', error);
            throw error;
        }
    }

    /**
     * Update submission status
     */
    async updateSubmissionStatus(submissionId, status) {
        try {
            return await this.service.updateSubmissionStatus(submissionId, status);
        } catch (error) {
            console.error('Error updating submission status:', error);
            throw error;
        }
    }

    /**
     * Approve submission with admin comment - updates both submission and indicator reviews
     */
    async approveSubmissionWithComment(submissionId, adminComment, adminId) {
        try {
            return await this.service.approveSubmissionWithComment(submissionId, adminComment, adminId);
        } catch (error) {
            console.error('Error approving submission with comment:', error);
            throw error;
        }
    }

    /**
     * Reject submission with admin comment
     */
    async rejectSubmissionWithComment(submissionId, adminComment, adminId) {
        try {
            return await this.service.rejectSubmissionWithComment(submissionId, adminComment, adminId);
        } catch (error) {
            console.error('Error rejecting submission with comment:', error);
            throw error;
        }
    }

    /**
     * Get user's panel review submissions
     */
    async getUserPanelReviewSubmissions() {
        const auth = window.championAuth;
        if (!auth.isAuthenticated()) {
            return [];
        }

        try {
            return await this.service.getUserPanelReviewSubmissions(auth.getUser().id);
        } catch (error) {
            console.error('Error getting user submissions:', error);
            return [];
        }
    }

    /**
     * Get user's accepted indicator IDs for a specific panel
     */
    async getUserAcceptedIndicatorIds(panelId) {
        const auth = window.championAuth;
        if (!auth.isAuthenticated()) {
            return [];
        }

        try {
            return await this.service.getUserAcceptedIndicatorIds(auth.getUser().id, panelId);
        } catch (error) {
            console.error('Error getting user accepted indicators:', error);
            return [];
        }
    }
}

// Create and export singleton instance
window.ChampionDB = ChampionDB;
window.championDB = new ChampionDB();

