import React from 'react';
import ActionButton from './ActionButton';
import './AIGenerateInput.css';

interface AIGenerateTextareaProps {
  value: string;
  onChange: (v: string) => void;
  onAIGenerate: () => void;
  loading?: boolean;
  placeholder?: string;
  label?: string;
  error?: string | null;
  disabled?: boolean;
  minRows?: number;
}

const AIGenerateTextarea: React.FC<AIGenerateTextareaProps> = ({
  value,
  onChange,
  onAIGenerate,
  loading = false,
  placeholder = '',
  label,
  error,
  disabled = false,
  minRows = 4,
}) => {
  return (
    <div className="ai-generate-input-wrapper">
      {label && <label className="ai-generate-label">{label}</label>}
      <div className="ai-generate-input-container">
        <textarea
          className="ai-generate-input"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled || loading}
          style={{ resize: 'vertical', minHeight: minRows * 24 }}
        />
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

export default AIGenerateTextarea;
