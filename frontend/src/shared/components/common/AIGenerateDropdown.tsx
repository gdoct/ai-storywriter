import React from 'react';
import ActionButton from './ActionButton';
import './AIGenerateInput.css';

interface AIGenerateDropdownProps {
  value: string;
  onChange: (v: string) => void;
  onAIGenerate: () => void;
  loading?: boolean;
  placeholder?: string;
  label?: string;
  error?: string | null;
  options: string[];
  disabled?: boolean;
}

const AIGenerateDropdown: React.FC<AIGenerateDropdownProps> = ({
  value,
  onChange,
  onAIGenerate,
  loading = false,
  placeholder = '',
  label,
  error,
  options,
  disabled = false,
}) => {
  return (
    <div className="ai-generate-input-wrapper">
      {label && <label className="ai-generate-label">{label}</label>}
      <div className="ai-generate-input-container" style={{ position: 'relative' }}>
        <input
          className="ai-generate-input"
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled || loading}
          list="ai-generate-dropdown-list"
        />
        <datalist id="ai-generate-dropdown-list">
          {options.map((option, idx) => (
            <option value={option} key={idx} />
          ))}
        </datalist>
        <ActionButton
          onClick={onAIGenerate}
          label={loading ? '...' : '✨'}
          variant="success"
          disabled={loading || disabled}
          className="ai-generate-btn"
          title="Generate with ✨"
        />
      </div>
      {error && <div className="ai-generate-error">{error}</div>}
    </div>
  );
};

export default AIGenerateDropdown;
