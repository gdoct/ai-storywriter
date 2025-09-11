import os
from google.oauth2 import id_token
from google.auth.transport import requests
from typing import Dict, Optional
from fastapi import HTTPException, status


class GoogleOAuthService:
    """Service for handling Google OAuth authentication"""
    
    def __init__(self):
        self.client_id = os.getenv('GOOGLE_CLIENT_ID')
        if not self.client_id:
            raise ValueError("GOOGLE_CLIENT_ID environment variable is required")
    
    def verify_google_token(self, token: str) -> Dict:
        """
        Verify Google OAuth token and return user info
        
        Args:
            token: Google OAuth ID token
            
        Returns:
            Dict containing user information from Google
            
        Raises:
            HTTPException: If token is invalid
        """
        try:
            # Verify the token
            idinfo = id_token.verify_oauth2_token(
                token, 
                requests.Request(), 
                self.client_id
            )
            
            # Token is valid, extract user info
            return {
                'google_id': idinfo['sub'],
                'email': idinfo['email'],
                'name': idinfo.get('name', ''),
                'given_name': idinfo.get('given_name', ''),
                'family_name': idinfo.get('family_name', ''),
                'picture': idinfo.get('picture', ''),
                'email_verified': idinfo.get('email_verified', False),
            }
            
        except ValueError as e:
            # Invalid token
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid Google token: {str(e)}"
            )
        except Exception as e:
            # Other errors
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error verifying Google token: {str(e)}"
            )
    
    def generate_username_from_email(self, email: str, google_info: Dict) -> str:
        """
        Generate a username from Google user info
        
        Args:
            email: User's email address
            google_info: Google user information
            
        Returns:
            Generated username
        """
        # Try to use the part before @ in email
        base_username = email.split('@')[0]
        
        # If there's a given name, prefer that
        if google_info.get('given_name'):
            base_username = google_info['given_name'].lower().replace(' ', '')
        
        # Clean the username (remove special characters, keep only alphanumeric)
        import re
        username = re.sub(r'[^a-zA-Z0-9]', '', base_username)
        
        # Ensure minimum length
        if len(username) < 3:
            username = email.split('@')[0][:10]  # Use email prefix as fallback
        
        return username[:20]  # Limit length