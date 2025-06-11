import React, { useState } from 'react';
import { CreditPackage, PaymentError, Transaction } from '../../pages/BuyCredits';
import ErrorState from './ErrorState';
import './MockPaymentModal.css';
import PaymentForm from './PaymentForm';
import ProcessingState from './ProcessingState';
import SuccessState from './SuccessState';

interface MockPaymentModalProps {
  package: CreditPackage;
  onClose: () => void;
  onSuccess: (transaction: Transaction) => void;
  onError: (error: PaymentError) => void;
}

export interface CardDetails {
  number: string;
  expiry: string;
  cvv: string;
  name: string;
}

const MockPaymentModal: React.FC<MockPaymentModalProps> = ({ 
  package: pkg, 
  onClose, 
  onSuccess, 
  onError 
}) => {
  const [paymentState, setPaymentState] = useState<'form' | 'processing' | 'success' | 'error'>('form');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal'>('card');
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [cardDetails, setCardDetails] = useState<CardDetails>({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);
  const [currentError, setCurrentError] = useState<PaymentError | null>(null);

  const handlePayment = async () => {
    setPaymentState('processing');
    
    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create payment request
      const paymentData = {
        packageId: pkg.id,
        credits: pkg.credits,
        amount: pkg.price,
        paymentMethod,
        simulateFailure,
        cardDetails: paymentMethod === 'card' ? cardDetails : null
      };

      // Call backend mock payment endpoint
      const response = await fetch('/api/payment/mock-purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(paymentData)
      });

      const result = await response.json();

      if (result.success) {
        const transaction: Transaction = result.transaction;
        setCurrentTransaction(transaction);
        setPaymentState('success');
        onSuccess(transaction);
      } else {
        const error: PaymentError = result.error;
        setCurrentError(error);
        setPaymentState('error');
        onError(error);
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      const paymentError: PaymentError = {
        code: 'NETWORK_ERROR',
        message: 'Network error occurred. Please try again.',
        retryable: true
      };
      setCurrentError(paymentError);
      setPaymentState('error');
      onError(paymentError);
    }
  };

  const handleRetry = () => {
    setPaymentState('form');
    setCurrentError(null);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && paymentState !== 'processing') {
      onClose();
    }
  };

  return (
    <div className="payment-modal-overlay" onClick={handleOverlayClick}>
      <div className="payment-modal">
        <div className="modal-header">
          <h2>
            {paymentState === 'success' ? '✅ Payment Successful' : 
             paymentState === 'error' ? '❌ Payment Failed' :
             paymentState === 'processing' ? '🔄 Processing Payment' :
             'Complete Your Purchase'}
          </h2>
          {paymentState !== 'processing' && (
            <button className="close-btn" onClick={onClose}>×</button>
          )}
        </div>

        <div className="modal-content">
          {paymentState === 'form' && (
            <PaymentForm 
              package={pkg}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              cardDetails={cardDetails}
              setCardDetails={setCardDetails}
              simulateFailure={simulateFailure}
              setSimulateFailure={setSimulateFailure}
              onSubmit={handlePayment}
              onCancel={onClose}
            />
          )}

          {paymentState === 'processing' && (
            <ProcessingState package={pkg} />
          )}

          {paymentState === 'success' && currentTransaction && (
            <SuccessState 
              package={pkg}
              transaction={currentTransaction}
              onClose={onClose} 
            />
          )}

          {paymentState === 'error' && currentError && (
            <ErrorState 
              error={currentError}
              onRetry={handleRetry}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MockPaymentModal;
