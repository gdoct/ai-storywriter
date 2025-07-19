import { AiTextArea, Button } from '@drdata/ai-styles';
import React, { useCallback, useMemo, useState } from 'react';
import { FaPlus, FaUserFriends, FaTimes, FaUsers, FaDice, FaTrash, FaProjectDiagram } from 'react-icons/fa';
import { TabProps } from '../../types';
import { Relationship } from './types/relationships';
import './CharacterRelationshipsTab.css';

interface SimpleRelationship {
  id: string;
  characterA: string;
  characterB: string;
  type: 'romantic' | 'friendship' | 'family' | 'rivalry' | 'mentor' | 'alliance' | 'neutral';
  status: 'active' | 'strained' | 'broken' | 'healing' | 'evolving';
  description?: string;
}

const relationshipTypeIcons = {
  romantic: FaUsers,
  friendship: FaUserFriends,
  family: FaUsers,
  rivalry: FaTrash,
  mentor: FaProjectDiagram,
  alliance: FaUserFriends,
  neutral: FaDice,
};

const relationshipTypeColors = {
  romantic: '#ff6b9d',
  friendship: '#4ecdc4',
  family: '#45b7d1',
  rivalry: '#ff6b6b',
  mentor: '#f9ca24',
  alliance: '#6c5ce7',
  neutral: '#a0a0a0',
};

const statusColors = {
  active: '#2ecc71',
  strained: '#f39c12',
  broken: '#e74c3c',
  healing: '#3498db',
  evolving: '#9b59b6',
};

export const CharacterRelationshipsTab: React.FC<TabProps> = ({
  scenario,
  onScenarioChange,
  isDirty,
  isLoading,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingRelationship, setEditingRelationship] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRelationshipCharacterA, setNewRelationshipCharacterA] = useState('');
  const [newRelationshipCharacterB, setNewRelationshipCharacterB] = useState('');
  const [newRelationshipType, setNewRelationshipType] = useState<SimpleRelationship['type']>('friendship');

  const characters = scenario.characters || [];
  const relationships: SimpleRelationship[] = useMemo(() => {
    const existing = scenario.characterRelationships?.relationships || [];
    return existing.map(rel => ({
      id: rel.id,
      characterA: rel.characterA,
      characterB: rel.characterB,
      type: rel.type === 'romantic' || rel.type === 'friendship' || rel.type === 'family' || 
           rel.type === 'rivalry' || rel.type === 'mentor' || rel.type === 'alliance' 
           ? rel.type as SimpleRelationship['type'] : 'neutral',
      status: rel.status === 'active' || rel.status === 'strained' || rel.status === 'broken' || 
             rel.status === 'healing' || rel.status === 'evolving' 
             ? rel.status : 'active',
      description: rel.description,
    }));
  }, [scenario.characterRelationships]);

  const getCharacterImage = useCallback((characterName: string) => {
    const character = characters.find(c => c.name === characterName);
    if (character?.photo_data) {
      return `data:${character.photo_mime_type || 'image/jpeg'};base64,${character.photo_data}`;
    }
    return character?.photoUrl || null;
  }, [characters]);

  const handleRelationshipsChange = useCallback((newRelationships: SimpleRelationship[]) => {
    const fullRelationships: Relationship[] = newRelationships.map(rel => ({
      id: rel.id,
      characterA: rel.characterA,
      characterB: rel.characterB,
      type: rel.type,
      status: rel.status,
      strength: 5,
      description: rel.description || '',
      publicPerception: '',
      secretAspects: '',
      origin: {
        when: '',
        where: '',
        how: '',
        circumstances: '',
        firstImpressions: [],
        immediateImpact: '',
        witnesses: [],
      },
      development: [],
      currentState: '',
      tensions: [],
      bonds: [],
      powerDynamics: {
        type: 'equal',
        description: '',
        sources: [],
        manifestations: [],
        changes: '',
      },
      communication: {
        frequency: 'regular',
        methods: [],
        barriers: [],
        patterns: [],
        effectiveness: 5,
      },
      futureProjection: '',
      storyImportance: 'supporting',
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    
    const updated = {
      ...scenario,
      characterRelationships: {
        ...scenario.characterRelationships,
        relationships: fullRelationships,
        relationshipTypes: scenario.characterRelationships?.relationshipTypes || [],
        dynamics: scenario.characterRelationships?.dynamics || [],
        conflicts: scenario.characterRelationships?.conflicts || [],
        histories: scenario.characterRelationships?.histories || [],
        groups: scenario.characterRelationships?.groups || [],
        generalNotes: scenario.characterRelationships?.generalNotes || '',
      },
    };
    onScenarioChange(updated);
  }, [scenario, onScenarioChange]);

  const handleNotesChange = useCallback((value: string) => {
    const updated = {
      ...scenario,
      characterRelationships: {
        ...scenario.characterRelationships,
        relationships: scenario.characterRelationships?.relationships || [],
        relationshipTypes: scenario.characterRelationships?.relationshipTypes || [],
        dynamics: scenario.characterRelationships?.dynamics || [],
        conflicts: scenario.characterRelationships?.conflicts || [],
        histories: scenario.characterRelationships?.histories || [],
        groups: scenario.characterRelationships?.groups || [],
        generalNotes: value,
      },
    };
    onScenarioChange(updated);
  }, [scenario, onScenarioChange]);

  const addRelationship = useCallback((characterA: string, characterB: string, type: SimpleRelationship['type']) => {
    const newRelationship: SimpleRelationship = {
      id: Date.now().toString(),
      characterA,
      characterB,
      type,
      status: 'active',
      description: '',
    };
    handleRelationshipsChange([...relationships, newRelationship]);
    setShowAddForm(false);
    setNewRelationshipCharacterA('');
    setNewRelationshipCharacterB('');
    setNewRelationshipType('friendship');
  }, [relationships, handleRelationshipsChange]);

  const updateRelationship = useCallback((id: string, updates: Partial<SimpleRelationship>) => {
    const updatedRelationships = relationships.map(rel => 
      rel.id === id ? { ...rel, ...updates } : rel
    );
    handleRelationshipsChange(updatedRelationships);
  }, [relationships, handleRelationshipsChange]);

  const deleteRelationship = useCallback((id: string) => {
    handleRelationshipsChange(relationships.filter(rel => rel.id !== id));
  }, [relationships, handleRelationshipsChange]);

  const handleGenerateRelationships = useCallback(async () => {
    if (characters.length < 2) return;
    
    setIsGenerating(true);
    // Simulate AI generation with realistic typing
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let notes = '';
    const sampleNotes = `Character relationship analysis for "${scenario.title || 'your story'}":

• Complex interpersonal dynamics drive the narrative forward
• Multiple relationship types create rich story layers
• Character motivations stem from their connections
• Conflicts arise naturally from opposing goals
• Relationships evolve throughout the story arc`;
    
    let currentIndex = 0;
    const typeNextLetter = () => {
      if (currentIndex < sampleNotes.length) {
        notes = sampleNotes.substring(0, currentIndex + 1);
        handleNotesChange(notes);
        currentIndex++;
        setTimeout(typeNextLetter, 30);
      } else {
        setIsGenerating(false);
      }
    };
    
    handleNotesChange('');
    setTimeout(typeNextLetter, 100);
  }, [characters, scenario.title, handleNotesChange]);

  const renderCharacterAvatar = (characterName: string, size: 'small' | 'medium' = 'small') => {
    const imageUrl = getCharacterImage(characterName);
    const sizeClass = size === 'small' ? 'character-avatar--small' : 'character-avatar--medium';
    
    return (
      <div className={`character-avatar ${sizeClass}`}>
        {imageUrl ? (
          <img src={imageUrl} alt={characterName} className="character-avatar__image" />
        ) : (
          <div className="character-avatar__placeholder">
            {characterName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    );
  };

  const renderRelationshipCard = (relationship: SimpleRelationship) => {
    const TypeIcon = relationshipTypeIcons[relationship.type];
    const typeColor = relationshipTypeColors[relationship.type];
    const statusColor = statusColors[relationship.status];
    const isEditing = editingRelationship === relationship.id;

    return (
      <div key={relationship.id} className="relationship-card">
        <div className="relationship-card__header">
          <div className="relationship-card__characters">
            {renderCharacterAvatar(relationship.characterA, 'medium')}
            <div className="relationship-card__connector" style={{ backgroundColor: typeColor }}>
              <TypeIcon className="relationship-card__type-icon" />
            </div>
            {renderCharacterAvatar(relationship.characterB, 'medium')}
          </div>
          <div className="relationship-card__info">
            <span className="relationship-card__names">
              {relationship.characterA} & {relationship.characterB}
            </span>
            <div className="relationship-card__badges">
              <span 
                className="relationship-card__type" 
                style={{ backgroundColor: typeColor }}
              >
                {relationship.type}
              </span>
              <span 
                className="relationship-card__status" 
                style={{ backgroundColor: statusColor }}
              >
                {relationship.status}
              </span>
            </div>
          </div>
          <div className="relationship-card__actions">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingRelationship(isEditing ? null : relationship.id)}
            >
              {isEditing ? 'Done' : 'Edit'}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => deleteRelationship(relationship.id)}
            >
              <FaTimes />
            </Button>
          </div>
        </div>
        
        {isEditing && (
          <div className="relationship-card__editor">
            <div className="relationship-editor__row">
              <label>Type:</label>
              <select 
                value={relationship.type} 
                onChange={(e) => updateRelationship(relationship.id, { type: e.target.value as SimpleRelationship['type'] })}
              >
                <option value="romantic">Romantic</option>
                <option value="friendship">Friendship</option>
                <option value="family">Family</option>
                <option value="rivalry">Rivalry</option>
                <option value="mentor">Mentor</option>
                <option value="alliance">Alliance</option>
                <option value="neutral">Neutral</option>
              </select>
            </div>
            <div className="relationship-editor__row">
              <label>Status:</label>
              <select 
                value={relationship.status} 
                onChange={(e) => updateRelationship(relationship.id, { status: e.target.value as SimpleRelationship['status'] })}
              >
                <option value="active">Active</option>
                <option value="strained">Strained</option>
                <option value="broken">Broken</option>
                <option value="healing">Healing</option>
                <option value="evolving">Evolving</option>
              </select>
            </div>
            <div className="relationship-editor__row">
              <label>Description:</label>
              <textarea 
                value={relationship.description || ''}
                onChange={(e) => updateRelationship(relationship.id, { description: e.target.value })}
                placeholder="Describe this relationship..."
                rows={3}
              />
            </div>
          </div>
        )}
        
        {relationship.description && !isEditing && (
          <div className="relationship-card__description">
            {relationship.description}
          </div>
        )}
      </div>
    );
  };

  const renderAddRelationshipForm = () => {
    return (
      <div className="add-relationship-form">
        <div className="add-relationship-form__header">
          <h4>Add New Relationship</h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowAddForm(false);
              setNewRelationshipCharacterA('');
              setNewRelationshipCharacterB('');
              setNewRelationshipType('friendship');
            }}
          >
            <FaTimes />
          </Button>
        </div>
        
        <div className="add-relationship-form__content">
          <div className="character-selectors">
            <div className="character-selector">
              <label>Character A:</label>
              <select value={newRelationshipCharacterA} onChange={(e) => setNewRelationshipCharacterA(e.target.value)}>
                <option value="">Select character</option>
                {characters.map(char => (
                  <option key={char.id} value={char.name}>{char.name}</option>
                ))}
              </select>
            </div>
            
            <div className="character-selector">
              <label>Character B:</label>
              <select value={newRelationshipCharacterB} onChange={(e) => setNewRelationshipCharacterB(e.target.value)}>
                <option value="">Select character</option>
                {characters.filter(char => char.name !== newRelationshipCharacterA).map(char => (
                  <option key={char.id} value={char.name}>{char.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="relationship-type-selector">
            <label>Relationship Type:</label>
            <div className="type-options">
              {Object.entries(relationshipTypeIcons).map(([typeName, Icon]) => (
                <button
                  key={typeName}
                  className={`type-option ${newRelationshipType === typeName ? 'selected' : ''}`}
                  onClick={() => setNewRelationshipType(typeName as SimpleRelationship['type'])}
                  style={{ 
                    backgroundColor: newRelationshipType === typeName ? relationshipTypeColors[typeName as SimpleRelationship['type']] : undefined 
                  }}
                >
                  <Icon className="type-option__icon" />
                  {typeName}
                </button>
              ))}
            </div>
          </div>
          
          <div className="add-relationship-form__actions">
            <Button
              variant="primary"
              onClick={() => addRelationship(newRelationshipCharacterA, newRelationshipCharacterB, newRelationshipType)}
              disabled={!newRelationshipCharacterA || !newRelationshipCharacterB || newRelationshipCharacterA === newRelationshipCharacterB}
            >
              Add Relationship
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="character-relationships-tab">
      {/* Scenario background */}
      {scenario.imageUrl && (
        <div className="relationships-backdrop">
          <img src={scenario.imageUrl} alt="Scenario" className="relationships-backdrop__image" />
          <div className="relationships-backdrop__overlay" />
        </div>
      )}
      
      <div className="character-relationships-tab__header">
        <div className="relationships-title-section">
          <FaUserFriends className="relationships-icon" />
          <div>
            <h2>Character Relationships</h2>
            <p>Define the connections that drive your story's interpersonal dynamics.</p>
          </div>
        </div>
        
        <div className="relationships-actions">
          {!isGenerating ? (
            <>
              <Button
                variant="primary"
                icon={<FaPlus />}
                onClick={() => setShowAddForm(true)}
                disabled={characters.length < 2}
              >
                Add Relationship
              </Button>
              <Button
                variant="secondary"
                onClick={handleGenerateRelationships}
                disabled={characters.length < 2}
              >
                ✨ Generate Ideas
              </Button>
            </>
          ) : (
            <Button variant="ghost" disabled>
              Generating ideas...
            </Button>
          )}
        </div>
      </div>

      {characters.length < 2 ? (
        <div className="relationships-empty-state">
          <FaUserFriends className="empty-state-icon" />
          <h3>Add Characters First</h3>
          <p>You need at least 2 characters to create relationships. Add some characters in the Characters tab first.</p>
        </div>
      ) : (
        <div className="character-relationships-tab__content">
          {showAddForm && renderAddRelationshipForm()}
          
          <div className="relationships-grid">
            {relationships.length === 0 && !showAddForm ? (
              <div className="relationships-empty">
                <p>No relationships defined yet. Click "Add Relationship" to get started.</p>
              </div>
            ) : (
              relationships.map(renderRelationshipCard)
            )}
          </div>
          
          <div className="relationships-notes">
            <AiTextArea
              label="Relationship Notes & Analysis"
              value={scenario.characterRelationships?.generalNotes || ''}
              onChange={handleNotesChange}
              placeholder="Add notes about character relationships, group dynamics, conflicts, or any other interpersonal elements that drive your story..."
              rows={6}
              disabled={isGenerating}
              onAiClick={handleGenerateRelationships}
              aiGenerating={isGenerating}
            />
          </div>
        </div>
      )}
    </div>
  );
};