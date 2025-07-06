import React from 'react';
import { useTheme } from '../../providers/ThemeProvider';
import './Hero.css';

export interface HeroProps {
  /** Main title text */
  title: string;
  /** Optional subtitle text */
  subtitle?: string;
  /** Hero image URL */
  image?: string;
  /** Optional custom content below the title/subtitle */
  children?: React.ReactNode;
  /** Optional className for custom styling */
  className?: string;
  /** Optional call-to-action button */
  cta?: React.ReactNode;
  /** Optional button bar for multiple actions */
  buttonBar?: React.ReactNode;
}

/**
 * Hero section component for prominent page headers.
 * Applies global styles and supports background images.
 */
export const Hero: React.FC<HeroProps> = ({
  title,
  subtitle,
  image,
  children,
  className = '',
  cta,
  buttonBar,
}) => {
  const { resolvedTheme: theme } = useTheme();

  return (
    <section
      className={`ai-hero ai-hero--${theme} ${className}`.trim()}
      data-testid="hero-section"
    >
      <div className="ai-hero__container">
        <div className="ai-hero__content">
          <div className="ai-hero__text">
            <h1 className="ai-hero__title">{title}</h1>
            {subtitle && <p className="ai-hero__subtitle">{subtitle}</p>}
            {children && <div className="ai-hero__description">{children}</div>}
          </div>
          
          {(cta || buttonBar) && (
            <div className="ai-hero__actions">
              {cta && <div className="ai-hero__cta">{cta}</div>}
              {buttonBar && <div className="ai-hero__button-bar">{buttonBar}</div>}
            </div>
          )}
        </div>
        
        {image && (
          <div className="ai-hero__image">
            <img src={image} alt={title} className="ai-hero__img" />
          </div>
        )}
      </div>
    </section>
  );
};
