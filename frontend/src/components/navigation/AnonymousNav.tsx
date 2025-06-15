import React from 'react';
import { Link } from 'react-router-dom';
import './Navigation.css';

const AnonymousNav: React.FC = () => {
  return (
    <div className="nav-container">
      <nav className="nav-links">
        <Link to="/marketplace" className="nav-link">Marketplace</Link>
        <Link to="/features" className="nav-link">Features</Link>
        <Link to="/pricing" className="nav-link">Pricing</Link>
        <Link to="/login" className="nav-link">Login</Link>
        <Link to="/signup" className="nav-link nav-cta">Sign Up</Link>
      </nav>
    </div>
  );
};

export default AnonymousNav;
