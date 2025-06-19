import json
import uuid
from datetime import datetime, timezone

from data.db import get_db_connection
from data.db_models import (  # Assuming db_models.py is in the same directory
    AppActivePolicy, Policy, PolicySet)
from sqlalchemy.orm import Session  # Assuming you'll use SQLAlchemy sessions


class UserRepository:
    @staticmethod
    def get_user_by_username(username):
        conn = get_db_connection()
        user = conn.execute('SELECT * FROM users WHERE username = ? AND is_deleted = 0', (username,)).fetchone()
        conn.close()
        return user

    @staticmethod
    def get_user_by_email(email):
        conn = get_db_connection()
        user = conn.execute('SELECT * FROM users WHERE email = ? AND is_deleted = 0', (email,)).fetchone()
        conn.close()
        return user

    @staticmethod
    def create_user(username, email=None, password_hash=None, agreed_to_terms=False):
        conn = get_db_connection()
        user_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        # If user agreed to terms, record the timestamp and version
        terms_agreed_at = now if agreed_to_terms else None
        privacy_agreed_at = now if agreed_to_terms else None
        terms_version = '1.0' if agreed_to_terms else None
        privacy_version = '1.0' if agreed_to_terms else None
        
        conn.execute('''INSERT INTO users 
                        (id, username, email, password_hash, created_at, terms_agreed_at, privacy_agreed_at, terms_version, privacy_version) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)''', 
                    (user_id, username, email, password_hash, now, terms_agreed_at, privacy_agreed_at, terms_version, privacy_version))
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
    def update_user_password(user_id, password_hash):
        """Update a user's password hash."""
        conn = get_db_connection()
        conn.execute('UPDATE users SET password_hash = ? WHERE id = ?', (password_hash, user_id))
        conn.commit()
        conn.close()
        return True

    @staticmethod
    def delete_user(user_id):
        conn = get_db_connection()
        # soft delete the user by marking them as deleted
        # Note: This does not delete the user from the database, it just marks them as deleted
        # We generate a random id to postfix the email address with, so they can signup again with their
        # original email if they want to, but we keep the old data for historical purposes
        cursor = conn.cursor()
        cursor.execute("SELECT email FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        if not row:
            conn.close()
            return False

        original_email = row[0]
        random_prefix = f"DELETED_{str(uuid.uuid4())[:8]}_"

        if '@' in original_email:
            parts = original_email.split('@', 1)
            new_email = random_prefix + parts[0] + '@' + parts[1]
        else:
            new_email = random_prefix + original_email
        
        conn.execute('UPDATE users SET is_deleted = 1, email = ? WHERE id = ?', (new_email, user_id))
        conn.commit()
        conn.close()
        return True

    @staticmethod
    def update_user_credits(user_id, credits):
        pass # This method is now obsolete, credits are managed via transactions

    @staticmethod
    def add_credit_transaction(user_id, transaction_type, amount, description=None, related_entity_id=None, checkpoint_balance=None):
        conn = get_db_connection()
        transaction_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        conn.execute('''INSERT INTO credit_transactions
                        (id, user_id, transaction_type, amount, description, related_entity_id, created_at, checkpoint_balance)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
                     (transaction_id, user_id, transaction_type, amount, description, related_entity_id, now, checkpoint_balance))
        conn.commit()
        conn.close()

    @staticmethod
    def get_user_credit_balance(user_id):
        conn = get_db_connection()
        # First, try to get the latest checkpoint
        latest_checkpoint = conn.execute('''
            SELECT checkpoint_balance, created_at
            FROM credit_transactions
            WHERE user_id = ? AND transaction_type = 'checkpoint'
            ORDER BY created_at DESC
            LIMIT 1
        ''', (user_id,)).fetchone()

        balance = 0
        since_timestamp = None

        if latest_checkpoint:
            balance = latest_checkpoint['checkpoint_balance']
            since_timestamp = latest_checkpoint['created_at']

        # Sum transactions since the last checkpoint (or all if no checkpoint)
        query = '''
            SELECT SUM(amount)
            FROM credit_transactions
            WHERE user_id = ?
        '''
        params = [user_id]

        if since_timestamp:
            query += ' AND created_at > ?'
            params.append(since_timestamp)
        
        # Exclude checkpoint amounts themselves from the sum if we started from a checkpoint
        if latest_checkpoint:
             query += ' AND transaction_type != \'checkpoint\''

        result = conn.execute(query, tuple(params)).fetchone()
        conn.close()

        if result and result[0] is not None:
            balance += result[0]
        
        return balance

    @staticmethod
    def get_user_with_roles(user_id):
        """Get user with their roles included"""
        conn = get_db_connection()
        user = conn.execute('SELECT * FROM users WHERE id = ? AND is_deleted = 0', (user_id,)).fetchone()
        
        if user:
            # Get user roles
            roles_cursor = conn.execute('''
                SELECT role FROM user_roles 
                WHERE user_id = ? AND revoked_at IS NULL
            ''', (user_id,))
            roles = [row['role'] for row in roles_cursor.fetchall()]
            
            # Convert user row to dict and add roles
            user_dict = dict(user)
            user_dict['roles'] = roles
            conn.close()
            return user_dict
        
        conn.close()
        return None

    @staticmethod
    def get_user_by_username_with_roles(username):
        """Get user by username with their roles included"""
        conn = get_db_connection()
        user = conn.execute('SELECT * FROM users WHERE username = ? AND is_deleted = 0', (username,)).fetchone()
        
        if user:
            # Get user roles
            roles_cursor = conn.execute('''
                SELECT role FROM user_roles 
                WHERE user_id = ? AND revoked_at IS NULL
            ''', (user['id'],))
            roles = [row['role'] for row in roles_cursor.fetchall()]
            
            # Convert user row to dict and add roles
            user_dict = dict(user)
            user_dict['roles'] = roles
            conn.close()
            return user_dict
        
        conn.close()
        return None

    @staticmethod
    def get_user_by_email_with_roles(email):
        """Get user by email with their roles included"""
        conn = get_db_connection()
        user = conn.execute('SELECT * FROM users WHERE email = ? AND is_deleted = 0', (email,)).fetchone()
        if user:
            user_id = user['id'] if 'id' in user.keys() else user[0]
            # Get user roles
            roles_cursor = conn.execute('''
                SELECT role FROM user_roles 
                WHERE user_id = ? AND revoked_at IS NULL
            ''', (user_id,))
            roles = [row['role'] for row in roles_cursor.fetchall()]
            user_dict = dict(user)
            user_dict['user_id'] = user_id  # Map id to user_id for API
            user_dict['roles'] = roles
            conn.close()
            return user_dict
        conn.close()
        return None

    @staticmethod
    def list_all_users(limit=100, offset=0, include_deleted=False):
        """List all users with pagination and optional role information"""
        conn = get_db_connection()
        
        where_clause = "" if include_deleted else "WHERE is_deleted = 0"
        
        cursor = conn.execute(f'''
            SELECT u.*, 
                   GROUP_CONCAT(ur.role) as roles
            FROM users u
            LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.revoked_at IS NULL
            {where_clause}
            GROUP BY u.id
            ORDER BY u.created_at DESC
            LIMIT ? OFFSET ?
        ''', (limit, offset))
        
        users = []
        for row in cursor.fetchall():
            user_dict = dict(row)
            # Parse roles from GROUP_CONCAT
            roles_str = user_dict.pop('roles', '')
            user_dict['roles'] = roles_str.split(',') if roles_str else []
            users.append(user_dict)
        
        conn.close()
        return users

    @staticmethod
    def count_users(include_deleted=False):
        """Count total number of users"""
        conn = get_db_connection()
        where_clause = "" if include_deleted else "WHERE is_deleted = 0"
        
        cursor = conn.execute(f'SELECT COUNT(*) as count FROM users {where_clause}')
        count = cursor.fetchone()['count']
        conn.close()
        return count

    @staticmethod
    def update_user_tier(user_id, new_tier):
        """Update user's tier"""
        valid_tiers = ['free', 'byok', 'premium']
        if new_tier not in valid_tiers:
            raise ValueError(f"Invalid tier: {new_tier}. Must be one of {valid_tiers}")
        
        conn = get_db_connection()
        conn.execute('UPDATE users SET tier = ? WHERE id = ?', (new_tier, user_id))
        conn.commit()
        conn.close()

    @staticmethod
    def get_users_by_tier(tier):
        """Get all users with a specific tier"""
        conn = get_db_connection()
        cursor = conn.execute('SELECT * FROM users WHERE tier = ? AND is_deleted = 0', (tier,))
        users = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return users

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
        # jsondata has an "id" property that needs to be updated before saving
        if isinstance(jsondata, dict):
            jsondata['id'] = scenario_id
        elif isinstance(jsondata, str):
            try:
                json_obj = json.loads(jsondata)
                json_obj['id'] = scenario_id
                jsondata = json.dumps(json_obj)
            except json.JSONDecodeError:
                raise ValueError("Invalid JSON data provided")
        else:
            raise ValueError("jsondata must be a dict or a JSON string")
        now = datetime.now(timezone.utc).isoformat()
        conn.execute('INSERT INTO scenarios (id, user_id, title, jsondata, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
                     (scenario_id, user_id, title, jsondata, now, now))
        conn.commit()
        scenario = conn.execute('SELECT * FROM scenarios WHERE id = ?', (scenario_id,)).fetchone()
        conn.close()
        return scenario

    @staticmethod
    def update_scenario(scenario_id, title=None, jsondata=None):
        conn = get_db_connection()
        now = datetime.now(timezone.utc).isoformat()
        
        # Build the update query dynamically
        updates = []
        params = []
        
        if title:
            updates.append('title = ?')
            params.append(title)
        if jsondata:
            updates.append('jsondata = ?')
            params.append(jsondata)
        
        # Always update the updated_at timestamp
        updates.append('updated_at = ?')
        params.append(now)
        params.append(scenario_id)
        
        if updates:
            query = f'UPDATE scenarios SET {", ".join(updates)} WHERE id = ?'
            conn.execute(query, params)
        
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
    def get_story_by_id(story_id):
        conn = get_db_connection()
        story = conn.execute('SELECT * FROM stories WHERE id = ?', (story_id,)).fetchone()
        conn.close()
        return story

    @staticmethod
    def create_story(scenario_id, text):
        conn = get_db_connection()
        now = datetime.now(timezone.utc).isoformat()
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

class PolicyRepository:
    @staticmethod
    def create_policy(db: Session, name: str, settings: dict, description: str = None, version: int = 1, conditions: dict = None, created_by: uuid.UUID = None, is_default: bool = False) -> Policy:
        policy = Policy(
            name=name,
            description=description,
            version=version,
            conditions=conditions,
            settings=settings,
            created_by=created_by,
            is_default=is_default
        )
        db.add(policy)
        db.commit()
        db.refresh(policy)
        return policy

    @staticmethod
    def get_policy_by_id(db: Session, policy_id: uuid.UUID) -> Policy | None:
        return db.query(Policy).filter(Policy.id == policy_id, Policy.is_archived == False).first()

    @staticmethod
    def get_active_policies(db: Session) -> list[Policy]:
        return db.query(Policy).filter(Policy.is_active == True, Policy.is_archived == False).all()
    
    @staticmethod
    def get_default_policy(db: Session) -> Policy | None:
        return db.query(Policy).filter(Policy.is_default == True, Policy.is_active == True, Policy.is_archived == False).first()

    @staticmethod
    def update_policy(db: Session, policy_id: uuid.UUID, updated_by: uuid.UUID, **kwargs) -> Policy | None:
        policy = db.query(Policy).filter(Policy.id == policy_id, Policy.is_archived == False).first()
        if policy:
            for key, value in kwargs.items():
                setattr(policy, key, value)
            policy.updated_by = updated_by
            policy.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(policy)
        return policy

    @staticmethod
    def activate_policy(db: Session, policy_id: uuid.UUID, updated_by: uuid.UUID) -> Policy | None:
        policy = db.query(Policy).filter(Policy.id == policy_id, Policy.is_archived == False).first()
        if policy:
            policy.is_active = True
            policy.updated_by = updated_by
            policy.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(policy)
        return policy

    @staticmethod
    def deactivate_policy(db: Session, policy_id: uuid.UUID, updated_by: uuid.UUID) -> Policy | None:
        policy = db.query(Policy).filter(Policy.id == policy_id, Policy.is_archived == False).first()
        if policy:
            policy.is_active = False
            policy.updated_by = updated_by
            policy.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(policy)
        return policy

    @staticmethod
    def deprecate_policy(db: Session, policy_id: uuid.UUID, deprecated_by: uuid.UUID) -> Policy | None:
        policy = db.query(Policy).filter(Policy.id == policy_id, Policy.is_archived == False).first()
        if policy:
            policy.is_deprecated = True
            policy.is_active = False # Deprecated policies should not be active
            policy.deprecated_by = deprecated_by
            policy.deprecated_at = datetime.utcnow()
            policy.updated_by = deprecated_by # Also update the updated_by field
            policy.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(policy)
        return policy

    @staticmethod
    def archive_policy(db: Session, policy_id: uuid.UUID, archived_by: uuid.UUID) -> Policy | None:
        policy = db.query(Policy).filter(Policy.id == policy_id).first() # Allow archiving even if already archived for some reason
        if policy:
            policy.is_archived = True
            policy.is_active = False # Archived policies should not be active
            policy.archived_by = archived_by
            policy.archived_at = datetime.utcnow()
            policy.updated_by = archived_by # Also update the updated_by field
            policy.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(policy)
        return policy

class PolicySetRepository:
    @staticmethod
    def create_policy_set(db: Session, name: str, policies: list[uuid.UUID], description: str = None, version: int = 1) -> PolicySet:
        policy_set = PolicySet(
            name=name,
            description=description,
            version=version,
            policies=policies 
        )
        db.add(policy_set)
        db.commit()
        db.refresh(policy_set)
        return policy_set

    @staticmethod
    def get_policy_set_by_id(db: Session, policy_set_id: uuid.UUID) -> PolicySet | None:
        return db.query(PolicySet).filter(PolicySet.id == policy_set_id).first()

    @staticmethod
    def get_active_policy_sets(db: Session) -> list[PolicySet]:
        return db.query(PolicySet).filter(PolicySet.is_active == True).all()

    @staticmethod
    def update_policy_set(db: Session, policy_set_id: uuid.UUID, **kwargs) -> PolicySet | None:
        policy_set = db.query(PolicySet).filter(PolicySet.id == policy_set_id).first()
        if policy_set:
            for key, value in kwargs.items():
                setattr(policy_set, key, value)
            policy_set.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(policy_set)
        return policy_set
    
    @staticmethod
    def activate_policy_set(db: Session, policy_set_id: uuid.UUID) -> PolicySet | None:
        policy_set = db.query(PolicySet).filter(PolicySet.id == policy_set_id).first()
        if policy_set:
            policy_set.is_active = True
            policy_set.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(policy_set)
        return policy_set

    @staticmethod
    def deactivate_policy_set(db: Session, policy_set_id: uuid.UUID) -> PolicySet | None:
        policy_set = db.query(PolicySet).filter(PolicySet.id == policy_set_id).first()
        if policy_set:
            policy_set.is_active = False
            policy_set.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(policy_set)
        return policy_set

class AppActivePolicyRepository:
    @staticmethod
    def get_active_app_policy(db: Session) -> AppActivePolicy | None:
        return db.query(AppActivePolicy).filter(AppActivePolicy.is_active == True).order_by(AppActivePolicy.created_at.desc()).first()

    @staticmethod
    def set_active_app_policy(db: Session, policy_set_id: uuid.UUID, policy_settings_value: dict) -> AppActivePolicy:
        # Deactivate any currently active policy
        current_active = db.query(AppActivePolicy).filter(AppActivePolicy.is_active == True).all()
        for ap in current_active:
            ap.is_active = False
        
        app_policy = AppActivePolicy(
            policy_set_id=policy_set_id,
            value=policy_settings_value, # This should be the resolved settings from the policy set
            is_active=True
        )
        db.add(app_policy)
        db.commit()
        db.refresh(app_policy)
        return app_policy

    @staticmethod
    def get_app_policy_history(db: Session, limit: int = 10) -> list[AppActivePolicy]:
        return db.query(AppActivePolicy).order_by(AppActivePolicy.created_at.desc()).limit(limit).all()

# You will need to integrate SQLAlchemy session management into your get_db_connection or similar utility.
# For example, your get_db_connection might yield a session and ensure it's closed.
# from sqlalchemy import create_engine
# from sqlalchemy.orm import sessionmaker
# from contextlib import contextmanager

# DATABASE_URL = "sqlite:///./storywriter.db" # Or your actual DB URL
# engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False}) # check_same_thread for SQLite
# SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# @contextmanager
# def get_db_session():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()

# Then, in your repository methods, you would use this session:
# with get_db_session() as db:
#     # db operations
#     pass
