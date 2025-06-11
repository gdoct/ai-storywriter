import React, { useEffect, useState } from 'react';
import { CreditPackage } from '../../pages/BuyCredits';
import './ProcessingState.css';

interface ProcessingStateProps {
  package: CreditPackage;
}

const ProcessingState: React.FC<ProcessingStateProps> = ({ package: pkg }) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('Validating payment details...');

  useEffect(() => {
    const steps = [
      'Validating payment details...',
      'Processing payment...',
      'Confirming transaction...',
      'Updating your account...'
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = Math.min(prev + 25, 100);
        if (newProgress === 25 || newProgress === 50 || newProgress === 75) {
          stepIndex++;
          setCurrentStep(steps[stepIndex] || steps[steps.length - 1]);
        }
        return newProgress;
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="processing-state">
      <div className="processing-icon">
        <div className="spinner"></div>
      </div>
      
      <h3>🔄 Processing Payment</h3>
      
      <p className="processing-message">
        Please wait while we process your payment for the <strong>{pkg.name}</strong>...
      </p>
      
      <div className="progress-container">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="progress-text">{progress}%</div>
      </div>
      
      <div className="current-step">
        {currentStep}
      </div>
      
      <div className="processing-warning">
        <p>⚠️ Do not close this window</p>
      </div>
    </div>
  );
};

export default ProcessingState;
