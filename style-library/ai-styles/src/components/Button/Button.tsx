import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';
import React from 'react';
import { RiLoader4Line } from 'react-icons/ri';
import './Button.css';

// Base props that all button variants share
interface BaseButtonProps {
  /** Button label (text) */
  children: ReactNode;
  /** Optional icon to display left of the text */
  icon?: ReactNode;
  /** Show a busy spinner and prevent further clicks */
  busy?: boolean;
  /** Additional CSS class name */
  className?: string;
  /** Custom width for the button */
  width?: string | number;
  /** Custom height for the button */
  height?: string | number;
  /** Button variant style */
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost' | 'success';
  /** Button size */
  size?: 'sm' | 'm' | 'l' | 'xl';
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Custom style */
  style?: React.CSSProperties;
}

// Polymorphic component props that includes the 'as' prop
type PolymorphicButtonProps<C extends ElementType = 'button'> = BaseButtonProps & {
  /** The component to render as (default: 'button') */
  as?: C;
} & Omit<ComponentPropsWithoutRef<C>, keyof BaseButtonProps>;

// Legacy ButtonProps for backward compatibility (extends base with 'as' optional)
export interface ButtonProps extends BaseButtonProps {
  /** The component to render as (default: 'button') */
  as?: 'button';
  /** Click handler that receives the click event */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

// Component function with proper overloads
export function Button<C extends ElementType = 'button'>(
  props: PolymorphicButtonProps<C>
): React.ReactElement {
  const {
    children,
    icon,
    busy = false,
    className = '',
    disabled,
    width,
    height,
    style,
    variant = 'primary',
    size = 'm',
    as,
    onClick,
    ...rest
  } = props;

  const Component = (as || 'button') as ElementType;
  
  const buttonStyle = {
    width,
    height,
    ...style,
  };

  const buttonClasses = [
    'ai-button',
    `ai-button--${variant}`,
    `ai-button--${size}`,
    busy ? 'ai-button--busy' : '',
    disabled ? 'ai-button--disabled' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // Handle click events with proper typing
  const handleClick = (event: React.MouseEvent<any>) => {
    if (!busy && !disabled && onClick) {
      onClick(event);
    }
  };

  // Create component-specific props
  if (Component === 'button') {
    return (
      <button
        {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}
        type="button"
        className={buttonClasses}
        style={buttonStyle}
        onClick={handleClick}
        disabled={disabled || busy}
        aria-busy={busy}
      >
        {busy ? (
          <span className="ai-button__spinner">
            <RiLoader4Line className="ai-button__spinner-icon" />
          </span>
        ) : (
          icon && <span className="ai-button__icon">{icon}</span>
        )}
        <span className="ai-button__label">{children}</span>
      </button>
    );
  }

  // For non-button elements
  return (
    <Component
      {...rest}
      className={buttonClasses}
      style={buttonStyle}
      onClick={handleClick}
      aria-disabled={disabled || busy}
      role="button"
      tabIndex={disabled || busy ? -1 : 0}
    >
      {busy ? (
        <span className="ai-button__spinner">
          <RiLoader4Line className="ai-button__spinner-icon" />
        </span>
      ) : (
        icon && <span className="ai-button__icon">{icon}</span>
      )}
      <span className="ai-button__label">{children}</span>
    </Component>
  );
}

// Export the polymorphic props type for external use
export type { PolymorphicButtonProps };
