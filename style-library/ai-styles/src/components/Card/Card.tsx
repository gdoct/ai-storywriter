import type { CSSProperties, ReactNode } from 'react';
import React from 'react';
import { useTheme } from '../../providers/ThemeProvider';
import './Card.css';

export interface CardProps {
  /** Card content */
  children: ReactNode;
  /** Optional header content */
  header?: ReactNode;
  /** Optional footer content */
  footer?: ReactNode;
  /** Additional CSS class name */
  className?: string;
  /** Custom style for the card */
  style?: CSSProperties;
  /** Left area content, overrides icon if provided */
  leftContent?: ReactNode;
  /** Icon to show on the left if leftContent is not provided */
  icon?: ReactNode;
  /** Right area content */
  rightContent?: ReactNode;
  size?: 'sm' | 'm' | 'l' | 'xl';
}

/**
 * Card: A flexible container for content, with optional header and footer.
 */
export const Card: React.FC<CardProps> = ({
  children,
  header,
  footer,
  className = '',
  style,
  leftContent,
  icon,
  rightContent,
  size = 'm',
}) => {
  const { resolvedTheme: theme } = useTheme();

  return (
    <div
      className={`ai-card ai-card--${size} ai-card--${theme} ${className}`.trim()}
      style={style}
    >
      {header && <div className="ai-card__header">{header}</div>}
      <div className="ai-card__main">
        <div className="ai-card__left">
          {leftContent !== undefined
            ? leftContent
            : icon !== undefined
            ? icon
            : <span className="ai-card__icon" />}
        </div>
        <div className="ai-card__body">{children}</div>
        {rightContent && <div className="ai-card__right">{rightContent}</div>}
      </div>
      {footer && <div className="ai-card__footer">{footer}</div>}
    </div>
  );
};
