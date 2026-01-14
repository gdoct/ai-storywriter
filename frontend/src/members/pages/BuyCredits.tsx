import React, { useCallback, useEffect, useState } from 'react';
import CreditPackageCard from '../components/payments/CreditPackageCard';
import MockPaymentModal from '../components/payments/MockPaymentModal';
import { useAuth } from '@shared/contexts/AuthContext';
import './BuyCredits.css';

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  isPopular?: boolean;
  isBestValue?: boolean;
  features: string[];
}

export interface Transaction {
  id: string;
  packageId: string;
  credits: number;
  amount: number;
  timestamp: string;
  status: 'completed' | 'failed' | 'pending';
}

export interface PaymentError {
  code: string;
  message: string;
  retryable: boolean;
}

export interface UserProfile {
  username: string;
  email?: string;
  tier: 'free' | 'byok' | 'premium';
  credits: number;
  created_at?: string;
  last_active?: string;
}

const creditPackages: CreditPackage[] = [
  {
    id: 'starter',
    name: 'Starter Pack',
    credits: 500,
    price: 5.00,
    features: ['Perfect for trying premium features', '~25 story generations']
  },
  {
    id: 'popular',
    name: 'Popular Pack',
    credits: 1200,
    price: 10.00,
    isPopular: true,
    features: ['Most chosen by users', '~60 story generations', '20% bonus credits']
  },
  {
    id: 'value',
    name: 'Best Value Pack',
    credits: 3000,
    price: 20.00,
    isBestValue: true,
    features: ['Maximum savings', '~150 story generations', '50% bonus credits']
  },
  {
    id: 'professional',
    name: 'Professional Pack',
    credits: 6000,
    price: 35.00,
    features: ['For heavy users', '~300 story generations', '71% bonus credits']
  }
];

const BuyCredits: React.FC = () => {
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { userProfile: authUserProfile, refreshCredits } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Memoize fetchUserProfile to avoid redefining on every render
  const fetchUserProfile = useCallback(async () => {
    if (!authUserProfile?.username) return;
    
    try {
      const response = await fetch(`/api/user/profile`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const profile = await response.json();
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    } finally {
      setLoading(false);
    }
  }, [authUserProfile?.username]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const handlePackageSelect = (pkg: CreditPackage) => {
    setSelectedPackage(pkg);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async (transaction: Transaction) => {
    // Update local user profile with new credits
    if (userProfile) {
      setUserProfile({
        ...userProfile,
        credits: userProfile.credits + transaction.credits
      });
    }
    
    // Refresh credits in AuthContext to update all badges
    await refreshCredits();
    
    setShowPaymentModal(false);
    setSelectedPackage(null);
    
    // Show success notification
    console.log('Payment successful:', transaction);
  };

  const handlePaymentError = (error: PaymentError) => {
    console.error('Payment failed:', error);
    // Modal will handle error display
  };

  if (loading) {
    return (
      <div className="buy-credits-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="buy-credits-container">
      <div className="buy-credits-header">
        <h1>💳 Buy Credits</h1>
        <p>Choose a credit package to unlock premium AI features</p>
        {userProfile && (
          <div className="current-balance">
            Current balance: <strong>{userProfile.credits.toLocaleString()} credits</strong>
          </div>
        )}
      </div>

      <div className="packages-grid">
        {creditPackages.map(pkg => (
          <CreditPackageCard 
            key={pkg.id}
            package={pkg}
            onSelect={() => handlePackageSelect(pkg)}
          />
        ))}
      </div>

      {showPaymentModal && selectedPackage && (
        <MockPaymentModal
          package={selectedPackage}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedPackage(null);
          }}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
        />
      )}
    </div>
  );
};

export default BuyCredits;
