import React from 'react';
import { useTheme } from '../../providers/ThemeProvider';
import './Toggle.css';

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  id?: string;
  size?: 'sm' | 'm' | 'l' | 'xl';
}

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  disabled = false,
  label,
  id,
  size = 'm',
}) => {
  const { theme } = useTheme();

  return (
    <label className={`ds-toggle ds-toggle--${size} ${theme} ${disabled ? 'ds-toggle--disabled' : ''}`}
      aria-disabled={disabled}
      htmlFor={id}
    >
      <input
        id={id}
        type="checkbox"
        className="ds-toggle__input"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        disabled={disabled}
      />
      <span className="ds-toggle__slider" />
      {label && <span className="ds-toggle__label">{label}</span>}
    </label>
  );
};

export default Toggle;
