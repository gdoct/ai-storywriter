import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { GoogleAuthService } from '../services/googleAuth';
import { GoogleCredentialResponse } from '../types/google';

interface EmailConflictData {
  error: string;
  email: string;
  message: string;
  existing_user_info: {
    username: string;
    created_at: string;
    tier: string;
  };
}

interface GoogleSignInButtonProps {
  theme?: 'outline' | 'filled_blue';
  onSuccess?: (isNewUser: boolean) => void;
  onError?: (error: string) => void;
  onEmailConflict?: (conflictData: EmailConflictData) => void;
  disabled?: boolean;
}

const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  theme = 'outline',
  onSuccess,
  onError,
  onEmailConflict,
  disabled = false
}) => {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const { loginWithGoogle } = useAuth();
  const googleAuth = GoogleAuthService.getInstance();

  useEffect(() => {
    const initializeButton = async () => {
      if (!buttonRef.current || disabled) return;

      try {
        await googleAuth.initializeGoogleAuth(handleCredentialResponse);
        await googleAuth.renderButton(buttonRef.current, theme);
      } catch (error) {
        console.error('Failed to initialize Google Sign-In:', error);
        setError('Google Sign-In is currently unavailable');
        onError?.('Google Sign-In failed to initialize');
      }
    };

    initializeButton();
  }, [theme, disabled]);

  const handleCredentialResponse = async (response: GoogleCredentialResponse) => {
    if (!response.credential) {
      const errorMsg = 'No credential received from Google';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const success = await loginWithGoogle(response.credential);
      
      if (success) {
        onSuccess?.(false); // We don't know if it's a new user from the frontend
      } else {
        const errorMsg = 'Failed to sign in with Google';
        setError(errorMsg);
        onError?.(errorMsg);
      }
    } catch (error: any) {
      // Check if it's an email conflict response
      if (error?.response?.data?.error === 'email_conflict') {
        const conflictData = error.response.data;
        onEmailConflict?.(conflictData);
      } else {
        const errorMsg = error instanceof Error ? error.message : 'Google sign-in failed';
        setError(errorMsg);
        onError?.(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <div className="google-signin-error">
        <p style={{ color: 'red', fontSize: '14px', textAlign: 'center' }}>
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="google-signin-container">
      {isLoading && (
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(255, 255, 255, 0.8)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          zIndex: 10
        }}>
          <span>Signing in...</span>
        </div>
      )}
      <div 
        ref={buttonRef}
        style={{ 
          opacity: disabled || isLoading ? 0.6 : 1,
          pointerEvents: disabled || isLoading ? 'none' : 'auto'
        }}
      />
    </div>
  );
};

export default GoogleSignInButton;