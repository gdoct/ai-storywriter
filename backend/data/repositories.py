import uuid
from datetime import datetime

from data.db import get_db_connection


class UserRepository:
    @staticmethod
    def get_user_by_username(username):
        conn = get_db_connection()
        user = conn.execute('SELECT * FROM users WHERE username = ? AND is_deleted = 0', (username,)).fetchone()
        conn.close()
        return user

    @staticmethod
    def create_user(username, email=None, agreed_to_terms=False):
        conn = get_db_connection()
        user_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        
        # If user agreed to terms, record the timestamp and version
        terms_agreed_at = now if agreed_to_terms else None
        privacy_agreed_at = now if agreed_to_terms else None
        terms_version = '1.0' if agreed_to_terms else None
        privacy_version = '1.0' if agreed_to_terms else None
        
        conn.execute('''INSERT INTO users 
                        (id, username, email, created_at, terms_agreed_at, privacy_agreed_at, terms_version, privacy_version) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)''', 
                    (user_id, username, email, now, terms_agreed_at, privacy_agreed_at, terms_version, privacy_version))
        conn.commit()
        user = conn.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()
        conn.close()
        return user

    @staticmethod
    def update_user(user_id, email=None):
        conn = get_db_connection()
        conn.execute('UPDATE users SET email = ? WHERE id = ?', (email, user_id))
        conn.commit()
        conn.close()

    @staticmethod
    def delete_user(user_id):
        conn = get_db_connection()
        conn.execute('UPDATE users SET is_deleted = 1 WHERE id = ?', (user_id,))
        conn.commit()
        conn.close()

    @staticmethod
    def update_user_credits(user_id, credits):
        """Update user's credit balance"""
        conn = get_db_connection()
        conn.execute('UPDATE users SET credits = ? WHERE id = ?', (credits, user_id))
        conn.commit()
        conn.close()

class ScenarioRepository:
    @staticmethod
    def get_scenarios_by_user(user_id):
        conn = get_db_connection()
        scenarios = conn.execute('SELECT * FROM scenarios WHERE user_id = ? AND is_deleted = 0', (user_id,)).fetchall()
        conn.close()
        return scenarios

    @staticmethod
    def create_scenario(user_id, title, jsondata):
        conn = get_db_connection()
        scenario_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        conn.execute('INSERT INTO scenarios (id, user_id, title, jsondata, created_at) VALUES (?, ?, ?, ?, ?)',
                     (scenario_id, user_id, title, jsondata, now))
        conn.commit()
        scenario = conn.execute('SELECT * FROM scenarios WHERE id = ?', (scenario_id,)).fetchone()
        conn.close()
        return scenario

    @staticmethod
    def update_scenario(scenario_id, title=None, jsondata=None):
        conn = get_db_connection()
        if title:
            conn.execute('UPDATE scenarios SET title = ? WHERE id = ?', (title, scenario_id))
        if jsondata:
            conn.execute('UPDATE scenarios SET jsondata = ? WHERE id = ?', (jsondata, scenario_id))
        conn.commit()
        conn.close()

    @staticmethod
    def delete_scenario(scenario_id):
        conn = get_db_connection()
        conn.execute('UPDATE scenarios SET is_deleted = 1 WHERE id = ?', (scenario_id,))
        conn.commit()
        conn.close()

class GeneratedTextRepository:
    @staticmethod
    def get_stories_by_scenario(scenario_id):
        conn = get_db_connection()
        stories = conn.execute('SELECT * FROM stories WHERE scenario_id = ? ORDER BY created_at DESC', (scenario_id,)).fetchall()
        conn.close()
        return stories

    @staticmethod
    def create_story(scenario_id, text):
        conn = get_db_connection()
        now = datetime.utcnow().isoformat()
        conn.execute('INSERT INTO stories (scenario_id, text, created_at) VALUES (?, ?, ?)', (scenario_id, text, now))
        conn.commit()
        story = conn.execute('SELECT * FROM stories WHERE scenario_id = ? ORDER BY created_at DESC LIMIT 1', (scenario_id,)).fetchone()
        conn.close()
        return story

    @staticmethod
    def delete_story(story_id):
        conn = get_db_connection()
        conn.execute('DELETE FROM stories WHERE id = ?', (story_id,))
        conn.commit()
        conn.close()
