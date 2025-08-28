import React from 'react';
import '../ScenarioWriter/common/TabStylesNew.css';

interface ActionButtonProps {
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
  variant?: 'primary' | 'danger' | 'success' | 'default';
  className?: string;
  title?: string;
  disabled?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ 
  onClick, 
  label, 
  icon, 
  variant = 'primary', 
  className = '',
  title,
  disabled = false
}) => {
  const buttonClass = `tab-btn tab-btn-${variant} ${className} ${disabled ? 'disabled' : ''}`;
  
  return (
    <button 
      className={buttonClass}
      onClick={disabled ? undefined : onClick} 
      title={title}
      disabled={disabled}
    >
      {icon && <span className="tab-btn-icon">{icon}</span>}
      {label}
    </button>
  );
};

export default ActionButton;
