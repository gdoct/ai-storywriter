// filepath: /home/guido/storywriter/frontend/src/components/TopBar.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../services/AuthContext';
import { logout } from '../../services/security';
import './TopBar.css';

const TopBar: React.FC = () => {
  const { authenticated, setAuthenticated, username } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setAuthenticated(false);
    navigate('/login');
    setDropdownOpen(false);
  };

  const handleLogin = () => {
    navigate('/login');
    setDropdownOpen(false);
  };

  return (
    <header className="topbar">
      <nav className="topbar-nav">
        {authenticated && (
          <>
            <Link to="/"><img src="/storywriter-logo-48.png" alt="Logo" /></Link>
            <div className="nav-links">
              <Link to="/">Home</Link>
              <Link to="/settings">Settings</Link>
            </div>
          </>
        )}
      </nav>
      <div className="topbar-right">
        <div className="user-dropdown">
          <span 
            className="user-icon" 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            title={authenticated ? username || 'Logged in' : 'Not logged in'}
          >
            {authenticated ? (
              <div className="avatar">{username ? username[0].toUpperCase() : '?'}</div>
            ) : (
              <button className="login-button" onClick={handleLogin}>Login</button>
            )}
          </span>
          {dropdownOpen && authenticated && (
            <div className="dropdown-content">
              <div className="dropdown-username">{username}</div>
              <button onClick={handleLogout}>Logout</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
