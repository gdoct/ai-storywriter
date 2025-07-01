import React from 'react';
import { AiTextBox, AiTextArea, Label } from '@drdata/docomo';

export interface InputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'number';
  disabled?: boolean;
  error?: string;
  required?: boolean;
  className?: string;
  rows?: number; // For textarea
  multiline?: boolean;
  icon?: React.ReactNode;
  onIconClick?: () => void;
}

export const Input: React.FC<InputProps> = ({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled = false,
  error,
  required = false,
  className = '',
  rows = 3,
  multiline = false,
  icon,
  onIconClick,
}) => {
  const handleAiGenerate = () => {
    if (onIconClick) {
      onIconClick();
    }
  };

  const commonProps = {
    value,
    onChange,
    placeholder,
    disabled,
    error,
    className,
    showGenerateButton: Boolean(icon && onIconClick),
    onGenerate: handleAiGenerate,
  };

  return (
    <div style={{ marginBottom: error ? 'var(--spacing-sm)' : 'var(--spacing-md)' }}>
      {label && (
        <Label 
          style={{ 
            marginBottom: 'var(--spacing-xs)',
            display: 'block'
          }}
        >
          {label}
          {required && (
            <span style={{ 
              color: 'var(--color-error)', 
              marginLeft: 'var(--spacing-xs)' 
            }}>
              *
            </span>
          )}
        </Label>
      )}
      
      {multiline ? (
        <AiTextArea
          {...commonProps}
          rows={rows}
        />
      ) : (
        <AiTextBox
          {...commonProps}
          type={type}
        />
      )}
    </div>
  );
};
