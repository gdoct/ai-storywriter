import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wizard, WizardStep, Button } from '@drdata/ai-styles';
import {
  RiMagicLine,
  RiSettings3Line,
  RiPencilLine,
  RiBookOpenLine,
  RiStoreLine,
  RiSearchLine,
  RiArrowRightLine,
  RiCheckLine,
  RiCpuLine,
  RiUserLine
} from 'react-icons/ri';

interface WelcomeWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const WelcomeWizard: React.FC<WelcomeWizardProps> = ({ isOpen, onClose, onComplete }) => {
  const navigate = useNavigate();
  const [hasClosedWizard, setHasClosedWizard] = useState(false);

  const handleNavigateAndClose = (path: string) => {
    setHasClosedWizard(true);
    onComplete();
    // Small delay to allow wizard to close gracefully before navigation
    setTimeout(() => {
      navigate(path);
    }, 300);
  };

  const steps: WizardStep[] = [
    {
      title: 'Configure AI back end',
      content: (
        <div style={{
          padding: '1.5rem',
          minHeight: '300px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <RiCpuLine
              size={48}
              style={{
                color: 'var(--color-primary)',
                marginBottom: '1rem'
              }}
            />
            <Button
              variant="primary"
              onClick={() => handleNavigateAndClose('/settings')}
              icon={<RiArrowRightLine />}
            >
              Configure LLM Settings
            </Button>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <p style={{
              fontSize: '1rem',
              color: 'var(--color-text-secondary)',
              marginBottom: '1.5rem',
              textAlign: 'center',
              lineHeight: '1.6'
            }}>You appear not to have configured the AI services yet.
              Configure your preferred Large Language Model (LLM) to power your story generation.
              You can connect to local models like Ollama, LM Studio, or cloud services.
            </p>

          </div>
        </div>
      ),
    },
  ];

  const handleComplete = () => {
    setHasClosedWizard(true);
    onComplete();
  };

  // Don't render if already closed via navigation
  if (hasClosedWizard) {
    return null;
  }

  return (
    <Wizard
      open={isOpen}
      steps={steps}
      onClose={onClose}
      onComplete={handleComplete}
      allowSkip={true}
      showProgress={false}
    />
  );
};

export default WelcomeWizard;