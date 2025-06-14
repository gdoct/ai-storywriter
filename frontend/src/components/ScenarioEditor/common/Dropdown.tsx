import React, { useState } from 'react';
import './Dropdown.css';

export interface DropdownProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select an option...',
  disabled = false,
  error,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleInputClick = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  const handleOptionClick = (option: string) => {
    onChange(option);
    setIsOpen(false);
  };

  const baseClasses = 'dropdown-field';
  const errorClass = error ? 'dropdown-field--error' : '';
  const disabledClass = disabled ? 'dropdown-field--disabled' : '';

  const containerClasses = [
    baseClasses,
    errorClass,
    disabledClass,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClasses}>
      {label && (
        <label className="dropdown-field__label">{label}</label>
      )}
      <div className="dropdown-field__wrapper">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onClick={handleInputClick}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          placeholder={placeholder}
          disabled={disabled}
          className="dropdown-field__input"
        />
        {isOpen && !disabled && (
          <ul className="dropdown-field__options">
            {options.map((option, index) => (
              <li
                key={index}
                onClick={() => handleOptionClick(option)}
                className="dropdown-field__option"
              >
                {option}
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && <span className="dropdown-field__error">{error}</span>}
    </div>
  );
};
