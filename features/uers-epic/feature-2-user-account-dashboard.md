# Feature 2: User Account Dashboard

## 📋 Overview

**Epic:** Public Launch & Monetization Strategy  
**Feature ID:** F2  
**Priority:** HIGH  
**Effort:** 4 days  
**Dependencies:** F1 (Public Homepage & Navigation)

## 🎯 Description

Create a centralized hub for logged-in users to manage their account, settings, and billing information. This dashboard provides tier-specific functionality and encourages upgrades to premium services.

## 👤 User Stories

### US2.1 - Main Dashboard Welcome
**As a** logged-in user  
**I want** a main dashboard page that welcomes me and shows my current status  
**So that** I understand my account tier and available features

**Acceptance Criteria:**
- [ ] Displays personalized welcome message with username
- [ ] Shows current user tier (Free, BYOK, Premium) prominently
- [ ] Displays tier-specific status information
- [ ] Quick access to main app features
- [ ] Recent activity/usage summary

### US2.2 - BYOK API Key Management
**As a** BYOK user  
**I need** a settings page to securely manage my personal API key  
**So that** I can use my own AI provider account

**Acceptance Criteria:**
- [ ] Secure input field for API key (masked/obscured)
- [ ] Save/update API key functionality
- [ ] Remove/clear API key option
- [ ] Test API key connectivity
- [ ] Clear indication of API key status (valid/invalid/not set)
- [ ] Support for different providers (OpenAI, Anthropic, etc.)

### US2.3 - Premium Credits Management
**As a** Premium user  
**I need** a billing/credits page showing my credit balance and usage history  
**So that** I can monitor my spending and plan purchases

**Acceptance Criteria:**
- [ ] Current credit balance displayed prominently
- [ ] Credit usage history with timestamps
- [ ] Usage breakdown by feature (generation, chat, etc.)
- [ ] Purchase credits button/link
- [ ] Low balance warnings and notifications

### US2.4 - Upgrade Prompts
**As a** Free or BYOK user  
**I want** to see upgrade prompts and benefits  
**So that** I can easily upgrade to Premium when needed

**Acceptance Criteria:**
- [ ] Tier-appropriate upgrade suggestions
- [ ] Clear benefits of upgrading shown
- [ ] "Upgrade" buttons prominently placed
- [ ] Comparison with current tier features
- [ ] Non-intrusive but visible placement

## 🔧 Technical Implementation

### Current State Analysis
The existing application has:
- **Home component** redirects to ScenarioWriter directly
- **Settings page** for LLM backend configuration only
- **Basic user authentication** with JWT tokens
- **Database schema** with basic user info (no tier/credits)

### Required Changes

#### 1. New UserDashboard Component
**File:** `/frontend/src/pages/UserDashboard.tsx`

```tsx
interface UserDashboardProps {
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  seed?: number | null;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ setIsLoading, seed }) => {
  const { username } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  return (
    <div className="dashboard-container">
      <DashboardHeader username={username} />
      <div className="dashboard-grid">
        <WelcomeCard userProfile={userProfile} />
        <QuickActionsCard />
        <TierStatusCard userProfile={userProfile} />
        <RecentActivityCard />
        {userProfile?.tier !== 'premium' && <UpgradePromptCard tier={userProfile?.tier} />}
      </div>
    </div>
  );
};
```

#### 2. Enhanced Settings Component
**File:** `/frontend/src/pages/Settings.tsx` (extend existing)

```tsx
// Add new sections to existing Settings component
const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('llm'); // 'llm', 'account', 'billing'
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  return (
    <div className="settings-container">
      <div className="settings-tabs">
        <button 
          className={activeTab === 'llm' ? 'active' : ''} 
          onClick={() => setActiveTab('llm')}
        >
          LLM Backend
        </button>
        <button 
          className={activeTab === 'account' ? 'active' : ''} 
          onClick={() => setActiveTab('account')}
        >
          Account
        </button>
        {userProfile?.tier === 'premium' && (
          <button 
            className={activeTab === 'billing' ? 'active' : ''} 
            onClick={() => setActiveTab('billing')}
          >
            Billing & Credits
          </button>
        )}
      </div>
      
      <div className="settings-content">
        {activeTab === 'llm' && <LLMSettingsTab />} {/* Existing content */}
        {activeTab === 'account' && <AccountSettingsTab userProfile={userProfile} />}
        {activeTab === 'billing' && <BillingSettingsTab userProfile={userProfile} />}
      </div>
    </div>
  );
};
```

#### 3. New Dashboard Components

**WelcomeCard.tsx**
```tsx
interface WelcomeCardProps {
  userProfile: UserProfile | null;
}

const WelcomeCard: React.FC<WelcomeCardProps> = ({ userProfile }) => {
  return (
    <div className="welcome-card dashboard-card">
      <h2>Welcome back, {userProfile?.username}! 👋</h2>
      <div className="tier-badge tier-{userProfile?.tier}">
        {userProfile?.tier?.toUpperCase()} User
      </div>
      <p>You're on the {userProfile?.tier} plan.</p>
      
      {userProfile?.tier === 'free' && (
        <p>Generate up to 10 stories per day with our basic AI model.</p>
      )}
      {userProfile?.tier === 'byok' && (
        <p>Using your own API key for unlimited generations.</p>
      )}
      {userProfile?.tier === 'premium' && (
        <p>Credits remaining: <strong>{userProfile?.credits}</strong></p>
      )}
    </div>
  );
};
```

**AccountSettingsTab.tsx**
```tsx
const AccountSettingsTab: React.FC<{ userProfile: UserProfile | null }> = ({ userProfile }) => {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyStatus, setApiKeyStatus] = useState<'none' | 'valid' | 'invalid' | 'testing'>('none');

  return (
    <div className="account-settings">
      <section className="account-section">
        <h3>Account Information</h3>
        <div className="form-row">
          <label>Username:</label>
          <input type="text" value={userProfile?.username || ''} disabled />
        </div>
        <div className="form-row">
          <label>Email:</label>
          <input type="email" value={userProfile?.email || ''} />
        </div>
        <div className="form-row">
          <label>Account Tier:</label>
          <div className="tier-display tier-{userProfile?.tier}">
            {userProfile?.tier?.toUpperCase()}
          </div>
        </div>
      </section>

      {userProfile?.tier === 'byok' && (
        <section className="api-key-section">
          <h3>API Key Management</h3>
          <div className="form-row">
            <label>OpenAI API Key:</label>
            <div className="api-key-input-group">
              <input
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="api-key-input"
              />
              <button 
                type="button" 
                onClick={() => setShowApiKey(!showApiKey)}
                className="toggle-visibility-btn"
              >
                {showApiKey ? "🙈" : "👁️"}
              </button>
            </div>
          </div>
          
          <div className="api-key-status">
            Status: <span className={`status-${apiKeyStatus}`}>
              {apiKeyStatus === 'none' && 'No key set'}
              {apiKeyStatus === 'valid' && '✅ Valid'}
              {apiKeyStatus === 'invalid' && '❌ Invalid'}
              {apiKeyStatus === 'testing' && '🔄 Testing...'}
            </span>
          </div>

          <div className="button-row">
            <button className="settings-btn primary-btn" onClick={handleSaveApiKey}>
              Save API Key
            </button>
            <button className="settings-btn secondary-btn" onClick={handleTestApiKey}>
              Test Connection
            </button>
            <button className="settings-btn danger-btn" onClick={handleClearApiKey}>
              Clear Key
            </button>
          </div>
        </section>
      )}
    </div>
  );
};
```

**BillingSettingsTab.tsx**
```tsx
const BillingSettingsTab: React.FC<{ userProfile: UserProfile | null }> = ({ userProfile }) => {
  const [usageHistory, setUsageHistory] = useState<UsageRecord[]>([]);

  return (
    <div className="billing-settings">
      <section className="credits-overview">
        <h3>Credits Overview</h3>
        <div className="credits-display">
          <div className="current-balance">
            <span className="balance-number">{userProfile?.credits || 0}</span>
            <span className="balance-label">Credits Remaining</span>
          </div>
          <button className="buy-credits-btn primary-btn">
            Buy More Credits
          </button>
        </div>
        
        {(userProfile?.credits || 0) < 100 && (
          <div className="low-balance-warning">
            ⚠️ Low balance! Consider purchasing more credits to continue using premium features.
          </div>
        )}
      </section>

      <section className="usage-history">
        <h3>Usage History</h3>
        <div className="usage-table">
          <div className="usage-header">
            <span>Date</span>
            <span>Feature</span>
            <span>Credits Used</span>
            <span>Remaining</span>
          </div>
          {usageHistory.map(record => (
            <div key={record.id} className="usage-row">
              <span>{formatDate(record.timestamp)}</span>
              <span>{record.feature}</span>
              <span>-{record.creditsUsed}</span>
              <span>{record.creditsRemaining}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
```

#### 4. Backend Schema Extensions

**Database Migration:** Extend users table
```sql
-- Add new columns to existing users table
ALTER TABLE users ADD COLUMN tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'byok', 'premium'));
ALTER TABLE users ADD COLUMN credits INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN api_key TEXT;
ALTER TABLE users ADD COLUMN api_provider TEXT DEFAULT 'openai';

-- Create usage tracking table
CREATE TABLE IF NOT EXISTS credit_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    feature TEXT NOT NULL,
    credits_used INTEGER NOT NULL,
    credits_remaining INTEGER NOT NULL,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);
```

**New API Endpoints:**
- `GET /api/user/profile` - Get full user profile including tier/credits
- `PUT /api/user/profile` - Update user profile
- `POST /api/user/api-key` - Save/update API key (encrypted)
- `DELETE /api/user/api-key` - Remove API key
- `POST /api/user/api-key/test` - Test API key validity
- `GET /api/user/usage` - Get credit usage history

## 🎨 UX Design Mockups

### Main Dashboard Layout
```
┌─────────────────────────────────────────────────────────────┐
│                    📊 DASHBOARD                             │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────┐ ┌─────────────────────┐             │
│ │ 👋 Welcome back,    │ │ 🚀 Quick Actions    │             │
│ │    John!            │ │                     │             │
│ │                     │ │ [New Story]         │             │
│ │ 🟢 FREE User        │ │ [Continue Writing]  │             │
│ │ 8/10 daily stories  │ │ [Browse Stories]    │             │
│ └─────────────────────┘ └─────────────────────┘             │
│                                                             │
│ ┌─────────────────────┐ ┌─────────────────────┐             │
│ │ 📈 Recent Activity  │ │ ⬆️ Upgrade to Pro   │             │
│ │                     │ │                     │             │
│ │ • Story "Dragons"   │ │ Unlock unlimited    │             │
│ │   2 hours ago       │ │ stories, premium    │             │
│ │ • Chat session      │ │ models & more!      │             │
│ │   1 day ago         │ │                     │             │
│ │ • Settings update   │ │ [Learn More]        │             │
│ │   3 days ago        │ │                     │             │
│ └─────────────────────┘ └─────────────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

### Account Settings (BYOK User)
```
┌─────────────────────────────────────────────────────────────┐
│ [LLM Backend] [Account] [Billing]                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 👤 Account Information                                      │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Username: john_writer                                   │ │
│ │ Email:    john@example.com                             │ │
│ │ Tier:     🔑 BYOK                                      │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ 🔐 API Key Management                                       │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ OpenAI API Key: [••••••••••••••••••••••••••] [👁️]     │ │
│ │ Status: ✅ Valid                                       │ │
│ │                                                         │ │
│ │ [Save Key] [Test Connection] [Clear Key]                │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ⬆️ Upgrade to Premium                                       │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ • No need to manage API keys                           │ │
│ │ • Access to latest premium models                      │ │
│ │ • Priority support                                     │ │
│ │                                        [Upgrade Now]   │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Premium Billing Tab
```
┌─────────────────────────────────────────────────────────────┐
│ [LLM Backend] [Account] [Billing]                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 💰 Credits Overview                                         │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │         1,247                                           │ │
│ │    Credits Remaining          [Buy More Credits]        │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ 📊 Usage History                                            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Date       │ Feature      │ Used │ Remaining            │ │
│ │──────────────────────────────────────────────────────── │ │
│ │ 2025-06-11 │ Story Gen    │ -50  │ 1,247               │ │
│ │ 2025-06-10 │ Chat Session │ -15  │ 1,297               │ │
│ │ 2025-06-09 │ Story Gen    │ -75  │ 1,312               │ │
│ │ 2025-06-08 │ Purchase     │ +500 │ 1,387               │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ⚠️ Low balance warning appears when < 100 credits          │
└─────────────────────────────────────────────────────────────┘
```

## 📝 Implementation Tasks

### Phase 1: Dashboard Foundation (1.5 days)
- [ ] Create `UserDashboard.tsx` main component
- [ ] Create dashboard card components (`WelcomeCard`, `QuickActionsCard`, etc.)
- [ ] Add basic CSS styling for dashboard grid layout
- [ ] Update routing to include dashboard route

### Phase 2: Account Settings Enhancement (1.5 days)
- [ ] Extend existing `Settings.tsx` with tabbed interface
- [ ] Create `AccountSettingsTab.tsx` component
- [ ] Implement API key management UI for BYOK users
- [ ] Add API key encryption/decryption utilities

### Phase 3: Premium Billing Interface (1 day)
- [ ] Create `BillingSettingsTab.tsx` component
- [ ] Implement credit balance display
- [ ] Create usage history table
- [ ] Add low balance warning system

### Phase 4: Backend Integration (1 day)
- [ ] Extend database schema with user tier/credits
- [ ] Create new API endpoints for user profile
- [ ] Implement API key storage (encrypted)
- [ ] Create credit usage tracking system
- [ ] Add user tier middleware for future use

## 🧪 Testing Strategy

### Component Testing
- [ ] Dashboard renders correctly for each tier
- [ ] Settings tabs switch properly
- [ ] API key masking/showing works
- [ ] Credit balance updates correctly

### Integration Testing
- [ ] User profile data loads correctly
- [ ] API key save/test/clear functions work
- [ ] Credit usage tracking accurate
- [ ] Tier-specific features show/hide appropriately

### User Acceptance Testing
1. **Free User Journey:**
   - Login → see dashboard with daily limit
   - View upgrade prompts
   - Cannot access billing tab

2. **BYOK User Journey:**
   - Login → see dashboard
   - Manage API key in settings
   - See upgrade prompts for Premium

3. **Premium User Journey:**
   - Login → see credit balance
   - View usage history
   - Buy credits (mock)

## 🚀 Success Metrics

### Immediate (Launch)
- [ ] Dashboard loads in < 1 second
- [ ] All tier-specific features work correctly
- [ ] API key management functions properly
- [ ] Credit tracking accurate

### Post-Launch (1 week)
- [ ] Dashboard engagement > 70% of logins
- [ ] API key save success rate > 95%
- [ ] User satisfaction score > 4.0/5.0

## 📊 Analytics & Tracking

### Events to Track
- Dashboard page views by tier
- Settings tab interactions
- API key management actions
- Credit balance views
- Upgrade button clicks
- Time spent on dashboard

### User Behavior Insights
- Which dashboard cards get most interaction
- How often users check credit balance
- API key management usage patterns

## 🔗 Dependencies & Risks

### Dependencies
- User authentication system (exists)
- Database migration capabilities
- API key encryption library

### Risks & Mitigation
- **Risk:** API key security concerns
  - **Mitigation:** Strong encryption at rest, never log keys

- **Risk:** Complex tier logic in UI
  - **Mitigation:** Centralized tier checking utilities

- **Risk:** Credit tracking accuracy
  - **Mitigation:** Atomic database transactions, audit trails

## 📋 Definition of Done

- [ ] All user stories meet acceptance criteria
- [ ] Dashboard functional for all three tiers
- [ ] Account settings support tier-specific features
- [ ] API key management secure and functional
- [ ] Credit tracking accurate and reliable
- [ ] Database schema properly extended
- [ ] All API endpoints working
- [ ] Code reviewed and tested
- [ ] Documentation updated
