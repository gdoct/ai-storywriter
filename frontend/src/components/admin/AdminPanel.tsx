/**
 * Admin Panel Component
 * Provides administrative interface for user and role management
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useModals } from '../../hooks/useModals';
import type { AdminUser } from '../../services/rbacApi';
import { adminApi } from '../../services/rbacApi';
import { UserRole, UserTier } from '../../types/auth';
import { AlertModal, ConfirmModal } from '../Modal';
import { AdminOnly } from '../PermissionGate';
import './AdminPanel.css';

export const AdminPanel: React.FC = () => {
  const { userProfile } = useAuth();
  const { alertState, confirmState, hideAlert, hideConfirm, customAlert, customConfirm } = useModals();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [currentPage]);

  const fetchUsers = async () => {
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
  };

  const handleGrantRole = async (userId: string, role: UserRole) => {
    const confirmed = await customConfirm(
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
      customAlert(`${role} role granted successfully`, 'Success');
      fetchUsers(); // Refresh user list
    } catch (error) {
      console.error('Failed to grant role:', error);
      customAlert('Failed to grant role', 'Error');
    }
  };

  const handleRevokeRole = async (userId: string, role: UserRole) => {
    const confirmed = await customConfirm(
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
      customAlert(`${role} role revoked successfully`, 'Success');
      fetchUsers(); // Refresh user list
    } catch (error) {
      console.error('Failed to revoke role:', error);
      customAlert('Failed to revoke role', 'Error');
    }
  };

  const createTierChangeHandler = (user: AdminUser) => {
    return (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newTier = e.target.value as UserTier;
      handleUpdateTier((user as any).id, newTier, user.username);
    };
  };

  const handleUpdateTier = async (userId: string, newTier: UserTier, username?: string) => {
    const currentUser = users.find(u => (u as any).id === userId);
    
    if (!currentUser) {
      customAlert('Error: User not found', 'Error');
      return;
    }
    
    const currentTier = currentUser.tier || 'unknown';
    const userDisplayName = username || currentUser.username;
    
    // Don't do anything if it's the same tier
    if (currentTier === newTier) return;
    
    const confirmed = await customConfirm(
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
      customAlert(`User tier updated from ${response.old_tier} to ${response.new_tier} successfully`, 'Success');
      fetchUsers(); // Refresh user list
    } catch (error: any) {
      console.error('Failed to update tier:', error);
      const errorMessage = error.response?.data?.error || 'Failed to update tier';
      customAlert(`Error: ${errorMessage}`, 'Error');
      // Reset the select to the original value
      fetchUsers();
    } finally {
      setUpdatingUser(null);
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    const currentUser = users.find(u => (u as any).id === userId);
    const userInfo = `${username} (${currentUser?.email || 'no email'})`;
    
    const confirmed = await customConfirm(
      `Delete user "${userInfo}"?\n\nThis action cannot be undone. The user will no longer be able to access their account and all their data will be marked as deleted.`,
      {
        title: 'Confirm Delete User',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        variant: 'danger'
      }
    );

    if (!confirmed) return;

    setUpdatingUser(userId);
    try {
      const response = await adminApi.deleteUser(userId);
      customAlert(`User ${username} deleted successfully`, 'Success');
      fetchUsers(); // Refresh user list
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      const errorMessage = error.response?.data?.error || 'Failed to delete user';
      customAlert(`Error: ${errorMessage}`, 'Error');
    } finally {
      setUpdatingUser(null);
    }
  };

  if (loading) {
    return (
      <div className="admin-panel">
        <div className="loading">Loading admin panel...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-panel">
        <div className="error">
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={fetchUsers}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <AdminOnly fallback={<div>Access denied. Administrator permissions required.</div>}>
      <div className="admin-panel">
        <div className="panel-header">
          <h1>Administration Panel</h1>
          <div className="admin-info">
            <span>Logged in as: <strong>{userProfile?.username}</strong></span>
          </div>
        </div>

        <div className="panel-sections">
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
                                <span key={`${(user as any).id}-${role}`} className={`role-badge role-${role}`}>
                                  {role}
                                  <button
                                    onClick={() => handleRevokeRole((user as any).id, role)}
                                    className="revoke-role"
                                    title={`Revoke ${role} role`}
                                  >
                                    ×
                                  </button>
                                </span>
                              ))
                            )}
                          </div>
                          <div className="role-actions">
                            {!user.roles.includes('moderator') && (
                              <button
                                key={`grant-moderator-${(user as any).id}`}
                                onClick={() => handleGrantRole((user as any).id, 'moderator')}
                                className="btn btn-small btn-secondary"
                              >
                                + Moderator
                              </button>
                            )}
                            {!user.roles.includes('admin') && (
                              <button
                                key={`grant-admin-${(user as any).id}`}
                                onClick={() => handleGrantRole((user as any).id, 'admin')}
                                className="btn btn-small btn-primary"
                              >
                                + Admin
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        <div className="user-actions">
                          <button
                            onClick={() => handleDeleteUser((user as any).id, user.username)}
                            className="btn btn-small btn-danger"
                            disabled={(user as any).id === userProfile?.user_id || updatingUser === (user as any).id}
                          >
                            {updatingUser === (user as any).id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination && pagination.pages > 1 && (
              <div className="pagination">
                <button
                  key="prev-page"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="btn btn-secondary"
                >
                  Previous
                </button>
                <span key="page-info" className="page-info">
                  Page {currentPage} of {pagination.pages}
                </span>
                <button
                  key="next-page"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === pagination.pages}
                  className="btn btn-secondary"
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {/* Custom Modal Components */}
          <AlertModal
            isOpen={alertState.isOpen}
            onClose={hideAlert}
            message={alertState.message}
            title={alertState.title}
          />
          
          <ConfirmModal
            isOpen={confirmState.isOpen}
            onClose={hideConfirm}
            onConfirm={confirmState.onConfirm || (() => {})}
            message={confirmState.message}
            title={confirmState.title}
            confirmText={confirmState.confirmText}
            cancelText={confirmState.cancelText}
            variant={confirmState.variant}
          />
        </div>
      </div>
    </AdminOnly>
  );
};
