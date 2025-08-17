# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**StoryWriter** is a web application for creating, editing, and managing scenarios that can be sent to AI models to generate engaging stories. The app features a React frontend with TypeScript and a FastAPI backend with Python, along with a custom React component library.

## Architecture

### Monorepo Structure
- `frontend/` - React/TypeScript frontend application (Vite + React 19)
- `backend/` - Python/FastAPI REST API backend
- `style-library/` - Custom React component library (@drdata/ai-styles)
  - `ai-styles/` - Core component library package
  - `storybook/` - Component documentation and demos
  - `tests/` - Shared testing infrastructure

### Key Technologies
- **Frontend**: React 19, TypeScript, Vite, React Router v6, Axios
- **Backend**: FastAPI, SQLAlchemy, JWT authentication, Pydantic validation
- **Database**: SQLite (with PostgreSQL support via SQLAlchemy)
- **Testing**: Jest (frontend), Playwright (E2E), pytest (backend)
- **UI Library**: Custom @drdata/ai-styles component library
- **AI Integration**: OpenAI-compatible APIs (LM Studio, Ollama)

## TESTING and AUTHENTICATION
if authentication is needed, use these credentials
* frontend/playwright-tests/.testuser
for a regular user that was created with the playwright test

## Common Development Commands

### Root Level Commands
```bash
# Build frontend and install backend dependencies
npm run build

# Start frontend in development mode
npm run dev:frontend

# Start backend in development mode  
npm run dev:backend

# Start both frontend and backend concurrently
npm run dev

# Type checking
npm run typecheck
```

### Frontend Commands (in frontend/)
```bash
# Development server
npm start  # or npm run dev

# Build for production
npm run build

# Type checking
npm run typecheck

# Linting and formatting
npm run lint
npm run lint:fix
npm run prettier
npm run format

# Testing
npm test                    # Jest unit tests
npm run test:playwright     # Playwright E2E tests
npm run test:playwright:ui  # Playwright with UI
```

### Backend Commands (in backend/)
```bash
# Install dependencies
pip install -r requirements.txt

# Start FastAPI development server
python app.py

# Alternative: using uvicorn directly
uvicorn app:app --host 0.0.0.0 --port 5000 --reload

# Run tests
pytest
```

### Style Library Commands (in style-library/ai-styles/)
```bash
# Build component library
npm run build

# Development mode
npm start

# Testing
npm test

# Linting
npm run lint
```

### Storybook Commands (in style-library/storybook/)
```bash
# Start Storybook development server
npm run dev

# Build Storybook
npm run build
```

## Project-Specific Architecture Details

### Frontend Application Structure
- **Route Management**: React Router v6 with role-based access control
- **State Management**: React Context (AuthContext, AIStatusContext)
- **Component Organization**: Feature-based folders under `src/components/`
- **API Communication**: Axios with proxy to backend at `/api/*`
- **Authentication**: JWT tokens with role-based permissions (admin, moderator, user)

### Backend API Structure
- **Router Organization**: Feature-based routers in `routers/` directory
- **Database**: SQLAlchemy ORM with SQLite default, PostgreSQL support
- **Authentication**: JWT with FastAPI dependency injection and role-based access control
- **Validation**: Pydantic models for request/response type safety
- **Documentation**: Automatic OpenAPI/Swagger docs at `/api/docs`
- **AI Integration**: Router for LLM services (OpenAI-compatible APIs)

### Key Backend Routers
- `auth` - User authentication and registration
- `scenario` - Scenario CRUD operations
- `chat` - AI chat interactions
- `marketplace` - Story marketplace features
- `settings` - LLM and application settings
- `dashboard` - User dashboard and analytics
- `payment` - Credit packages and transactions
- `moderation` - Content moderation tools
- `role` - Role and user management
- `llm_proxy` - AI model communication

### Database Models (SQLAlchemy)
- Credit transaction system with usage tracking
- Policy-based configuration management
- User roles and permissions (admin, moderator, user)
- Story and scenario management

### Custom Component Library (@drdata/ai-styles)
- **Theme System**: Dark/light theme support with ThemeProvider
- **Component Architecture**: Modular components with CSS modules
- **Key Components**: AiTextBox, IconButton, AiStoryReader, Dialog, etc.
- **Testing**: Jest with React Testing Library
- **Documentation**: Storybook for component demos

## Development Workflow

### Running the Full Stack
1. Install dependencies: `cd frontend && npm install && cd ../backend && pip install -r requirements.txt`
2. The user is always running the backend server in a terminal window. Ask the user for feedback if required, and do not attempt to start the backend server.
3. The user is always running the frontend server in a terminal window. Ask the user for feedback if required, and do not attempt to start the frontend server.
To test a full e2e flow, run the playwright tests with
 `cd frontend && ./scripts/e2e-flow.sh`
4. The user can run the Storybook server to view and test components: `cd style-library/storybook && npm run dev`

### Testing Strategy
- **Frontend Unit Tests**: Jest with React Testing Library
- **E2E Tests**: Playwright tests in `frontend/playwright-tests/`
- **Backend Tests**: pytest in `backend/tests/`
- **Component Library Tests**: Jest tests in `style-library/ai-styles/`

### Code Quality Tools
- **TypeScript**: Strict mode enabled with comprehensive type checking
- **ESLint**: React and TypeScript rules configured
- **Prettier**: Automatic code formatting
- **Git Hooks**: Pre-commit formatting and linting

## AI Integration

The application connects to OpenAI-compatible APIs without requiring API keys, designed for local AI models like:
- **LM Studio**: Local OpenAI-compatible server
- **Ollama**: Local model hosting
- **Custom OpenAI-compatible endpoints**

API communication flows through the `llm_proxy` controller for centralized model management.

## Authentication & Authorization

- **JWT-based authentication** with long-lived tokens (365 days)
- **Role-based access control**: admin, moderator, user roles
- **Protected routes** with React components for permission gating
- **User registration/login** with credit system integration

## Deployment Notes

- Frontend builds to `frontend/build/` directory
- Backend serves frontend static files and provides `/api/*` endpoints
- SQLite database with migration scripts in `backend/migrations/`
- Environment configuration via `.env` files (see `env.default`)