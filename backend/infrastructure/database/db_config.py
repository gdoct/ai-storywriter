"""
Database configuration module
Provides centralized database path management for the entire application
"""
import os


def get_db_path():
    """
    Get the full path to the SQLite database file.
    Returns: [solution-root]/backend/storywriter.db
    """
    # Get the directory where this file (db_config.py) is located
    current_dir = os.path.dirname(os.path.abspath(__file__))
    # Navigate from infrastructure/database/ back to backend root
    backend_dir = os.path.dirname(os.path.dirname(current_dir))
    # Construct the path to the database file
    db_path = os.path.join(backend_dir, 'storywriter.db')
    return db_path

# Central database path - can be overridden by environment variable
DB_PATH = os.environ.get('STORYWRITER_DB_PATH', get_db_path())
