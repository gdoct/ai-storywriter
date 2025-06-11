import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../services/AuthContext';
import AnonymousNav from '../navigation/AnonymousNav';
import AuthenticatedNav from '../navigation/AuthenticatedNav';
import './TopBar.css';

const TopBar: React.FC = () => {
  const { authenticated, username } = useAuth();
  const location = useLocation();
  const isMarketingPage = location.pathname === '/' && !authenticated;

  return (
    <header className="topbar">
      <nav className="topbar-nav">
        <Link to={authenticated ? "/dashboard" : "/"} className="logo-link">
          <img src="/storywriter-logo-48.png" alt="StoryWriter" />
          {!isMarketingPage && <span className="brand-text">StoryWriter</span>}
        </Link>
      </nav>
      
      {/* Dynamic navigation based on auth state */}
      <div className="topbar-right">
        {authenticated ? (
          <AuthenticatedNav username={username} />
        ) : (
          <AnonymousNav />
        )}
      </div>
    </header>
  );
};

export default TopBar;
