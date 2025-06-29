import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { logout } from '../../services/security';
import { AdminOnly, ModeratorOnly } from '../PermissionGate';
import CreditsBadge from '../TopBar/CreditsBadge';
import './Navigation.css';

interface AuthenticatedNavProps {
  username: string | null;
  email: string | null;
}

const AuthenticatedNav: React.FC<AuthenticatedNavProps> = ({ username, email }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { userProfile, logout: authLogout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(); // Clear old auth state
    authLogout(); // Clear new auth state 
    navigate('/');
    setDropdownOpen(false);
  };

  return (
    <div className="nav-container">
      <nav className="nav-links">
        <Link to="/dashboard" className="nav-link __topbar__dashboardlink">Dashboard</Link>
        <Link to="/marketplace" className="nav-link __toppabr__marketplacelink">Marketplace</Link>
        
        {/* Role-based navigation links */}
        <ModeratorOnly>
          <Link to="/moderation" className="nav-link moderation-link">
            Moderation
          </Link>
        </ModeratorOnly>
        
        <AdminOnly>
          <Link to="/admin" className="nav-link admin-link">
            Admin Panel
          </Link>
        </AdminOnly>
        
        <Link to="/buy-credits" className="nav-link"><CreditsBadge className="header-badge" /></Link>
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
              {/* Show user tier and roles */}
              {userProfile && (
                <div className="user-badges">
                  <span className={`tier-badge tier-${userProfile.tier}`}>
                    {userProfile.tier.toUpperCase()}
                  </span>
                  {userProfile.roles.map(role => (
                    <span key={role} className={`role-badge role-${role}`}>
                      {role.toUpperCase()}
                    </span>
                  ))}
                </div>
              )}
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
            
            {/* Role-based dropdown items */}
            <ModeratorOnly>
              <Link 
                to="/moderation" 
                className="dropdown-item moderation-item"
                onClick={() => setDropdownOpen(false)}
              >
                Moderation Dashboard
              </Link>
            </ModeratorOnly>
            
            <AdminOnly>
              <Link 
                to="/admin" 
                className="dropdown-item admin-item"
                onClick={() => setDropdownOpen(false)}
              >
                Admin Panel
              </Link>
            </AdminOnly>
            
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
