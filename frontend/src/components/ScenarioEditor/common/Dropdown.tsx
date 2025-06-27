import React, { useEffect, useRef, useState } from 'react';
import './Dropdown.css';

export interface DropdownProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  error?: string;
  className?: string;
  icon?: React.ReactNode;
  onIconClick?: () => void;
  renderOption?: (option: string) => React.ReactNode;
  renderValue?: (value: string) => React.ReactNode;
}

export const Dropdown: React.FC<DropdownProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select an option...',
  disabled = false,
  readOnly = false,
  error,
  className = '',
  icon,
  onIconClick,
  renderOption,
  renderValue,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const footerHeight = 60; // Footer height
      const dropdownHeight = 200; // Max height of dropdown options
      
      // Check if there's enough space below, accounting for footer
      const spaceBelow = windowHeight - footerHeight - rect.bottom;
      setOpenUpward(spaceBelow < dropdownHeight);
    }
  }, [isOpen]);

  const handleInputClick = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  const handleOptionClick = (option: string) => {
    onChange(option);
    setIsOpen(false);
  };

  const handleIconClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onIconClick) {
      onIconClick();
    }
  };

  const baseClasses = 'dropdown-field';
  const errorClass = error ? 'dropdown-field--error' : '';
  const disabledClass = disabled ? 'dropdown-field--disabled' : '';
  const iconClass = icon ? 'dropdown-field--with-icon' : '';

  const containerClasses = [
    baseClasses,
    errorClass,
    disabledClass,
    iconClass,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClasses} ref={dropdownRef}>
      {label && (
        <label className="dropdown-field__label">{label}</label>
      )}
      <div className="dropdown-field__wrapper">
        {icon && (
          <button
            type="button"
            onClick={handleIconClick}
            className="dropdown-field__icon"
            disabled={disabled}
          >
            {icon}
          </button>
        )}
        {(readOnly && renderValue) ? (
          <div
            onClick={handleInputClick}
            onBlur={() => setTimeout(() => setIsOpen(false), 200)}
            className="dropdown-field__input dropdown-field__input--readonly"
            tabIndex={disabled ? -1 : 0}
          >
            {value ? renderValue(value) : <span className="dropdown-field__placeholder">{placeholder}</span>}
          </div>
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => !readOnly && onChange(e.target.value)}
            onClick={handleInputClick}
            onBlur={() => setTimeout(() => setIsOpen(false), 200)}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readOnly}
            className="dropdown-field__input"
          />
        )}
        {isOpen && !disabled && (
          <ul className={`dropdown-field__options ${openUpward ? 'dropdown-field__options--upward' : ''}`}>
            {options.map((option, index) => (
              <li
                key={index}
                onClick={() => handleOptionClick(option)}
                className="dropdown-field__option"
              >
                {renderOption ? renderOption(option) : option}
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && <span className="dropdown-field__error">{error}</span>}
    </div>
  );
};
