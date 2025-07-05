import { ThemeToggle, UserMenu, UserMenuItem } from '@drdata/docomo';
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { logout } from '../../services/security';
import AnonymousNav from '../navigation/AnonymousNav';

const TopBar: React.FC = () => {
  const { authenticated, userProfile, logout: authLogout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isMarketingPage = location.pathname === '/' && !authenticated;

  const handleLogout = () => {
    logout(); // Clear old auth state
    authLogout(); // Clear new auth state 
    navigate('/');
  };

  // Define menu items for authenticated users
  const menuItems: UserMenuItem[] = [
    {
      label: 'Dashboard',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 4C2 3.44772 2.44772 3 3 3H7C7.55228 3 8 3.44772 8 4V7C8 7.55228 7.55228 8 7 8H3C2.44772 8 2 7.55228 2 7V4Z" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M10 4C10 3.44772 10.4477 3 11 3H13C13.5523 3 14 3.44772 14 4V5C14 5.55228 13.5523 6 13 6H11C10.4477 6 10 5.55228 10 5V4Z" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M10 9C10 8.44772 10.4477 8 11 8H13C13.5523 8 14 8.44772 14 9V12C14 12.5523 13.5523 13 13 13H11C10.4477 13 11 12.5523 10 12V9Z" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M2 11C2 10.4477 2.44772 10 3 10H7C7.55228 10 8 10.4477 8 11V12C8 12.5523 7.55228 13 7 13H3C2.44772 13 2 12.5523 2 12V11Z" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      ),
      onClick: () => navigate('/dashboard')
    },
    {
      label: 'Marketplace',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3 7V13C3 13.5523 3.44772 14 4 14H12C12.5523 14 13 13.5523 13 13V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M1 4L3 2H13L15 4V6C15 6.55228 14.5523 7 14 7C13.4477 7 13 6.55228 13 6C13 6.55228 12.5523 7 12 7C11.4477 7 11 6.55228 11 6C11 6.55228 10.5523 7 10 7C9.44772 7 9 6.55228 9 6C9 6.55228 8.55228 7 8 7C7.44772 7 7 6.55228 7 6C7 6.55228 6.55228 7 6 7C5.44772 7 5 6.55228 5 6C5 6.55228 4.55228 7 4 7C3.44772 7 3 6.55228 3 6C3 6.55228 2.55228 7 2 7C1.44772 7 1 6.55228 1 6V4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
      onClick: () => navigate('/marketplace')
    },
    {
      label: 'Buy Credits',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 4C2 3.44772 2.44772 3 3 3H13C13.5523 3 14 3.44772 14 4V12C14 12.5523 13.5523 13 13 13H3C2.44772 13 2 12.5523 2 12V4Z" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M2 6H14" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M5 10H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
      onClick: () => navigate('/buy-credits')
    },
    {
      divider: true,
      label: '',
      onClick: () => {}
    },
    {
      label: 'Settings',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 10C9.10457 10 10 9.10457 10 8C10 6.89543 9.10457 6 8 6C6.89543 6 6 6.89543 6 8C6 9.10457 6.89543 10 8 10Z" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M12.9 8.9C12.8 9.4 12.9 9.8 13.1 10.1L13.2 10.2C13.3 10.4 13.4 10.6 13.4 10.8C13.4 11 13.3 11.2 13.2 11.4C13.1 11.6 12.9 11.7 12.7 11.8L11.8 12.3C11.6 12.4 11.3 12.4 11.1 12.3C10.9 12.2 10.7 12 10.6 11.8L10.5 11.7C10.3 11.5 9.9 11.4 9.4 11.5C9 11.6 8.5 11.5 8.1 11.3L8 11.2C7.8 11.1 7.6 11 7.4 11C7.2 11 7 11.1 6.8 11.2L5.9 11.7C5.7 11.8 5.4 11.8 5.2 11.7C5 11.6 4.8 11.4 4.7 11.2L4.2 10.3C4.1 10.1 4.1 9.8 4.2 9.6C4.3 9.4 4.5 9.2 4.7 9.1L4.8 9C5 8.8 5.1 8.4 5 7.9C4.9 7.5 5 7 5.2 6.6L5.3 6.5C5.4 6.3 5.5 6.1 5.5 5.9C5.5 5.7 5.4 5.5 5.3 5.3C5.2 5.1 5 5 4.8 4.9L3.9 4.4C3.7 4.3 3.4 4.3 3.2 4.4C3 4.5 2.8 4.7 2.7 4.9L2.2 5.8C2.1 6 2.1 6.3 2.2 6.5C2.3 6.7 2.5 6.9 2.7 7L2.8 7.1C3 7.3 3.1 7.7 3 8.2C2.9 8.6 3 9.1 3.2 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
      onClick: () => navigate('/settings')
    }
  ];

  // Add role-based menu items
  if (userProfile?.roles?.includes('moderator')) {
    menuItems.push({
      divider: true,
      label: '',
      onClick: () => {}
    });
    menuItems.push({
      label: 'Moderation',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 1L10.163 5.326L15 6.148L11.5 9.572L12.326 14.408L8 12.174L3.674 14.408L4.5 9.572L1 6.148L5.837 5.326L8 1Z" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      ),
      onClick: () => navigate('/moderation'),
      roles: ['moderator']
    });
  }

  if (userProfile?.roles?.includes('admin')) {
    if (!userProfile?.roles?.includes('moderator')) {
      menuItems.push({
        divider: true,
        label: '',
        onClick: () => {}
      });
    }
    menuItems.push({
      label: 'Admin Panel',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 1C9.933 1 11.5 2.567 11.5 4.5V6.5C12.328 6.5 13 7.172 13 8V13C13 13.828 12.328 14.5 11.5 14.5H4.5C3.672 14.5 3 13.828 3 13V8C3 7.172 3.672 6.5 4.5 6.5V4.5C4.5 2.567 6.067 1 8 1ZM8 2.5C6.895 2.5 6 3.395 6 4.5V6.5H10V4.5C10 3.395 9.105 2.5 8 2.5Z" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      ),
      onClick: () => navigate('/admin'),
      roles: ['admin']
    });
  }

  return (
    <header style={{
      background: 'var(--color-surface)',
      borderBottom: '1px solid var(--color-border)',
      padding: '0',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
      backdropFilter: 'blur(10px)'
    }}>
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 var(--spacing-xl)',
        height: '64px'
      }}>
        <Link 
          to={authenticated ? "/dashboard" : "/"} 
          style={{
            display: 'flex',
            alignItems: 'center',
            textDecoration: 'none',
            color: 'var(--color-text-primary)',
            fontWeight: '600',
            fontSize: '1.25rem',
            letterSpacing: '-0.025em',
            transition: 'color 0.2s ease-in-out',
            padding: 'var(--spacing-sm) 0'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--color-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--color-text-primary)';
          }}
        >
          {!isMarketingPage && (
            <img 
              src="/storywriter-logo-48.png" 
              alt="StoryWriter Logo" 
              style={{
                width: '36px',
                height: '36px',
                marginRight: 'var(--spacing-md)',
                borderRadius: '6px',
                filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))'
              }}
            />
          )}
          StoryWriter
        </Link>
        
        {/* Dynamic navigation based on auth state */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 'var(--spacing-lg)',
          height: '100%'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            padding: 'var(--spacing-xs) var(--spacing-sm)',
            borderRadius: '8px',
            backgroundColor: 'var(--color-surface-variant)',
            border: '1px solid var(--color-border)'
          }}>
            <ThemeToggle size='xs' />
          </div>
          
          {authenticated ? (
            <UserMenu
              username={userProfile?.username || 'User'}
              email={userProfile?.email}
              tier={userProfile?.tier}
              roles={userProfile?.roles || []}
              credits={userProfile?.credits}
              menuItems={menuItems}
              onLogout={handleLogout}
              avatarUrl=''
              size="md"
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
