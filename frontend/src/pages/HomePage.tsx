/**
 * Home Page
 * Landing page for the application
 */

import { Link } from 'react-router-dom'
import { useAuth } from '@/features/auth'

export function HomePage() {
  const { user } = useAuth()

  return (
    <main>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title animate-fade-in">
              Shape the Future of <span className="text-gradient">ESG Reporting</span>
            </h1>
            <p className="hero-subtitle animate-fade-in" style={{ animationDelay: '0.1s' }}>
              Join a community of sustainability champions helping SMEs navigate the complex 
              world of Environmental, Social, and Governance reporting.
            </p>
            <div className="hero-actions animate-fade-in" style={{ animationDelay: '0.2s' }}>
              {user ? (
                <Link to="/champion-dashboard" className="btn btn-primary btn-lg">
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/champion-register" className="btn btn-primary btn-lg">
                    Become a Champion
                  </Link>
                  <Link to="/champion-login" className="btn btn-secondary btn-lg">
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="text-center mb-12">
            <h2>Why Become a STIF Champion?</h2>
            <p className="text-secondary" style={{ maxWidth: '600px', margin: 'var(--space-4) auto' }}>
              Your expertise shapes the ESG baseline for small and medium enterprises worldwide.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon" style={{ background: 'var(--environmental-bg)', color: 'var(--environmental)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22c4-4 8-7.5 8-12a8 8 0 1 0-16 0c0 4.5 4 8 8 12z" />
                </svg>
              </div>
              <h3 className="feature-title">Drive Impact</h3>
              <p className="feature-description">
                Your reviews directly influence which sustainability indicators become 
                part of the global ESG baseline for SMEs.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon" style={{ background: 'var(--social-bg)', color: 'var(--social)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3 className="feature-title">Join Experts</h3>
              <p className="feature-description">
                Connect with a global community of sustainability professionals, 
                ESG analysts, and industry leaders.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon" style={{ background: 'var(--governance-bg)', color: 'var(--governance)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <h3 className="feature-title">Earn Recognition</h3>
              <p className="feature-description">
                Accumulate STIF credits, climb the leaderboard, and earn badges 
                that showcase your ESG expertise.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section" style={{ background: 'var(--gray-50)', padding: 'var(--space-20) 0' }}>
        <div className="container">
          <div className="text-center mb-12">
            <h2>How It Works</h2>
            <p className="text-secondary" style={{ maxWidth: '600px', margin: 'var(--space-4) auto' }}>
              Contributing to ESG standards has never been easier.
            </p>
          </div>

          <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-8)' }}>
            <div className="step-item text-center">
              <div className="step-number">1</div>
              <h4>Register</h4>
              <p className="text-secondary">
                Create your champion profile with your ESG expertise and interests.
              </p>
            </div>
            <div className="step-item text-center">
              <div className="step-number">2</div>
              <h4>Browse Panels</h4>
              <p className="text-secondary">
                Explore Environmental, Social, and Governance indicator panels.
              </p>
            </div>
            <div className="step-item text-center">
              <div className="step-number">3</div>
              <h4>Submit Reviews</h4>
              <p className="text-secondary">
                Share your expert opinion on indicator relevance for SMEs.
              </p>
            </div>
            <div className="step-item text-center">
              <div className="step-number">4</div>
              <h4>Earn Credits</h4>
              <p className="text-secondary">
                Get recognized for your contributions and climb the leaderboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section" style={{ 
        background: 'linear-gradient(135deg, var(--primary-600), var(--primary-800))', 
        color: 'white',
        padding: 'var(--space-20) 0',
        textAlign: 'center'
      }}>
        <div className="container">
          <h2 style={{ color: 'white', marginBottom: 'var(--space-4)' }}>
            Ready to Make a Difference?
          </h2>
          <p style={{ color: 'var(--primary-100)', maxWidth: '600px', margin: '0 auto var(--space-6)' }}>
            Join thousands of sustainability champions shaping the future of ESG reporting.
          </p>
          {user ? (
            <Link to="/champion-panels" className="btn btn-accent btn-lg">
              Start Reviewing
            </Link>
          ) : (
            <Link to="/champion-register" className="btn btn-accent btn-lg">
              Get Started Free
            </Link>
          )}
        </div>
      </section>
    </main>
  )
}
