import React from 'react';
import './ActionButtons.css';

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
  return (
    <div className={`action-buttons ${className}`}>
      {items.map((item) => (
        <button
          key={item.id}
          className={`action-button action-button--${item.variant || 'secondary'} ${item.className || ''}`}
          onClick={item.onClick}
          disabled={disabled || item.disabled || item.loading}
          title={item.title || item.label}
          data-testid={item['data-testid']}
          data-action-id={item.id}
        >
          {item.loading ? (
            <div className="action-button__spinner" />
          ) : (
            item.icon
          )}
        </button>
      ))}
    </div>
  );
};
