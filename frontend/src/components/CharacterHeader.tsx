import React from 'react';

interface CharacterHeaderProps {
  character: {
    id: string;
    name: string;
    photo?: string;
    role?: string;
  };
  onRemove: () => void;
}

const CharacterHeader: React.FC<CharacterHeaderProps> = ({ character, onRemove }) => {
  return (
    <div className="character-header">
      <div className="character-content">
        <div className="character-photo">
          {character.photo ? (
            <img src={character.photo} alt={character.name} />
          ) : (
            <div className="photo-placeholder"></div>
          )}
        </div>
        <div className="character-info">
          <h3 className="character-name">{character.name}</h3>
          {character.role && (
            <span className="character-role">[{character.role}]</span>
          )}
        </div>
        <button className="remove-button" onClick={onRemove}>
          [Remove]
        </button>
      </div>
    </div>
  );
};

export default CharacterHeader;
