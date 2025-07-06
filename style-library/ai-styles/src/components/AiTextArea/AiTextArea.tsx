import type { ReactNode, TextareaHTMLAttributes } from 'react';
import React, { useState } from 'react';
import { RiAiGenerate2, RiCloseLine } from 'react-icons/ri';
import { useTheme } from '../../providers/ThemeProvider';
import { IconButton } from '../IconButton/IconButton';
import './AiTextArea.css';

export interface AiTextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  /** Label text for the textarea */
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
  /** Callback when textarea value changes */
  onChange?: (value: string) => void;
  /** Whether the AI button is in active/busy state */
  aiActive?: boolean;
  /** Additional CSS class name */
  className?: string;
  /** Current value of the textarea */
  value?: string;
  /** Textarea size */
  size?: 'sm' | 'm' | 'l' | 'xl';
}

export const AiTextArea: React.FC<AiTextAreaProps> = ({
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
  size = 'm',
  ...props
}) => {
  const { resolvedTheme: theme } = useTheme();
  const [internalValue, setInternalValue] = useState('');
  const [validationError, setValidationError] = useState<string>('');

  const value = controlledValue !== undefined ? controlledValue : internalValue;
  const isControlled = controlledValue !== undefined;

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
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
    'ai-textarea',
    `ai-textarea--${size}`,
    hasError ? 'ai-textarea--error' : '',
    hasSuccess ? 'ai-textarea--success' : '',
    disabled ? 'ai-textarea--disabled' : '',
    `ai-textarea--${theme}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const textareaClasses = [
    'ai-textarea__input',
    `ai-textarea__input--${size}`,
    hasError ? 'ai-textarea__input--error' : '',
    hasSuccess ? 'ai-textarea__input--success' : '',
    `ai-textarea__input--${theme}`,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClasses}>
      {label && (
        <label className="ai-textarea__label" htmlFor={props.id}>
          {label}
        </label>
      )}

      <div className="ai-textarea__input-container">
        <textarea
          {...props}
          className={textareaClasses}
          value={value}
          onChange={handleInputChange}
          disabled={disabled}
          placeholder={placeholder}
        />

        <div className="ai-textarea__buttons">
          {value && (
            <IconButton
              icon={clearIcon}
              onClick={handleClearClick}
              disabled={disabled}
              className="ai-textarea__clear-button"
              size={size}
              title="Clear text"
            />
          )}

          <IconButton
            icon={aiIcon}
            onClick={handleAiClick}
            active={aiActive}
            disabled={disabled}
            className="ai-textarea__ai-button"
            size={size}
            title="Generate with AI"
          />
        </div>
      </div>

      {displayError && (
        <div className="ai-textarea__message ai-textarea__message--error">
          {displayError}
        </div>
      )}

      {successMessage && !hasError && (
        <div className="ai-textarea__message ai-textarea__message--success">
          {successMessage}
        </div>
      )}

      {infoMessage && !hasError && !hasSuccess && (
        <div className="ai-textarea__message ai-textarea__message--info">
          {infoMessage}
        </div>
      )}
    </div>
  );
};
