import type { ButtonHTMLAttributes, ReactNode } from 'react';
import React from 'react';
import { RiLoader4Line, RiSettings3Line } from 'react-icons/ri';
import { useTheme } from '../../providers/ThemeProvider';
import './IconButton.css';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  /** Custom icon to display. If not provided, a default icon will be used */
  icon?: ReactNode;
  /** Whether the button is in an active/busy state */
  active?: boolean;
  /** Show a busy spinner and prevent further clicks */
  busy?: boolean;
  /** Custom width for the button */
  width?: string | number;
  /** Custom height for the button */
  height?: string | number;
  /** Click handler that receives the click event */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /** Additional CSS class name */
  className?: string;
  /** Button size */
  size?: 'sm' | 'm' | 'l' | 'xl';
  variant?: "primary" | "secondary" | "danger" | "success" | "ghost";
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon = <RiSettings3Line />,
  active = false,
  busy = false,
  width,
  height,
  onClick,
  className = '',
  disabled,
  style,
  size = 'm',
  variant = 'primary',
  ...props
}) => {
  const { resolvedTheme } = useTheme();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!active && !busy && !disabled && onClick) {
      onClick(event);
    }
  };

  const buttonStyle = {
    width,
    height,
    ...style,
  };

  const buttonClasses = [
    'icon-button',
    `icon-button--${size}`,
    active ? 'icon-button--active' : '',
    busy ? 'icon-button--busy' : '',
    disabled ? 'icon-button--disabled' : '',
    `icon-button--${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      {...props}
      type="button"
      className={buttonClasses}
      style={buttonStyle}
      onClick={handleClick}
      disabled={disabled || active || busy}
      aria-pressed={active}
      aria-busy={busy}
      data-theme={resolvedTheme}
    >
      <span className={`icon-button__icon ${busy ? 'icon-button__icon--spinning' : ''}`}>
        {busy ? <RiLoader4Line /> : icon}
      </span>
    </button>
  );
};
