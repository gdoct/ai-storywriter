import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../services/AuthContext';
import { logout } from '../../services/security';
import './Navigation.css';

interface AuthenticatedNavProps {
  username: string | null;
  email: string | null;
}

const AuthenticatedNav: React.FC<AuthenticatedNavProps> = ({ username, email }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { setAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setAuthenticated(false);
    navigate('/');
    setDropdownOpen(false);
  };

  return (
    <div className="nav-container">
      <nav className="nav-links">
        <Link to="/dashboard" className="nav-link">Dashboard</Link>
        <Link to="/marketplace" className="nav-link">Marketplace</Link>
        
        <Link to="/buy-credits" className="nav-link">Buy Credits</Link>
      </nav>
      <div className="user-dropdown">
        <button 
          className="user-button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          aria-expanded={dropdownOpen}
          aria-haspopup="true"
        >
          <div className="avatar">
            {username ? username[0].toUpperCase() : '?'}
          </div>
          <span className="username-text">{username}</span>
          <span className={`dropdown-arrow ${dropdownOpen ? 'open' : ''}`}>▼</span>
        </button>
        {dropdownOpen && (
          <div className="dropdown-menu">
            <div className="dropdown-header">
              <span className="dropdown-username">{email || username}</span>
            </div>
            <Link 
              to="/dashboard" 
              className="dropdown-item"
              onClick={() => setDropdownOpen(false)}
            >
              Dashboard
            </Link>
            <Link 
              to="/settings" 
              className="dropdown-item"
              onClick={() => setDropdownOpen(false)}
            >
              Settings
            </Link>
            <button 
              onClick={handleLogout}
              className="dropdown-item logout-item"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthenticatedNav;
