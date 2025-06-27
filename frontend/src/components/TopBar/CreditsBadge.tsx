import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './CreditsBadge.css';

interface CreditsBadgeProps {
  className?: string;
}

const CreditsBadge: React.FC<CreditsBadgeProps> = ({ className = '' }) => {
  const { userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className={`credits-badge loading ${className}`}>
        <span className="credits-icon">💳</span>
        <span className="credits-text">Loading...</span>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className={`credits-badge error ${className}`}>
        <span className="credits-icon">⚠️</span>
        <span className="credits-text">Error</span>
      </div>
    );
  }

  const credits = userProfile.credits;

  if (credits === 0) {
    return (
      <div className={`credits-badge no-credits ${className}`}>
        <span className="credits-icon">💳</span>
        <span className="credits-text">Buy credits</span>
      </div>
    );
  }

  return (
    <div className={`credits-badge ${className}`} title={`You have ${credits} credits`}>
      <span className="credits-icon">💳</span>
      <span className="credits-text" data-test-id="credits-amount">{credits} credits</span>
    </div>
  );
};

export default CreditsBadge;
