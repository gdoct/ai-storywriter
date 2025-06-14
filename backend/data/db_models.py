\
import uuid
from datetime import datetime

from sqlalchemy import (JSON, Boolean, Column, DateTime, Integer, String,
                        create_engine)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

Base = declarative_base()

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

# Example for setting up the database connection (adjust as needed for your project)
# from data.db import get_db_url # Assuming you have a way to get the DB URL
# engine = create_engine(get_db_url())
# Base.metadata.create_all(engine)
# SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
