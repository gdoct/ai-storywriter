"""Security utilities for password hashing and other security operations."""

import hashlib
import os


def hash_password(password: str, salt: str = None) -> str:
    """Hash the password using a secure hashing algorithm.
    
    Args:
        password: The password to hash
        salt: Optional salt. If not provided, will get from environment
    """
    if salt is None:
        # Get salt from environment variable
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
