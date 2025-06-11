import React from 'react';
import { CreditPackage, Transaction } from '../../pages/BuyCredits';
import './SuccessState.css';

interface SuccessStateProps {
  package: CreditPackage;
  transaction: Transaction;
  onClose: () => void;
}

const SuccessState: React.FC<SuccessStateProps> = ({ package: pkg, transaction, onClose }) => {
  return (
    <div className="success-state">
      <div className="success-icon">
        <div className="checkmark-circle">
          <div className="checkmark">✓</div>
        </div>
      </div>
      
      <h3>✅ Success!</h3>
      
      <p className="success-message">
        Your payment has been processed successfully!
      </p>
      
      <div className="success-details">
        <div className="credits-added">
          🎉 {pkg.credits.toLocaleString()} credits added to your account! 🎉
        </div>
        
        <div className="transaction-info">
          <div className="info-row">
            <span>Package:</span>
            <span>{pkg.name}</span>
          </div>
          <div className="info-row">
            <span>Amount:</span>
            <span>€{pkg.price.toFixed(2)}</span>
          </div>
          <div className="info-row">
            <span>Transaction ID:</span>
            <span className="transaction-id">{transaction.id}</span>
          </div>
          <div className="info-row">
            <span>Date:</span>
            <span>{new Date(transaction.timestamp).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
      
      <div className="success-actions">
        <button 
          className="continue-btn primary-btn"
          onClick={onClose}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default SuccessState;
