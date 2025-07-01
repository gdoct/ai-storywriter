import { Button as DocomoButton } from '@drdata/docomo';
import React from 'react';

export interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  title?: string;
  as?: React.ElementType;
  to?: string;
  href?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
  type = 'button',
  className = '',
  title = '',
  as,
  to,
  href,
  ...otherProps
}) => {
  // Map custom variants to docomo variants
  const mapVariant = (v: string) => {
    switch (v) {
      case 'ghost': return 'secondary';
      case 'success': return 'primary'; // Map success to primary for now
      default: return v as 'primary' | 'secondary' | 'danger';
    }
  };

  // Map custom sizes to docomo sizes
  const mapSize = (s: string) => {
    switch (s) {
      case 'sm': return 'sm';
      case 'md': return 'm';
      case 'lg': return 'l';
      default: return 'm' as 'sm' | 'm' | 'l' | 'xl';
    }
  };

  return (
    <DocomoButton
      as={as}
      to={to}
      href={href}
      variant={mapVariant(variant)}
      size={mapSize(size)}
      disabled={disabled}
      loading={loading}
      icon={icon}
      fullWidth={fullWidth}
      type={type}
      className={className}
      title={title}
      onClick={onClick}
      style={variant === 'success' ? { 
        background: 'var(--color-success)', 
        borderColor: 'var(--color-success)' 
      } : variant === 'ghost' ? {
        background: 'transparent',
        border: '1px solid var(--color-border)',
        color: 'var(--color-text-secondary)'
      } : undefined}
      {...otherProps}
    >
      {children}
    </DocomoButton>
  );
};
