"""Security utilities for password hashing and other security operations."""

import hashlib
import os

from flask import current_app


def hash_password(password: str, salt: str = None) -> str:
    """Hash the password using a secure hashing algorithm.
    
    Args:
        password: The password to hash
        salt: Optional salt. If not provided, will try to get from Flask config or environment
    """
    if salt is None:
        # Try to get salt from Flask context first
        try:
            default_salt = "abc" * 5
            salt = current_app.config.get('PASSWORD_SALT', default_salt)
        except RuntimeError:
            # Flask context not available, try environment variable
            salt = os.environ.get('PASSWORD_SALT', "abc" * 5)
    
    if not salt:
        raise RuntimeError("PASSWORD_SALT not set in app configuration or environment")
    
    hash_obj = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100_000
    )
    return hash_obj.hex()
