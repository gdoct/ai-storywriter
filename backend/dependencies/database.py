from data.db import get_db_connection
from fastapi import Depends
import sqlite3

def get_database():
    """
    FastAPI dependency to get database connection
    """
    conn = get_db_connection()
    try:
        yield conn
    finally:
        conn.close()

# Type alias for dependency injection
DatabaseConnection = sqlite3.Connection