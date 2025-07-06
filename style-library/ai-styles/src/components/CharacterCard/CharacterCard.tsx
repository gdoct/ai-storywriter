import type { CSSProperties } from 'react';
import React from 'react';
import { useTheme } from '../../providers/ThemeProvider';
import './CharacterCard.css';

export interface CharacterCardProps {
  /** Character name */
  name: string;
  /** Optional nickname */
  nickname?: string;
  /** Character role or title */
  role?: string;
  /** Character backstory or description */
  backstory?: string;
  /** Additional notes */
  notes?: string;
  /** Character image URL */
  imageUrl?: string;
  /** Character gender for fallback icon ('male' | 'female' | 'other') */
  gender?: 'male' | 'female' | 'other';
  /** Custom image alt text */
  imageAlt?: string;
  /** Additional CSS class name */
  className?: string;
  /** Custom style for the card */
  style?: CSSProperties;
  /** Optional click handler */
  onClick?: () => void;
  /** Size of the character card */
  size?: 'sm' | 'm' | 'l' | 'xl';
}

const GenderIcon: React.FC<{ gender: 'male' | 'female' | 'other' }> = ({ gender }) => {
  switch (gender) {
    case 'male':
      return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="10" cy="10" r="6" stroke="currentColor" strokeWidth="2"/>
          <path d="M16 6l4-4m0 0v4m0-4h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      );
    case 'female':
      return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="8" r="6" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 14v6m-3-3h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      );
    case 'other':
    default:
      return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2"/>
          <path d="M8 12h8m-4-4v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      );
  }
};

/**
 * CharacterCard: A specialized card for displaying character information with image and personal details.
 */
export const CharacterCard: React.FC<CharacterCardProps> = ({
  name,
  nickname,
  role,
  backstory,
  notes,
  imageUrl,
  gender = 'other',
  imageAlt,
  className = '',
  style,
  onClick,
  size = 'm',
}) => {
  const { resolvedTheme: theme } = useTheme();

  return (
    <div
      className={`ai-character-card ai-character-card--${size} ai-character-card--${theme} ${className}`.trim()}
      style={style}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="ai-character-card__image">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={imageAlt || `${name} character portrait`}
            className="ai-character-card__img"
          />
        ) : (
          <div className="ai-character-card__gender-icon">
            <GenderIcon gender={gender} />
          </div>
        )}
      </div>

      <div className="ai-character-card__details">
        <div className="ai-character-card__header">
          <h3 className="ai-character-card__name">{name}</h3>
          {nickname && (
            <span className="ai-character-card__nickname">"{nickname}"</span>
          )}
        </div>

        {role && <div className="ai-character-card__role">{role}</div>}

        {backstory && <div className="ai-character-card__backstory">{backstory}</div>}

        {notes && (
          <div className="ai-character-card__notes">
            <strong>Notes:</strong> {notes}
          </div>
        )}
      </div>
    </div>
  );
};