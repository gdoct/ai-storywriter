import React from 'react';
import { Character } from '@shared/types/ScenarioTypes';
import './CharacterBadge.css';

interface CharacterBadgeProps {
  characters: Character[];
  className?: string;
}

interface SingleCharacterProps {
  character: Character;
  isSmall?: boolean;
}

const SingleCharacter: React.FC<SingleCharacterProps> = ({ character, isSmall = false }) => {
  const displayName = character.name || character.alias || 'Unnamed';
  
  return (
    <div className={`character-badge__single ${isSmall ? 'character-badge__single--small' : ''}`}>
      <div className="character-badge__photo-container">
        {character.photoUrl ? (
          <img
            src={character.photoUrl}
            alt={displayName}
            className="character-badge__photo"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
              if (placeholder) placeholder.style.display = 'flex';
            }}
          />
        ) : null}
        <div 
          className="character-badge__photo-placeholder"
          style={{ display: character.photoUrl ? 'none' : 'flex' }}
        >
          <div className="character-badge__placeholder-initials">
            {displayName.slice(0, 2).toUpperCase()}
          </div>
        </div>
      </div>
      <div className="character-badge__name">
        {displayName}
      </div>
    </div>
  );
};

export const CharacterBadge: React.FC<CharacterBadgeProps> = ({ characters, className = '' }) => {
  const displayCharacters = characters.slice(0, 5);
  const remainingCount = characters.length - 5;
  
  if (displayCharacters.length === 0) {
    return null;
  }
  
  if (displayCharacters.length === 1) {
    return (
      <div className={`character-badge ${className}`}>
        <SingleCharacter character={displayCharacters[0]} />
      </div>
    );
  }
  
  return (
    <div className={`character-badge character-badge--multiple ${className}`}>
      <div className="character-badge__grid">
        {displayCharacters.map((character, index) => (
          <SingleCharacter 
            key={character.id || index} 
            character={character} 
            isSmall={true}
          />
        ))}
        {remainingCount > 0 && (
          <div className="character-badge__single character-badge__single--small character-badge__more">
            <div className="character-badge__photo-container">
              <div className="character-badge__photo-placeholder">
                <div className="character-badge__placeholder-initials">
                  +{remainingCount}
                </div>
              </div>
            </div>
            <div className="character-badge__name">
              More
            </div>
          </div>
        )}
      </div>
    </div>
  );
};