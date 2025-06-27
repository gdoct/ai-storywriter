/**
 * User Management Component
 * Handles user administration functionality
 */

import React, { useCallback, useEffect, useState } from 'react';
import type { AdminUser } from '../../services/rbacApi';
import { adminApi } from '../../services/rbacApi';
import { UserRole, UserTier } from '../../types/auth';
import './AdminPanel.css';

interface UserManagementProps {
  onAlert: (message: string, title?: string) => void;
  onConfirm: (message: string, options?: any) => Promise<boolean>;
}

export const UserManagement: React.FC<UserManagementProps> = ({ onAlert, onConfirm }) => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminApi.getUsers(currentPage, 20);
      setUsers(response.users);
      setPagination(response.pagination);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleGrantRole = async (userId: string, role: UserRole) => {
    const confirmed = await onConfirm(
      `Grant ${role} role to this user?`,
      {
        title: 'Confirm Grant Role',
        confirmText: 'Grant',
        cancelText: 'Cancel'
      }
    );

    if (!confirmed) return;

    try {
      await adminApi.grantRole(userId, role);
      onAlert(`Role ${role} granted successfully`, 'Success');
      fetchUsers();
    } catch (error: any) {
      console.error('Failed to grant role:', error);
      const errorMessage = error.response?.data?.error || 'Failed to grant role';
      onAlert(`Error: ${errorMessage}`, 'Error');
    }
  };

  const handleRevokeRole = async (userId: string, role: UserRole) => {
    const confirmed = await onConfirm(
      `Revoke ${role} role from this user?`,
      {
        title: 'Confirm Revoke Role',
        confirmText: 'Revoke',
        cancelText: 'Cancel',
        variant: 'danger'
      }
    );

    if (!confirmed) return;

    try {
      await adminApi.revokeRole(userId, role);
      onAlert(`Role ${role} revoked successfully`, 'Success');
      fetchUsers();
    } catch (error: any) {
      console.error('Failed to revoke role:', error);
      const errorMessage = error.response?.data?.error || 'Failed to revoke role';
      onAlert(`Error: ${errorMessage}`, 'Error');
    }
  };

  const createTierChangeHandler = (user: AdminUser) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTier = e.target.value as UserTier;
    handleTierUpdate((user as any).id, newTier, user.username);
  };

  const handleTierUpdate = async (userId: string, newTier: UserTier, username?: string) => {
    const currentUser = users.find(u => (u as any).id === userId);
    if (!currentUser) {
      onAlert('Error: User not found', 'Error');
      return;
    }
    
    const currentTier = currentUser.tier || 'unknown';
    const userDisplayName = username || currentUser.username;
    
    if (currentTier === newTier) return;
    
    const confirmed = await onConfirm(
      `Update user "${userDisplayName}" tier from ${currentTier} to ${newTier}?\n\nThis will change their access level and available features.`,
      {
        title: 'Confirm Tier Update',
        confirmText: 'Update',
        cancelText: 'Cancel'
      }
    );

    if (!confirmed) return;

    setUpdatingUser(userId);
    try {
      const response = await adminApi.updateUserTier(userId, newTier);
      onAlert(`User tier updated from ${response.old_tier} to ${response.new_tier} successfully`, 'Success');
      fetchUsers();
    } catch (error: any) {
      console.error('Failed to update tier:', error);
      const errorMessage = error.response?.data?.error || 'Failed to update tier';
      onAlert(`Error: ${errorMessage}`, 'Error');
      fetchUsers();
    } finally {
      setUpdatingUser(null);
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    const currentUser = users.find(u => (u as any).id === userId);
    const userInfo = `${username} (${currentUser?.email || 'no email'})`;
    
    const confirmed = await onConfirm(
      `Delete user "${userInfo}"?\n\nThis action cannot be undone. The user will no longer be able to access their account and all their data will be marked as deleted.`,
      {
        title: 'Confirm Delete User',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        variant: 'danger'
      }
    );

    if (!confirmed) return;

    try {
      await adminApi.deleteUser(userId);
      onAlert(`User "${username}" deleted successfully`, 'Success');
      fetchUsers();
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      const errorMessage = error.response?.data?.error || 'Failed to delete user';
      onAlert(`Error: ${errorMessage}`, 'Error');
    }
  };

  if (loading) {
    return <div className="loading">Loading users...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <h3>Error</h3>
        <p>{error}</p>
        <button onClick={fetchUsers}>Retry</button>
      </div>
    );
  }

  return (
    <div className="section user-management">
      <h2>User Management</h2>
      
      {pagination && (
        <div className="pagination-info">
          Showing {users.length} of {pagination.total} users (Page {pagination.page} of {pagination.pages})
        </div>
      )}

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Tier</th>
              <th>Roles</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={(user as any).id}>
                <td>
                  <strong>{user.username}</strong>
                  <br />
                  <small>{(user as any).id}</small>
                </td>
                <td>{user.email || 'N/A'}</td>
                <td>
                  <select
                    value={user.tier}
                    onChange={createTierChangeHandler(user)}
                    className={`tier-select tier-${user.tier}`}
                    disabled={updatingUser === (user as any).id}
                  >
                    <option value="free" key="free">Free</option>
                    <option value="byok" key="byok">BYOK</option>
                    <option value="premium" key="premium">Premium</option>
                  </select>
                  {updatingUser === (user as any).id && (
                    <div className="updating-indicator">Updating...</div>
                  )}
                </td>
                <td>
                  <div className="roles-cell">
                    <div className="current-roles">
                      {user.roles.length === 0 ? (
                        <span className="no-roles">No roles</span>
                      ) : (
                        user.roles.map(role => (
                          <span key={role} className={`role-badge role-${role}`}>
                            {role}
                            <button
                              className="revoke-role-btn"
                              onClick={() => handleRevokeRole((user as any).id, role)}
                              title={`Revoke ${role} role`}
                            >
                              ×
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                    <div className="role-actions">
                      {(['admin', 'moderator', 'user'] as UserRole[]).map(role => (
                        !user.roles.includes(role) && (
                          <button
                            key={role}
                            className={`grant-role-btn role-${role}`}
                            onClick={() => handleGrantRole((user as any).id, role)}
                            title={`Grant ${role} role`}
                          >
                            + {role}
                          </button>
                        )
                      ))}
                    </div>
                  </div>
                </td>
                <td>
                  {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </td>
                <td>
                  <button
                    className="delete-user-btn"
                    onClick={() => handleDeleteUser((user as any).id, user.username)}
                    title="Delete user"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.pages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="btn btn-secondary"
          >
            Previous
          </button>
          <span className="page-info">
            Page {currentPage} of {pagination.pages}
          </span>
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === pagination.pages}
            className="btn btn-secondary"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
