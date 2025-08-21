import uuid
from datetime import datetime

from sqlalchemy import (JSON, Boolean, Column, DateTime, Integer, String, Float,
                        create_engine, ForeignKey)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship

Base = declarative_base()

class CreditTransaction(Base):
    __tablename__ = 'credit_transactions'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False) # Assuming user_id is UUID
    transaction_type = Column(String, nullable=False)  # e.g., 'purchase', 'usage', 'refund', 'checkpoint'
    amount = Column(Integer, nullable=False)  # Can be positive (addition) or negative (deduction)
    description = Column(String) # Optional description, e.g., "Purchased Starter Pack" or "Used for story generation"
    related_entity_id = Column(String) # Optional: ID of related entity, e.g., purchase_id, story_id
    created_at = Column(DateTime, default=datetime.utcnow)
    checkpoint_balance = Column(Integer) # For checkpoint type transactions

class Policy(Base):
    __tablename__ = 'policies'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    description = Column(String)
    version = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    conditions = Column(JSON)
    settings = Column(JSON, nullable=False)
    created_by = Column(UUID(as_uuid=True))
    updated_by = Column(UUID(as_uuid=True))
    is_default = Column(Boolean, default=False)
    is_deprecated = Column(Boolean, default=False)
    deprecated_at = Column(DateTime)
    deprecated_by = Column(UUID(as_uuid=True))
    is_archived = Column(Boolean, default=False)
    archived_at = Column(DateTime)
    archived_by = Column(UUID(as_uuid=True))

class PolicySet(Base):
    __tablename__ = 'policy_sets'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    description = Column(String)
    version = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    policies = Column(JSON, nullable=False)  # List of policy IDs in order

class AppActivePolicy(Base):
    __tablename__ = 'app_active_policies'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    policy_set_id = Column(UUID(as_uuid=True), nullable=False)
    value = Column(JSON) # Denormalized settings from the active policy set for quick access
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True) # Should only be one active record

class LLMProviderPreset(Base):
    __tablename__ = 'llm_provider_presets'

    id = Column(Integer, primary_key=True)
    provider_name = Column(String, nullable=False, unique=True)
    display_name = Column(String, nullable=False)
    base_url = Column(String)
    is_enabled = Column(Boolean, default=True)
    credit_multiplier = Column(Float, default=1.0)
    config_json = Column(String)  # JSON as string for SQLite compatibility
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship to admin keys
    admin_keys = relationship('LLMAdminKey', back_populates='provider_preset', cascade='all, delete-orphan')

class LLMAdminKey(Base):
    __tablename__ = 'llm_admin_keys'

    id = Column(Integer, primary_key=True)
    provider_preset_id = Column(Integer, ForeignKey('llm_provider_presets.id'), nullable=False)
    key_name = Column(String, nullable=False)
    encrypted_value = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship to provider preset
    provider_preset = relationship('LLMProviderPreset', back_populates='admin_keys')

class UserPreference(Base):
    __tablename__ = 'user_preferences'

    id = Column(Integer, primary_key=True)
    user_id = Column(String, nullable=False, unique=True)  # TEXT for SQLite compatibility
    llm_mode = Column(String, default='member')  # 'member' or 'byok'
    byok_provider = Column(String)  # 'openai' or 'github'
    email_notifications = Column(Boolean, default=True)
    marketing_emails = Column(Boolean, default=False)
    first_name = Column(String)
    last_name = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class LLMRequestLog(Base):
    __tablename__ = 'llm_request_logs'

    id = Column(Integer, primary_key=True)
    user_id = Column(String, nullable=False)
    endpoint_url = Column(String, nullable=False)
    provider = Column(String, nullable=False)
    mode = Column(String, nullable=False)  # 'member' or 'byok'
    tokens_sent = Column(Integer, default=0)
    tokens_received = Column(Integer, default=0)
    credits_used = Column(Integer, default=0)
    request_timestamp = Column(DateTime, default=datetime.utcnow)
    response_timestamp = Column(DateTime)
    duration_ms = Column(Integer)
    status = Column(String)  # 'success', 'error', 'timeout'
    error_message = Column(String)
    
    @property
    def total_tokens(self):
        return (self.tokens_sent or 0) + (self.tokens_received or 0)

# Example for setting up the database connection (adjust as needed for your project)
# from data.db import get_db_url # Assuming you have a way to get the DB URL
# engine = create_engine(get_db_url())
# Base.metadata.create_all(engine)
# SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
