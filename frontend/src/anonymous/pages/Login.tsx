import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../shared/contexts/AuthContext';
import GoogleSignInButton from '../../shared/components/GoogleSignInButton';
import EmailConflictModal from '../../shared/components/EmailConflictModal';
import './Login.css';

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

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailConflictData, setEmailConflictData] = useState<EmailConflictData | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { authenticated, login } = useAuth();

  // Get the URL the user was trying to access before being redirected to login
  const from = location.state?.from?.pathname + location.state?.from?.search || '/dashboard';

  // Redirect to intended destination if already authenticated
  useEffect(() => {
    if (authenticated) {
      navigate(from, { replace: true });
    }
  }, [authenticated, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    setIsLoading(true);
    setError('');

    const success = await login(email, password);
    setIsLoading(false);
    
    if (success) {
      navigate(from, { replace: true });
    } else {
      setError('Login failed. Please check your credentials.');
    }
  };

  const handleGoogleSuccess = () => {
    navigate(from, { replace: true });
  };

  const handleGoogleError = (errorMessage: string) => {
    setError(`Google Sign-In failed: ${errorMessage}`);
  };

  const handleEmailConflict = (conflictData: EmailConflictData) => {
    setEmailConflictData(conflictData);
    setError(''); // Clear any existing errors
  };

  const handleConflictClose = () => {
    setEmailConflictData(null);
  };

  const handleLoginExisting = () => {
    setEmailConflictData(null);
    // Pre-fill the email field with the conflicted email
    if (emailConflictData) {
      setEmail(emailConflictData.email);
    }
    // Focus could be added here to the password field
  };

  const handleCreateNewAccount = () => {
    setEmailConflictData(null);
    // For now, just navigate to signup - in a full implementation, you'd force Google account creation
    navigate('/signup');
  };

  return (
    <div className="login-container">
      <div className="login-form-wrapper">
        <h2>Welcome Back to StoryWriter</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        {/* Google Sign-In Button */}
        <div className="google-signin-section">
          <GoogleSignInButton
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            onEmailConflict={handleEmailConflict}
            disabled={isLoading}
          />
        </div>
        
        <div className="login-divider">
          <span>or</span>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className="signup-link">
          Don't have an account?{' '}
          <Link to="/signup">Sign up here</Link>
        </div>
      </div>
      
      {/* Email Conflict Modal */}
      {emailConflictData && (
        <EmailConflictModal
          conflictData={emailConflictData}
          onClose={handleConflictClose}
          onLoginExisting={handleLoginExisting}
          onCreateNewAccount={handleCreateNewAccount}
        />
      )}
    </div>
  );
};

export default Login;
