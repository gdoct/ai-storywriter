import React, { useEffect, useRef, useState } from 'react';
import { GoogleAuthService } from '../services/googleAuth';
import { GoogleCredentialResponse } from '../types/google';

interface GoogleLinkButtonProps {
  theme?: 'outline' | 'filled_blue';
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onCredential?: (token: string) => Promise<void>;
  disabled?: boolean;
}

const GoogleLinkButton: React.FC<GoogleLinkButtonProps> = ({
  theme = 'outline',
  onSuccess,
  onError,
  onCredential,
  disabled = false
}) => {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
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
      if (onCredential) {
        await onCredential(response.credential);
        onSuccess?.();
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Google linking failed';
      setError(errorMsg);
      onError?.(errorMsg);
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
    <div className="google-signin-container" style={{ position: 'relative' }}>
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
          zIndex: 10,
          borderRadius: '4px'
        }}>
          <span>Linking...</span>
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

export default GoogleLinkButton;