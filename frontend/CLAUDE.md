# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**StoryWriter Frontend** is a React 19 application built with TypeScript and Vite. It provides a rich user interface for creating, editing, and managing story scenarios with AI integration. The app features role-based access control, a custom component library, and sophisticated state management.

## Architecture

### Technology Stack
- **React 19** with TypeScript
- **Vite** as build tool and dev server
- **React Router v6** for client-side routing
- **Axios** for HTTP requests with proxy to backend (`/api/*`)
- **Custom UI Library** (@drdata/ai-styles) for consistent styling
- **Jest** + **React Testing Library** for unit tests
- **Playwright** for E2E testing

### Component Organization

The application follows a **role-based architecture** with clear separation of concerns:

```
src/
├── anonymous/        # Unauthenticated user components (marketing, login, signup)
├── members/          # Authenticated user components (scenarios, stories, dashboard)
├── admin/            # Admin-only components (user management, moderation)
├── shared/           # Components shared across roles (contexts, services, utilities)
└── pages/            # Legacy page components (being migrated to role-based structure)
```

### Role-Based Access Control (RBAC)

The app implements comprehensive RBAC with three main roles:
- **User**: Standard authenticated users
- **Moderator**: Content moderation privileges  
- **Admin**: Full system access

**Key RBAC Components:**
- `ProtectedRoute` - Wraps authenticated routes
- `AdminOnly` / `ModeratorOnly` - Permission gate components
- `AuthContext` - Centralized authentication and authorization state
- Route-level protection in `routes.tsx`

### State Management

**React Context Pattern:**
- `AuthContext` - Authentication state, user profile, permissions
- `AIStatusContext` - AI generation status and polling
- `SceneHoverContext` - UI interaction state

**No external state management library** is used; contexts handle global state effectively.

## Development Commands

### Core Development
```bash
# Start development server (port 3000)
npm start  # or npm run dev

# Build for production
npm run build

# Type checking
npm run typecheck

# Preview production build
npm run preview
```

### Code Quality
```bash
# Linting
npm run lint
npm run lint:fix

# Formatting
npm run prettier
npm run prettier:check
npm run format              # runs prettier + lint:fix
```

### Testing
```bash
# Unit tests (Jest)
npm test

# E2E tests (Playwright)
npm run test:playwright
npm run test:playwright:ui  # with UI

# Full E2E flow test
./scripts/e2e-flow.sh
```

## Testing Strategy

### Unit Testing (Jest + React Testing Library)
- **Configuration**: `jest.config.js` with jsdom environment
- **Location**: `__tests__/` directory
- **Pattern**: `*.test.ts?(x)` files
- **Setup**: Uses `setupTests.ts` for test configuration

### E2E Testing (Playwright)
- **Configuration**: `playwright.config.ts`
- **Test Directory**: `playwright-tests/`
- **Browsers**: Chromium, Firefox, WebKit
- **Structured Flow**: Sequential tests from signup to cleanup

**E2E Test Flow:**
1. `10-signup.spec.ts` - User registration
2. `15-login-upgrade-logout.spec.ts` - Authentication flow
3. `20-create-scenario.spec.ts` - Scenario creation
4. `30-generate-story.spec.ts` - Story generation
5. `40-publish.spec.ts` - Publishing workflow
6. `50-marketplace.spec.ts` - Marketplace interactions
7. `99-cleanup.spec.ts` - Test cleanup

### Test Authentication
- **Test User Credentials**: Located in `playwright-tests/.testuser`
- **Usage**: For E2E tests requiring authentication

## Routing Architecture

**File**: `src/routes.tsx`

### Route Categories
- **Public Routes**: Marketing pages, login, signup
- **Protected Routes**: Wrapped with `ProtectedRoute` component
- **Role-Based Routes**: Use `AdminOnly`/`ModeratorOnly` gates

### Key Route Patterns
```typescript
// Root route logic based on auth status
const MarketingHomeOrDashboard = () => {
  const { authenticated } = useAuth();
  return authenticated ? <Dashboard /> : <MarketingHome />;
};

// Protected route pattern
{
  path: '/scenarios',
  element: (
    <ProtectedRoute>
      <Scenarios />
    </ProtectedRoute>
  )
}

// Role-based protection
{
  path: '/admin',
  element: (
    <ProtectedRoute>
      <AdminOnly fallback={<AccessDenied />}>
        <AdminPanel />
      </AdminOnly>
    </ProtectedRoute>
  )
}
```

## API Integration

### HTTP Configuration
- **Base Configuration**: `src/shared/services/http.ts`
- **Proxy**: `/api/*` routes proxied to backend (localhost:5000)
- **Authentication**: JWT tokens in Authorization headers
- **Error Handling**: Centralized HTTP error handling

### Key Service Files
- `agentService.ts` - AI agent interactions
- `scenarioService.ts` - Scenario CRUD operations  
- `storyService.ts` - Story management
- `marketPlaceApi.ts` - Marketplace functionality
- `llmService.ts` - LLM configuration and management

## Build Configuration

### Vite Configuration (`vite.config.ts`)
**Key Features:**
- **Proxy Setup**: `/api` → `http://localhost:5000`
- **Port**: Development server on port 3000
- **Chunk Splitting**: Role-based code splitting
  - `anonymous-bundle` - Marketing and auth pages
  - `members-bundle` - Authenticated user features
  - `admin-bundle` - Admin functionality
  - `shared-bundle` - Shared components
- **Library Watching**: Monitors `@drdata/ai-styles` for changes

### TypeScript Configuration (`tsconfig.json`)
- **Target**: ES2020 with DOM support
- **Strict Mode**: Disabled for flexibility (`strict: false`)
- **Module Resolution**: Bundler mode for Vite compatibility
- **Includes**: `src`, `__tests__`, `playwright-tests`

### ESLint Configuration (`eslint.config.js`)
- **Flat Config Format** (ESLint 9+)
- **TypeScript Support** with `@typescript-eslint` parser
- **React Hooks** linting with `eslint-plugin-react-hooks`
- **React Refresh** support for HMR
- **Separate Configs** for source, test, and Playwright files

## Custom Component Library Integration

The app uses `@drdata/ai-styles` (local package in `../style-library/ai-styles/`)

**Key Components:**
- `ThemeProvider` - Light/dark theme management
- `AiTextBox` - Enhanced text inputs
- `AiStoryReader` - Story display component
- `IconButton` - Consistent button styling
- `Dialog` - Modal dialogs

**Import Pattern:**
```typescript
import { ThemeProvider, AiTextBox } from '@drdata/ai-styles';
```

## Development Notes

### Server Management
- **Frontend Dev Server**: Typically running on localhost:3000
- **Backend API**: Expected to be running on localhost:5000
- **Do NOT start/stop servers** without explicit user permission

### Code Style
- **TypeScript**: Permissive settings for rapid development
- **React 19 Features**: Uses latest React APIs and patterns
- **ESLint**: Configured for React and TypeScript best practices
- **Prettier**: Automatic code formatting

### Common Development Patterns
1. **Context Usage**: Import contexts via custom hooks (`useAuth()`)
2. **Route Protection**: Always wrap authenticated routes with `ProtectedRoute`
3. **Error Handling**: Use centralized error handling in HTTP layer
4. **Component Structure**: Follow role-based organization
5. **Testing**: Write unit tests for complex components, E2E tests for user flows

## Important Files and Directories

- `src/App.tsx` - Root application component with providers
- `src/routes.tsx` - Complete routing configuration
- `src/shared/contexts/` - Global state management
- `src/shared/services/` - API integration services  
- `playwright-tests/` - E2E test suite
- `scripts/e2e-flow.sh` - Complete user flow test script
- `vite.config.ts` - Build and development configuration