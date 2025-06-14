import React from 'react';
import ActionButton from './ActionButton';
import './AIGenerateInput.css';

interface AIGenerateInputProps {
  value: string;
  onChange: (v: string) => void;
  onAIGenerate: () => void;
  loading?: boolean;
  placeholder?: string;
  label?: string;
  error?: string | null;
  textarea?: boolean;
  disabled?: boolean;
}

const AIGenerateInput: React.FC<AIGenerateInputProps> = ({
  value,
  onChange,
  onAIGenerate,
  loading = false,
  placeholder = '',
  label,
  error,
  textarea = false,
  disabled = false,
}) => {
  return (
    <div className="ai-generate-input-wrapper">
      {label && <label className="ai-generate-label">{label}</label>}
      <div className="ai-generate-input-container">
        {textarea ? (
          <textarea
            className="ai-generate-input"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled || loading}
            style={{ resize: 'vertical', minHeight: 80 }}
          />
        ) : (
          <input
            className="ai-generate-input"
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled || loading}
          />
        )}
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

export default AIGenerateInput;
