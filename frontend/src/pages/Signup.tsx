import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MarketingFooter from '../components/marketing/MarketingFooter';
import { useAuth } from '../contexts/AuthContext';
import { signup } from '../services/security';
import './Signup.css';

const Signup: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the Terms of Service and Privacy Policy';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    // Use the signup function with legal agreement data
    const success = await signup({
      username: formData.username,
      email: formData.email,
      password: formData.password,
      agreeToTerms: formData.agreeToTerms
    });

    setIsLoading(false);

    if (success) {
      // After successful signup, log the user in
      const loginSuccess = await login(formData.email, formData.password);
      if (loginSuccess) {
        navigate('/dashboard');
      } else {
        setErrors({ general: 'Signup successful but login failed. Please try logging in manually.' });
      }
    } else {
      setErrors({ general: 'Signup failed. Please try again.' });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'agreeToTerms') {
      setFormData(prev => ({ ...prev, [field]: value === 'true' }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div>
      <div className="signup-container">
        <div className="signup-form-wrapper">
          <div className="signup-header">
            <h2>Create Your Account</h2>
            <p>Start your creative writing journey with AI assistance</p>
          </div>

          <form onSubmit={handleSubmit} className="signup-form">
            {errors.general && (
              <div className="error-message general-error">{errors.general}</div>
            )}

            <div className="form-group">
              <label htmlFor="username">Username:</label>
              <input
                type="text"
                id="username"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                className={errors.username ? 'error' : ''}
                disabled={isLoading}
                placeholder="Choose a unique username"
              />
              {errors.username && <span className="error-text">{errors.username}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={errors.email ? 'error' : ''}
                disabled={isLoading}
                placeholder="your.email@example.com"
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="password">Password:</label>
              <input
                type="password"
                id="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={errors.password ? 'error' : ''}
                disabled={isLoading}
                placeholder="Create a secure password"
              />
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password:</label>
              <input
                type="password"
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className={errors.confirmPassword ? 'error' : ''}
                disabled={isLoading}
                placeholder="Confirm your password"
              />
              {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
            </div>

            {/* Legal agreement checkbox */}
            <div className="form-group legal-agreement">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  data-test-id="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={(e) => handleInputChange('agreeToTerms', e.target.checked.toString())}
                  className={errors.agreeToTerms ? 'error' : ''}
                  disabled={isLoading}
                />
                <span className="checkmark"></span>
                I agree to the{' '}
                <Link to="/terms" target="_blank" className="legal-link">
                  Terms of Service
                </Link>
                {' '}and{' '}
                <Link to="/privacy" target="_blank" className="legal-link">
                  Privacy Policy
                </Link>
              </label>
              {errors.agreeToTerms && <span className="error-text">{errors.agreeToTerms}</span>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="signup-btn"
              data-test-id="signupButton"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="login-link">
            Already have an account?{' '}
            <Link to="/login">Sign in here</Link>
          </div>

          <div className="signup-benefits">
            <h3>What you get:</h3>
            <ul>
              <li>✓ 5 free stories per month</li>
              <li>✓ AI-powered story generation</li>
              <li>✓ Multiple AI model support</li>
              <li>✓ Story management tools</li>
            </ul>
          </div>
        </div>
      </div>
      <div style={{ marginTop: 'var(--spacing-5xl)' }}>
        <MarketingFooter />
      </div>
    </div>
  );
};

export default Signup;
