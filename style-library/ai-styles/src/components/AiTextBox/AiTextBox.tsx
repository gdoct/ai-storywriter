import type { InputHTMLAttributes, ReactNode } from 'react';
import React, { useState } from 'react';
import { RiAiGenerate2, RiCloseLine } from 'react-icons/ri';
import { IconButton } from '../IconButton/IconButton';
import './AiTextBox.css';

export interface AiTextBoxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  /** Label text for the input */
  label?: string;
  /** Error message to display */
  errorMessage?: string;
  /** Success message to display */
  successMessage?: string;
  /** Info message to display */
  infoMessage?: string;
  /** Validation callback function */
  validation?: (value: string) => boolean | string;
  /** Custom icon for the AI button */
  aiIcon?: ReactNode;
  /** Custom icon for the clear button */
  clearIcon?: ReactNode;
  /** Callback when AI button is clicked */
  onAiClick?: (value: string) => void;
  /** Callback when clear button is clicked */
  onClear?: () => void;
  /** Callback when input value changes */
  onChange?: (value: string) => void;
  /** Whether the AI button is in active/busy state */
  aiActive?: boolean;
  /** Additional CSS class name */
  className?: string;
  /** Current value of the input */
  value?: string;
  /** Input size */
  componentSize?: 'sm' | 'm' | 'l' | 'xl';
}

export const AiTextBox: React.FC<AiTextBoxProps> = ({
  label,
  errorMessage,
  successMessage,
  infoMessage,
  validation,
  aiIcon = <RiAiGenerate2 />,
  clearIcon = <RiCloseLine />,
  onAiClick,
  onClear,
  onChange,
  aiActive = false,
  className = '',
  value: controlledValue,
  disabled,
  placeholder = 'Enter text...',
  componentSize = 'm',
  ...props
}) => {
  const [internalValue, setInternalValue] = useState('');
  const [validationError, setValidationError] = useState<string>('');
  
  const value = controlledValue !== undefined ? controlledValue : internalValue;
  const isControlled = controlledValue !== undefined;

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    
    if (!isControlled) {
      setInternalValue(newValue);
    }
    
    // Run validation
    if (validation) {
      const validationResult = validation(newValue);
      if (typeof validationResult === 'string') {
        setValidationError(validationResult);
      } else if (!validationResult) {
        setValidationError('Invalid input');
      } else {
        setValidationError('');
      }
    }
    
    if (onChange) {
      onChange(newValue);
    }
  };

  const handleAiClick = () => {
    if (!aiActive && !disabled && onAiClick) {
      onAiClick(value);
    }
  };

  const handleClearClick = () => {
    if (!disabled) {
      if (!isControlled) {
        setInternalValue('');
      }
      setValidationError('');
      if (onClear) {
        onClear();
      }
      if (onChange) {
        onChange('');
      }
    }
  };
  const displayError = validationError || errorMessage;
  const hasError = Boolean(displayError);
  const hasSuccess = Boolean(successMessage);

  const containerClasses = [
    'ai-textbox',
    `ai-textbox--${componentSize}`,
    hasError ? 'ai-textbox--error' : '',
    hasSuccess ? 'ai-textbox--success' : '',
    disabled ? 'ai-textbox--disabled' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const inputClasses = [
    'ai-textbox__input',
    `ai-textbox__input--${componentSize}`,
    hasError ? 'ai-textbox__input--error' : '',
    hasSuccess ? 'ai-textbox__input--success' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClasses}>
      {label && (
        <label className="ai-textbox__label" htmlFor={props.id}>
          {label}
        </label>
      )}
      
      <div className="ai-textbox__input-container">
        <input
          {...props}
          type="text"
          className={inputClasses}
          value={value}
          onChange={handleInputChange}
          disabled={disabled}
          placeholder={placeholder}
        />
        
        <div className="ai-textbox__buttons">
          {value && (
            <IconButton
              icon={clearIcon}
              onClick={handleClearClick}
              disabled={disabled}
              className="ai-textbox__clear-button"
              size={componentSize}
              title="Clear text"
            />
          )}
          
          <IconButton
            icon={aiIcon}
            onClick={handleAiClick}
            active={aiActive}
            disabled={disabled}
            className="ai-textbox__ai-button"
            size={componentSize}
            title="Generate with AI"
          />
        </div>
      </div>
      
      {displayError && (
        <div className="ai-textbox__message ai-textbox__message--error">
          {displayError}
        </div>
      )}
      
      {successMessage && !hasError && (
        <div className="ai-textbox__message ai-textbox__message--success">
          {successMessage}
        </div>
      )}
      
      {infoMessage && !hasError && !hasSuccess && (
        <div className="ai-textbox__message ai-textbox__message--info">
          {infoMessage}
        </div>
      )}
    </div>
  );
};
