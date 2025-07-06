import type { InputHTMLAttributes, ReactNode } from 'react';
import React, { useEffect, useRef, useState } from 'react';
import { RiAiGenerate2, RiArrowDownSLine, RiCloseLine } from 'react-icons/ri';
import { IconButton } from '../IconButton/IconButton';
import './AiDropdown.css';

export interface DropdownOption {
  /** Unique identifier for the option */
  value: string;
  /** Display text for the option */
  label: string;
  /** Whether the option is disabled */
  disabled?: boolean;
}

export interface AiDropdownProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'onSelect'> {
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
  /** Custom icon for the dropdown toggle */
  dropdownIcon?: ReactNode;
  /** Callback when AI button is clicked */
  onAiClick?: (value: string) => void;
  /** Callback when clear button is clicked */
  onClear?: () => void;
  /** Callback when input value changes */
  onChange?: (value: string) => void;
  /** Callback when an option is selected from dropdown */
  onSelect?: (option: DropdownOption) => void;
  /** Whether the AI button is in active/busy state */
  aiActive?: boolean;
  /** Additional CSS class name */
  className?: string;
  /** Current value of the input */
  value?: string;
  /** Dropdown options */
  options?: DropdownOption[];
  /** Whether dropdown is open */
  isOpen?: boolean;
  /** Callback when dropdown open state changes */
  onOpenChange?: (isOpen: boolean) => void;
  /** Maximum height for dropdown */
  maxDropdownHeight?: string;
  /** Whether to filter options based on input value */
  filterable?: boolean;
  /** Custom filter function */
  filterFn?: (option: DropdownOption, inputValue: string) => boolean;
  /** Custom render function for dropdown options */
  renderOption?: (option: DropdownOption) => ReactNode;
  /** Custom render function for the selected value display */
  renderValue?: (value: string) => ReactNode;
  /** Dropdown size */
  componentSize?: 'sm' | 'm' | 'l' | 'xl';
  /** read-only */
  isReadOnly?: boolean;
}

export const AiDropdown: React.FC<AiDropdownProps> = ({
  label,
  errorMessage,
  successMessage,
  infoMessage,
  validation,
  aiIcon = <RiAiGenerate2 />,
  clearIcon = <RiCloseLine />,
  dropdownIcon = <RiArrowDownSLine />,
  onAiClick,
  onClear,
  onChange,
  onSelect,
  aiActive = false,
  className = '',
  value: controlledValue,
  disabled,
  placeholder = 'Enter text...',
  options = [],
  isOpen: controlledIsOpen,
  onOpenChange,
  maxDropdownHeight = '200px',
  filterable = true,
  filterFn,
  renderOption,
  renderValue,
  componentSize = 'm',
  ...props
}) => {
  const [internalValue, setInternalValue] = useState('');
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [validationError, setValidationError] = useState<string>('');
  const [focusedOptionIndex, setFocusedOptionIndex] = useState<number>(-1);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const value = controlledValue !== undefined ? controlledValue : internalValue;
  const isControlled = controlledValue !== undefined;
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const isOpenControlled = controlledIsOpen !== undefined;

  // Find the currently selected option for custom rendering
  const selectedOption = options.find(option => option.value === value) || null;

  // Filter options based on input value
  const filteredOptions = filterable && value && !selectedOption
    ? options.filter(option => {
        if (filterFn) {
          return filterFn(option, value);
        }
        return option.label.toLowerCase().includes(value.toLowerCase()) ||
               option.value.toLowerCase().includes(value.toLowerCase());
      })
    : options;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        handleSetIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Reset focused option when options change
  useEffect(() => {
    setFocusedOptionIndex(-1);
  }, [filteredOptions]);

  const handleSetIsOpen = (newIsOpen: boolean) => {
    if (!isOpenControlled) {
      setInternalIsOpen(newIsOpen);
    }
    if (onOpenChange) {
      onOpenChange(newIsOpen);
    }
  };

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

    // Open dropdown when typing
    if (!isOpen && newValue) {
      handleSetIsOpen(true);
    }
  };

  const handleInputFocus = () => {
    if (filteredOptions.length > 0) {
      handleSetIsOpen(true);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (event.key === 'ArrowDown' || event.key === 'Enter') {
        event.preventDefault();
        handleSetIsOpen(true);
        setFocusedOptionIndex(0);
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setFocusedOptionIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setFocusedOptionIndex(prev => 
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case 'Enter':
        event.preventDefault();
        if (focusedOptionIndex >= 0 && focusedOptionIndex < filteredOptions.length) {
          handleOptionSelect(filteredOptions[focusedOptionIndex]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        handleSetIsOpen(false);
        inputRef.current?.focus();
        break;
      case 'Tab':
        handleSetIsOpen(false);
        break;
    }
  };

  const handleDropdownToggle = () => {
    if (!disabled) {
      handleSetIsOpen(!isOpen);
      if (!isOpen) {
        setFocusedOptionIndex(0);
      }
    }
  };

  const handleOptionSelect = (option: DropdownOption) => {
    if (option.disabled) return;

    if (!isControlled) {
      setInternalValue(option.value);
    }
    
    if (onChange) {
      onChange(option.value);
    }
    
    if (onSelect) {
      onSelect(option);
    }
    
    handleSetIsOpen(false);
    inputRef.current?.focus();
    console.debug('Dropdown closed after option select');
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
      handleSetIsOpen(false);
      if (onClear) {
        onClear();
      }
      if (onChange) {
        onChange('');
      }
      inputRef.current?.focus();
    }
  };

  const displayError = validationError || errorMessage;
  const hasError = Boolean(displayError);
  const hasSuccess = Boolean(successMessage);

  // Get display value for input field
  const getDisplayValue = () => {
    if (renderValue) {
      const customValue = renderValue(value);
      // If custom render returns a string, use it directly
      // If it returns a ReactNode, we need to handle it differently
      if (typeof customValue === 'string') {
        return customValue;
      }
      // For non-string ReactNodes, fall back to the raw value
      return value;
    }
    return value;
  };

  // Get content for option rendering
  const getOptionContent = (option: DropdownOption) => {
    if (renderOption) {
      return renderOption(option);
    }
    return option.label;
  };

  const containerClasses = [
    'ai-dropdown',
    `ai-dropdown--${componentSize}`,
    hasError ? 'ai-dropdown--error' : '',
    hasSuccess ? 'ai-dropdown--success' : '',
    disabled ? 'ai-dropdown--disabled' : '',
    isOpen ? 'ai-dropdown--open' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const inputClasses = [
    'ai-dropdown__input',
    `ai-dropdown__input--${componentSize}`,
    hasError ? 'ai-dropdown__input--error' : '',
    hasSuccess ? 'ai-dropdown__input--success' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClasses} ref={containerRef}>
      {label && (
        <label className="ai-dropdown__label" htmlFor={props.id}>
          {label}
        </label>
      )}
      
      <div className="ai-dropdown__input-container">
        <input
          {...props}
          ref={inputRef}
          type="text"
          className={inputClasses}
          value={getDisplayValue()}
          onChange={props.isReadOnly ? undefined : handleInputChange} // Disable onChange when isReadOnly
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          disabled={disabled || props.isReadOnly} // Disable input when isReadOnly
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-autocomplete="list"
        />
        
        <div className="ai-dropdown__buttons">
          {value && (
            <IconButton
              icon={clearIcon}
              onClick={handleClearClick}
              disabled={disabled}
              className="ai-dropdown__clear-button"
              size={componentSize}
              title="Clear text"
            />
          )}
          
          <IconButton
            icon={dropdownIcon}
            onClick={handleDropdownToggle}
            disabled={disabled}
            className={`ai-dropdown__toggle-button ${isOpen ? 'ai-dropdown__toggle-button--open' : ''}`}
            size={componentSize}
            title="Toggle dropdown"
          />
          
          <IconButton
            icon={aiIcon}
            onClick={handleAiClick}
            active={aiActive}
            disabled={disabled}
            className="ai-dropdown__ai-button"
            size={componentSize}
            title="Generate with AI"
          />
        </div>
      </div>

      {isOpen && filteredOptions.length > 0 && (
        <div 
          className="ai-dropdown__dropdown"
          ref={dropdownRef}
          style={{ maxHeight: maxDropdownHeight }}
          role="listbox"
        >
          {filteredOptions.map((option, index) => (
            <div
              key={option.value}
              className={`ai-dropdown__option ${
                index === focusedOptionIndex ? 'ai-dropdown__option--focused' : ''
              } ${option.disabled ? 'ai-dropdown__option--disabled' : ''}`}
              onClick={() => handleOptionSelect(option)}
              role="option"
              aria-selected={value === option.value}
              aria-disabled={option.disabled}
            >
              {getOptionContent(option)}
            </div>
          ))}
        </div>
      )}
      
      {displayError && (
        <div className="ai-dropdown__message ai-dropdown__message--error">
          {displayError}
        </div>
      )}
      
      {successMessage && !hasError && (
        <div className="ai-dropdown__message ai-dropdown__message--success">
          {successMessage}
        </div>
      )}
      
      {infoMessage && !hasError && !hasSuccess && (
        <div className="ai-dropdown__message ai-dropdown__message--info">
          {infoMessage}
        </div>
      )}
    </div>
  );
};
