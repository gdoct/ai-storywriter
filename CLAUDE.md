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
- **Backend**: FastAPI, SQLAlchemy, JWT authentication, Pydantic validation, LangGraph agents
- **Database**: SQLite (with PostgreSQL support via SQLAlchemy)
- **Testing**: Jest (frontend), Playwright (E2E), pytest (backend)
- **UI Library**: Custom @drdata/ai-styles component library
- **AI Integration**: OpenAI-compatible APIs (LM Studio, Ollama), LangGraph multi-agent workflows

## TESTING and AUTHENTICATION
if authentication is needed, use these credentials
* frontend/playwright-tests/.testuser
for a regular user that was created with the playwright test
the file .env in the root of the solution may contain a bearer token with more access to the site.

## Common Development Commands

### Root Level Commands
```bash
# Build frontend and install backend dependencies
npm run build

# Type checking
npm run typecheck
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

## Component-Specific Documentation

For detailed information about each component of the system, see:
- **Frontend**: `frontend/CLAUDE.md` - React application architecture, routing, testing, component organization
- **Backend**: `backend/CLAUDE.md` - FastAPI structure, LangGraph agents, authentication, database models
- **Style Library**: `style-library/ai-styles/` - Custom component library with theme system and Storybook documentation

## High-Level Architecture Overview

### Frontend (React 19 + TypeScript)
- Role-based component organization (anonymous/members/admin/shared)
- React Router v6 with comprehensive RBAC
- Context-based state management (AuthContext, AIStatusContext)
- Custom @drdata/ai-styles component library integration

### Backend (FastAPI + LangGraph)
- Feature-based router organization with 15+ specialized endpoints
- SQLAlchemy ORM with comprehensive role-based access control
- Advanced LangGraph multi-agent system for AI scenario generation
- Multi-provider AI integration (LM Studio, Ollama, OpenAI-compatible)

### Database & Authentication
- SQLite with PostgreSQL support via SQLAlchemy
- JWT-based authentication with 365-day token expiration
- Comprehensive RBAC (user/moderator/admin roles)
- Credit transaction system with audit trails

## Development Workflow

### Running the Full Stack
1. Install dependencies: `cd frontend && npm install && cd ../backend && pip install -r requirements.txt`

**IMPORTANT**: The user typically has both frontend and backend development servers running in separate terminal windows:
- **Backend server**: Running on port 5000 via `python app.py` or `uvicorn app:app --host 0.0.0.0 --port 5000 --reload`
- **Frontend server**: Running on port 3000 via `npm start` or `npm run dev`

**DO NOT** start or restart these servers without explicit user permission. Always ask the user first if you need to modify or restart development servers.

Additional testing and development:
- To test a full e2e flow, run the playwright tests with `cd frontend && ./scripts/e2e-flow.sh`
- The user can run the Storybook server to view and test components: `cd style-library/storybook && npm run dev`

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

## AI Integration Overview

The application features a sophisticated multi-layered AI integration system:

- **LangGraph Multi-Agent System**: Advanced stateful workflows with specialized nodes for scenario creation, modification, and conversation (see `backend/CLAUDE.md` for details)
- **Real-time Streaming**: Token-by-token response delivery with status updates
- **Multi-Provider Support**: LM Studio, Ollama, and OpenAI-compatible APIs without requiring API keys
- **Centralized Management**: LLM proxy controller for unified AI communication

For detailed AI integration architecture, see `backend/CLAUDE.md`.

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