# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**StoryWriter Backend** is a FastAPI-based REST API that powers the StoryWriter application. It features sophisticated AI integration with LangGraph agents, comprehensive role-based access control, and OpenAI-compatible API support for local AI models.

## Architecture

### Technology Stack
- **FastAPI** - Modern, fast web framework for building APIs
- **SQLAlchemy** - ORM with SQLite (PostgreSQL support)
- **LangGraph** - Advanced multi-agent AI workflows
- **JWT Authentication** - Token-based authentication with 365-day expiration
- **Pydantic** - Request/response validation and serialization
- **Uvicorn** - ASGI server for development and production

### Core Components

```
backend/
├── app.py                 # FastAPI application entry point
├── routers/               # Feature-based API endpoints
├── models/                # Pydantic request/response models
├── data/                  # Database layer (SQLAlchemy models, repositories)
├── services/              # Business logic services
├── middleware/            # Authentication and authorization
├── llm_services/          # AI provider integrations
├── scenario_agent/        # LangGraph multi-agent system
└── dependencies/          # FastAPI dependency injection
```

## Development Commands

### Core Development
```bash
# Install dependencies
pip install -r requirements.txt

# Start FastAPI development server
python app.py

# Alternative: using uvicorn directly
uvicorn app:app --host 0.0.0.0 --port 5000 --reload

# Run tests
pytest

# Run specific test file
pytest tests/test_llm_services.py

# Run tests with coverage
pytest --cov=. --cov-report=html
```

### Database Operations
```bash
# Initialize database (creates tables)
python -c "from data.db import init_db; init_db()"

# Run database migration scripts
python data/scripts/migration_*.py

# Check database schema
python data/scripts/check_schema.py

# Recreate database (DESTRUCTIVE)
python data/scripts/recreate_db.py
```

### Utility Scripts
```bash
# Create admin user and get token
python get_admin_token.py

# Initialize roles in database  
python init_roles.py

# Add credits to user account
./add_credits.sh <user_id> <amount>

# Export database
python export_database.py
```

## API Structure

### Router Organization
The API is organized into feature-based routers, each handling a specific domain:

- **`auth.py`** - User authentication, registration, JWT token management
- **`scenario.py`** - Scenario CRUD operations, sharing, copying
- **`chat.py`** - AI chat interactions for scenario discussions
- **`agent.py`** - Basic AI agent endpoints for simple operations
- **`streaming_agent.py`** - Advanced LangGraph multi-agent system with real-time streaming
- **`llm_proxy.py`** - AI model communication and configuration
- **`marketplace.py`** - Story marketplace, publishing, ratings
- **`dashboard.py`** - User analytics, statistics, recent activity
- **`payment.py`** - Credit packages, transactions, billing
- **`moderation.py`** - Content moderation, user reports, admin tools
- **`role.py`** - User role assignment and management
- **`settings.py`** - LLM configuration and application settings
- **`user_settings.py`** - User preferences and profile management
- **`image.py`** - General image handling and processing
- **`character_photo.py`** - Character photo uploads and management
- **`scenario_image.py`** - Scenario cover image management

### API Documentation
- **Interactive Docs**: `http://localhost:5000/api/docs` (Swagger UI)
- **Alternative Docs**: `http://localhost:5000/api/redoc` (ReDoc)
- **OpenAPI Spec**: Auto-generated from FastAPI decorators and Pydantic models

## Database Architecture

### Database Models (`data/db_models.py`)

**Core Entity Models:**
- **`User`** - User accounts with authentication data
- **`Scenario`** - Story scenarios with JSON content
- **`Story`** - Generated stories linked to scenarios
- **`MarketStory`** - Published stories in marketplace

**Role-Based Access Control:**
- **`UserRole`** - Role assignments with audit trail
- **`Role`** - Role definitions with permissions
- **Roles**: `user` (default), `moderator`, `admin`

**Credit System:**
- **`CreditTransaction`** - All credit movements with audit trail
- **`CreditPackage`** - Available credit packages for purchase

**AI Configuration:**
- **`Policy`** - LLM configuration policies
- **`PolicySet`** - Collections of policies
- **`AppActivePolicy`** - Currently active system configuration
- **`LLMProviderPreset`** - AI provider configurations
- **`LLMAdminKey`** - Encrypted API keys for AI providers

**User Management:**
- **`UserPreference`** - User-specific settings and preferences

### Repository Pattern (`data/repositories.py`)
Centralized data access layer with methods for:
- User management and authentication
- Scenario and story operations
- Credit transactions and balance tracking
- Role and permission management
- Marketplace operations

## Authentication & Authorization

### JWT Configuration
- **Secret Key**: Configured via `JWT_SECRET_KEY` environment variable
- **Token Expiration**: 365 days (configured for long-lived sessions)
- **Algorithm**: HS256
- **Header Format**: `Authorization: Bearer <token>`

### Role-Based Access Control (RBAC)

**Roles and Permissions** (`services/role_manager.py`):
```python
ROLE_PERMISSIONS = {
    'moderator': [
        'moderate_content', 'remove_stories', 'suspend_users',
        'view_moderation_logs', 'manage_user_reports'
    ],
    'admin': [
        # All moderator permissions plus:
        'manage_users', 'configure_ai_backends', 'manage_system_settings',
        'view_analytics', 'manage_database', 'create_announcements', 'assign_roles'
    ]
}
```

**Authentication Flow**:
1. User provides credentials to `/api/auth/login`
2. System validates and returns JWT token
3. Client includes token in `Authorization` header
4. `verify_token` middleware validates JWT and loads user + roles
5. Route-level decorators check permissions

### FastAPI Dependencies (`middleware/fastapi_auth.py`)
- `verify_token()` - Basic authentication verification
- `get_current_user()` - Returns authenticated user with roles
- `require_role()` - Decorator for role-based route protection

## LangGraph Agent System

### Agent Architecture (`scenario_agent/`)

The backend features a sophisticated multi-agent system built with LangGraph for intelligent scenario creation and modification.

**Core Components:**
- **`AgentState`** - Stateful conversation context and scenario data
- **`StateGraph`** - Workflow orchestration with specialized nodes
- **Streaming Support** - Real-time token-by-token response streaming

**Agent Nodes** (`scenario_agent/nodes/`):
- **`supervisor_node`** - Central orchestration and routing
- **`input_classification_node`** - Intent analysis and categorization
- **`creation_node`** - New scenario creation from user prompts
- **`modification_node`** - Existing scenario modifications
- **`details_node`** - Scenario explanations and summaries
- **`conversation_node`** - General chat and discussion
- **`wrap_up_node`** - Conclusion with follow-up suggestions

**Specialized Operations**:
- **Character Management**: `create_character_node`, `modify_character_node`
- **Location Management**: `create_location_node`, `modify_location_node`
- **Story Elements**: `modify_backstory_node`, `modify_storyarc_node`
- **Multi-Operations**: `multi_operation_node` for complex combined actions

**Agent Tools** (`scenario_agent/tools/`):
- `classify_input.py` - User intent classification
- `create_scenario.py` - New scenario generation
- `modify_scenario.py` - Scenario modification operations
- `generic_chat.py` - General conversation handling
- `generate_followup_questions.py` - Contextual follow-up generation

### Streaming Implementation
- **Real-time Responses**: Token-by-token streaming via FastAPI `StreamingResponse`
- **Status Updates**: Progress notifications during agent execution
- **Error Handling**: Graceful error recovery with user feedback

## AI Integration

### LLM Services (`llm_services/`)

**Provider Support:**
- **`lmstudio_service.py`** - Local LM Studio integration
- **`ollama_service.py`** - Local Ollama integration  
- **`openai_service.py`** - OpenAI-compatible API support
- **`github_service.py`** - GitHub integration for AI features
- **`model_cache.py`** - Model response caching

### LLM Proxy (`routers/llm_proxy.py`)
Centralized AI communication layer that:
- Routes requests to appropriate providers
- Handles authentication and API keys
- Provides consistent interface across different AI backends
- Manages rate limiting and error handling

### Configuration Management
- **Policy-Based Config**: Dynamic LLM settings via database policies
- **Provider Presets**: Pre-configured AI provider settings
- **Admin Override**: Administrative control over AI configurations

## Testing

### Test Structure (`tests/`)
- **`test_llm_services.py`** - AI provider integration tests
- **`test_settings_controller.py`** - Configuration management tests
- **`test_llm_proxy_controller.py`** - LLM proxy functionality tests
- **`conftest.py`** - Pytest configuration and fixtures

### Mock Services (`tests/mocks/`)
- **`mock_lmstudio.py`** - LM Studio service mocking
- **`mock_ollama.py`** - Ollama service mocking
- **`mock_openai.py`** - OpenAI API mocking

### Test Commands
```bash
# Run all tests
pytest

# Run with verbose output
pytest -v

# Run specific test category
pytest tests/test_llm_services.py -v

# Generate coverage report
pytest --cov=. --cov-report=html
```

## Development Notes

### Server Management
- **Backend Server**: Typically running on localhost:5000
- **Auto-reload**: Enabled in development mode with `--reload` flag
- **Do NOT start/stop servers** without explicit user permission

### Environment Configuration
- **`.env` File**: Create from `env.default` template
- **Required Variables**:
  ```bash
  JWT_SECRET_KEY=<secure-random-key>
  ```

### Database Migrations
- **Location**: `backend/migrations/`
- **Manual Migrations**: SQL files for schema changes
- **Python Migrations**: Complex data transformations

### Code Organization Patterns
1. **Router Pattern**: Feature-based endpoint grouping
2. **Repository Pattern**: Centralized data access
3. **Service Layer**: Business logic separation
4. **Dependency Injection**: FastAPI dependencies for auth/db
5. **Pydantic Models**: Request/response validation

### AI Integration Patterns
1. **Provider Abstraction**: Unified interface across AI backends
2. **Streaming Support**: Real-time response delivery
3. **Error Handling**: Graceful degradation when AI services unavailable
4. **Configuration Management**: Dynamic AI settings via database

### Common Development Tasks

**Adding New Router:**
1. Create router file in `routers/`
2. Define Pydantic models in `models/`
3. Add database operations to repositories
4. Include router in `app.py`
5. Add authentication dependencies as needed

**Adding New AI Provider:**
1. Create service file in `llm_services/`
2. Implement standardized interface methods
3. Add provider configuration to database
4. Update `llm_proxy.py` routing logic
5. Add tests in `tests/mocks/`

**Database Schema Changes:**
1. Create migration script in `migrations/`
2. Update SQLAlchemy models in `data/db_models.py`
3. Add repository methods if needed
4. Test migration on development database
5. Document changes in migration script

## Important Files and Directories

- `app.py` - FastAPI application setup and router registration
- `data/db_models.py` - SQLAlchemy database models
- `data/repositories.py` - Data access layer
- `middleware/fastapi_auth.py` - Authentication and authorization
- `services/role_manager.py` - RBAC implementation
- `scenario_agent/graph.py` - LangGraph agent workflow
- `llm_services/` - AI provider integrations
- `routers/` - API endpoint implementations
- `requirements.txt` - Python dependencies