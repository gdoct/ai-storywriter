import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { PermissionGate } from '../PermissionGate';
import './Navigation.css';

interface NavigationProps {
  className?: string;
}

export const Navigation: React.FC<NavigationProps> = ({ className }) => {
  const { userProfile, authenticated } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path ? 'active' : '';
  };

  if (!authenticated || !userProfile) {
    return null;
  }

  return (
    <nav className={`navigation ${className || ''}`}>
      <div className="nav-brand">
        <Link to="/dashboard">StoryWriter</Link>
      </div>
      
      <div className="nav-menu">
        <Link to="/dashboard" className={isActive('/dashboard')}>
          Dashboard
        </Link>
        
        <Link to="/scenarios" className={isActive('/scenarios')}>
          Scenarios
        </Link>
        
        <Link to="/marketplace" className={isActive('/marketplace')}>
          Marketplace
        </Link>
        
        <Link to="/settings" className={isActive('/settings')}>
          Settings
        </Link>
        
        {/* Moderation menu for moderators and admins */}
        <PermissionGate requiredRoles={['moderator', 'admin']}>
          <div className="nav-dropdown">
            <span className="nav-dropdown-trigger">
              Moderation
              <span className="dropdown-arrow">▼</span>
            </span>
            <div className="nav-dropdown-menu">
              <Link to="/moderation/dashboard" className={isActive('/moderation/dashboard')}>
                Moderation Dashboard
              </Link>
              <Link to="/moderation/stories" className={isActive('/moderation/stories')}>
                Review Stories
              </Link>
              <Link to="/moderation/reports" className={isActive('/moderation/reports')}>
                User Reports
              </Link>
            </div>
          </div>
        </PermissionGate>
        
        {/* Admin menu for admins only */}
        <PermissionGate requiredRoles={['admin']}>
          <div className="nav-dropdown">
            <span className="nav-dropdown-trigger">
              Admin
              <span className="dropdown-arrow">▼</span>
            </span>
            <div className="nav-dropdown-menu">
              <Link to="/admin/dashboard" className={isActive('/admin/dashboard')}>
                Admin Dashboard
              </Link>
              <Link to="/admin/users" className={isActive('/admin/users')}>
                User Management
              </Link>
              <Link to="/admin/roles" className={isActive('/admin/roles')}>
                Role Management
              </Link>
              <Link to="/admin/settings" className={isActive('/admin/settings')}>
                System Settings
              </Link>
              <Link to="/admin/analytics" className={isActive('/admin/analytics')}>
                Analytics
              </Link>
            </div>
          </div>
        </PermissionGate>
      </div>
      
      <div className="nav-user">
        <div className="user-info">
          <span className="username">{userProfile.username}</span>
          <span className={`tier tier-${userProfile.tier}`}>
            {userProfile.tier.toUpperCase()}
          </span>
          {userProfile.roles.length > 0 && (
            <div className="user-roles">
              {userProfile.roles.map(role => (
                <span key={role} className={`role role-${role}`}>
                  {role}
                </span>
              ))}
            </div>
          )}
        </div>
        
        <div className="user-menu">
          <Link to="/profile">Profile</Link>
          <button onClick={() => {
            localStorage.clear();
            window.location.href = '/login';
          }}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};
