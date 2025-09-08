#!/usr/bin/env python3
"""Get a JWT token for the admin user"""

from api.middleware.fastapi_auth import create_access_token

# Create token for the admin user we found in debug_dashboard.py
username = "Guido Docter"
token = create_access_token(data={"sub": username})
print(f"JWT token for {username}:")
print(token)