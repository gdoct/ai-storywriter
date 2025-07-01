import { AiDropdown, Label } from '@drdata/docomo';
import React from 'react';

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
  onIconClick,
  renderOption,
  renderValue,
}) => {
  const handleAiGenerate = () => {
    if (onIconClick) {
      onIconClick();
    }
  };

  // Convert string options to DropdownOption format for AiDropdown
  const dropdownOptions: Array<{value: string; label: string; disabled?: boolean}> = options.map(option => ({
    value: option,
    label: option,
    disabled: false,
  }));

  // Create render functions that work with DropdownOption objects
  const handleRenderOption = renderOption ? (option: {value: string; label: string; disabled?: boolean}) => renderOption(option.value) : undefined;
  const handleRenderValue = renderValue;

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
        </Label>
      )}
      
      <AiDropdown
        value={value}
        onChange={onChange}
        options={dropdownOptions}
        placeholder={placeholder}
        disabled={disabled || readOnly}
        errorMessage={error}
        className={className}
        onAiClick={onIconClick ? handleAiGenerate : undefined}
        renderOption={handleRenderOption}
        renderValue={handleRenderValue}
       />
    </div>
  );
};