import React from 'react';
import ActionButton from './ActionButton';

interface AIGenerateButtonProps {
  loading: boolean;
  onClick: () => void;
  label?: string;
  className?: string;
  title?: string;
  disabled?: boolean;
}

const AIGenerateButton: React.FC<AIGenerateButtonProps> = ({
  loading,
  onClick,
  label = '✨',
  className = '',
  title = 'Generate with ✨',
  disabled = false
}) => (
  <ActionButton
    onClick={onClick}
    label={loading ? 'Generating...' : label}
    variant={loading ? 'default' : 'success'}
    className={className}
    title={title}
    disabled={loading || disabled}
  />
);

export default AIGenerateButton;
