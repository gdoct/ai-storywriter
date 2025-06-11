import React from 'react';
import { Link } from 'react-router-dom';
import './CTASection.css';

const CTASection: React.FC = () => {
  return (
    <section className="cta-section">
      <div className="cta-container">
        <div className="cta-content">
          <h2 className="cta-title">
            Start Writing Today - It's Free!
          </h2>
          <p className="cta-subtitle">
            Join thousands of writers using AI to enhance their creativity. 
            No credit card required to get started.
          </p>
          <div className="cta-buttons">
            <Link to="/signup" className="btn btn-primary btn-large">
              Create Free Account
            </Link>
            <Link to="/features" className="btn btn-secondary btn-large">
              Learn More
            </Link>
          </div>
          <p className="cta-note">
            🔒 Free forever • No hidden fees • Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
