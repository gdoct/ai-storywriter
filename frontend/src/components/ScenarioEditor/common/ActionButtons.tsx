import { IconButton, IconButtonGroup } from '@drdata/ai-styles';
import React from 'react';

export interface ActionButtonItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  className?: string;
  title?: string;
  'data-testid'?: string;
}

interface ActionButtonsProps {
  items: ActionButtonItem[];
  className?: string;
  disabled?: boolean;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  items,
  className = '',
  disabled = false,
}) => {
  // Map custom variants to docomo variants (commented out as unused)
  // const mapVariant = (v: string | undefined) => {
  //   switch (v) {
  //     case 'ghost': return 'secondary';
  //     case 'success': return 'primary';
  //     case 'danger': return 'danger';
  //     case 'primary': return 'primary';
  //     default: return 'secondary' as 'primary' | 'secondary' | 'danger';
  //   }
  // };

  const iconButtons = items.map((item) => (
    <IconButton
      key={item.id}
      variant={item.variant}
      icon={item.icon}
      disabled={disabled || item.disabled}
      busy={item.loading}
      title={item.title || item.label}
      onClick={item.onClick}
      className={item.className}
      data-testid={item['data-testid']}
      data-action-id={item.id}
      style={item.variant === 'success' ? { 
        background: 'var(--color-success)', 
        borderColor: 'var(--color-success)' 
      } : item.variant === 'ghost' ? {
        background: 'transparent',
        border: '1px solid var(--color-border)',
        color: 'var(--color-text-secondary)'
      } : undefined}
    />
  ));

  return (
    <IconButtonGroup className={className}>
      {iconButtons}
    </IconButtonGroup>
  );
};
