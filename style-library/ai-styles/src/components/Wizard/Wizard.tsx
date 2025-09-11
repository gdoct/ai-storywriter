import React, { useState } from 'react';
import type { ReactNode } from 'react';
import ReactDOM from 'react-dom';
import { RiArrowLeftLine, RiArrowRightLine, RiCloseLine } from 'react-icons/ri';
import { useTheme } from '../../providers/ThemeProvider';
import { Button } from '../Button/Button';
import './Wizard.css';

export interface WizardStep {
  title: string;
  content: ReactNode;
}

export interface WizardProps {
  /** Array of wizard steps */
  steps: WizardStep[];
  /** Callback when wizard is closed */
  onClose: () => void;
  /** Callback when wizard is completed */
  onComplete: () => void;
  /** Whether users can skip steps (shows finish button on all steps) */
  allowSkip?: boolean;
  /** Whether the wizard is open */
  open?: boolean;
  /** Whether to show the progress indicator (step x of y) */
  showProgress?: boolean;
}

export const Wizard: React.FC<WizardProps> = ({
  steps,
  onClose,
  onComplete,
  allowSkip = false,
  open = true,
  showProgress = true,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const { resolvedTheme: theme } = useTheme();

  if (!open || steps.length === 0) return null;

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = () => {
    onComplete();
  };

  const wizardClasses = [
    'wizard-dialog',
    `wizard-dialog--${theme}`,
  ].join(' ');

  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  return ReactDOM.createPortal(
    <div className={`wizard-overlay wizard-overlay--${theme}`}>
      <div className={wizardClasses}>
        {/* Header with close button */}
        <div className="wizard-header">
          <button 
            className={`wizard-close-btn wizard-close-btn--${theme}`}
            onClick={onClose}
            aria-label="Close wizard"
          >
            <RiCloseLine />
          </button>
        </div>

        {/* Progress bar */}
        {showProgress && (
          <div className="wizard-progress-container">
            <div className="wizard-progress-bar">
              <div 
                className="wizard-progress-fill"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="wizard-progress-text">
              Step {currentStep + 1} of {steps.length}
            </div>
          </div>
        )}

        {/* Step title */}
        <div className="wizard-step-title">
          <h2>{steps[currentStep].title}</h2>
        </div>

        {/* Step content */}
        <div className="wizard-content">
          {steps[currentStep].content}
        </div>

        {/* Navigation buttons */}
        <div className="wizard-actions">
          <div className="wizard-actions-left">
            {!isFirstStep && (
              <Button
                variant="secondary"
                onClick={handlePrevious}
                icon={<RiArrowLeftLine />}
              >
                Previous
              </Button>
            )}
          </div>
          
          <div className="wizard-actions-right">
            {allowSkip && !isLastStep && (
              <Button
                variant="tertiary"
                onClick={handleFinish}
              >
                Skip to Finish
              </Button>
            )}
            
            {isLastStep ? (
              <Button
                variant="primary"
                onClick={handleFinish}
              >
                Finish
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleNext}
                icon={<RiArrowRightLine />}
              >
                Next
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};