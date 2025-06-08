import os
import tempfile

import pytest
from app import create_app
from db import init_db


@pytest.fixture
def app():
    # Create temporary database for testing
    db_fd, db_path = tempfile.mkstemp()
    
    app = create_app()
    app.config['TESTING'] = True
    app.config['DATABASE'] = db_path
    
    with app.app_context():
        init_db()
    
    yield app
    
    os.close(db_fd)
    os.unlink(db_path)

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def auth_headers():
    # Mock authentication headers
    return {'Authorization': 'Bearer test_token'}
