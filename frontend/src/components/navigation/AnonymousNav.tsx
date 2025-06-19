import React from 'react';
import { Link } from 'react-router-dom';
import './Navigation.css';

const AnonymousNav: React.FC = () => {
  return (
    <div className="nav-container">
      <nav className="nav-links">
        <Link to="/marketplace" className="nav-link" data-test-id="nav-marketplace">Marketplace</Link>
        <Link to="/features" className="nav-link" data-test-id="nav-features">Features</Link>
        <Link to="/pricing" className="nav-link" data-test-id="nav-pricing">Pricing</Link>
        <Link to="/login" className="nav-link" data-test-id="nav-login">Login</Link>
        <Link to="/signup" className="nav-link nav-cta" data-test-id="nav-signup">Sign Up</Link>
      </nav>
    </div>
  );
};

export default AnonymousNav;
