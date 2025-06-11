# Feature 1: Public Homepage & Core Navigation

## 📋 Overview

**Epic:** Public Launch & Monetization Strategy  
**Feature ID:** F1  
**Priority:** HIGH  
**Effort:** 5 days  
**Dependencies:** None

## 🎯 Description

Create the initial public-facing marketing page and update the application's core navigation to support anonymous and logged-in states. This feature transforms the current single-user application into a multi-user service with proper marketing presence.

## 👤 User Stories

### US1.1 - Anonymous Homepage
**As an** anonymous visitor  
**I want** to see a compelling homepage that showcases the app's features  
**So that** I can understand the value proposition and decide to sign up

**Acceptance Criteria:**
- [ ] Homepage displays clear value proposition for StoryWriter
- [ ] Features overview section explaining AI-powered story generation
- [ ] User tier comparison table (Free, BYOK, Premium)
- [ ] Prominent "Sign Up" and "Login" call-to-action buttons
- [ ] Professional, modern design that builds trust
- [ ] Responsive design for mobile and desktop

### US1.2 - Dynamic Navigation
**As a** user (anonymous or authenticated)  
**I want** the navigation bar to adapt based on my login status  
**So that** I see relevant options for my current state

**Acceptance Criteria:**
- [ ] Anonymous users see: "Features", "Pricing", "Login", "Sign Up"
- [ ] Logged-in users see: user avatar/email, "Dashboard", "Logout"
- [ ] Smooth transition between states without page reload
- [ ] Logo always links to appropriate home page (marketing vs app)

### US1.3 - Integrated Authentication Flow
**As a** visitor  
**I want** to seamlessly move between marketing pages and authentication  
**So that** the experience feels cohesive and professional

**Acceptance Criteria:**
- [ ] Login/signup flows integrate with new navigation structure
- [ ] Post-login redirect goes to user dashboard (not old Home)
- [ ] Post-logout redirect goes to marketing homepage
- [ ] Breadcrumb or clear navigation context maintained

## 🔧 Technical Implementation

### Current State Analysis
The current application has:
- **TopBar component** (`/frontend/src/components/TopBar/TopBar.tsx`) with basic auth dropdown
- **Login page** (`/frontend/src/pages/Login.tsx`) with simple form
- **Home page** (`/frontend/src/pages/Home.tsx`) that goes directly to ScenarioWriter
- **Protected routes** via `ProtectedRoute.tsx`

### Required Changes

#### 1. New Marketing Homepage Component
**File:** `/frontend/src/pages/MarketingHome.tsx`

```tsx
// New marketing homepage component
interface MarketingHomeProps {}

const MarketingHome: React.FC<MarketingHomeProps> = () => {
  return (
    <div className="marketing-home">
      <HeroSection />
      <FeaturesSection />
      <PricingSection />
      <CTASection />
    </div>
  );
};
```

#### 2. Enhanced TopBar Component
**File:** `/frontend/src/components/TopBar/TopBar.tsx` (modify existing)

```tsx
// Enhanced navigation with anonymous/authenticated states
const TopBar: React.FC = () => {
  const { authenticated, username } = useAuth();
  const location = useLocation();
  const isMarketingPage = location.pathname === '/' && !authenticated;

  return (
    <header className="topbar">
      <nav className="topbar-nav">
        <Link to={authenticated ? "/dashboard" : "/"}>
          <img src="/storywriter-logo-48.png" alt="StoryWriter" />
          {!isMarketingPage && <span>StoryWriter</span>}
        </Link>
      </nav>
      
      {/* Dynamic navigation based on auth state */}
      <div className="topbar-right">
        {authenticated ? (
          <AuthenticatedNav username={username} />
        ) : (
          <AnonymousNav />
        )}
      </div>
    </header>
  );
};
```

#### 3. Updated Routing Structure
**File:** `/frontend/src/routes.tsx` (modify existing)

```tsx
const getRoutes = ({ setIsLoading, seed }: RoutesProps): RouteObject[] => {
  return [
    { 
      path: '/', 
      element: <MarketingHomeOrDashboard setIsLoading={setIsLoading} seed={seed} />
    },
    { 
      path: '/dashboard', 
      element: (
        <ProtectedRoute>
          <UserDashboard setIsLoading={setIsLoading} seed={seed} />
        </ProtectedRoute>
      )
    },
    { 
      path: '/app', 
      element: (
        <ProtectedRoute>
          <Home setIsLoading={setIsLoading} seed={seed} />
        </ProtectedRoute>
      )
    },
    { path: '/features', element: <FeaturesPage /> },
    { path: '/pricing', element: <PricingPage /> },
    { path: '/login', element: <Login /> },
    { path: '/signup', element: <SignUp /> },
    // ... existing routes
  ];
};
```

#### 4. New Components Needed

**MarketingHome sections:**
- `HeroSection.tsx` - Main value proposition banner
- `FeaturesSection.tsx` - Feature highlights with icons
- `PricingSection.tsx` - Tier comparison table
- `CTASection.tsx` - Final call-to-action

**Navigation components:**
- `AnonymousNav.tsx` - Navigation for non-authenticated users
- `AuthenticatedNav.tsx` - Navigation for logged-in users

### Database Schema Extensions
No immediate database changes required for this feature.

## 🎨 UX Design Mockups

### Anonymous Homepage Layout
```
┌─────────────────────────────────────────────────────────────┐
│ [🏠 StoryWriter]              [Features] [Pricing] [Login] [Sign Up] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│           🚀 HERO SECTION                                   │
│   "Transform Your Ideas into Compelling Stories"           │
│   "AI-powered narrative generation for writers"            │
│                                                             │
│           [Get Started Free] [See Demo]                     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│           ✨ FEATURES SECTION                               │
│   [🤖 AI Writer] [📝 Scenarios] [⚡ Fast Gen]               │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│           💰 PRICING TIERS                                  │
│   ┌─────────┐ ┌─────────┐ ┌─────────┐                       │
│   │  FREE   │ │  BYOK   │ │ PREMIUM │                       │
│   │ $0/mo   │ │ $0/mo   │ │ Credits │                       │
│   │Limited  │ │Own Key  │ │Full Acc │                       │
│   └─────────┘ └─────────┘ └─────────┘                       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│           [Start Writing Today - It's Free!]               │
└─────────────────────────────────────────────────────────────┘
```

### Authenticated TopBar
```
┌─────────────────────────────────────────────────────────────┐
│ [🏠 StoryWriter]     [Dashboard] [Stories]      [👤 John] ▼ │
│                                                  ┌─────────┐ │
│                                                  │Dashboard│ │
│                                                  │Settings │ │
│                                                  │Logout   │ │
│                                                  └─────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Features Page Wireframe
```
┌─────────────────────────────────────────────────────────────┐
│                    🔧 FEATURES OVERVIEW                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   🤖 AI-Powered Story Generation                           │
│   Generate compelling narratives from simple prompts       │
│                                                             │
│   📝 Scenario Management                                   │
│   Create and manage complex story scenarios                │
│                                                             │
│   ⚡ Multiple AI Backends                                  │
│   LM Studio, Ollama, OpenAI integration                   │
│                                                             │
│   💾 Story Persistence                                     │
│   Save, version, and manage your stories                  │
│                                                             │
│   🎛️ Advanced Controls                                    │
│   Temperature, seed, model selection                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 📝 Implementation Tasks

### Phase 1: Core Structure (2 days)
- [ ] Create `MarketingHome.tsx` component
- [ ] Update routing to support marketing vs app states
- [ ] Do not use `TopBar.tsx` for dynamic navigation
- [ ] Create `AnonymousNav` and `AuthenticatedNav` components

### Phase 2: Marketing Content (2 days)
- [ ] Design and implement `HeroSection.tsx`
- [ ] Create `FeaturesSection.tsx` with feature highlights
- [ ] Build `PricingSection.tsx` with tier comparison
- [ ] Implement `CTASection.tsx`
- [ ] Add responsive CSS for all sections

### Phase 3: Integration & Polish (1 day)
- [ ] Update authentication flow redirects
- [ ] Add smooth transitions between states
- [ ] Implement breadcrumb navigation
- [ ] Manually test all user flows
- [ ] Polish CSS and responsive design

## 🧪 Testing Strategy

### Manual Testing Scenarios
1. **Anonymous visitor journey:**
   - Visit homepage → see marketing content
   - Click "Features" → see features page
   - Click "Pricing" → see pricing page
   - Click "Login" → go to login form
   - Click "Sign Up" → go to signup form

2. **Authentication flow:**
   - Sign up from homepage → redirect to dashboard
   - Login from marketing page → redirect to dashboard
   - Logout from app → redirect to marketing homepage

3. **Responsive testing:**
   - Test on mobile (320px width)
   - Test on tablet (768px width)
   - Test on desktop (1200px+ width)

### Automated Testing
- [ ] Add tests for route transitions
- [ ] Test TopBar state changes
- [ ] Verify protected route behavior

## 🚀 Success Metrics

### Immediate (Launch)
- [ ] Homepage loads in < 2 seconds
- [ ] Navigation works seamlessly
- [ ] All responsive breakpoints function
- [ ] Authentication flows work correctly

### Post-Launch (1 week)
- [ ] Bounce rate < 60% on homepage
- [ ] Sign-up conversion rate > 5%
- [ ] Zero navigation-related user reports

## 📊 Analytics & Tracking

### Events to Track
- Homepage visit (anonymous)
- Feature page visit
- Pricing page visit  
- Sign-up button clicks
- Login button clicks
- Successful registrations
- User session duration

### Conversion Funnel
1. Anonymous homepage visit
2. Feature/pricing page engagement
3. Sign-up form interaction
4. Successful account creation
5. First story generation

## 🔗 Dependencies & Risks

### Dependencies
- Design assets (logo, icons, images)
- Copy/content for marketing pages
- No backend changes required initially

### Risks & Mitigation
- **Risk:** Marketing content not compelling
  - **Mitigation:** A/B test different headlines and CTAs

- **Risk:** Navigation confusion for existing users
  - **Mitigation:** Clear migration guide and preserved URLs

- **Risk:** Mobile responsiveness issues
  - **Mitigation:** Mobile-first design approach

## 📋 Definition of Done

- [ ] All user stories meet acceptance criteria
- [ ] Marketing homepage is live and functional
- [ ] Navigation adapts correctly to auth state
- [ ] All responsive breakpoints work
- [ ] Authentication flows redirect appropriately
- [ ] Code is reviewed and tested
- [ ] Documentation is updated
- [ ] Analytics tracking is implemented
