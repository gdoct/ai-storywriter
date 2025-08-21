-- Migration: Refactor LLM Settings Architecture
-- This migration implements the new LLM settings system with provider presets and admin keys

-- Step 1: Create provider presets table for system-wide LLM configurations
CREATE TABLE llm_provider_presets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider_name TEXT NOT NULL UNIQUE, -- 'openai', 'github', 'lmstudio', 'ollama'
    display_name TEXT NOT NULL,
    base_url TEXT,
    is_enabled INTEGER DEFAULT 1,
    credit_multiplier REAL DEFAULT 1.0, -- e.g., 1.5 for GitHub
    config_json TEXT, -- Provider-specific configuration (models, etc.)
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Create admin keys table for secure API key storage
CREATE TABLE llm_admin_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider_preset_id INTEGER NOT NULL,
    key_name TEXT NOT NULL, -- e.g., 'api_key', 'secret_key'
    encrypted_value TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(provider_preset_id) REFERENCES llm_provider_presets(id),
    UNIQUE(provider_preset_id, key_name)
);

-- Step 3: Create user preferences table
CREATE TABLE user_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    llm_mode TEXT DEFAULT 'member' CHECK (llm_mode IN ('member', 'byok')),
    byok_provider TEXT CHECK (byok_provider IN ('openai', 'github')),
    email_notifications INTEGER DEFAULT 1,
    marketing_emails INTEGER DEFAULT 0,
    first_name TEXT,
    last_name TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    UNIQUE(user_id)
);

-- Step 4: Create LLM request log table for tracking usage
CREATE TABLE llm_request_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    endpoint_url TEXT NOT NULL,
    provider TEXT NOT NULL, -- 'openai', 'github', etc.
    mode TEXT NOT NULL CHECK (mode IN ('member', 'byok')),
    tokens_sent INTEGER DEFAULT 0,
    tokens_received INTEGER DEFAULT 0,
    total_tokens INTEGER GENERATED ALWAYS AS (tokens_sent + tokens_received),
    credits_used INTEGER DEFAULT 0, -- Only for member mode
    request_timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
    response_timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
    duration_ms INTEGER,
    status TEXT, -- 'success', 'error', 'timeout'
    error_message TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Step 5: Insert default provider presets
INSERT INTO llm_provider_presets (provider_name, display_name, base_url, is_enabled, credit_multiplier, config_json) VALUES
('openai', 'OpenAI', 'https://api.openai.com/v1', 1, 1.0, '{"default_model": "gpt-4", "temperature": 0.7}'),
('github', 'GitHub Models', 'https://models.inference.ai.azure.com', 1, 1.5, '{"default_model": "gpt-4o", "temperature": 0.7}'),
('lmstudio', 'LM Studio', 'http://localhost:1234/v1', 0, 0.1, '{"default_model": "llama-3.1-8b-instruct", "temperature": 0.7}'),
('ollama', 'Ollama', 'http://localhost:11434/v1', 0, 0.1, '{"default_model": "llama3.1:8b", "temperature": 0.7}');

-- Step 6: Create indexes for performance
CREATE INDEX idx_llm_provider_presets_enabled ON llm_provider_presets(is_enabled);
CREATE INDEX idx_llm_admin_keys_provider ON llm_admin_keys(provider_preset_id);
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX idx_user_preferences_llm_mode ON user_preferences(llm_mode);
CREATE INDEX idx_llm_request_logs_user_id ON llm_request_logs(user_id);
CREATE INDEX idx_llm_request_logs_timestamp ON llm_request_logs(request_timestamp);
CREATE INDEX idx_llm_request_logs_mode ON llm_request_logs(mode);
CREATE INDEX idx_llm_request_logs_provider ON llm_request_logs(provider);

-- Step 7: Migrate existing user data to user_preferences
INSERT INTO user_preferences (user_id, llm_mode, email_notifications, marketing_emails)
SELECT id, 'member', 1, 0 FROM users WHERE is_deleted = 0;

-- Note: The old 'settings' table will be deprecated but kept for now
-- It can be dropped in a future migration once the new system is fully operational
-- UPDATE: We'll add a deprecation marker instead of dropping
ALTER TABLE settings ADD COLUMN deprecated INTEGER DEFAULT 1;