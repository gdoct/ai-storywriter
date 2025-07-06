import type { ReactNode } from 'react';
import React from 'react';
import { useTheme } from '../../providers/ThemeProvider';
import './IconButtonGroup.css';

export interface IconButtonGroupProps {
  /** IconButton elements to display in the group */
  children: ReactNode;
  /** Additional CSS class name */
  className?: string;
  /** ARIA label for the toolbar */
  'aria-label'?: string;
}

/**
 * IconButtonGroup: Groups IconButtons into a horizontal toolbar with unified styling.
 */
export const IconButtonGroup: React.FC<IconButtonGroupProps> = ({
  children,
  className = '',
  'aria-label': ariaLabel = 'Toolbar',
}) => {
  const { resolvedTheme } = useTheme();

  return (
    <div
      className={`icon-button-group ${className}`.trim()}
      role="toolbar"
      aria-label={ariaLabel}
      data-theme={resolvedTheme}
    >
      {children}
    </div>
  );
};
