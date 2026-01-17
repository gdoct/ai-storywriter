"""
Pytest configuration for backend tests.
"""

import os
import sys
import tempfile

import pytest

# Add backend to path for imports
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)


@pytest.fixture
def app():
    """Create FastAPI test app with temporary database."""
    from api.app import app as fastapi_app
    from infrastructure.database.db import init_db

    # Create temporary database for testing
    db_fd, db_path = tempfile.mkstemp()

    # Store original DATABASE_URL if any
    original_db = os.environ.get('DATABASE_URL')
    os.environ['DATABASE_URL'] = f'sqlite:///{db_path}'

    # Initialize database
    init_db()

    yield fastapi_app

    # Cleanup
    os.close(db_fd)
    os.unlink(db_path)
    if original_db:
        os.environ['DATABASE_URL'] = original_db
    elif 'DATABASE_URL' in os.environ:
        del os.environ['DATABASE_URL']


@pytest.fixture
def client(app):
    """Create FastAPI test client."""
    from fastapi.testclient import TestClient
    return TestClient(app)


@pytest.fixture
def auth_headers():
    """Mock authentication headers."""
    return {'Authorization': 'Bearer test_token'}
