/**
 * Admin Panel Component
 * Provides administrative interface for user and role management
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import type { AdminUser } from '../../services/rbacApi';
import { adminApi } from '../../services/rbacApi';
import { UserRole, UserTier } from '../../types/auth';
import { AdminOnly } from '../PermissionGate';
import './AdminPanel.css';

export const AdminPanel: React.FC = () => {
  const { userProfile } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

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
    if (!window.confirm(`Grant ${role} role to this user?`)) return;

    try {
      await adminApi.grantRole(userId, role);
      alert(`${role} role granted successfully`);
      fetchUsers(); // Refresh user list
    } catch (error) {
      console.error('Failed to grant role:', error);
      alert('Failed to grant role');
    }
  };

  const handleRevokeRole = async (userId: string, role: UserRole) => {
    if (!window.confirm(`Revoke ${role} role from this user?`)) return;

    try {
      await adminApi.revokeRole(userId, role);
      alert(`${role} role revoked successfully`);
      fetchUsers(); // Refresh user list
    } catch (error) {
      console.error('Failed to revoke role:', error);
      alert('Failed to revoke role');
    }
  };

  const handleUpdateTier = async (userId: string, newTier: UserTier) => {
    if (!window.confirm(`Update user tier to ${newTier}?`)) return;

    try {
      // TODO: Implement tier update in API service
      // await adminApi.updateUserTier(userId, newTier);
      alert('Tier update not yet implemented');
      // fetchUsers(); // Refresh user list
    } catch (error) {
      console.error('Failed to update tier:', error);
      alert('Failed to update tier');
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!window.confirm(`Delete user "${username}"? This action cannot be undone.`)) return;

    try {
      // TODO: Implement user deletion in API service
      // await adminApi.deleteUser(userId);
      alert('User deletion not yet implemented');
      // fetchUsers(); // Refresh user list
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user');
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
                    <tr key={user.user_id}>
                      <td>
                        <strong>{user.username}</strong>
                        <br />
                        <small>{user.user_id}</small>
                      </td>
                      <td>{user.email || 'N/A'}</td>
                      <td>
                        <select
                          value={user.tier}
                          onChange={(e) => handleUpdateTier(user.user_id, e.target.value as UserTier)}
                          className={`tier-select tier-${user.tier}`}
                        >
                          <option value="free">Free</option>
                          <option value="byok">BYOK</option>
                          <option value="premium">Premium</option>
                        </select>
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
                                    onClick={() => handleRevokeRole(user.user_id, role)}
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
                                onClick={() => handleGrantRole(user.user_id, 'moderator')}
                                className="btn btn-small btn-secondary"
                              >
                                + Moderator
                              </button>
                            )}
                            {!user.roles.includes('admin') && (
                              <button
                                onClick={() => handleGrantRole(user.user_id, 'admin')}
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
                            onClick={() => handleDeleteUser(user.user_id, user.username)}
                            className="btn btn-small btn-danger"
                            disabled={user.user_id === userProfile?.user_id}
                          >
                            Delete
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
        </div>
      </div>
    </AdminOnly>
  );
};
