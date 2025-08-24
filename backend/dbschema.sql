CREATE TABLE character_photos (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        scenario_id TEXT NOT NULL,
        character_id TEXT NOT NULL,
        filename TEXT NOT NULL,
        original_filename TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        mime_type TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (username),
        FOREIGN KEY (scenario_id) REFERENCES scenarios (id),
        FOREIGN KEY (character_id) REFERENCES characters (id)
    );

CREATE TABLE credit_transactions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            transaction_type TEXT NOT NULL, -- 'purchase', 'usage', 'refund', 'checkpoint'
            amount INTEGER NOT NULL,
            description TEXT,
            related_entity_id TEXT, -- Optional: ID of related entity, e.g., purchase_id, story_id
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            checkpoint_balance INTEGER, -- For 'checkpoint' type transactions
            FOREIGN KEY(user_id) REFERENCES users(id)
        );

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

CREATE TABLE market_stories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            original_story_id INTEGER NOT NULL,
            user_id TEXT NOT NULL,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            ai_summary TEXT,
            ai_genres TEXT, -- JSON array of genres
            total_downloads INTEGER DEFAULT 0,
            average_rating REAL DEFAULT 0.0,
            rating_count INTEGER DEFAULT 0,
            total_donated_credits INTEGER DEFAULT 0,
            published_at TEXT DEFAULT CURRENT_TIMESTAMP,
            created_at_original TEXT,
            updated_at_original TEXT,
            is_staff_pick INTEGER DEFAULT 0,
            image_uri TEXT,
            scenario_json TEXT,
            FOREIGN KEY(original_story_id) REFERENCES stories(id),
            FOREIGN KEY(user_id) REFERENCES users(id)
        );

CREATE TABLE market_story_donations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            market_story_id INTEGER NOT NULL,
            donor_user_id TEXT NOT NULL,
            recipient_user_id TEXT NOT NULL,
            credits_donated INTEGER NOT NULL,
            donated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(market_story_id) REFERENCES market_stories(id),
            FOREIGN KEY(donor_user_id) REFERENCES users(id),
            FOREIGN KEY(recipient_user_id) REFERENCES users(id)
        );

CREATE TABLE market_story_ratings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            market_story_id INTEGER NOT NULL,
            user_id TEXT NOT NULL,
            rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
            rated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(market_story_id) REFERENCES market_stories(id),
            FOREIGN KEY(user_id) REFERENCES users(id),
            UNIQUE(market_story_id, user_id)
        );

CREATE TABLE rate_limits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            feature TEXT NOT NULL,
            count INTEGER DEFAULT 0,
            window_start TEXT,
            FOREIGN KEY(user_id) REFERENCES users(id),
            UNIQUE(user_id, feature, window_start)
        );

CREATE TABLE scenarios (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            title TEXT,
            jsondata TEXT,
            is_deleted INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP, 
            updated_at TEXT,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );

CREATE TABLE settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            backend_type TEXT NOT NULL,
            config_json TEXT,
            is_active INTEGER DEFAULT 1,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP, 
            deprecated INTEGER DEFAULT 1,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );

CREATE TABLE stories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            scenario_id TEXT,
            text TEXT,
            scenario_json TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(scenario_id) REFERENCES scenarios(id)
        );

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

CREATE TABLE IF NOT EXISTS "users" (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    email TEXT UNIQUE,
    password_hash TEXT,
    is_deleted INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    terms_agreed_at TEXT,
    privacy_agreed_at TEXT,
    terms_version TEXT DEFAULT '1.0',
    privacy_version TEXT DEFAULT '1.0',
    tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'byok', 'premium')),
    api_key_encrypted TEXT,
    api_provider TEXT DEFAULT 'openai' CHECK (api_provider IN ('openai', 'anthropic', 'google'))
);

-- LLM Provider and Configuration Tables
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

-- Indexes
CREATE INDEX idx_market_stories_user_id ON market_stories(user_id);
CREATE INDEX idx_market_stories_published_at ON market_stories(published_at);
CREATE INDEX idx_market_stories_average_rating ON market_stories(average_rating);
CREATE INDEX idx_market_stories_total_downloads ON market_stories(total_downloads);
CREATE INDEX idx_market_story_ratings_market_story_id ON market_story_ratings(market_story_id);
CREATE INDEX idx_market_story_donations_market_story_id ON market_story_donations(market_story_id);
CREATE INDEX idx_market_story_donations_recipient ON market_story_donations(recipient_user_id);
CREATE INDEX idx_credit_usage_user_id ON credit_usage(user_id);
CREATE INDEX idx_rate_limits_user_feature ON rate_limits(user_id, feature);
CREATE INDEX idx_character_photos_user_id ON character_photos (user_id);
CREATE INDEX idx_character_photos_scenario_id ON character_photos (scenario_id);
CREATE INDEX idx_character_photos_character_id ON character_photos (character_id);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);
CREATE INDEX idx_user_roles_active ON user_roles(user_id, role) WHERE revoked_at IS NULL;
CREATE INDEX idx_market_stories_scenario_json ON market_stories(scenario_json) WHERE scenario_json IS NOT NULL;
CREATE INDEX idx_llm_provider_presets_enabled ON llm_provider_presets(is_enabled);
CREATE INDEX idx_llm_admin_keys_provider ON llm_admin_keys(provider_preset_id);
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX idx_user_preferences_llm_mode ON user_preferences(llm_mode);
CREATE INDEX idx_llm_request_logs_user_id ON llm_request_logs(user_id);
CREATE INDEX idx_llm_request_logs_timestamp ON llm_request_logs(request_timestamp);
CREATE INDEX idx_llm_request_logs_mode ON llm_request_logs(mode);
CREATE INDEX idx_llm_request_logs_provider ON llm_request_logs(provider);

-- Seed Data for LLM Provider Presets
INSERT INTO llm_provider_presets (provider_name, display_name, base_url, is_enabled, credit_multiplier, config_json) VALUES
('openai', 'OpenAI', 'https://api.openai.com/v1', 1, 1.0, '{"default_model": "gpt-4", "temperature": 0.7}'),
('github', 'GitHub Models', 'https://models.inference.ai.azure.com', 1, 1.5, '{"default_model": "gpt-4o", "temperature": 0.7}'),
('lmstudio', 'LM Studio', 'http://localhost:1234/v1', 1, 0.1, '{"url": "http://192.168.32.1:1234", "showThinking": false}'),
('ollama', 'Ollama', 'http://localhost:11434/v1', 0, 0.1, '{"default_model": "llama3.1:8b", "temperature": 0.7}');