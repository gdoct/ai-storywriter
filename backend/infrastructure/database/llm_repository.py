from typing import List, Optional, Dict, Any
from datetime import datetime
from infrastructure.database.db import get_db_connection
from domain.models.user_settings import LLMProviderPresetResponse, LLMRequestLogResponse

class LLMRepository:
    @staticmethod
    def get_enabled_providers() -> List[Dict[str, Any]]:
        """Get all enabled LLM provider presets"""
        conn = get_db_connection()
        c = conn.cursor()
        
        c.execute('''
            SELECT id, provider_name, display_name, base_url, backend_type, is_enabled, 
                   credit_multiplier, config_json, created_at, updated_at
            FROM llm_provider_presets 
            WHERE is_enabled = 1
            ORDER BY updated_at DESC
        ''')
        
        rows = c.fetchall()
        conn.close()
        
        return [dict(row) for row in rows]

    @staticmethod
    def get_enabled_providers_by_backend_type(backend_type: str) -> List[Dict[str, Any]]:
        """Get enabled LLM provider presets filtered by backend type"""
        conn = get_db_connection()
        c = conn.cursor()
        
        c.execute('''
            SELECT id, provider_name, display_name, base_url, backend_type, is_enabled, 
                   credit_multiplier, config_json, created_at, updated_at
            FROM llm_provider_presets 
            WHERE is_enabled = 1 AND backend_type = ?
            ORDER BY updated_at DESC
        ''', (backend_type,))
        
        rows = c.fetchall()
        conn.close()
        
        return [dict(row) for row in rows]

    @staticmethod
    def get_provider_preset(provider_name: str) -> Optional[Dict[str, Any]]:
        """Get a specific provider preset by name"""
        conn = get_db_connection()
        c = conn.cursor()
        
        c.execute('''
            SELECT id, provider_name, display_name, base_url, is_enabled, 
                   credit_multiplier, config_json, created_at, updated_at
            FROM llm_provider_presets 
            WHERE provider_name = ?
        ''', (provider_name,))
        
        row = c.fetchone()
        conn.close()
        
        return dict(row) if row else None

    @staticmethod
    def get_provider_admin_key(provider_name: str, key_name: str = 'api_key') -> Optional[str]:
        """Get encrypted admin API key for a provider"""
        conn = get_db_connection()
        c = conn.cursor()
        
        c.execute('''
            SELECT k.encrypted_value
            FROM llm_admin_keys k
            JOIN llm_provider_presets p ON k.provider_preset_id = p.id
            WHERE p.provider_name = ? AND k.key_name = ?
        ''', (provider_name, key_name))
        
        row = c.fetchone()
        conn.close()
        
        return row['encrypted_value'] if row else None

    @staticmethod
    def create_provider_preset(preset_data: Dict[str, Any]) -> Optional[int]:
        """Create a new provider preset and return its ID"""
        conn = get_db_connection()
        c = conn.cursor()
        
        try:
            c.execute('''
                INSERT INTO llm_provider_presets 
                (provider_name, display_name, base_url, is_enabled, credit_multiplier, config_json, has_api_key, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ''', (
                preset_data.get('provider_name'),
                preset_data.get('display_name'),
                preset_data.get('base_url', ''),
                preset_data.get('is_enabled', True),
                preset_data.get('credit_multiplier', 1.0),
                preset_data.get('config_json', '{}'),
                preset_data.get('has_api_key', False)
            ))
            
            preset_id = c.lastrowid
            conn.commit()
            conn.close()
            return preset_id
            
        except Exception as e:
            conn.rollback()
            conn.close()
            print(f"Error creating provider preset: {e}")
            return None

    @staticmethod
    def update_provider_preset(provider_id: int, updates: Dict[str, Any]) -> bool:
        """Update a provider preset"""
        conn = get_db_connection()
        c = conn.cursor()
        
        try:
            update_fields = []
            update_values = []
            
            allowed_fields = ['display_name', 'base_url', 'is_enabled', 'credit_multiplier', 'config_json']
            
            for field in allowed_fields:
                if field in updates:
                    update_fields.append(f'{field} = ?')
                    update_values.append(updates[field])
            
            if update_fields:
                update_fields.append('updated_at = CURRENT_TIMESTAMP')
                update_values.append(provider_id)
                
                c.execute(f'''
                    UPDATE llm_provider_presets 
                    SET {", ".join(update_fields)}
                    WHERE id = ?
                ''', update_values)
            
            conn.commit()
            return True
            
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()

    @staticmethod
    def set_provider_admin_key(provider_name: str, key_name: str, encrypted_value: str) -> bool:
        """Set or update an admin API key for a provider"""
        conn = get_db_connection()
        c = conn.cursor()
        
        try:
            # Get provider preset ID
            c.execute('SELECT id FROM llm_provider_presets WHERE provider_name = ?', (provider_name,))
            provider_row = c.fetchone()
            
            if not provider_row:
                raise ValueError(f"Provider preset '{provider_name}' not found")
            
            provider_id = provider_row['id']
            
            # Check if key exists
            c.execute('SELECT id FROM llm_admin_keys WHERE provider_preset_id = ? AND key_name = ?', 
                     (provider_id, key_name))
            existing_key = c.fetchone()
            
            if existing_key:
                # Update existing key
                c.execute('''
                    UPDATE llm_admin_keys 
                    SET encrypted_value = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE provider_preset_id = ? AND key_name = ?
                ''', (encrypted_value, provider_id, key_name))
            else:
                # Insert new key
                c.execute('''
                    INSERT INTO llm_admin_keys (provider_preset_id, key_name, encrypted_value)
                    VALUES (?, ?, ?)
                ''', (provider_id, key_name, encrypted_value))
            
            conn.commit()
            return True
            
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()

    @staticmethod
    def log_llm_request(user_id: str, endpoint_url: str, provider: str, mode: str,
                       tokens_sent: int = 0, tokens_received: int = 0, credits_used: int = 0,
                       duration_ms: Optional[int] = None, status: str = "success", 
                       error_message: Optional[str] = None) -> bool:
        """Log an LLM request"""
        conn = get_db_connection()
        c = conn.cursor()
        
        try:
            c.execute('''
                INSERT INTO llm_request_logs 
                (user_id, endpoint_url, provider, mode, tokens_sent, tokens_received, 
                 credits_used, response_timestamp, duration_ms, status, error_message)
                VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?)
            ''', (user_id, endpoint_url, provider, mode, tokens_sent, tokens_received,
                  credits_used, duration_ms, status, error_message))
            
            conn.commit()
            return True
            
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()

    @staticmethod
    def get_user_llm_usage(user_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Get recent LLM usage for a user"""
        conn = get_db_connection()
        c = conn.cursor()
        
        c.execute('''
            SELECT id, user_id, endpoint_url, provider, mode, tokens_sent, tokens_received,
                   (tokens_sent + tokens_received) as total_tokens, credits_used,
                   request_timestamp, response_timestamp, duration_ms, status, error_message
            FROM llm_request_logs
            WHERE user_id = ?
            ORDER BY request_timestamp DESC
            LIMIT ?
        ''', (user_id, limit))
        
        rows = c.fetchall()
        conn.close()
        
        return [dict(row) for row in rows]

    @staticmethod
    def get_provider_usage_stats(provider: str, days: int = 30) -> Dict[str, Any]:
        """Get usage statistics for a provider over the last N days"""
        conn = get_db_connection()
        c = conn.cursor()
        
        c.execute('''
            SELECT 
                COUNT(*) as total_requests,
                SUM(tokens_sent + tokens_received) as total_tokens,
                SUM(credits_used) as total_credits,
                AVG(duration_ms) as avg_duration_ms,
                COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_requests,
                COUNT(CASE WHEN status = 'error' THEN 1 END) as failed_requests
            FROM llm_request_logs
            WHERE provider = ? 
                AND request_timestamp > datetime('now', '-' || ? || ' days')
        ''', (provider, days))
        
        row = c.fetchone()
        conn.close()
        
        if row:
            stats = dict(row)
            stats['success_rate'] = (stats['successful_requests'] / max(stats['total_requests'], 1)) * 100
            return stats
        
        return {
            'total_requests': 0,
            'total_tokens': 0,
            'total_credits': 0,
            'avg_duration_ms': 0,
            'successful_requests': 0,
            'failed_requests': 0,
            'success_rate': 0
        }