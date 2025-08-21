import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { PermissionGate } from '../PermissionGate';

interface NavigationProps {
  className?: string;
}

export const Navigation: React.FC<NavigationProps> = ({ className: _className }) => {
  const { userProfile, authenticated } = useAuth();
  const location = useLocation();

  // const isActive = (path: string) => {
  //   return location.pathname === path ? 'active' : '';
  // };

  if (!authenticated || !userProfile) {
    return null;
  }

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--spacing-lg)',
      padding: 'var(--spacing-md)',
      background: 'var(--color-surface)',
      borderBottom: '1px solid var(--color-border)'
    }}>
      <div style={{
        fontWeight: 'var(--font-weight-bold)',
        fontSize: 'var(--font-size-lg)'
      }}>
        <Link 
          to="/dashboard" 
          style={{
            textDecoration: 'none',
            color: 'var(--color-text-primary)'
          }}
        >
          StoryWriter
        </Link>
      </div>
      
      <div style={{
        display: 'flex',
        gap: 'var(--spacing-md)',
        alignItems: 'center'
      }}>
        <Link 
          to="/dashboard" 
          style={{
            textDecoration: 'none',
            color: location.pathname === '/dashboard' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: location.pathname === '/dashboard' ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)',
            padding: 'var(--spacing-sm) var(--spacing-md)',
            borderRadius: 'var(--radius-sm)',
            transition: 'color 0.2s ease'
          }}
        >
          Dashboard
        </Link>
        
        <Link 
          to="/scenarios" 
          style={{
            textDecoration: 'none',
            color: location.pathname === '/scenarios' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: location.pathname === '/scenarios' ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)',
            padding: 'var(--spacing-sm) var(--spacing-md)',
            borderRadius: 'var(--radius-sm)',
            transition: 'color 0.2s ease'
          }}
        >
          Scenarios
        </Link>
        
        <Link 
          to="/marketplace" 
          style={{
            textDecoration: 'none',
            color: location.pathname === '/marketplace' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: location.pathname === '/marketplace' ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)',
            padding: 'var(--spacing-sm) var(--spacing-md)',
            borderRadius: 'var(--radius-sm)',
            transition: 'color 0.2s ease'
          }}
        >
          Marketplace
        </Link>
        
        <Link 
          to="/settings" 
          style={{
            textDecoration: 'none',
            color: location.pathname === '/settings' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: location.pathname === '/settings' ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)',
            padding: 'var(--spacing-sm) var(--spacing-md)',
            borderRadius: 'var(--radius-sm)',
            transition: 'color 0.2s ease'
          }}
        >
          Settings
        </Link>
        
        {/* Moderation menu for moderators and admins */}
        <PermissionGate requiredRoles={['moderator', 'admin']}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <span style={{
              padding: 'var(--spacing-sm) var(--spacing-md)',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              fontWeight: 'var(--font-weight-normal)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-xs)'
            }}>
              Moderation
              <span>▼</span>
            </span>
          </div>
        </PermissionGate>
        
        {/* Admin menu for admins only */}
        <PermissionGate requiredRoles={['admin']}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <span style={{
              padding: 'var(--spacing-sm) var(--spacing-md)',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              fontWeight: 'var(--font-weight-normal)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-xs)'
            }}>
              Admin
              <span>▼</span>
            </span>
          </div>
        </PermissionGate>
      </div>
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-md)',
        marginLeft: 'auto'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 'var(--spacing-xs)'
        }}>
          <span style={{
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--color-text-primary)'
          }}>
            {userProfile.username}
          </span>
          <span style={{
            fontSize: 'var(--font-size-xs)',
            padding: 'var(--spacing-xs) var(--spacing-sm)',
            background: 'var(--color-primary)',
            color: 'var(--color-primary-contrast)',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 'var(--font-weight-medium)'
          }}>
            {userProfile.tier.toUpperCase()}
          </span>
          {userProfile.roles.length > 0 && (
            <div style={{
              display: 'flex',
              gap: 'var(--spacing-xs)',
              flexWrap: 'wrap'
            }}>
              {userProfile.roles.map(role => (
                <span 
                  key={role} 
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    padding: 'var(--spacing-xs) var(--spacing-sm)',
                    background: 'var(--color-secondary)',
                    color: 'var(--color-secondary-contrast)',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 'var(--font-weight-medium)'
                  }}
                >
                  {role}
                </span>
              ))}
            </div>
          )}
        </div>
        
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-xs)'
        }}>
          <Link 
            to="/profile" 
            style={{
              textDecoration: 'none',
              color: 'var(--color-text-secondary)',
              fontSize: 'var(--font-size-sm)',
              padding: 'var(--spacing-xs) var(--spacing-sm)',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            Profile
          </Link>
          <button 
            onClick={() => {
              localStorage.clear();
              window.location.href = '/login';
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-secondary)',
              fontSize: 'var(--font-size-sm)',
              cursor: 'pointer',
              padding: 'var(--spacing-xs) var(--spacing-sm)',
              borderRadius: 'var(--radius-sm)',
              textAlign: 'left'
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};
