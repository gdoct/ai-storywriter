import React, { useEffect, useState } from 'react';
import { CreditPackage } from '../../pages/BuyCredits';
import { CardDetails } from './MockPaymentModal';
import './PaymentForm.css';

interface PaymentFormProps {
  package: CreditPackage;
  paymentMethod: 'card' | 'paypal';
  setPaymentMethod: (method: 'card' | 'paypal') => void;
  cardDetails: CardDetails;
  setCardDetails: (details: CardDetails) => void;
  simulateFailure: boolean;
  setSimulateFailure: (simulate: boolean) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  package: pkg,
  paymentMethod,
  setPaymentMethod,
  cardDetails,
  setCardDetails,
  simulateFailure,
  setSimulateFailure,
  onSubmit,
  onCancel
}) => {
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    if (paymentMethod === 'card') {
      setIsFormValid(
        (cardDetails.number.length >= 16 &&
          cardDetails.expiry.length >= 5 &&
          cardDetails.cvv.length >= 3 &&
          cardDetails.name.trim().length > 0)
      );
    } else {
      setIsFormValid(true); // PayPal doesn't need form validation
    }
  }, [cardDetails, paymentMethod]);

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setCardDetails({ ...cardDetails, number: formatted });
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiry(e.target.value);
    setCardDetails({ ...cardDetails, expiry: formatted });
  };

  return (
    <div className="payment-form">
      <div className="order-summary">
        <h3>📋 Order Summary</h3>
        <div className="summary-content">
          <div className="summary-line">
            <span>{pkg.name}</span>
            <span>€{pkg.price.toFixed(2)}</span>
          </div>
          <div className="summary-line">
            <span>{pkg.credits.toLocaleString()} Credits</span>
            <span></span>
          </div>
          <div className="summary-divider"></div>
          <div className="summary-total">
            <span>Total</span>
            <span>€{pkg.price.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="payment-methods">
        <h3>💳 Payment Method</h3>
        <div className="method-selector">
          <button 
            className={`method-btn ${paymentMethod === 'card' ? 'active' : ''}`}
            onClick={() => setPaymentMethod('card')}
          >
            💳 Credit Card
          </button>
          <button 
            className={`method-btn ${paymentMethod === 'paypal' ? 'active' : ''}`}
            onClick={() => setPaymentMethod('paypal')}
          >
            🅿️ PayPal
          </button>
        </div>
      </div>

      {paymentMethod === 'card' && (
        <div className="card-form">
          <div className="form-row">
            <label>Card Number</label>
            <input
              type="text"
              placeholder="1234 5678 9012 3456"
              value={cardDetails.number}
              onChange={handleCardNumberChange}
              maxLength={19}
              className="form-input"
            />
          </div>
          <div className="form-row-group">
            <div className="form-row">
              <label>Expiry Date</label>
              <input
                type="text"
                placeholder="MM/YY"
                value={cardDetails.expiry}
                onChange={handleExpiryChange}
                maxLength={5}
                className="form-input"
              />
            </div>
            <div className="form-row">
              <label>CVV</label>
              <input
                type="text"
                placeholder="123"
                value={cardDetails.cvv}
                onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value.replace(/[^0-9]/g, '')})}
                maxLength={4}
                className="form-input"
              />
            </div>
          </div>
          <div className="form-row">
            <label>Cardholder Name</label>
            <input
              type="text"
              placeholder="John Doe"
              value={cardDetails.name}
              onChange={(e) => setCardDetails({...cardDetails, name: e.target.value})}
              className="form-input"
            />
          </div>
        </div>
      )}

      {paymentMethod === 'paypal' && (
        <div className="paypal-info">
          <div className="paypal-notice">
            <p>You will be redirected to PayPal to complete your payment securely.</p>
          </div>
        </div>
      )}

      {/* Development/Testing Controls */}
      <div className="dev-controls">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={simulateFailure}
            onChange={(e) => setSimulateFailure(e.target.checked)}
          />
          <span className="checkmark"></span>
          Simulate payment failure (for testing)
        </label>
      </div>

      <div className="form-actions">
        <button 
          className="cancel-btn secondary-btn"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button 
          className="pay-btn primary-btn"
          onClick={onSubmit}
          disabled={!isFormValid}
        >
          Pay €{pkg.price.toFixed(2)}
        </button>
      </div>
    </div>
  );
};

export default PaymentForm;
