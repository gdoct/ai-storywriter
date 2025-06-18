import React, { useEffect, useState } from 'react';
import http from '../../services/http';
import './RoleManagement.css';

interface User {
  user_id: string;
  username: string;
  email: string;
  tier: string;
  roles: string[];
  created_at: string;
}

interface RoleHistory {
  role: string;
  granted_by: string;
  granted_by_username: string;
  granted_at: string;
  revoked_at: string | null;
  is_active: boolean;
}

const RoleManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [roleHistory, setRoleHistory] = useState<RoleHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadUsers = async (page: number = 1) => {
    try {
      setLoading(true);
      const response = await http.get(`/api/admin/users?page=${page}&per_page=20`);
      setUsers(response.data.users);
      setTotalPages(response.data.pagination.pages);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRoleHistory = async (userId: string) => {
    try {
      const response = await http.get(`/api/admin/roles/users/${userId}`);
      setRoleHistory(response.data.role_history);
    } catch (error) {
      console.error('Error loading role history:', error);
    }
  };

  const grantRole = async (userId: string, role: string) => {
    try {
      await http.post('/api/admin/roles/grant', {
        user_id: userId,
        role: role
      });
      
      // Refresh data
      await loadUsers(currentPage);
      if (selectedUser) {
        await loadRoleHistory(userId);
      }
    } catch (error) {
      console.error('Error granting role:', error);
      alert('Failed to grant role');
    }
  };

  const revokeRole = async (userId: string, role: string) => {
    try {
      await http.post('/api/admin/roles/revoke', {
        user_id: userId,
        role: role
      });
      
      // Refresh data
      await loadUsers(currentPage);
      if (selectedUser) {
        await loadRoleHistory(userId);
      }
    } catch (error) {
      console.error('Error revoking role:', error);
      alert('Failed to revoke role');
    }
  };

  const updateUserTier = async (userId: string, newTier: string) => {
    try {
      await http.put(`/api/admin/users/${userId}/tier`, {
        tier: newTier
      });
      
      // Refresh data
      await loadUsers(currentPage);
    } catch (error) {
      console.error('Error updating user tier:', error);
      alert('Failed to update user tier');
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectUser = async (user: User) => {
    setSelectedUser(user);
    await loadRoleHistory(user.user_id);
  };

  return (
    <div className="role-management">
      <div className="role-management-header">
        <h2>Role Management</h2>
        <div className="search-box">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="role-management-content">
        <div className="users-panel">
          <h3>Users</h3>
          {loading ? (
            <div className="loading">Loading users...</div>
          ) : (
            <>
              <div className="users-list">
                {filteredUsers.map(user => (
                  <div
                    key={user.user_id}
                    className={`user-item ${selectedUser?.user_id === user.user_id ? 'selected' : ''}`}
                    onClick={() => selectUser(user)}
                  >
                    <div className="user-info">
                      <div className="username">{user.username}</div>
                      <div className="user-details">
                        <span className={`tier tier-${user.tier}`}>{user.tier}</span>
                        {user.roles.length > 0 && (
                          <span className="roles">
                            {user.roles.map(role => (
                              <span key={role} className={`role role-${role}`}>{role}</span>
                            ))}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="pagination">
                <button
                  onClick={() => loadUsers(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  Previous
                </button>
                <span>Page {currentPage} of {totalPages}</span>
                <button
                  onClick={() => loadUsers(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>

        <div className="user-details-panel">
          {selectedUser ? (
            <>
              <h3>User Details: {selectedUser.username}</h3>
              
              <div className="user-profile">
                <div className="profile-field">
                  <label>Email:</label>
                  <span>{selectedUser.email || 'N/A'}</span>
                </div>
                
                <div className="profile-field">
                  <label>Tier:</label>
                  <select
                    value={selectedUser.tier}
                    onChange={(e) => updateUserTier(selectedUser.user_id, e.target.value)}
                  >
                    <option value="free">Free</option>
                    <option value="byok">BYOK</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
                
                <div className="profile-field">
                  <label>Created:</label>
                  <span>{new Date(selectedUser.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="role-actions">
                <h4>Role Management</h4>
                <div className="current-roles">
                  <label>Current Roles:</label>
                  <div className="roles-list">
                    {selectedUser.roles.length > 0 ? (
                      selectedUser.roles.map(role => (
                        <div key={role} className="role-badge">
                          <span className={`role role-${role}`}>{role}</span>
                          <button
                            className="revoke-btn"
                            onClick={() => revokeRole(selectedUser.user_id, role)}
                          >
                            ×
                          </button>
                        </div>
                      ))
                    ) : (
                      <span className="no-roles">No administrative roles</span>
                    )}
                  </div>
                </div>
                
                <div className="grant-roles">
                  <label>Grant Role:</label>
                  <div className="role-buttons">
                    {!selectedUser.roles.includes('moderator') && (
                      <button
                        className="grant-btn moderator"
                        onClick={() => grantRole(selectedUser.user_id, 'moderator')}
                      >
                        Grant Moderator
                      </button>
                    )}
                    {!selectedUser.roles.includes('admin') && (
                      <button
                        className="grant-btn admin"
                        onClick={() => grantRole(selectedUser.user_id, 'admin')}
                      >
                        Grant Admin
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="role-history">
                <h4>Role History</h4>
                {roleHistory.length > 0 ? (
                  <div className="history-list">
                    {roleHistory.map((entry, index) => (
                      <div key={index} className="history-entry">
                        <div className="history-role">
                          <span className={`role role-${entry.role}`}>{entry.role}</span>
                          <span className={`status ${entry.is_active ? 'active' : 'revoked'}`}>
                            {entry.is_active ? 'Active' : 'Revoked'}
                          </span>
                        </div>
                        <div className="history-details">
                          <div>Granted by: {entry.granted_by_username}</div>
                          <div>Granted at: {new Date(entry.granted_at).toLocaleString()}</div>
                          {entry.revoked_at && (
                            <div>Revoked at: {new Date(entry.revoked_at).toLocaleString()}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-history">No role history</div>
                )}
              </div>
            </>
          ) : (
            <div className="no-selection">
              <p>Select a user to view and manage their roles</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoleManagement;
