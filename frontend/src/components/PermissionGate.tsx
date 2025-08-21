/**
 * Permission Gate Component for StoryWriter
 * Conditionally renders content based on user roles, permissions, and tiers
 */

import React, { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Permission, UserRole, UserTier } from '../types/auth';

interface PermissionGateProps {
  // Role-based access
  requiredRoles?: UserRole[];
  
  // Permission-based access
  requiredPermissions?: Permission[];
  
  // Tier-based access
  requiredTier?: UserTier;
  minimumTier?: UserTier;
  
  // Logic operators
  requireAll?: boolean; // If true, user must have ALL specified roles/permissions
  
  // Rendering
  fallback?: ReactNode;
  children: ReactNode;
  
  // Authentication requirement
  requireAuth?: boolean; // If true, user must be authenticated
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  requiredRoles,
  requiredPermissions,
  requiredTier,
  minimumTier,
  requireAll = false,
  fallback = null,
  children,
  requireAuth = true
}) => {
  const { authenticated, hasRole, hasPermission, hasTier, hasMinimumTier } = useAuth();

  // Check authentication requirement
  if (requireAuth && !authenticated) {
    return <>{fallback}</>;
  }

  // If no specific requirements, show content to authenticated users
  if (!requiredRoles && !requiredPermissions && !requiredTier && !minimumTier) {
    return authenticated ? <>{children}</> : <>{fallback}</>;
  }

  let hasAccess = true;

  // Check role requirements
  if (requiredRoles && requiredRoles.length > 0) {
    if (requireAll) {
      // User must have ALL specified roles
      hasAccess = hasAccess && requiredRoles.every(role => hasRole(role));
    } else {
      // User must have at least ONE of the specified roles
      hasAccess = hasAccess && requiredRoles.some(role => hasRole(role));
    }
  }

  // Check permission requirements
  if (requiredPermissions && requiredPermissions.length > 0) {
    if (requireAll) {
      // User must have ALL specified permissions
      hasAccess = hasAccess && requiredPermissions.every(permission => hasPermission(permission));
    } else {
      // User must have at least ONE of the specified permissions
      hasAccess = hasAccess && requiredPermissions.some(permission => hasPermission(permission));
    }
  }

  // Check tier requirements
  if (requiredTier) {
    hasAccess = hasAccess && hasTier(requiredTier);
  }

  if (minimumTier) {
    hasAccess = hasAccess && hasMinimumTier(minimumTier);
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

// Convenience components for common use cases

interface AdminOnlyProps {
  fallback?: ReactNode;
  children: ReactNode;
}

export const AdminOnly: React.FC<AdminOnlyProps> = ({ fallback, children }) => (
  <PermissionGate requiredRoles={['admin']} fallback={fallback}>
    {children}
  </PermissionGate>
);

interface ModeratorOnlyProps {
  fallback?: ReactNode;
  children: ReactNode;
}

export const ModeratorOnly: React.FC<ModeratorOnlyProps> = ({ fallback, children }) => (
  <PermissionGate requiredRoles={['moderator', 'admin']} fallback={fallback}>
    {children}
  </PermissionGate>
);

interface PremiumOnlyProps {
  fallback?: ReactNode;
  children: ReactNode;
}

export const PremiumOnly: React.FC<PremiumOnlyProps> = ({ fallback, children }) => (
  <PermissionGate minimumTier="premium" fallback={fallback}>
    {children}
  </PermissionGate>
);

interface ByokOrPremiumProps {
  fallback?: ReactNode;
  children: ReactNode;
}

export const ByokOrPremium: React.FC<ByokOrPremiumProps> = ({ fallback, children }) => (
  <PermissionGate minimumTier="byok" fallback={fallback}>
    {children}
  </PermissionGate>
);

// Hook for imperative permission checking
// eslint-disable-next-line react-refresh/only-export-components
export const usePermissions = () => {
  const { hasRole, hasPermission, hasTier, hasMinimumTier, userProfile } = useAuth();

  const checkAccess = ({
    requiredRoles,
    requiredPermissions,
    requiredTier,
    minimumTier,
    requireAll = false
  }: {
    requiredRoles?: UserRole[];
    requiredPermissions?: Permission[];
    requiredTier?: UserTier;
    minimumTier?: UserTier;
    requireAll?: boolean;
  }): boolean => {
    if (!userProfile) return false;

    let hasAccess = true;

    if (requiredRoles && requiredRoles.length > 0) {
      if (requireAll) {
        hasAccess = hasAccess && requiredRoles.every(role => hasRole(role));
      } else {
        hasAccess = hasAccess && requiredRoles.some(role => hasRole(role));
      }
    }

    if (requiredPermissions && requiredPermissions.length > 0) {
      if (requireAll) {
        hasAccess = hasAccess && requiredPermissions.every(permission => hasPermission(permission));
      } else {
        hasAccess = hasAccess && requiredPermissions.some(permission => hasPermission(permission));
      }
    }

    if (requiredTier) {
      hasAccess = hasAccess && hasTier(requiredTier);
    }

    if (minimumTier) {
      hasAccess = hasAccess && hasMinimumTier(minimumTier);
    }

    return hasAccess;
  };

  return {
    checkAccess,
    hasRole,
    hasPermission,
    hasTier,
    hasMinimumTier,
    isAdmin: hasRole('admin'),
    isModerator: hasRole('moderator') || hasRole('admin'),
    isPremium: hasMinimumTier('premium'),
    isByokOrPremium: hasMinimumTier('byok')
  };
};
