#!/usr/bin/env python3
"""
Migration 004: Add backend type support for multiple LLM backends
- Adds backend_type column to llm_provider_presets table
- Adds multi-backend config columns to user_preferences table
- Migrates existing data to maintain backward compatibility
"""

import sqlite3
import json
from pathlib import Path

def get_db_path():
    """Get the database path"""
    # Look for database in the standard location
    db_path = Path(__file__).parent.parent / "storywriter.db"
    if db_path.exists():
        return str(db_path)
    
    # Fallback locations
    fallback_paths = [
        Path.cwd() / "storywriter.db",
        Path.cwd() / "backend" / "storywriter.db"
    ]
    
    for path in fallback_paths:
        if path.exists():
            return str(path)
    
    # If no existing database found, use the standard location
    return str(db_path)

def run_migration():
    """Run the migration to add backend type support"""
    db_path = get_db_path()
    print(f"Using database: {db_path}")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if backend_type column already exists
        cursor.execute("PRAGMA table_info(llm_provider_presets)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if 'backend_type' not in columns:
            print("Adding backend_type column to llm_provider_presets...")
            cursor.execute("""
                ALTER TABLE llm_provider_presets 
                ADD COLUMN backend_type TEXT NOT NULL DEFAULT 'text'
            """)
            
            # Set all existing providers to 'text' type
            cursor.execute("""
                UPDATE llm_provider_presets 
                SET backend_type = 'text' 
                WHERE backend_type IS NULL OR backend_type = ''
            """)
            print("✓ Added backend_type column")
        else:
            print("✓ backend_type column already exists")
        
        # Check if user_preferences multi-backend columns exist
        cursor.execute("PRAGMA table_info(user_preferences)")
        columns = [row[1] for row in cursor.fetchall()]
        
        new_columns = ['text_llm_config', 'multimodal_llm_config', 'image_llm_config']
        for column in new_columns:
            if column not in columns:
                print(f"Adding {column} column to user_preferences...")
                cursor.execute(f"""
                    ALTER TABLE user_preferences 
                    ADD COLUMN {column} TEXT
                """)
                print(f"✓ Added {column} column")
            else:
                print(f"✓ {column} column already exists")
        
        # Migrate existing user preferences to new structure
        print("Migrating existing user preferences...")
        cursor.execute("""
            SELECT user_id, llm_mode, byok_provider 
            FROM user_preferences 
            WHERE text_llm_config IS NULL
        """)
        
        users_to_migrate = cursor.fetchall()
        
        for user_id, llm_mode, byok_provider in users_to_migrate:
            # Create default text LLM config based on existing preferences
            text_config = {
                "mode": llm_mode or "member",
                "provider": byok_provider or "lmstudio",
                "model": None,  # Will be set when user selects a model
                "temperature": 0.8,
                "api_key": None  # For BYOK mode
            }
            
            # Set default configs for multimodal and image (disabled initially)
            multimodal_config = {
                "mode": "member",  # Default to member mode
                "provider": None,
                "model": None,
                "temperature": 0.8,
                "api_key": None,
                "enabled": False
            }
            
            image_config = {
                "mode": "member",
                "provider": None,
                "model": None,
                "api_key": None,
                "enabled": False  # Image generation disabled by default for existing users
            }
            
            cursor.execute("""
                UPDATE user_preferences 
                SET text_llm_config = ?, 
                    multimodal_llm_config = ?, 
                    image_llm_config = ?
                WHERE user_id = ?
            """, (
                json.dumps(text_config),
                json.dumps(multimodal_config),
                json.dumps(image_config),
                user_id
            ))
        
        if users_to_migrate:
            print(f"✓ Migrated {len(users_to_migrate)} user preferences")
        else:
            print("✓ No user preferences to migrate")
        
        # Create initial provider presets for different backend types if they don't exist
        print("Creating default provider presets for new backend types...")
        
        # Check existing providers
        cursor.execute("SELECT provider_name, backend_type FROM llm_provider_presets")
        existing_providers = {(row[0], row[1]) for row in cursor.fetchall()}
        
        # Default multimodal providers
        multimodal_providers = [
            {
                'provider_name': 'openai_multimodal',
                'display_name': 'OpenAI GPT-4 Vision',
                'backend_type': 'multimodal',
                'base_url': 'https://api.openai.com/v1',
                'is_enabled': False,  # Disabled by default
                'credit_multiplier': 2.0  # Higher cost for multimodal
            },
            {
                'provider_name': 'lmstudio_multimodal',
                'display_name': 'LM Studio (Multimodal)',
                'backend_type': 'multimodal',
                'base_url': 'http://localhost:1234/v1',
                'is_enabled': False,
                'credit_multiplier': 1.0
            }
        ]
        
        # Default image generation providers
        image_providers = [
            {
                'provider_name': 'openai_dalle',
                'display_name': 'DALL-E 2/3',
                'backend_type': 'image',
                'base_url': 'https://api.openai.com/v1',
                'is_enabled': False,
                'credit_multiplier': 5.0  # Much higher cost for image generation
            },
            {
                'provider_name': 'stable_diffusion',
                'display_name': 'Stable Diffusion API',
                'backend_type': 'image',
                'base_url': None,  # Would be configured per deployment
                'is_enabled': False,
                'credit_multiplier': 3.0
            }
        ]
        
        all_new_providers = multimodal_providers + image_providers
        
        for provider in all_new_providers:
            provider_key = (provider['provider_name'], provider['backend_type'])
            if provider_key not in existing_providers:
                cursor.execute("""
                    INSERT INTO llm_provider_presets 
                    (provider_name, display_name, backend_type, base_url, is_enabled, credit_multiplier)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    provider['provider_name'],
                    provider['display_name'],
                    provider['backend_type'],
                    provider['base_url'],
                    provider['is_enabled'],
                    provider['credit_multiplier']
                ))
                print(f"✓ Created provider preset: {provider['display_name']}")
            else:
                print(f"✓ Provider preset already exists: {provider['display_name']}")
        
        # Commit all changes
        conn.commit()
        print("\n🎉 Migration completed successfully!")
        
        # Show summary
        cursor.execute("SELECT backend_type, COUNT(*) FROM llm_provider_presets GROUP BY backend_type")
        summary = cursor.fetchall()
        print("\nProvider summary:")
        for backend_type, count in summary:
            print(f"  {backend_type}: {count} providers")
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Migration failed: {e}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    print("Running migration 004: Add backend type support")
    run_migration()