# Feature 5: Backend Architecture for Multi-Tier Logic

## 📋 Overview

**Epic:** Public Launch & Monetization Strategy  
**Feature ID:** F5  
**Priority:** HIGH  
**Effort:** 5 days  
**Dependencies:** F1, F2, F3, F4 (All previous features for complete system)

## 🎯 Description

Refactor the backend to handle requests from different user tiers, apply the correct logic, and manage data securely. This feature implements the core business logic that differentiates between Free, BYOK, and Premium users in AI request processing.

## 👤 User Stories

### US5.1 - Database Schema Extension
**As a** system administrator  
**I need** the database to support user tiers, credits, and API keys  
**So that** the system can properly track and manage user accounts

**Acceptance Criteria:**
- [ ] Users table extended with tier, credits, and encrypted API key fields
- [ ] Credit usage tracking table created
- [ ] Database migration scripts provided
- [ ] Proper indexes for performance
- [ ] Data integrity constraints enforced

### US5.2 - Authentication Middleware
**As a** system  
**I need** middleware that identifies user tier on every AI request  
**So that** the correct logic can be applied

**Acceptance Criteria:**
- [ ] JWT token validation and user lookup
- [ ] User tier determination from database
- [ ] Request context enrichment with user profile
- [ ] Proper error handling for invalid tokens
- [ ] Performance optimization for frequent lookups

### US5.3 - Free Tier Rate Limiting
**As a** Free tier user  
**I expect** strict rate limits to be enforced  
**So that** the service remains sustainable

**Acceptance Criteria:**
- [ ] Daily generation limit enforced (e.g., 10 stories/day)
- [ ] Rate limit tracking per user
- [ ] Clear error messages when limits exceeded
- [ ] Rate limit reset at midnight UTC
- [ ] Different limits for different AI features

### US5.4 - BYOK API Key Management
**As a** BYOK user  
**I want** my API key to be used for AI requests  
**So that** I can use my own AI provider account

**Acceptance Criteria:**
- [ ] API keys stored encrypted at rest
- [ ] API key retrieval and decryption for requests
- [ ] Support for multiple AI providers (OpenAI, Anthropic)
- [ ] Graceful handling of invalid/expired API keys
- [ ] API key validation before first use

### US5.5 - Premium Credit Management
**As a** Premium user  
**I expect** credits to be deducted accurately for each AI request  
**So that** I'm charged fairly for usage

**Acceptance Criteria:**
- [ ] Credit balance checking before requests
- [ ] Atomic credit deduction after successful generation
- [ ] Different credit costs for different AI models/features
- [ ] Credit transaction logging
- [ ] Insufficient credit error handling

### US5.6 - AI Request Router
**As a** system  
**I need** intelligent routing of AI requests based on user tier  
**So that** each user gets appropriate service

**Acceptance Criteria:**
- [ ] Route selection based on user tier
- [ ] Model selection per tier (basic vs premium models)
- [ ] Request preprocessing and validation
- [ ] Response post-processing and logging
- [ ] Error handling and fallback mechanisms

## 🔧 Technical Implementation

### Current State Analysis
The current application has:
- **LLM Proxy Controller** (`/backend/llm_services/llm_proxy_controller.py`) handling basic AI requests
- **Simple authentication** with JWT tokens
- **Basic user repository** without tier support
- **No rate limiting or credit system**
- **Direct LLM service calls** without tier-based logic

### Required Changes

#### 1. Database Schema Extensions
these schema extensions should be integrated in the database bootstrapping code in the application, ensuring that the database is ready to handle user tiers, credits, and API keys.

**File:** `/backend/data/migration_user_tiers.py`

```python
"""
Database migration to add user tier support
"""
import sqlite3
from data.db import DB_PATH

def migrate_user_tiers():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Add tier-related columns to users table
    c.execute('''
        ALTER TABLE users ADD COLUMN tier TEXT DEFAULT 'free' 
        CHECK (tier IN ('free', 'byok', 'premium'))
    ''')
    
    c.execute('''
        ALTER TABLE users ADD COLUMN credits INTEGER DEFAULT 0
    ''')
    
    c.execute('''
        ALTER TABLE users ADD COLUMN api_key_encrypted TEXT
    ''')
    
    c.execute('''
        ALTER TABLE users ADD COLUMN api_provider TEXT DEFAULT 'openai'
        CHECK (api_provider IN ('openai', 'anthropic', 'google'))
    ''')
    
    c.execute('''
        ALTER TABLE users ADD COLUMN daily_generation_count INTEGER DEFAULT 0
    ''')
    
    c.execute('''
        ALTER TABLE users ADD COLUMN last_generation_date TEXT
    ''')
    
    # Create credit usage tracking table
    c.execute('''
        CREATE TABLE IF NOT EXISTS credit_usage (
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
        )
    ''')
    
    # Create rate limiting table
    c.execute('''
        CREATE TABLE IF NOT EXISTS rate_limits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            feature TEXT NOT NULL,
            count INTEGER DEFAULT 0,
            window_start TEXT,
            FOREIGN KEY(user_id) REFERENCES users(id),
            UNIQUE(user_id, feature, window_start)
        )
    ''')
    
    # Create indexes for performance
    c.execute('CREATE INDEX IF NOT EXISTS idx_users_tier ON users(tier)')
    c.execute('CREATE INDEX IF NOT EXISTS idx_credit_usage_user_id ON credit_usage(user_id)')
    c.execute('CREATE INDEX IF NOT EXISTS idx_rate_limits_user_feature ON rate_limits(user_id, feature)')
    
    conn.commit()
    conn.close()
    print("User tier migration completed successfully")

if __name__ == "__main__":
    migrate_user_tiers()
```

#### 2. Enhanced User Repository
**File:** `/backend/data/repositories.py` (extend existing)

```python
import hashlib
from cryptography.fernet import Fernet
import os
from datetime import datetime, date

class UserRepository:
    # ... existing methods ...
    
    @staticmethod
    def get_user_profile(user_id):
        """Get complete user profile including tier information"""
        conn = get_db_connection()
        user = conn.execute(
            'SELECT * FROM users WHERE id = ? AND is_deleted = 0', 
            (user_id,)
        ).fetchone()
        conn.close()
        return user
    
    @staticmethod
    def update_user_tier(user_id, tier):
        """Update user's tier"""
        conn = get_db_connection()
        conn.execute(
            'UPDATE users SET tier = ? WHERE id = ?', 
            (tier, user_id)
        )
        conn.commit()
        conn.close()
    
    @staticmethod
    def update_user_credits(user_id, credits):
        """Update user's credit balance"""
        conn = get_db_connection()
        conn.execute(
            'UPDATE users SET credits = ? WHERE id = ?', 
            (credits, user_id)
        )
        conn.commit()
        conn.close()
    
    @staticmethod
    def deduct_credits(user_id, amount, feature, model=None, tokens_used=None):
        """Atomically deduct credits and log usage"""
        conn = get_db_connection()
        try:
            # Get current balance
            user = conn.execute(
                'SELECT credits FROM users WHERE id = ?', 
                (user_id,)
            ).fetchone()
            
            if not user or user['credits'] < amount:
                return False, "Insufficient credits"
            
            new_balance = user['credits'] - amount
            
            # Update balance
            conn.execute(
                'UPDATE users SET credits = ? WHERE id = ?', 
                (new_balance, user_id)
            )
            
            # Log usage
            conn.execute('''
                INSERT INTO credit_usage 
                (user_id, feature, model, credits_used, credits_remaining, request_tokens, response_tokens)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (user_id, feature, model, amount, new_balance, 
                  tokens_used.get('input', 0) if tokens_used else 0,
                  tokens_used.get('output', 0) if tokens_used else 0))
            
            conn.commit()
            return True, new_balance
            
        except Exception as e:
            conn.rollback()
            return False, str(e)
        finally:
            conn.close()
    
    @staticmethod
    def encrypt_api_key(api_key):
        """Encrypt API key for storage"""
        key = os.environ.get('ENCRYPTION_KEY', Fernet.generate_key())
        fernet = Fernet(key)
        return fernet.encrypt(api_key.encode()).decode()
    
    @staticmethod
    def decrypt_api_key(encrypted_key):
        """Decrypt API key for use"""
        key = os.environ.get('ENCRYPTION_KEY')
        if not key:
            raise ValueError("Encryption key not configured")
        fernet = Fernet(key)
        return fernet.decrypt(encrypted_key.encode()).decode()
    
    @staticmethod
    def save_api_key(user_id, api_key, provider='openai'):
        """Save encrypted API key for user"""
        encrypted_key = UserRepository.encrypt_api_key(api_key)
        conn = get_db_connection()
        conn.execute(
            'UPDATE users SET api_key_encrypted = ?, api_provider = ? WHERE id = ?',
            (encrypted_key, provider, user_id)
        )
        conn.commit()
        conn.close()
    
    @staticmethod
    def get_api_key(user_id):
        """Get decrypted API key for user"""
        conn = get_db_connection()
        user = conn.execute(
            'SELECT api_key_encrypted, api_provider FROM users WHERE id = ?',
            (user_id,)
        ).fetchone()
        conn.close()
        
        if user and user['api_key_encrypted']:
            return {
                'key': UserRepository.decrypt_api_key(user['api_key_encrypted']),
                'provider': user['api_provider']
            }
        return None

class RateLimitRepository:
    @staticmethod
    def check_rate_limit(user_id, feature, limit_per_day):
        """Check if user has exceeded rate limit for feature"""
        today = date.today().isoformat()
        conn = get_db_connection()
        
        # Get or create rate limit record for today
        record = conn.execute(
            'SELECT count FROM rate_limits WHERE user_id = ? AND feature = ? AND window_start = ?',
            (user_id, feature, today)
        ).fetchone()
        
        if not record:
            # First request today
            conn.execute(
                'INSERT INTO rate_limits (user_id, feature, count, window_start) VALUES (?, ?, 1, ?)',
                (user_id, feature, today)
            )
            conn.commit()
            conn.close()
            return True, 1
        
        current_count = record['count']
        if current_count >= limit_per_day:
            conn.close()
            return False, current_count
        
        # Increment count
        new_count = current_count + 1
        conn.execute(
            'UPDATE rate_limits SET count = ? WHERE user_id = ? AND feature = ? AND window_start = ?',
            (new_count, user_id, feature, today)
        )
        conn.commit()
        conn.close()
        
        return True, new_count
```

#### 3. Tier-Based Middleware
**File:** `/backend/middleware/tier_middleware.py`

```python
from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from data.repositories import UserRepository

def tier_based_auth(allowed_tiers=None):
    """Decorator that adds user tier information to request context"""
    if allowed_tiers is None:
        allowed_tiers = ['free', 'byok', 'premium']
    
    def decorator(f):
        @wraps(f)
        @jwt_required()
        def decorated_function(*args, **kwargs):
            try:
                username = get_jwt_identity()
                user = UserRepository.get_user_by_username(username)
                
                if not user:
                    return jsonify({'error': 'User not found'}), 404
                
                user_tier = user.get('tier', 'free')
                
                if user_tier not in allowed_tiers:
                    return jsonify({
                        'error': f'This feature requires {" or ".join(allowed_tiers)} tier',
                        'current_tier': user_tier
                    }), 403
                
                # Add user context to request
                request.user_context = {
                    'user_id': user['id'],
                    'username': user['username'],
                    'tier': user_tier,
                    'credits': user.get('credits', 0),
                    'profile': user
                }
                
                return f(*args, **kwargs)
                
            except Exception as e:
                return jsonify({'error': 'Authentication failed', 'details': str(e)}), 401
        
        return decorated_function
    return decorator

def get_user_context():
    """Get user context from current request"""
    return getattr(request, 'user_context', None)
```

#### 4. Enhanced LLM Proxy Controller
**File:** `/backend/llm_services/llm_proxy_controller.py` (major refactor)

```python
from flask import Blueprint, request, jsonify, Response
from middleware.tier_middleware import tier_based_auth, get_user_context
from data.repositories import UserRepository, RateLimitRepository
from llm_services.llm_service import LLMService
from llm_services.openai_service import OpenAIService
import json

llm_proxy = Blueprint('llm_proxy', __name__)

# Tier-based rate limits (requests per day)
RATE_LIMITS = {
    'free': {
        'chat_completion': 10,
        'story_generation': 5
    },
    'byok': {
        'chat_completion': -1,  # Unlimited
        'story_generation': -1
    },
    'premium': {
        'chat_completion': -1,  # Unlimited
        'story_generation': -1
    }
}

# Credit costs per feature
CREDIT_COSTS = {
    'chat_completion': {
        'gpt-3.5-turbo': 1,
        'gpt-4': 5,
        'gpt-4-turbo': 3
    },
    'story_generation': {
        'gpt-3.5-turbo': 10,
        'gpt-4': 25,
        'gpt-4-turbo': 15
    }
}

@llm_proxy.route('/proxy/llm/v1/chat/completions', methods=['POST'])
@tier_based_auth()
def proxy_chat_completion():
    """Tier-aware chat completion proxy"""
    user_context = get_user_context()
    request_data = request.get_json()
    
    feature = 'chat_completion'
    model = request_data.get('model', 'gpt-3.5-turbo')
    
    try:
        # Apply tier-specific logic
        if user_context['tier'] == 'free':
            return handle_free_tier_request(user_context, feature, model, request_data)
        elif user_context['tier'] == 'byok':
            return handle_byok_tier_request(user_context, feature, model, request_data)
        elif user_context['tier'] == 'premium':
            return handle_premium_tier_request(user_context, feature, model, request_data)
        else:
            return jsonify({'error': 'Invalid user tier'}), 400
            
    except Exception as e:
        return jsonify({'error': 'Request processing failed', 'details': str(e)}), 500

def handle_free_tier_request(user_context, feature, model, request_data):
    """Handle request for free tier user"""
    user_id = user_context['user_id']
    rate_limit = RATE_LIMITS['free'][feature]
    
    # Check rate limit
    allowed, current_count = RateLimitRepository.check_rate_limit(user_id, feature, rate_limit)
    if not allowed:
        return jsonify({
            'error': 'Rate limit exceeded',
            'message': f'Free tier allows {rate_limit} {feature} requests per day',
            'current_usage': current_count,
            'upgrade_url': '/pricing'
        }), 429
    
    # Force basic model for free tier
    request_data['model'] = 'gpt-3.5-turbo'
    request_data['max_tokens'] = min(request_data.get('max_tokens', 500), 500)
    
    # Use application's API key
    llm_service = LLMService()
    response = llm_service.chat_completion(request_data)
    
    return jsonify(response)

def handle_byok_tier_request(user_context, feature, model, request_data):
    """Handle request for BYOK tier user"""
    user_id = user_context['user_id']
    
    # Get user's API key
    api_key_data = UserRepository.get_api_key(user_id)
    if not api_key_data:
        return jsonify({
            'error': 'API key not configured',
            'message': 'Please configure your API key in settings',
            'settings_url': '/settings'
        }), 400
    
    try:
        # Use user's API key
        if api_key_data['provider'] == 'openai':
            service = OpenAIService(api_key=api_key_data['key'])
        else:
            return jsonify({'error': f'Unsupported provider: {api_key_data["provider"]}'}), 400
        
        response = service.chat_completion(request_data)
        return jsonify(response)
        
    except Exception as e:
        if 'invalid api key' in str(e).lower():
            return jsonify({
                'error': 'Invalid API key',
                'message': 'Your API key appears to be invalid or expired',
                'settings_url': '/settings'
            }), 401
        raise e

def handle_premium_tier_request(user_context, feature, model, request_data):
    """Handle request for premium tier user"""
    user_id = user_context['user_id']
    credits = user_context['credits']
    
    # Calculate credit cost
    credit_cost = CREDIT_COSTS.get(feature, {}).get(model, 5)  # Default cost
    
    if credits < credit_cost:
        return jsonify({
            'error': 'Insufficient credits',
            'message': f'This request requires {credit_cost} credits, you have {credits}',
            'current_credits': credits,
            'buy_credits_url': '/buy-credits'
        }), 402
    
    # Use application's premium API key with premium models
    llm_service = LLMService()
    
    try:
        response = llm_service.chat_completion(request_data)
        
        # Deduct credits after successful request
        tokens_used = response.get('usage', {})
        success, new_balance = UserRepository.deduct_credits(
            user_id, credit_cost, feature, model, tokens_used
        )
        
        if not success:
            # This shouldn't happen due to pre-check, but handle it
            return jsonify({'error': 'Credit deduction failed'}), 500
        
        # Add credit info to response
        response['credits_used'] = credit_cost
        response['credits_remaining'] = new_balance
        
        return jsonify(response)
        
    except Exception as e:
        # Don't deduct credits on failure
        raise e

@llm_proxy.route('/api/user/tier-status', methods=['GET'])
@tier_based_auth()
def get_tier_status():
    """Get current user's tier status and usage"""
    user_context = get_user_context()
    user_id = user_context['user_id']
    tier = user_context['tier']
    
    status = {
        'tier': tier,
        'username': user_context['username']
    }
    
    if tier == 'free':
        # Get today's usage
        today = date.today().isoformat()
        conn = get_db_connection()
        usage = conn.execute(
            'SELECT feature, count FROM rate_limits WHERE user_id = ? AND window_start = ?',
            (user_id, today)
        ).fetchall()
        conn.close()
        
        status['daily_usage'] = {row['feature']: row['count'] for row in usage}
        status['limits'] = RATE_LIMITS['free']
        
    elif tier == 'byok':
        api_key_data = UserRepository.get_api_key(user_id)
        status['api_key_configured'] = bool(api_key_data)
        if api_key_data:
            status['api_provider'] = api_key_data['provider']
            
    elif tier == 'premium':
        status['credits'] = user_context['credits']
        
        # Get recent usage
        conn = get_db_connection()
        recent_usage = conn.execute(
            'SELECT * FROM credit_usage WHERE user_id = ? ORDER BY timestamp DESC LIMIT 10',
            (user_id,)
        ).fetchall()
        conn.close()
        
        status['recent_usage'] = [dict(row) for row in recent_usage]
    
    return jsonify(status)
```

#### 5. Configuration and Environment Setup
**File:** `/backend/.env.example`

```bash
# Existing environment variables
JWT_SECRET_KEY=your-secret-key-here

# New environment variables for tier system
ENCRYPTION_KEY=your-32-byte-base64-encryption-key-here
OPENAI_API_KEY=your-openai-api-key-for-free-and-premium-tiers
FREE_TIER_MODEL=gpt-3.5-turbo
PREMIUM_MODEL_DEFAULT=gpt-4-turbo

# Rate limiting settings
FREE_TIER_DAILY_LIMIT_CHAT=10
FREE_TIER_DAILY_LIMIT_STORY=5

# Credit costs (can be adjusted)
CREDIT_COST_CHAT_GPT35=1
CREDIT_COST_CHAT_GPT4=5
CREDIT_COST_STORY_GPT35=10
CREDIT_COST_STORY_GPT4=25
```

#### 6. Application Integration
**File:** `/backend/app.py` (update existing)

```python
# Add new imports
from middleware.tier_middleware import tier_based_auth
from controllers.payment_controller import payment_bp

# Add new blueprints
app.register_blueprint(payment_bp)

# Update existing LLM proxy registration to use new controller
app.register_blueprint(llm_proxy)

# Add environment validation
@app.before_first_request
def validate_environment():
    required_vars = ['JWT_SECRET_KEY', 'ENCRYPTION_KEY', 'OPENAI_API_KEY']
    missing = [var for var in required_vars if not os.environ.get(var)]
    if missing:
        app.logger.error(f"Missing required environment variables: {missing}")
        raise RuntimeError(f"Missing environment variables: {missing}")
```

## 🎨 UX Integration Examples

### API Response Examples

#### Free Tier Rate Limit Exceeded
```json
{
  "error": "Rate limit exceeded",
  "message": "Free tier allows 10 chat_completion requests per day",
  "current_usage": 10,
  "remaining_resets_in": "14h 23m",
  "upgrade_url": "/pricing"
}
```

#### BYOK API Key Error
```json
{
  "error": "Invalid API key",
  "message": "Your OpenAI API key appears to be invalid or expired",
  "provider": "openai",
  "settings_url": "/settings"
}
```

#### Premium Insufficient Credits
```json
{
  "error": "Insufficient credits",
  "message": "This request requires 25 credits, you have 15",
  "current_credits": 15,
  "required_credits": 25,
  "buy_credits_url": "/buy-credits"
}
```

#### Premium Successful Response
```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "choices": [...],
  "usage": {
    "prompt_tokens": 50,
    "completion_tokens": 100,
    "total_tokens": 150
  },
  "credits_used": 5,
  "credits_remaining": 1235
}
```

## 📝 Implementation Tasks

### Phase 1: Database & Core Infrastructure (2 days)
- [ ] Create database migration script for user tiers
- [ ] Extend UserRepository with tier-related methods
- [ ] Implement encryption/decryption for API keys
- [ ] Create RateLimitRepository for tracking usage
- [ ] Add environment variable validation

### Phase 2: Middleware & Authentication (1 day)
- [ ] Create tier-based authentication middleware
- [ ] Implement user context injection
- [ ] Add tier validation and error handling
- [ ] Test middleware with different user types

### Phase 3: LLM Proxy Refactoring (2 days)
- [ ] Refactor main LLM proxy controller
- [ ] Implement tier-specific request handlers
- [ ] Add rate limiting for free tier
- [ ] Implement credit deduction for premium tier
- [ ] Add BYOK API key integration
- [ ] Create tier status endpoint

### Phase 4: Integration & Testing (1 day)
- [ ] Integrate new components with existing app
- [ ] Test all tier combinations thoroughly
- [ ] Add error handling and logging
- [ ] Performance testing and optimization

## 🧪 Testing Strategy

### Unit Testing
- [ ] UserRepository tier methods
- [ ] Encryption/decryption functions
- [ ] Rate limiting logic
- [ ] Credit deduction accuracy
- [ ] Middleware functionality

### Integration Testing
- [ ] End-to-end tier flows
- [ ] API key management
- [ ] Credit system accuracy
- [ ] Rate limit enforcement
- [ ] Error scenario handling

### Load Testing
- [ ] Performance with tier middleware
- [ ] Database query optimization
- [ ] Concurrent credit deductions
- [ ] Rate limit scaling

### User Acceptance Testing
1. **Free Tier User:**
   - Can make requests up to daily limit
   - Gets appropriate error when limit exceeded
   - Forced to use basic model

2. **BYOK User:**
   - Can configure API key
   - Requests use their API key
   - Appropriate errors for invalid keys

3. **Premium User:**
   - Credits deducted correctly
   - Can use premium models
   - Appropriate errors for insufficient credits

## 🚀 Success Metrics

### Performance Metrics
- [ ] Middleware adds < 50ms latency per request
- [ ] Database queries optimized (< 100ms average)
- [ ] Credit deduction operations < 200ms
- [ ] Rate limit checking < 10ms

### Accuracy Metrics
- [ ] 100% accuracy in credit deductions
- [ ] 0% false positives in rate limiting
- [ ] 100% proper tier enforcement
- [ ] 0% API key leakage incidents

### Business Metrics
- [ ] Free tier conversion rate to paid > 15%
- [ ] BYOK user satisfaction > 4.5/5
- [ ] Premium tier revenue per user growth
- [ ] Support tickets related to tier issues < 5%

## 📊 Analytics & Monitoring

### Key Metrics to Track
- Request volume by tier
- Rate limit hit rates
- Credit consumption patterns
- API key validation success rates
- Error rates by tier and error type
- Performance metrics by tier

### Monitoring Alerts
- High error rates for specific tiers
- Unusual credit consumption spikes
- API key validation failures
- Database performance degradation
- Rate limiting false positives

## 🔗 Dependencies & Risks

### Dependencies
- Frontend tier management (F2)
- Payment processing (F3)
- Legal compliance (F4)
- Encryption key management
- AI provider API reliability

### Risks & Mitigation
- **Risk:** Credit calculation errors
  - **Mitigation:** Atomic transactions, comprehensive testing

- **Risk:** API key security breaches
  - **Mitigation:** Strong encryption, secure key management

- **Risk:** Rate limiting bypasses
  - **Mitigation:** Multiple validation layers, audit logging

- **Risk:** Performance degradation with middleware
  - **Mitigation:** Caching, database optimization, profiling

## 📋 Definition of Done

- [ ] All user stories meet acceptance criteria
- [ ] Database schema properly extended and migrated
- [ ] Tier-based middleware functions correctly
- [ ] All three tiers work as specified
- [ ] Rate limiting enforced accurately
- [ ] Credit system operates correctly
- [ ] API key management secure and functional
- [ ] Error handling comprehensive
- [ ] Performance meets requirements
- [ ] Security audit passed
- [ ] Code reviewed and tested
- [ ] Documentation complete
- [ ] Monitoring and analytics implemented
