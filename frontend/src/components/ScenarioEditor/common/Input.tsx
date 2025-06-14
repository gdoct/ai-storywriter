import React from 'react';
import './Input.css';

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
}) => {
  const baseClasses = 'input-field';
  const errorClass = error ? 'input-field--error' : '';
  const disabledClass = disabled ? 'input-field--disabled' : '';
  const iconClass = icon ? 'input-field--with-icon' : '';

  const containerClasses = [
    baseClasses,
    errorClass,
    disabledClass,
    iconClass,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const inputElement = multiline ? (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      rows={rows}
      className="input-field__control input-field__textarea"
    />
  ) : (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      className="input-field__control input-field__input"
    />
  );

  return (
    <div className={containerClasses}>
      {label && (
        <label className="input-field__label">
          {label}
          {required && <span className="input-field__required">*</span>}
        </label>
      )}
      <div className="input-field__wrapper">
        {icon && <span className="input-field__icon">{icon}</span>}
        {inputElement}
      </div>
      {error && <span className="input-field__error-text">{error}</span>}
    </div>
  );
};
