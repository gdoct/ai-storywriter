import React from 'react';
import { Link } from 'react-router-dom';
import './MarketingFooter.css';

const MarketingFooter: React.FC = () => {
  return (
    <footer className="marketing-footer">
      <div className="marketing-footer-container">
        <div className="footer-content">
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <img src="/storywriter-logo-48.png" alt="StoryWriter" />
              <span className="footer-brand-name">StoryWriter</span>
            </Link>
            <p className="footer-description">
              AI-powered story generation for creative writers
            </p>
          </div>
          
          <div className="footer-links">
            <div className="footer-section">
              <h4>Product</h4>
              <ul>
                <li><Link to="/features">Features</Link></li>
                <li><Link to="/pricing">Pricing</Link></li>
                <li><Link to="/templates">Templates</Link></li>
              </ul>
            </div>
            
            <div className="footer-section">
              <h4>Company</h4>
              <ul>
                <li><a href="mailto:support@storywriter.app">Support</a></li>
                <li><a href="mailto:contact@storywriter.app">Contact</a></li>
              </ul>
            </div>
            
            <div className="footer-section">
              <h4>Legal</h4>
              <ul>
                <li><Link to="/privacy">Privacy Policy</Link></li>
                <li><Link to="/terms">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p>&copy; 2025 StoryWriter. All rights reserved.</p>
            <div className="footer-legal-links">
              <Link to="/privacy">Privacy</Link>
              <span className="separator">•</span>
              <Link to="/terms">Terms</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default MarketingFooter;
