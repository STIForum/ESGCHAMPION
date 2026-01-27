/**
 * Ranking / Leaderboard JavaScript
 * ESG Champions Platform
 */

// Fallback utility functions (in case centralized utilities don't load)
function _hideLoading(elementId) {
    if (window.hideLoading) return window.hideLoading(elementId);
    const el = document.getElementById(elementId);
    if (el) el.classList.add('hidden');
}

function _showErrorState(elementId, message, retryCallback) {
    if (window.showErrorState) return window.showErrorState(elementId, message, retryCallback);
    const el = document.getElementById(elementId);
    if (el) {
        el.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <h3 class="empty-state-title">Error</h3>
                <p class="empty-state-description">${message}</p>
                ${retryCallback ? '<button class="btn btn-primary" onclick="location.reload()">Try Again</button>' : ''}
            </div>
        `;
        el.classList.remove('hidden');
    }
}

class RankingPage {
    constructor() {
        this.champions = [];
        this.currentPeriod = 'all';
    }

    async init() {
        // Wait for services to be ready
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Load leaderboard
        await this.loadLeaderboard();
        
        // Setup period filters
        this.setupFilters();
        
        // Show user's rank if logged in
        await this.showUserRank();
    }

    async loadLeaderboard() {
        try {
            const champions = await window.championDB.getLeaderboard(this.currentPeriod, 50);
            this.champions = champions;
            
            document.getElementById('champion-count').textContent = champions.length;
            
            // Render podium (top 3)
            if (champions.length >= 3) {
                this.renderPodium(champions.slice(0, 3));
                document.getElementById('podium').classList.remove('hidden');
            }
            
            // Render rest of leaderboard
            this.renderLeaderboard(champions.slice(3));
            
            // Hide loading, show content using fallback utility
            _hideLoading('loading-state');
            document.getElementById('leaderboard-widget').classList.remove('hidden');
            
        } catch (error) {
            console.error('Error loading leaderboard:', error);
            this.showError('Failed to load leaderboard. Please refresh.');
        }
    }

    renderPodium(topThree) {
        const positions = [
            { rank: 1, prefix: 'rank1' },
            { rank: 2, prefix: 'rank2' },
            { rank: 3, prefix: 'rank3' }
        ];

        positions.forEach(({ rank, prefix }) => {
            const champion = topThree[rank - 1];
            if (!champion) return;

            const avatar = document.getElementById(`${prefix}-avatar`);
            const name = document.getElementById(`${prefix}-name`);
            const company = document.getElementById(`${prefix}-company`);
            const credits = document.getElementById(`${prefix}-credits`);

            if (champion.avatar_url) {
                avatar.innerHTML = `<img src="${champion.avatar_url}" alt="${champion.full_name}">`;
            } else {
                avatar.textContent = this.getInitials(champion.full_name);
            }

            name.textContent = champion.full_name || 'Anonymous';
            company.textContent = champion.company || 'ESG Champion';
            credits.textContent = champion.credits || 0;
        });
    }

    renderLeaderboard(champions) {
        const container = document.getElementById('leaderboard-list');
        
        if (champions.length === 0) {
            container.innerHTML = '<li class="p-6 text-center text-secondary">No more champions to display.</li>';
            return;
        }

        container.innerHTML = champions.map((champion, index) => {
            const rank = index + 4; // Start from 4 since top 3 is on podium
            const initials = this.getInitials(champion.full_name);
            
            return `
                <li class="leaderboard-item">
                    <div class="leaderboard-rank">${rank}</div>
                    <div class="avatar" style="flex-shrink: 0;">
                        ${champion.avatar_url 
                            ? `<img src="${champion.avatar_url}" alt="${champion.full_name}">`
                            : initials
                        }
                    </div>
                    <div class="leaderboard-info">
                        <div class="leaderboard-name">${champion.full_name || 'Anonymous'}</div>
                        <div class="leaderboard-stats">
                            ${champion.company || 'ESG Champion'} • ${champion.accepted_reviews_count || 0} reviews
                        </div>
                    </div>
                    <div class="leaderboard-score">${champion.credits || 0}</div>
                </li>
            `;
        }).join('');
    }

    async showUserRank() {
        if (!window.championAuth.isAuthenticated()) {
            return;
        }

        try {
            const champion = window.championAuth.getChampion();
            if (!champion) return;

            const rank = await window.championDB.getChampionRank(champion.id);
            
            document.getElementById('your-rank').textContent = rank ? `#${rank}` : '#--';
            document.getElementById('your-credits').textContent = champion.credits || 0;
            document.getElementById('your-rank-card').classList.remove('hidden');
            
        } catch (error) {
            console.error('Error getting user rank:', error);
        }
    }

    setupFilters() {
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const period = btn.dataset.period;
                this.currentPeriod = period;
                
                // Update button states
                document.querySelectorAll('.period-btn').forEach(b => {
                    b.classList.remove('active', 'btn-primary');
                    b.classList.add('btn-ghost');
                });
                btn.classList.add('active', 'btn-primary');
                btn.classList.remove('btn-ghost');
                
                // Reload leaderboard
                document.getElementById('loading-state').classList.remove('hidden');
                document.getElementById('podium').classList.add('hidden');
                document.getElementById('leaderboard-widget').classList.add('hidden');
                
                await this.loadLeaderboard();
            });
        });
    }

    getInitials(name) {
        if (!name) return '?';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    }

    showError(message) {
        // Use fallback error state display
        _showErrorState('loading-state', message, () => location.reload());
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    const ranking = new RankingPage();
    ranking.init();
});

