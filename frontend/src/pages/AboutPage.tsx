/**
 * About Page
 * Information about STIF
 */

import { Link } from 'react-router-dom'

export function AboutPage() {
  return (
    <main style={{ paddingTop: '100px' }}>
      {/* Hero Section */}
      <section style={{ padding: 'var(--space-16) 0', background: 'var(--gray-50)' }}>
        <div className="container text-center">
          <h1>About STIF</h1>
          <p className="text-secondary" style={{ maxWidth: '700px', margin: 'var(--space-4) auto' }}>
            The Sustainability Technology and Innovation Forum is dedicated to making 
            ESG reporting accessible and meaningful for small and medium enterprises worldwide.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="container" style={{ padding: 'var(--space-16) 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-12)', alignItems: 'center' }}>
          <div>
            <h2>Our Mission</h2>
            <p className="text-secondary" style={{ marginBottom: 'var(--space-4)' }}>
              We believe that sustainability reporting shouldn't be reserved for large corporations. 
              SMEs represent over 90% of businesses globally and are critical to achieving 
              global sustainability goals.
            </p>
            <p className="text-secondary">
              Our mission is to create a practical, expert-validated baseline of ESG indicators 
              that SMEs can use to measure and improve their sustainability performance.
            </p>
          </div>
          <div className="feature-card" style={{ padding: 'var(--space-8)' }}>
            <div className="stat-value text-gradient" style={{ fontSize: 'var(--text-5xl)' }}>90%+</div>
            <p className="text-secondary mt-2">of global businesses are SMEs</p>
          </div>
        </div>
      </section>

      {/* How Champions Help Section */}
      <section style={{ background: 'var(--primary-50)', padding: 'var(--space-16) 0' }}>
        <div className="container">
          <h2 className="text-center mb-8">How Champions Make a Difference</h2>
          <div className="features-grid">
            <div className="feature-card">
              <h3>Expert Validation</h3>
              <p className="text-secondary">
                Champions review and validate ESG indicators, ensuring they are relevant, 
                practical, and impactful for SMEs.
              </p>
            </div>
            <div className="feature-card">
              <h3>Train Our AI</h3>
              <p className="text-secondary">
                Your expert reviews help train the STIF Intelligence Engine to provide 
                smarter, context-aware recommendations.
              </p>
            </div>
            <div className="feature-card">
              <h3>Shape Standards</h3>
              <p className="text-secondary">
                The collective wisdom of champions directly influences which indicators 
                become part of the global SME ESG baseline.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container text-center" style={{ padding: 'var(--space-16) 0' }}>
        <h2>Ready to Make an Impact?</h2>
        <p className="text-secondary" style={{ maxWidth: '600px', margin: 'var(--space-4) auto var(--space-6)' }}>
          Join our community of sustainability champions and help shape the future of ESG reporting.
        </p>
        <Link to="/champion-register" className="btn btn-primary btn-lg">
          Become a Champion
        </Link>
      </section>
    </main>
  )
}
