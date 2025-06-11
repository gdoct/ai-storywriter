# Feature 4: Legal & Trust Framework

## 📋 Overview

**Epic:** Public Launch & Monetization Strategy  
**Feature ID:** F4  
**Priority:** MEDIUM  
**Effort:** 2 days  
**Dependencies:** F1 (Public Homepage & Navigation)

## 🎯 Description

Establish trust with users by providing clear legal documentation. This feature creates the legal foundation necessary for public launch, including Privacy Policy, Terms of Service, and compliant signup processes.

## 👤 User Stories

### US4.1 - Privacy Policy Access
**As a** user  
**I want** to access and read a clear Privacy Policy  
**So that** I understand what data is collected and how it's used

**Acceptance Criteria:**
- [ ] Dedicated Privacy Policy page accessible from all pages
- [ ] Clear explanation of data collection practices
- [ ] Specific mention of prompt/story data handling
- [ ] API key security and encryption details
- [ ] User rights and data deletion processes
- [ ] Contact information for privacy concerns
- [ ] Last updated date prominently displayed

### US4.2 - Terms of Service Access
**As a** user  
**I want** to access a Terms of Service page  
**So that** I understand the rules and my responsibilities

**Acceptance Criteria:**
- [ ] Dedicated Terms of Service page
- [ ] Clear usage guidelines and restrictions
- [ ] User responsibilities and prohibited uses
- [ ] Service availability and limitations
- [ ] Account termination conditions
- [ ] Intellectual property rights
- [ ] Limitation of liability
- [ ] Dispute resolution process

### US4.3 - Compliant Signup Process
**As a** new user  
**I must** agree to legal documents before creating an account  
**So that** both parties understand the agreement

**Acceptance Criteria:**
- [ ] Checkbox requiring agreement to Terms and Privacy Policy
- [ ] Links to both documents from signup form
- [ ] Cannot submit signup without agreeing
- [ ] Clear visual indication of requirement
- [ ] Agreement timestamp recorded in database

### US4.4 - Footer Legal Links
**As a** visitor  
**I want** easy access to legal documents from any page  
**So that** I can review them when needed

**Acceptance Criteria:**
- [ ] Privacy Policy and Terms links in footer
- [ ] Links work from all pages (marketing and app)
- [ ] Consistent styling and placement
- [ ] Clear, readable link text

## 🔧 Technical Implementation

### Current State Analysis
The current application has:
- Basic footer component with minimal content
- Simple signup form without legal agreements
- No legal documentation pages
- No privacy/terms compliance

### Required Changes

#### 1. Privacy Policy Page Component
**File:** `/frontend/src/pages/legal/PrivacyPolicy.tsx`

```tsx
const PrivacyPolicy: React.FC = () => {
  return (
    <div className="legal-document">
      <div className="legal-header">
        <h1>Privacy Policy</h1>
        <p className="last-updated">Last updated: June 11, 2025</p>
      </div>

      <div className="legal-content">
        <section>
          <h2>1. Information We Collect</h2>
          <h3>1.1 Account Information</h3>
          <p>
            When you create an account, we collect your username, email address, 
            and password (stored securely using industry-standard hashing).
          </p>

          <h3>1.2 Story and Prompt Data</h3>
          <p>
            We store the scenarios, prompts, and stories you create to provide 
            our services. This content is private to your account and is not 
            shared with other users unless you explicitly choose to do so.
          </p>

          <h3>1.3 API Keys (BYOK Users)</h3>
          <p>
            If you use the "Bring Your Own Key" tier, we store your API keys 
            encrypted at rest using AES-256 encryption. These keys are only 
            used to make AI requests on your behalf and are never logged or 
            transmitted in plain text.
          </p>

          <h3>1.4 Usage Data</h3>
          <p>
            We collect usage statistics including feature usage, generation counts,
            and performance metrics to improve our service. This data is anonymized
            and aggregated.
          </p>
        </section>

        <section>
          <h2>2. How We Use Your Information</h2>
          <ul>
            <li>Provide and maintain our story generation services</li>
            <li>Process AI generation requests using your prompts</li>
            <li>Manage your account and subscription</li>
            <li>Send important service notifications</li>
            <li>Improve our services and user experience</li>
            <li>Provide customer support</li>
          </ul>
        </section>

        <section>
          <h2>3. Data Sharing and Disclosure</h2>
          <p>
            We do not sell, trade, or otherwise transfer your personal information
            to third parties except as described below:
          </p>
          <ul>
            <li><strong>AI Service Providers:</strong> Your prompts are sent to AI providers (OpenAI, Anthropic, etc.) to generate content. These providers have their own privacy policies.</li>
            <li><strong>Legal Requirements:</strong> We may disclose information if required by law or to protect our rights.</li>
            <li><strong>Service Providers:</strong> We may use trusted third-party services for hosting, analytics, and payment processing.</li>
          </ul>
        </section>

        <section>
          <h2>4. Data Security</h2>
          <p>
            We implement industry-standard security measures including:
          </p>
          <ul>
            <li>HTTPS encryption for all data transmission</li>
            <li>AES-256 encryption for sensitive data at rest</li>
            <li>Regular security audits and updates</li>
            <li>Limited access controls for our staff</li>
            <li>Secure password hashing using bcrypt</li>
          </ul>
        </section>

        <section>
          <h2>5. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Delete your account and associated data</li>
            <li>Export your stories and scenarios</li>
            <li>Opt out of non-essential communications</li>
          </ul>
        </section>

        <section>
          <h2>6. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, please contact us at:
            <br />
            Email: privacy@storywriter.app
            <br />
            Address: [Company Address]
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
```

#### 2. Terms of Service Page Component
**File:** `/frontend/src/pages/legal/TermsOfService.tsx`

```tsx
const TermsOfService: React.FC = () => {
  return (
    <div className="legal-document">
      <div className="legal-header">
        <h1>Terms of Service</h1>
        <p className="last-updated">Last updated: June 11, 2025</p>
      </div>

      <div className="legal-content">
        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using StoryWriter, you accept and agree to be bound 
            by the terms and provision of this agreement.
          </p>
        </section>

        <section>
          <h2>2. Description of Service</h2>
          <p>
            StoryWriter is an AI-powered story generation platform that helps users
            create narratives using artificial intelligence. We offer three service
            tiers: Free, BYOK (Bring Your Own Key), and Premium.
          </p>

          <h3>2.1 Service Tiers</h3>
          <ul>
            <li><strong>Free:</strong> Limited daily generations with our AI models</li>
            <li><strong>BYOK:</strong> Unlimited use with your own AI provider API keys</li>
            <li><strong>Premium:</strong> Unlimited use with our premium AI models using a credit system</li>
          </ul>
        </section>

        <section>
          <h2>3. User Accounts</h2>
          <h3>3.1 Account Creation</h3>
          <p>
            You must provide accurate and complete information when creating an account.
            You are responsible for maintaining the security of your account credentials.
          </p>

          <h3>3.2 Account Responsibilities</h3>
          <ul>
            <li>You are responsible for all activity under your account</li>
            <li>You must notify us immediately of any unauthorized use</li>
            <li>You must not share your account credentials</li>
            <li>You must be at least 13 years old to use our service</li>
          </ul>
        </section>

        <section>
          <h2>4. Acceptable Use</h2>
          <h3>4.1 Permitted Uses</h3>
          <p>You may use StoryWriter for lawful purposes including:</p>
          <ul>
            <li>Creating original fictional content</li>
            <li>Educational and research purposes</li>
            <li>Personal and commercial storytelling projects</li>
          </ul>

          <h3>4.2 Prohibited Uses</h3>
          <p>You may not use StoryWriter to:</p>
          <ul>
            <li>Generate harmful, illegal, or offensive content</li>
            <li>Create content that infringes on others' intellectual property</li>
            <li>Attempt to reverse engineer or hack our systems</li>
            <li>Use automated tools to abuse our rate limits</li>
            <li>Generate spam or malicious content</li>
            <li>Create content intended to deceive or mislead others</li>
          </ul>
        </section>

        <section>
          <h2>5. Intellectual Property</h2>
          <h3>5.1 Your Content</h3>
          <p>
            You retain ownership of the stories and scenarios you create. By using
            our service, you grant us a limited license to process and store your
            content to provide our services.
          </p>

          <h3>5.2 Our Content</h3>
          <p>
            The StoryWriter platform, including its design, features, and technology,
            is owned by us and protected by intellectual property laws.
          </p>
        </section>

        <section>
          <h2>6. Payment and Refunds</h2>
          <h3>6.1 Premium Credits</h3>
          <p>
            Premium tier users purchase credits for AI generation. Credits are
            non-transferable and do not expire for 12 months from purchase date.
          </p>

          <h3>6.2 Refund Policy</h3>
          <p>
            Refunds are available within 7 days of purchase for unused credits.
            Contact support for refund requests.
          </p>
        </section>

        <section>
          <h2>7. Service Availability</h2>
          <p>
            We strive for high availability but do not guarantee uninterrupted access.
            We may perform maintenance, updates, or experience outages that temporarily
            affect service availability.
          </p>
        </section>

        <section>
          <h2>8. Limitation of Liability</h2>
          <p>
            StoryWriter is provided "as is" without warranties. We are not liable
            for any damages arising from your use of our service, including but not
            limited to lost data, business interruption, or consequential damages.
          </p>
        </section>

        <section>
          <h2>9. Termination</h2>
          <p>
            We may terminate or suspend your account for violations of these terms.
            You may delete your account at any time through your account settings.
          </p>
        </section>

        <section>
          <h2>10. Contact Information</h2>
          <p>
            For questions about these Terms of Service, contact us at:
            <br />
            Email: legal@storywriter.app
            <br />
            Address: [Company Address]
          </p>
        </section>
      </div>
    </div>
  );
};

export default TermsOfService;
```

#### 3. Enhanced Footer Component
**File:** `/frontend/src/components/Footer/Footer.tsx` (extend existing)

```tsx
// Add legal links section to existing footer
const Footer: React.FC<FooterProps> = ({ isLoading, onSeedChange }) => {
  // ... existing footer content ...

  return (
    <div className="footer">
      <div className="footer-content">
        {/* Existing status indicators and controls */}
        <div className="status-indicators">
          {/* ... existing content ... */}
        </div>
        
        <div className="model-controls">
          {/* ... existing content ... */}
        </div>

        {/* New legal links section */}
        <div className="legal-links">
          <Link to="/privacy" className="legal-link">Privacy Policy</Link>
          <span className="separator">|</span>
          <Link to="/terms" className="legal-link">Terms of Service</Link>
        </div>
      </div>
    </div>
  );
};
```

#### 4. Enhanced Signup Component
**File:** `/frontend/src/pages/Signup.tsx` (new component)

```tsx
const Signup: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the Terms of Service and Privacy Policy';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    // Signup logic here
    setIsLoading(false);
  };

  return (
    <div className="signup-container">
      <div className="signup-form-wrapper">
        <h2>Create Your Account</h2>
        <form onSubmit={handleSubmit} className="signup-form">
          {/* Username field */}
          <div className="form-group">
            <label htmlFor="username">Username:</label>
            <input
              type="text"
              id="username"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              className={errors.username ? 'error' : ''}
            />
            {errors.username && <span className="error-text">{errors.username}</span>}
          </div>

          {/* Email field */}
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className={errors.email ? 'error' : ''}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          {/* Password fields */}
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className={errors.password ? 'error' : ''}
            />
            {errors.password && <span className="error-text">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password:</label>
            <input
              type="password"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              className={errors.confirmPassword ? 'error' : ''}
            />
            {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
          </div>

          {/* Legal agreement checkbox */}
          <div className="form-group legal-agreement">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.agreeToTerms}
                onChange={(e) => setFormData({...formData, agreeToTerms: e.target.checked})}
                className={errors.agreeToTerms ? 'error' : ''}
              />
              <span className="checkmark"></span>
              I agree to the{' '}
              <Link to="/terms" target="_blank" className="legal-link">
                Terms of Service
              </Link>
              {' '}and{' '}
              <Link to="/privacy" target="_blank" className="legal-link">
                Privacy Policy
              </Link>
            </label>
            {errors.agreeToTerms && <span className="error-text">{errors.agreeToTerms}</span>}
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="signup-btn"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="login-link">
          Already have an account?{' '}
          <Link to="/login">Sign in here</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
```

#### 5. Updated Routing
**File:** `/frontend/src/routes.tsx` (extend existing)

```tsx
const getRoutes = ({ setIsLoading, seed }: RoutesProps): RouteObject[] => {
  return [
    // ... existing routes ...
    {
      path: '/signup',
      element: <Signup />
    },
    {
      path: '/privacy',
      element: <PrivacyPolicy />
    },
    {
      path: '/terms',
      element: <TermsOfService />
    },
    // ... other routes ...
  ];
};
```

#### 6. Backend Database Extension
**Database Migration:** Track legal agreement
```sql
-- Add legal agreement tracking to users table
ALTER TABLE users ADD COLUMN terms_agreed_at TEXT;
ALTER TABLE users ADD COLUMN privacy_agreed_at TEXT;
ALTER TABLE users ADD COLUMN terms_version TEXT DEFAULT '1.0';
ALTER TABLE users ADD COLUMN privacy_version TEXT DEFAULT '1.0';
```

## 🎨 UX Design Mockups

### Privacy Policy Page Layout
```
┌─────────────────────────────────────────────────────────────┐
│ [🏠 StoryWriter]              [Features] [Pricing] [Login] [Sign Up] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    📋 Privacy Policy                        │
│                Last updated: June 11, 2025                 │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Table of Contents                                       │ │
│ │ 1. Information We Collect                               │ │
│ │ 2. How We Use Your Information                          │ │
│ │ 3. Data Sharing and Disclosure                          │ │
│ │ 4. Data Security                                        │ │
│ │ 5. Your Rights                                          │ │
│ │ 6. Contact Us                                           │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ 1. Information We Collect                                   │
│                                                             │
│ 1.1 Account Information                                     │
│ When you create an account, we collect your username,      │
│ email address, and password (stored securely using         │
│ industry-standard hashing).                                 │
│                                                             │
│ 1.2 Story and Prompt Data                                  │
│ We store the scenarios, prompts, and stories you create... │
│                                                             │
│ [Continue with full legal text...]                         │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ [Privacy Policy] | [Terms of Service]                      │
└─────────────────────────────────────────────────────────────┘
```

### Signup Form with Legal Agreement
```
┌─────────────────────────────────────────────────────────────┐
│                Create Your Account                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Username: [john_writer...........................]          │
│                                                             │
│ Email:    [john@example.com.....................]          │
│                                                             │
│ Password: [••••••••••••••••••••••••••••••••••••]          │
│                                                             │
│ Confirm:  [••••••••••••••••••••••••••••••••••••]          │
│                                                             │
│ ☑️ I agree to the [Terms of Service] and [Privacy Policy] │
│                                                             │
│                  [Create Account]                          │
│                                                             │
│           Already have an account? [Sign in here]          │
└─────────────────────────────────────────────────────────────┘
```

### Enhanced Footer with Legal Links
```
┌─────────────────────────────────────────────────────────────┐
│ [🟢 AI Connected] [Model: GPT-4] [Temp: 0.80] [Seed: Auto] │
│                                                             │
│                    [Privacy Policy] | [Terms of Service]   │
└─────────────────────────────────────────────────────────────┘
```

## 📝 Implementation Tasks

### Phase 1: Legal Document Pages (1 day)
- [ ] Create `PrivacyPolicy.tsx` component with comprehensive policy
- [ ] Create `TermsOfService.tsx` component with detailed terms
- [ ] Create shared CSS styles for legal documents
- [ ] Add legal document routes to routing configuration
- [ ] Ensure mobile-responsive design for legal pages

### Phase 2: Signup Enhancement & Footer Updates (1 day)
- [ ] Create `Signup.tsx` component with legal agreement checkbox
- [ ] Add form validation for legal agreement requirement
- [ ] Enhance Footer component with legal links
- [ ] Update database schema for legal agreement tracking
- [ ] Create backend endpoint for signup with legal agreement
- [ ] Test legal agreement requirement enforcement

## 🧪 Testing Strategy

### Manual Testing Scenarios
1. **Legal Document Access:**
   - Navigate to Privacy Policy from footer
   - Navigate to Terms of Service from footer
   - Verify documents load correctly on mobile/desktop
   - Test links work from all pages

2. **Signup Process:**
   - Try to submit without agreeing to terms
   - Verify links open legal documents in new tabs
   - Complete successful signup with agreement
   - Verify agreement is recorded in database

3. **Legal Links:**
   - Test footer links from marketing pages
   - Test footer links from app pages
   - Verify consistent styling and placement

### Automated Testing
- [ ] Unit tests for signup form validation
- [ ] Integration tests for legal agreement requirement
- [ ] End-to-end tests for complete signup flow

## 🚀 Success Metrics

### Immediate (Launch)
- [ ] Legal documents load in < 2 seconds
- [ ] Signup form enforces legal agreement
- [ ] All legal links work correctly
- [ ] Mobile responsive design functions

### Post-Launch (1 week)
- [ ] Legal document page views tracked
- [ ] Signup completion rate with legal agreement > 90%
- [ ] Zero legal compliance issues reported

## 📊 Analytics & Tracking

### Events to Track
- Privacy Policy page views
- Terms of Service page views
- Legal document engagement (scroll depth, time on page)
- Signup attempts without legal agreement
- Successful signups with legal agreement

### Compliance Metrics
- Legal agreement acceptance rate
- Legal document update notification success
- User data deletion request handling time

## 🔗 Dependencies & Risks

### Dependencies
- Legal review and approval of documents
- Company legal entity establishment
- Contact information and addresses

### Risks & Mitigation
- **Risk:** Legal documents not legally adequate
  - **Mitigation:** Professional legal review before launch

- **Risk:** GDPR/privacy law compliance gaps
  - **Mitigation:** Consult with privacy law expert

- **Risk:** User confusion with legal requirements
  - **Mitigation:** Clear, simple language and good UX design

## 📋 Definition of Done

- [ ] All user stories meet acceptance criteria
- [ ] Privacy Policy and Terms of Service are comprehensive and clear
- [ ] Signup form requires and enforces legal agreement
- [ ] Legal documents accessible from all pages via footer
- [ ] Database tracks legal agreement timestamps
- [ ] Legal documents reviewed by legal counsel
- [ ] Mobile responsive design implemented
- [ ] All links and forms tested and functional
- [ ] Analytics tracking implemented
- [ ] Documentation updated
