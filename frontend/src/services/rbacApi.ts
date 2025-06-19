/**
 * Admin and Moderation API Service
 * Handles API calls for administrative and moderation functions
 */
import { FlaggedContent, ModerationAction, UserProfile } from '../types/auth';
import http from './http';

export interface AdminUser extends UserProfile {
  created_at: string;
  last_active?: string;
}

export interface PaginatedUsers {
  users: AdminUser[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    pages: number;
  };
}

export interface ModerationStats {
  flagged_content_count: number;
  pending_reports: number;
  recent_actions: ModerationAction[];
}

// Admin API functions
export const adminApi = {
  // User management
  async getUsers(page: number = 1, perPage: number = 20): Promise<PaginatedUsers> {
    const response = await http.get<PaginatedUsers>(`/api/admin/users?page=${page}&per_page=${perPage}`);
    return response.data;
  },

  async getUserRoles(userId: string): Promise<{ user_id: string; username: string; active_roles: string[]; role_history: any[] }> {
    const response = await http.get(`/api/admin/roles/users/${userId}`);
    return response.data;
  },

  async grantRole(userId: string, role: string): Promise<{ message: string }> {
    const response = await http.post('/api/admin/roles/grant', { user_id: userId, role });
    return response.data;
  },

  async revokeRole(userId: string, role: string): Promise<{ message: string }> {
    const response = await http.post('/api/admin/roles/revoke', { user_id: userId, role });
    return response.data;
  },

  async updateUserTier(userId: string, tier: string): Promise<{ message: string; user_id: string; old_tier: string; new_tier: string }> {
    const response = await http.put(`/api/admin/users/${userId}/tier`, { tier });
    return response.data;
  },

  async deleteUser(userId: string): Promise<{ message: string; user_id: string }> {
    const response = await http.delete(`/api/admin/users/${userId}`);
    return response.data;
  },

  async listUsersWithRole(role: string): Promise<AdminUser[]> {
    const response = await http.get(`/api/admin/roles/${role}/users`);
    return response.data;
  }
};

// Moderation API functions
export const moderationApi = {
  // Dashboard and stats
  async getDashboard(): Promise<ModerationStats> {
    const response = await http.get<ModerationStats>('/api/moderate/dashboard');
    return response.data;
  },

  // Story moderation
  async removeStory(storyId: number, reason: string): Promise<{ message: string }> {
    const response = await http.delete(`/api/moderate/stories/${storyId}`, {
      data: { reason }
    });
    return response.data;
  },

  async flagStory(storyId: number, reason: string): Promise<{ message: string }> {
    const response = await http.post(`/api/moderate/stories/${storyId}/flag`, { reason });
    return response.data;
  },

  // User moderation
  async suspendUser(userId: string, reason: string, duration?: string): Promise<{ message: string }> {
    const response = await http.post(`/api/moderate/users/${userId}/suspend`, { 
      reason, 
      duration 
    });
    return response.data;
  },

  async warnUser(userId: string, reason: string): Promise<{ message: string }> {
    const response = await http.post(`/api/moderate/users/${userId}/warn`, { reason });
    return response.data;
  },

  // Reports and flagged content
  async getFlaggedContent(page: number = 1): Promise<{ content: FlaggedContent[]; pagination: any }> {
    const response = await http.get(`/api/moderate/flagged?page=${page}`);
    return response.data;
  },

  async resolveReport(reportId: string, action: string): Promise<{ message: string }> {
    const response = await http.post(`/api/moderate/reports/${reportId}/resolve`, { action });
    return response.data;
  }
};

// Combined export for convenience
export const rbacApi = {
  admin: adminApi,
  moderation: moderationApi
};
