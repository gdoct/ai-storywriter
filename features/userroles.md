# Epic: User Roles and Site Administration
# Feature: Role-Based Access Control (RBAC)

## 📋 Overview
This document outlines the comprehensive user roles and permissions system for StoryWriter. It defines user tiers, administrative roles, their associated permissions, and the technical implementation for role-based access control across the application.

## 🎯 Objectives
- Implement a flexible tier-based user system (Free, BYOK, Premium)
- Add administrative roles for content moderation and site management
- Ensure secure access control across all application features
- Provide granular permission management for different user types
- Support future scalability with additional roles and tiers

## 👥 User Classification System

### Primary User Tiers
The application supports multiple user tiers based on subscription and payment model:

- **Free Tier**: Basic access with rate limits and feature restrictions
- **BYOK Tier**: "Bring Your Own Key" users who provide their own AI API keys
- **Premium Tier**: Full access users who purchase credits for AI features

### Administrative Roles
Administrative roles overlay on top of user tiers:

- **Moderator**: Content moderation and user management capabilities
- **Admin**: Full system administration and configuration access

### Access Hierarchy
User access is cumulative and whitelisted:
- **Anonymous Users**: Can only view public content (marketplace)
- **Free Users**: Basic scenario creation + limited AI features (rate-limited)
- **BYOK Users**: Unlimited AI features using their own API keys
- **Premium Users**: Unlimited AI features using application's premium models
- **Moderators**: User management + content moderation capabilities
- **Admins**: Full system access including configuration and analytics

## 🔐 Detailed User Levels

### 1. Anonymous Users
**Description**: Users who have not logged in or registered
**Access Level**: Public content only
**Capabilities**:
- View marketplace stories
- Browse public content
- Access marketing pages (features, pricing)
- Create account or login

### 2. Free Tier Users  
**Description**: Registered users with basic access
**Access Level**: Limited AI usage with rate limits
**Capabilities**:
- Create and edit scenarios
- Limited AI generations per day (10 chat completions, 5 story generations)
- View marketplace
- Rate stories (but cannot publish)
- Access user dashboard
**Restrictions**:
- Cannot publish stories to marketplace
- Rate-limited AI requests
- Basic AI models only
- No API key configuration

### 3. BYOK Tier Users
**Description**: Users who provide their own AI provider API keys
**Access Level**: Unlimited AI usage with their own keys
**Capabilities**:
- All Free tier capabilities
- Unlimited AI generations using their API key
- Configure and manage API keys securely
- Use their chosen AI models/providers
- Publish stories to marketplace
**Restrictions**:
- Must manage their own AI costs
- Limited to supported AI providers
- No access to premium-only features

### 4. Premium Tier Users
**Description**: Users who purchase credits for AI usage
**Access Level**: Full AI access with premium models
**Capabilities**:
- All BYOK tier capabilities
- Access to premium AI models
- Credit-based usage system
- Priority processing
- Advanced AI features
- Publish stories to marketplace
**Restrictions**:
- Credit consumption per request
- Must purchase credits when depleted

### 5. Moderators
**Description**: Users with content management responsibilities
**Access Level**: User management and content moderation
**Additional Capabilities**:
- Moderate marketplace content
- Remove inappropriate stories
- Manage user reports
- View moderation dashboard
- Ban/suspend users temporarily
- Access moderation logs
**Base Tier**: Can be any tier (Free, BYOK, Premium)

### 6. Administrators
**Description**: Users with full system access
**Access Level**: Complete system administration
**Additional Capabilities**:
- All Moderator capabilities
- User account management (create, edit, delete)
- AI backend configuration
- System settings and configuration
- Analytics and usage reports
- Database management tools
- Site-wide announcements
- Financial reporting
**Base Tier**: Typically Premium with admin role overlay

## 📊 Permission Matrix

| Feature                          | Admin | Moderator | Premium | BYOK | Free | Anonymous |
|----------------------------------|:-----:|:---------:|:-------:|:----:|:----:|:---------:|
| **Public Access**                |       |           |         |      |      |           |
| View marketplace                 |  ✅   |    ✅     |   ✅    |  ✅  |  ✅  |    ✅     |
| Browse marketing pages           |  ✅   |    ✅     |   ✅    |  ✅  |  ✅  |    ✅     |
| **Account Management**           |       |           |         |      |      |           |
| Create account                   |  ✅   |    ✅     |   ✅    |  ✅  |  ✅  |    ✅     |
| Login/logout                     |  ✅   |    ✅     |   ✅    |  ✅  |  ✅  |     -     |
| User dashboard                   |  ✅   |    ✅     |   ✅    |  ✅  |  ✅  |     -     |
| **Scenario Management**          |       |           |         |      |      |           |
| Create scenarios                 |  ✅   |    ✅     |   ✅    |  ✅  |  ✅  |     -     |
| Edit own scenarios               |  ✅   |    ✅     |   ✅    |  ✅  |  ✅  |     -     |
| Delete own scenarios             |  ✅   |    ✅     |   ✅    |  ✅  |  ✅  |     -     |
| **AI Features**                  |       |           |         |      |      |           |
| Chat completions                 |  ✅   |    ✅     |   ✅    |  ✅  | ⚠️ ¹ |     -     |
| Story generation                 |  ✅   |    ✅     |   ✅    |  ✅  | ⚠️ ¹ |     -     |
| Character generation             |  ✅   |    ✅     |   ✅    |  ✅  | ⚠️ ¹ |     -     |
| Image analysis (vision)          |  ✅   |    ✅     |   ✅    |  ✅  | ⚠️ ¹ |     -     |
| Premium AI models                |  ✅   |    ✅     |   ✅    |  -   |  -   |     -     |
| **Marketplace**                  |       |           |         |      |      |           |
| View stories                     |  ✅   |    ✅     |   ✅    |  ✅  |  ✅  |    ✅     |
| Rate stories                     |  ✅   |    ✅     |   ✅    |  ✅  |  ✅  |     -     |
| Download stories                 |  ✅   |    ✅     |   ✅    |  ✅  |  ✅  |     -     |
| Publish stories                  |  ✅   |    ✅     |   ✅    |  ✅  |  -   |     -     |
| Donate credits                   |  ✅   |    ✅     |   ✅    |  -   |  -   |     -     |
| **Settings & Configuration**     |       |           |         |      |      |           |
| Manage profile                   |  ✅   |    ✅     |   ✅    |  ✅  |  ✅  |     -     |
| Configure API keys               |  ✅   |    ✅     |   ✅ ²  |  ✅  |  -   |     -     |
| Purchase credits                 |  ✅   |    ✅     |   ✅    |  ✅ ³|  ✅ ³|     -     |
| **Moderation**                   |       |           |         |      |      |           |
| Moderate marketplace content     |  ✅   |    ✅     |    -    |  -   |  -   |     -     |
| Remove inappropriate stories     |  ✅   |    ✅     |    -    |  -   |  -   |     -     |
| Ban/suspend users                |  ✅   |    ✅     |    -    |  -   |  -   |     -     |
| View moderation logs             |  ✅   |    ✅     |    -    |  -   |  -   |     -     |
| Manage user reports              |  ✅   |    ✅     |    -    |  -   |  -   |     -     |
| **Administration**               |       |           |         |      |      |           |
| User account management          |  ✅   |     -     |    -    |  -   |  -   |     -     |
| AI backend configuration         |  ✅   |     -     |    -    |  -   |  -   |     -     |
| System settings                  |  ✅   |     -     |    -    |  -   |  -   |     -     |
| Analytics and reports            |  ✅   |     -     |    -    |  -   |  -   |     -     |
| Database management              |  ✅   |     -     |    -    |  -   |  -   |     -     |
| Site announcements               |  ✅   |     -     |    -    |  -   |  -   |     -     |

**Legend:**
- ✅ Full access
- ⚠️ Limited access (see footnotes)
- `-` No access

**Footnotes:**
1. **Free Tier AI Limits**: Trial: 25 chat completions and 3 stories
2. **Premium API Keys**: Optional for hybrid usage (own key + credits)
3. **Credit Purchase**: To upgrade to Premium tier

## 🎛️ Feature-Specific Access ControlN

### Content Moderation System
**Applicable Roles**: Moderators and Administrators

Moderators and Admins have access to enhanced marketplace interfaces with additional controls:

**Moderation Dashboard**:
- List of flagged content requiring review
- User-reported stories and inappropriate content
- Quick action buttons (approve, remove, flag for admin review)
- Moderation history and audit trail

**Enhanced Marketplace Interface**:
- Additional buttons on each story: "Remove", "Flag", "Ban Author"
- Moderation status indicators
- Bulk moderation actions
- Advanced filtering (by report type, user, date)

**User Management**:
- Temporary suspension capabilities
- View user's complete story history
- Access to user's account activity
- Warning system and progressive discipline

### Admin Panel System
**Applicable Roles**: Administrators only

The Admin Panel provides comprehensive system management tools:

**User Management Interface**:
- Search and filter users by tier, activity, registration date
- Modify user tiers and roles
- View detailed user profiles and activity logs
- Bulk user operations (export, communications)
- Manual credit adjustments and refunds

**AI Backend Management**:
- Configure supported AI providers (OpenAI, Anthropic, Google)
- Set default models for each tier and request type
- Configure rate limits and pricing
- Monitor AI usage and costs
- API key rotation and management

**System Configuration**:
- Global application settings
- Feature flags and beta feature access
- Maintenance mode controls
- Database backup and management tools
- Performance monitoring and analytics

**Financial Management**:
- Revenue reports and analytics
- Credit purchase tracking
- Refund processing
- Payment gateway configuration
- Tier upgrade/downgrade analytics

## 🔐 Technical Implementation

### Database Schema
The existing database already includes the foundation for the tier system. The existing database schema can be found in the file ```backend\dbschema.sql```. 

```sql
-- Users table (already implemented)
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT,
    tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'byok', 'premium')),
    api_key_encrypted TEXT,
    api_provider TEXT DEFAULT 'openai' CHECK (api_provider IN ('openai', 'anthropic', 'google')),
    is_deleted INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    -- ... other fields
);

-- Additional table needed for role management
CREATE TABLE user_roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('moderator', 'admin')),
    granted_by TEXT NOT NULL,
    granted_at TEXT DEFAULT CURRENT_TIMESTAMP,
    revoked_at TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(granted_by) REFERENCES users(id)
);

-- Rate limiting (already implemented)
CREATE TABLE rate_limits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    feature TEXT NOT NULL,
    count INTEGER DEFAULT 0,
    window_start TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id),
    UNIQUE(user_id, feature, window_start)
);

-- Credit tracking (already implemented)
CREATE TABLE credit_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    feature TEXT NOT NULL,
    model TEXT,
    credits_used INTEGER NOT NULL,
    credits_remaining INTEGER NOT NULL,
    request_tokens INTEGER,
    response_tokens INTEGER,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);
```

### Backend Implementation

**1. Role Management Service**
```python
class RoleManager:
    @staticmethod
    def get_user_roles(user_id):
        """Get all active roles for a user"""
        
    @staticmethod
    def has_permission(user_id, permission):
        """Check if user has specific permission"""
        
    @staticmethod
    def grant_role(user_id, role, granted_by):
        """Grant administrative role to user"""
        
    @staticmethod
    def revoke_role(user_id, role, revoked_by):
        """Revoke administrative role from user"""
```

**2. Enhanced Authentication Middleware**
```python
from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

def require_role(required_roles=None):
    """Decorator that requires specific roles"""
    def decorator(f):
        @wraps(f)
        @jwt_required()
        def decorated_function(*args, **kwargs):
            username = get_jwt_identity()
            user = UserRepository.get_user_by_username(username)
            user_roles = RoleManager.get_user_roles(user['id'])
            
            if required_roles:
                if not any(role in user_roles for role in required_roles):
                    return jsonify({'error': 'Insufficient permissions'}), 403
            
            request.user_context = {
                'user_id': user['id'],
                'username': user['username'],
                'tier': user.get('tier', 'free'),
                'roles': user_roles,
                'profile': user
            }
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator
```

**3. Permission-Based Route Protection**
```python
# Moderation endpoints
@marketplace_bp.route('/api/moderate/stories/<story_id>', methods=['DELETE'])
@require_role(['moderator', 'admin'])
def remove_story(story_id):
    """Remove inappropriate story from marketplace"""
    
@marketplace_bp.route('/api/moderate/users/<user_id>/suspend', methods=['POST'])
@require_role(['moderator', 'admin'])
def suspend_user(user_id):
    """Temporarily suspend user account"""

# Admin-only endpoints
@admin_bp.route('/api/admin/users', methods=['GET'])
@require_role(['admin'])
def list_all_users():
    """List all users for admin management"""
    
@admin_bp.route('/api/admin/config/ai-backends', methods=['PUT'])
@require_role(['admin'])
def update_ai_config():
    """Update AI backend configuration"""
```

### Frontend Implementation

**1. Role-Based Component Rendering**
```tsx
// Permission-based component
interface PermissionGateProps {
  requiredRoles?: string[];
  requiredTier?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

const PermissionGate: React.FC<PermissionGateProps> = ({ 
  requiredRoles, 
  requiredTier, 
  fallback, 
  children 
}) => {
  const { userProfile } = useAuth();
  
  const hasPermission = () => {
    if (requiredTier && userProfile.tier !== requiredTier) return false;
    if (requiredRoles && !requiredRoles.some(role => userProfile.roles.includes(role))) return false;
    return true;
  };
  
  return hasPermission() ? <>{children}</> : <>{fallback}</>;
};
```

**2. Enhanced User Context**
```tsx
interface UserProfile {
  id: string;
  username: string;
  email: string;
  tier: 'free' | 'byok' | 'premium';
  roles: string[];
  credits?: number;
  apiKeyConfigured?: boolean;
}

const AuthContext = createContext<{
  authenticated: boolean;
  userProfile: UserProfile | null;
  hasRole: (role: string) => boolean;
  hasTier: (tier: string) => boolean;
}>({
  authenticated: false,
  userProfile: null,
  hasRole: () => false,
  hasTier: () => false,
});
```

**3. Conditional UI Elements**
```tsx
const MarketplaceStory: React.FC = ({ story }) => {
  const { hasRole } = useAuth();
  
  return (
    <div className="story-card">
      <h3>{story.title}</h3>
      <p>{story.excerpt}</p>
      
      {/* Regular user actions */}
      <button onClick={() => downloadStory(story.id)}>Download</button>
      <button onClick={() => rateStory(story.id)}>Rate</button>
      
      {/* Moderator-only actions */}
      <PermissionGate requiredRoles={['moderator', 'admin']}>
        <button onClick={() => removeStory(story.id)} className="danger">
          Remove Story
        </button>
        <button onClick={() => flagStory(story.id)} className="warning">
          Flag for Review
        </button>
      </PermissionGate>
      
      {/* Admin-only actions */}
      <PermissionGate requiredRoles={['admin']}>
        <button onClick={() => banAuthor(story.authorId)} className="danger">
          Ban Author
        </button>
      </PermissionGate>
    </div>
  );
};
```

## 📋 Implementation Plan

### Phase 1: Core Infrastructure
#### Backend Tasks
- [ ] **Database Migration**
  - Create `user_roles` table for administrative roles
  - Add indexes for performance optimization
  - Create migration scripts and rollback procedures

- [ ] **Role Management Service**
  - Implement `RoleManager` class with core methods
  - Create role assignment and revocation logic
  - Add role validation and permission checking
  - Unit tests for role management functionality

- [ ] **Enhanced Authentication Middleware**
  - Extend existing `@jwt_required` decorator with role support
  - Create `@require_role` decorator for route protection
  - Add user context injection with tier and role information
  - Integration tests for middleware functionality

- [ ] **User Repository Extensions**
  - Add role-related methods to `UserRepository`
  - Implement secure role assignment tracking
  - Add audit logging for role changes
  - Performance optimization for role lookups

- [ ] **API Endpoint Creation**
  - Create role management endpoints for admins
  - Add user listing and management endpoints
  - Implement basic moderation endpoints
  - API documentation and testing

#### Frontend Tasks
- [ ] **Enhanced Auth Context**
  - Extend `AuthContext` with role and tier information
  - Update login flow to fetch user profile details
  - Add role-checking utility functions
  - Update token handling for additional user data

- [ ] **Permission Gate Component**
  - Create reusable `PermissionGate` component
  - Add role-based conditional rendering
  - Implement fallback UI for insufficient permissions

- [ ] **Basic Role Integration**
  - Update existing components to use permission gates
  - Add role-based navigation elements
  - Implement basic admin/moderator UI indicators

### Phase 2: Moderation System 
**Priority**: High  
**Dependencies**: Phase 1 complete

#### Backend Tasks
- [ ] **Moderation Controller**
  - Create `ModerationController` with story management
  - Implement story removal and flagging endpoints
  - Add user suspension and warning system
  - Create moderation audit logging

- [ ] **Enhanced Marketplace API**
  - Add moderation status to story objects
  - Implement moderation history tracking
  - Create filtered story lists for moderators
  - Add bulk moderation operations

- [ ] **User Management API**
  - Create user suspension/ban endpoints
  - Implement user activity tracking
  - Add progressive discipline system
  - Create user communication tools

#### Frontend Tasks
- [ ] **Moderation Dashboard**
  - Create dedicated moderation interface
  - Implement flagged content review queue
  - Add quick action buttons and bulk operations
  - Create moderation history view

- [ ] **Enhanced Marketplace UI**
  - Add moderation buttons to story cards
  - Implement moderation status indicators
  - Create advanced filtering for moderators
  - Add confirmation dialogs for destructive actions

- [ ] **User Management Interface**
  - Create user profile management for moderators
  - Add user search and filtering
  - Implement user action history view
  - Add warning and suspension controls

### Phase 3: Admin Panel
**Priority**: Medium  
**Dependencies**: Phase 2 complete

#### Backend Tasks
- [ ] **Admin Controller**
  - Create comprehensive admin API endpoints
  - Implement system configuration management
  - Add user tier management functionality
  - Create analytics and reporting endpoints

- [ ] **AI Backend Configuration**
  - Create AI provider management system
  - Implement model configuration for tiers
  - Add rate limit and pricing management
  - Create AI usage monitoring and analytics

- [ ] **System Management API**
  - Implement database management tools
  - Add backup and maintenance endpoints
  - Create system health monitoring
  - Add financial reporting capabilities

#### Frontend Tasks
- [ ] **Admin Dashboard **
  - Create main admin interface with navigation
  - Implement system overview and analytics
  - Add user management interface
  - Create role assignment tools

- [ ] **AI Backend Management UI**
  - Create AI provider configuration interface
  - Implement model selection and pricing tools
  - Add usage monitoring dashboards
  - Create cost analysis and reporting

- [ ] **Advanced Admin Tools**
  - Implement database management interface
  - Add system configuration panels
  - Create financial reporting dashboards
  - Add maintenance and monitoring tools


## 🔧 Configuration and Environment

### Environment Variables
```bash
# Role management
ENABLE_ADMIN_PANEL=true
ENABLE_MODERATION=true
DEFAULT_ADMIN_USER=admin@storywriter.app

# Security
ROLE_JWT_CLAIM_KEY=roles
PERMISSION_CACHE_TTL=300

# Audit logging
AUDIT_LOG_RETENTION_DAYS=365
AUDIT_LOG_LEVEL=INFO
```

### Feature Flags
```json
{
  "features": {
    "admin_panel": {
      "enabled": true,
      "beta": false,
      "restricted_to_roles": ["admin"]
    },
    "moderation_tools": {
      "enabled": true,
      "beta": false,
      "restricted_to_roles": ["moderator", "admin"]
    },
    "bulk_operations": {
      "enabled": false,
      "beta": true,
      "restricted_to_roles": ["admin"]
    }
  }
}
```


