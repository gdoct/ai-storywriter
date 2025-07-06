import React from 'react';
import { useTheme } from '../../providers/ThemeProvider';
import './Footer.css';

export interface FooterProps {
  /** Main content of the footer (text, links, etc.) */
  children?: React.ReactNode;
  /** Optional left-aligned content (e.g., copyright) */
  left?: React.ReactNode;
  /** Optional right-aligned content (e.g., links, icons) */
  right?: React.ReactNode;
  /** Additional CSS class name */
  className?: string;
  /** Footer background color (uses CSS var by default) */
  backgroundColor?: string;
  /** Footer text color (uses CSS var by default) */
  color?: string;
  /** HTML tag to use for the footer container */
  as?: React.ElementType;
}

/**
 * Generic Footer component for application/library use.
 * Uses global styling and supports left/right/center content.
 */
export const Footer: React.FC<FooterProps> = ({
  children,
  left,
  right,
  className = '',
  backgroundColor,
  color,
  as: Tag = 'footer',
}) => {
  const { resolvedTheme: theme } = useTheme();

  const Component = Tag || 'footer';
  return (
    <Component
      className={`ai-footer ai-footer--${theme} ${className}`.trim()}
      style={{
        backgroundColor: backgroundColor || 'var(--color-footer-bg)',
        color: color || 'var(--color-footer-text)',
      }}
      data-testid="footer-section"
    >
      <div className="ai-footer__inner">
        {left && <div className="ai-footer__left">{left}</div>}
        <div className="ai-footer__center">{children}</div>
        {right && <div className="ai-footer__right">{right}</div>}
      </div>
    </Component>
  );
};
