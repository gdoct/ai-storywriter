from typing import Optional, Dict, Any
from data.db import get_db_connection
from models.user_settings import UserSettingsResponse, NotificationPreferences, LLMMode, BYOKProvider

class UserPreferencesRepository:
    @staticmethod
    def get_user_preferences(user_id: str) -> Optional[Dict[str, Any]]:
        """Get user preferences by user ID"""
        conn = get_db_connection()
        c = conn.cursor()
        
        # Get user data from users table
        c.execute('SELECT username, email FROM users WHERE id = ? AND is_deleted = 0', (user_id,))
        user_row = c.fetchone()
        
        if not user_row:
            conn.close()
            return None
            
        user_dict = dict(user_row)
        
        # Get preferences from user_preferences table
        c.execute('''
            SELECT llm_mode, byok_provider, email_notifications, marketing_emails, 
                   first_name, last_name
            FROM user_preferences 
            WHERE user_id = ?
        ''', (user_id,))
        
        prefs_row = c.fetchone()
        conn.close()
        
        if prefs_row:
            prefs_dict = dict(prefs_row)
            user_dict.update({
                'llm_mode': prefs_dict['llm_mode'],
                'byok_provider': prefs_dict['byok_provider'],
                'first_name': prefs_dict['first_name'],
                'last_name': prefs_dict['last_name'],
                'notifications': {
                    'email': bool(prefs_dict['email_notifications']),
                    'marketing': bool(prefs_dict['marketing_emails'])
                }
            })
        else:
            # Default preferences if none exist
            user_dict.update({
                'llm_mode': 'member',
                'byok_provider': None,
                'first_name': None,
                'last_name': None,
                'notifications': {
                    'email': True,
                    'marketing': False
                }
            })
            
        return user_dict

    @staticmethod
    def create_or_update_user_preferences(user_id: str, preferences: Dict[str, Any]) -> bool:
        """Create or update user preferences"""
        conn = get_db_connection()
        c = conn.cursor()
        
        try:
            # Update basic user info if provided
            if 'username' in preferences or 'email' in preferences:
                update_fields = []
                update_values = []
                
                if 'username' in preferences:
                    update_fields.append('username = ?')
                    update_values.append(preferences['username'])
                    
                if 'email' in preferences:
                    update_fields.append('email = ?')
                    update_values.append(preferences['email'])
                
                if update_fields:
                    update_values.append(user_id)
                    c.execute(f'UPDATE users SET {", ".join(update_fields)} WHERE id = ?', update_values)
            
            # Handle user preferences
            prefs_fields = {}
            if 'llm_mode' in preferences:
                prefs_fields['llm_mode'] = preferences['llm_mode']
            if 'byok_provider' in preferences:
                prefs_fields['byok_provider'] = preferences['byok_provider']
            if 'first_name' in preferences:
                prefs_fields['first_name'] = preferences['first_name']
            if 'last_name' in preferences:
                prefs_fields['last_name'] = preferences['last_name']
            if 'notifications' in preferences:
                prefs_fields['email_notifications'] = preferences['notifications'].get('email', True)
                prefs_fields['marketing_emails'] = preferences['notifications'].get('marketing', False)
            
            if prefs_fields:
                # Check if preferences exist
                c.execute('SELECT id FROM user_preferences WHERE user_id = ?', (user_id,))
                existing = c.fetchone()
                
                if existing:
                    # Update existing preferences
                    update_fields = []
                    update_values = []
                    
                    for field, value in prefs_fields.items():
                        update_fields.append(f'{field} = ?')
                        update_values.append(value)
                    
                    if update_fields:
                        update_fields.append('updated_at = CURRENT_TIMESTAMP')
                        update_values.append(user_id)
                        c.execute(f'''
                            UPDATE user_preferences 
                            SET {", ".join(update_fields)} 
                            WHERE user_id = ?
                        ''', update_values)
                else:
                    # Create new preferences
                    fields = ['user_id'] + list(prefs_fields.keys())
                    values = [user_id] + list(prefs_fields.values())
                    placeholders = ', '.join(['?' for _ in fields])
                    
                    c.execute(f'''
                        INSERT INTO user_preferences ({", ".join(fields)})
                        VALUES ({placeholders})
                    ''', values)
            
            conn.commit()
            return True
            
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()

    @staticmethod
    def get_user_llm_mode(user_id: str) -> str:
        """Get user's LLM mode (member or byok)"""
        conn = get_db_connection()
        c = conn.cursor()
        
        c.execute('SELECT llm_mode FROM user_preferences WHERE user_id = ?', (user_id,))
        row = c.fetchone()
        conn.close()
        
        return row['llm_mode'] if row else 'member'

    @staticmethod
    def get_user_byok_provider(user_id: str) -> Optional[str]:
        """Get user's BYOK provider if they're in BYOK mode"""
        conn = get_db_connection()
        c = conn.cursor()
        
        c.execute('SELECT byok_provider FROM user_preferences WHERE user_id = ? AND llm_mode = "byok"', (user_id,))
        row = c.fetchone()
        conn.close()
        
        return row['byok_provider'] if row else None