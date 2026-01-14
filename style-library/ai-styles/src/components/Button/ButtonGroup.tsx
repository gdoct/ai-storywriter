import type { ReactNode } from 'react';
import React from 'react';
import { useTheme } from '../../providers/ThemeProvider';
import './ButtonGroup.css';

export interface ButtonGroupProps {
  /** Button or IconButton elements to display in the group */
  children: ReactNode;
  /** Additional CSS class name */
  className?: string;
  /** ARIA label for the toolbar */
  'aria-label'?: string;
}

/**
 * ButtonGroup: Groups Button and IconButton components into a horizontal toolbar with unified styling.
 */
export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  children,
  className = '',
  'aria-label': ariaLabel = 'Toolbar',
}) => {
  const { resolvedTheme } = useTheme();

  return (
    <div
      className={`button-group ${className}`.trim()}
      role="toolbar"
      aria-label={ariaLabel}
      data-theme={resolvedTheme}
    >
      {children}
    </div>
  );
};