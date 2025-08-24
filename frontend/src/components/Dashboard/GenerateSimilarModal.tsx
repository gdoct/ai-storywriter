import { Button } from '@drdata/ai-styles';
import React, { useState } from 'react';
import { createPortal } from 'react-dom';

interface GenerateSimilarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (selections: ScenarioSelections) => void;
  scenarioTitle: string;
  characters: Array<{ name: string; id: string }>;
  locations: Array<{ name: string; id: string }>;
}

export interface ScenarioSelections {
  retainCharacters: boolean;
  retainLocations: boolean;
  retainNotes: boolean;
  selectedCharacters: string[];
  selectedLocations: string[];
  count: number;
  // Writing style is always retained
  // Backstory, timeline, and fill-in story cannot be retained
}

const GenerateSimilarModal: React.FC<GenerateSimilarModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
  scenarioTitle,
  characters,
  locations,
}) => {
  const [selections, setSelections] = useState<ScenarioSelections>({
    retainCharacters: characters.length > 0,
    retainLocations: locations.length > 0,
    retainNotes: false,
    selectedCharacters: [],
    selectedLocations: [],
    count: 1,
  });

  const handleGenerate = () => {
    onGenerate(selections);
    onClose();
  };

  if (!isOpen) {
    return null;
  }


  const modalContent = (
    <div data-testid="generate-similar-modal-outer"
     style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'var(--color-surface-overlay)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 'var(--z-modal)',
     
    }}>
      <div data-testid="generate-similar-modal-inner"
       style={{
        backgroundColor: 'var(--color-surface-elevated)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--spacing-xl)',
        boxShadow: 'var(--shadow-xl)',
        border: '1px solid var(--color-border-secondary)',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto',
      }}>
        <h3 style={{ 
          marginBottom: 'var(--spacing-lg)', 
          color: 'var(--color-text-primary)' 
        }}>
          Generate Similar Scenario
        </h3>
        <p style={{ 
          marginBottom: 'var(--spacing-xl)', 
          color: 'var(--color-text-secondary)',
          fontSize: 'var(--font-size-md)'
        }}>
          Choose which elements to retain from <strong>"{scenarioTitle}"</strong> when generating a similar scenario:
        </p>
        
        <div style={{ marginBottom: 'var(--spacing-xl)' }}>
          <h4 style={{ 
            marginBottom: 'var(--spacing-lg)', 
            color: 'var(--color-text-primary)',
            fontSize: 'var(--font-size-lg)'
          }}>
            Select elements to retain:
          </h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            
            {/* Characters Section */}
            {characters.length > 0 && (
              <div>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 'var(--spacing-sm)',
                  cursor: 'pointer',
                  marginBottom: 'var(--spacing-md)'
                }}>
                  <input
                    type="checkbox"
                    checked={selections.retainCharacters}
                    data-testid="generate-similar-modal-character-checkbox"
                    onChange={(e) => setSelections(prev => ({ 
                      ...prev, 
                      retainCharacters: e.target.checked,
                      selectedCharacters: e.target.checked ? prev.selectedCharacters : []
                    }))}
                    style={{ marginRight: 'var(--spacing-xs)' }}
                  />
                  <span style={{ color: 'var(--color-text-primary)', fontWeight: 'var(--font-weight-semibold)' }}>
                    Characters ({characters.length} available)
                  </span>
                </label>
                
                {selections.retainCharacters && (
                  <div style={{ 
                    marginLeft: 'var(--spacing-xl)', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 'var(--spacing-xs)' 
                  }}>
                    {characters.map((character) => (
                      <label key={character.id} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 'var(--spacing-sm)',
                        cursor: 'pointer'
                      }}>
                        <input
                          type="checkbox"
                          data-testid={`generate-similar-modal-character-item-checkbox`}
                          checked={selections.selectedCharacters.includes(character.id)}
                          onChange={(e) => {
                            setSelections(prev => ({
                              ...prev,
                              selectedCharacters: e.target.checked
                                ? [...prev.selectedCharacters, character.id]
                                : prev.selectedCharacters.filter(id => id !== character.id)
                            }));
                          }}
                          style={{ marginRight: 'var(--spacing-xs)' }}
                        />
                        <span style={{ color: 'var(--color-text-secondary)' }}>
                          {character.name}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Locations Section */}
            {locations.length > 0 && (
              <div>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 'var(--spacing-sm)',
                  cursor: 'pointer',
                  marginBottom: 'var(--spacing-md)'
                }}>
                  <input
                    type="checkbox"
                    checked={selections.retainLocations}
                    onChange={(e) => setSelections(prev => ({ 
                      ...prev, 
                      retainLocations: e.target.checked,
                      selectedLocations: e.target.checked ? prev.selectedLocations : []
                    }))}
                    style={{ marginRight: 'var(--spacing-xs)' }}
                  />
                  <span style={{ color: 'var(--color-text-primary)', fontWeight: 'var(--font-weight-semibold)' }}>
                    Locations ({locations.length} available)
                  </span>
                </label>
                
                {selections.retainLocations && (
                  <div style={{ 
                    marginLeft: 'var(--spacing-xl)', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 'var(--spacing-xs)' 
                  }}>
                    {locations.map((location) => (
                      <label key={location.id} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 'var(--spacing-sm)',
                        cursor: 'pointer'
                      }}>
                        <input
                          type="checkbox"
                          checked={selections.selectedLocations.includes(location.id)}
                          onChange={(e) => {
                            setSelections(prev => ({
                              ...prev,
                              selectedLocations: e.target.checked
                                ? [...prev.selectedLocations, location.id]
                                : prev.selectedLocations.filter(id => id !== location.id)
                            }));
                          }}
                          style={{ marginRight: 'var(--spacing-xs)' }}
                        />
                        <span style={{ color: 'var(--color-text-secondary)' }}>
                          {location.name}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Notes Section */}
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 'var(--spacing-sm)',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={selections.retainNotes}
                onChange={(e) => setSelections(prev => ({ ...prev, retainNotes: e.target.checked }))}
                style={{ marginRight: 'var(--spacing-xs)' }}
              />
              <span style={{ color: 'var(--color-text-primary)', fontWeight: 'var(--font-weight-semibold)' }}>Notes</span>
              <span style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
                (Include existing notes as reference)
              </span>
            </label>
          </div>
        </div>
        
        {/* Count Selection */}
        <div style={{ marginBottom: 'var(--spacing-xl)' }}>
          <h4 style={{ 
            marginBottom: 'var(--spacing-lg)', 
            color: 'var(--color-text-primary)',
            fontSize: 'var(--font-size-lg)'
          }}>
            Number of variations:
          </h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
            <input
              type="range"
              min="1"
              max="10"
              value={selections.count}
              onChange={(e) => setSelections(prev => ({ ...prev, count: parseInt(e.target.value) }))}
              style={{
                flex: 1,
                height: '6px',
                borderRadius: '3px',
                background: 'var(--color-surface-tertiary)',
                outline: 'none',
                cursor: 'pointer'
              }}
            />
            <span style={{ 
              color: 'var(--color-text-primary)',
              fontWeight: 'var(--font-weight-semibold)',
              minWidth: '20px',
              textAlign: 'center'
            }}>
              {selections.count}
            </span>
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginTop: 'var(--spacing-xs)',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-tertiary)'
          }}>
            <span>1</span>
            <span>10</span>
          </div>
        </div>
        
        <div style={{ 
          padding: 'var(--spacing-md)',
          backgroundColor: 'var(--color-surface-secondary)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--spacing-xl)'
        }}>
          <h5 style={{ 
            marginBottom: 'var(--spacing-sm)', 
            color: 'var(--color-text-primary)',
            fontSize: 'var(--font-size-md)'
          }}>
            Always included:
          </h5>
          <p style={{ 
            margin: '0 0 var(--spacing-xs) 0', 
            color: 'var(--color-text-secondary)',
            fontSize: 'var(--font-size-sm)'
          }}>
            ✓ Writing style (preserved from original)
          </p>
          <p style={{ 
            margin: 0, 
            color: 'var(--color-text-secondary)',
            fontSize: 'var(--font-size-sm)'
          }}>
            ✓ New title, synopsis, and at least one new character
          </p>
        </div>
        
        <div style={{ 
          padding: 'var(--spacing-md)',
          backgroundColor: 'var(--color-surface-tertiary)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--spacing-xl)'
        }}>
          <h5 style={{ 
            marginBottom: 'var(--spacing-sm)', 
            color: 'var(--color-text-primary)',
            fontSize: 'var(--font-size-md)'
          }}>
            Not included:
          </h5>
          <p style={{ 
            margin: '0 0 var(--spacing-xs) 0', 
            color: 'var(--color-text-secondary)',
            fontSize: 'var(--font-size-sm)'
          }}>
            ✗ Backstory (will be regenerated)
          </p>
          <p style={{ 
            margin: '0 0 var(--spacing-xs) 0', 
            color: 'var(--color-text-secondary)',
            fontSize: 'var(--font-size-sm)'
          }}>
            ✗ Timeline (will be regenerated)
          </p>
          <p style={{ 
            margin: 0, 
            color: 'var(--color-text-secondary)',
            fontSize: 'var(--font-size-sm)'
          }}>
            ✗ Fill-in story (will be regenerated)
          </p>
        </div>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: 'var(--spacing-md)'
        }}>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleGenerate} data-testid="generate-similar-modal-generate-button">
            Generate {selections.count} Similar Scenario{selections.count > 1 ? 's' : ''}
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default GenerateSimilarModal;