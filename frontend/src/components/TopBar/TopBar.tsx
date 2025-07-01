import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ThemeToggle } from '@drdata/docomo';
import { useAuth } from '../../contexts/AuthContext';
import AnonymousNav from '../navigation/AnonymousNav';
import AuthenticatedNav from '../navigation/AuthenticatedNav';

const TopBar: React.FC = () => {
  const { authenticated, userProfile } = useAuth();
  const location = useLocation();
  const isMarketingPage = location.pathname === '/' && !authenticated;

  return (
    <header style={{
      background: 'var(--color-surface)',
      borderBottom: '1px solid var(--color-border)',
      padding: 'var(--spacing-md) var(--spacing-lg)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: 'var(--shadow-sm)'
    }}>
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <Link 
          to={authenticated ? "/dashboard" : "/"} 
          style={{
            display: 'flex',
            alignItems: 'center',
            textDecoration: 'none',
            color: 'var(--color-text-primary)',
            fontWeight: 'var(--font-weight-bold)',
            fontSize: 'var(--font-size-lg)'
          }}
        >
          {!isMarketingPage && (
            <img 
              src="/storywriter-logo-48.png" 
              alt="StoryWriter Logo" 
              style={{
                width: '32px',
                height: '32px',
                marginRight: 'var(--spacing-sm)'
              }}
            />
          )}
          {isMarketingPage && 'StoryWriter'}
        </Link>
        
        {/* Dynamic navigation based on auth state */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 'var(--spacing-md)' 
        }}>
          <ThemeToggle />
          {authenticated ? (
            <AuthenticatedNav 
              username={userProfile?.username || null} 
              email={userProfile?.email || null} 
            />
          ) : (
            <AnonymousNav />
          )}
        </div>
      </nav>
    </header>
  );
};

export default TopBar;
