/**
 * Footer Component
 * Site-wide footer matching existing design
 */

import { Link } from 'react-router-dom'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-grid">
          {/* Brand Column */}
          <div className="footer-column">
            <Link to="/" className="footer-logo">
              <img src="/assets/images/logo1.png" alt="STIF Logo" className="footer-logo-img" />
              <span>STIF</span>
            </Link>
            <p className="footer-description">
              Sustainability Technology and Innovation Forum - 
              Empowering ESG Champions to drive sustainability reporting excellence.
            </p>
          </div>

          {/* Quick Links */}
          <div className="footer-column">
            <h4>Quick Links</h4>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/about">About</Link></li>
              <li><Link to="/ranking">Rankings</Link></li>
              <li><Link to="/faq">FAQ</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div className="footer-column">
            <h4>Resources</h4>
            <ul className="footer-links">
              <li><Link to="/champion-panels">ESG Panels</Link></li>
              <li><Link to="/champion-register">Become a Champion</Link></li>
              <li>
                <a href="https://github.com/stif-org" target="_blank" rel="noopener noreferrer">
                  GitHub
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="footer-column">
            <h4>Legal</h4>
            <ul className="footer-links">
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><Link to="/terms">Terms of Service</Link></li>
              <li><Link to="/cookie-policy">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {currentYear} Sustainability Technology and Innovation Forum. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
