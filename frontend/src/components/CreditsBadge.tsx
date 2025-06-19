import React, { useEffect, useState } from 'react';
import { getUserCredits } from '../services/marketPlaceApi';
import './CreditsBadge.css';

interface CreditsBadgeProps {
  refreshTrigger?: number; // Optional prop to trigger refresh
  className?: string;
}

const CreditsBadge: React.FC<CreditsBadgeProps> = ({ refreshTrigger, className = '' }) => {
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCredits = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getUserCredits();
      setCredits(response.credits);
    } catch (err) {
      console.error('Error fetching credits:', err);
      setError('Failed to load credits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredits();
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div className={`credits-badge loading ${className}`}>
        <span className="credits-icon">💳</span>
        <span className="credits-text">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`credits-badge error ${className}`}>
        <span className="credits-icon">⚠️</span>
        <span className="credits-text">Error</span>
      </div>
    );
  }
if (credits === null || credits === 0) {
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
