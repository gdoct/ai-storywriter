/**
 * User and authentication types for StoryWriter
 */

export type UserTier = 'free' | 'byok' | 'premium';

export type UserRole = 'moderator' | 'admin';

export type Permission = 
  | 'moderate_content'
  | 'remove_stories'
  | 'suspend_users'
  | 'view_moderation_logs'
  | 'manage_user_reports'
  | 'manage_users'
  | 'configure_ai_backends'
  | 'manage_system_settings'
  | 'view_analytics'
  | 'manage_database'
  | 'create_announcements'
  | 'assign_roles';

export interface UserProfile {
  user_id: string;
  username: string;
  email?: string;
  tier: UserTier;
  roles: UserRole[];
  permissions: Permission[];
  created_at?: string;
  credits: number; // Made required - always track credits
  apiKeyConfigured?: boolean;
}

export interface AuthState {
  authenticated: boolean;
  userProfile: UserProfile | null;
  token: string | null;
  loading: boolean;
}

export interface LoginResponse {
  access_token: string;
  username: string;
  email: string;
  tier: UserTier;
  roles: UserRole[];
  permissions: Permission[];
  message: string;
}

export interface AuthContextType {
  // State
  authenticated: boolean;
  userProfile: UserProfile | null;
  loading: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  refreshCredits: () => Promise<void>; // Added credit refresh function
  
  // Utility functions
  hasRole: (role: UserRole) => boolean;
  hasPermission: (permission: Permission) => boolean;
  hasTier: (tier: UserTier) => boolean;
  hasMinimumTier: (tier: UserTier) => boolean;
}

export interface ModerationAction {
  id: string;
  type: 'remove_story' | 'flag_story' | 'suspend_user' | 'warn_user';
  target_id: string;
  target_type: 'story' | 'user';
  moderator_id: string;
  moderator_username: string;
  reason: string;
  created_at: string;
}

export interface FlaggedContent {
  id: string;
  type: 'story' | 'comment';
  content_id: string;
  content_title?: string;
  author_username: string;
  report_reason: string;
  reported_by: string;
  reported_at: string;
  status: 'pending' | 'reviewed' | 'resolved';
}

export interface ModerationDashboard {
  recent_stories: any[]; // TODO: Import story type
  flagged_content_count: number;
  pending_reports: number;
  recent_actions: ModerationAction[];
}
