import React, { useCallback, useState } from 'react';
import { FaCog, FaPlus, FaTimes, FaTrash, FaUsers } from 'react-icons/fa';
import { Character } from '../../../../../types/ScenarioTypes';
import { Relationship } from '../types/relationships';

type RelationshipStatus = 'active' | 'strained' | 'broken' | 'healing' | 'evolving' | 'static';
type StoryImportance = 'critical' | 'major' | 'supporting' | 'background';

interface RelationshipsManagerProps {
  relationships: Relationship[];
  onRelationshipsChange: (relationships: Relationship[]) => void;
  characters: Character[];
  readonly?: boolean;
}

const RelationshipsManager: React.FC<RelationshipsManagerProps> = ({
  relationships,
  onRelationshipsChange,
  characters,
  readonly = false
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newRelationship, setNewRelationship] = useState({
    characterA: '',
    characterB: '',
    type: '',
    status: 'active' as RelationshipStatus,
    strength: 5,
    description: '',
    storyImportance: 'supporting' as StoryImportance
  });

  const handleDelete = useCallback((id: string) => {
    if (window.confirm('Are you sure you want to delete this relationship?')) {
      const updatedRelationships = relationships.filter(rel => rel.id !== id);
      onRelationshipsChange(updatedRelationships);
    }
  }, [relationships, onRelationshipsChange]);

  const handleAdd = useCallback(() => {
    if (!newRelationship.characterA || !newRelationship.characterB || newRelationship.characterA === newRelationship.characterB) {
      return;
    }

    const relationship: Relationship = {
      id: `relationship_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      characterA: newRelationship.characterA,
      characterB: newRelationship.characterB,
      type: newRelationship.type || 'friendship',
      status: newRelationship.status,
      strength: newRelationship.strength,
      description: newRelationship.description,
      publicPerception: '',
      secretAspects: '',
      origin: {
        when: '',
        where: '',
        how: '',
        circumstances: '',
        firstImpressions: [],
        immediateImpact: '',
        witnesses: []
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
        changes: ''
      },
      communication: {
        frequency: 'regular',
        methods: [],
        barriers: [],
        patterns: [],
        effectiveness: 5
      },
      futureProjection: '',
      storyImportance: newRelationship.storyImportance,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onRelationshipsChange([...relationships, relationship]);
    setNewRelationship({
      characterA: '',
      characterB: '',
      type: '',
      status: 'active',
      strength: 5,
      description: '',
      storyImportance: 'supporting'
    });
    setIsAdding(false);
  }, [newRelationship, relationships, onRelationshipsChange]);

  const statusOptions: { value: RelationshipStatus; label: string }[] = [
    { value: 'active', label: 'Active' },
    { value: 'strained', label: 'Strained' },
    { value: 'broken', label: 'Broken' },
    { value: 'healing', label: 'Healing' },
    { value: 'evolving', label: 'Evolving' },
    { value: 'static', label: 'Static' }
  ];

  const importanceOptions: { value: StoryImportance; label: string }[] = [
    { value: 'critical', label: 'Critical' },
    { value: 'major', label: 'Major' },
    { value: 'supporting', label: 'Supporting' },
    { value: 'background', label: 'Background' }
  ];

  const getStatusColor = (status: RelationshipStatus) => {
    switch (status) {
      case 'active': return '#2ecc71';
      case 'strained': return '#f39c12';
      case 'broken': return '#e74c3c';
      case 'healing': return '#3498db';
      case 'evolving': return '#9b59b6';
      case 'static': return '#95a5a6';
      default: return '#95a5a6';
    }
  };

  const getImportanceColor = (importance: StoryImportance) => {
    switch (importance) {
      case 'critical': return '#e74c3c';
      case 'major': return '#f39c12';
      case 'supporting': return '#3498db';
      case 'background': return '#95a5a6';
      default: return '#95a5a6';
    }
  };

  const getCharacterName = (characterId: string) => {
    const character = characters.find(c => c.id === characterId);
    return character ? character.name : 'Unknown Character';
  };

  if (relationships.length === 0 && !isAdding) {
    return (
      <div className="empty-state">
        <FaUsers className="empty-icon" />
        <h3>No Relationships Yet</h3>
        <p>Start mapping the connections between your characters to explore their interpersonal dynamics.</p>
        {!readonly && characters.length >= 2 && (
          <button 
            className="btn btn-primary"
            onClick={() => setIsAdding(true)}
          >
            <FaPlus /> Add First Relationship
          </button>
        )}
        {characters.length < 2 && (
          <p className="text-muted">You need at least 2 characters to create relationships.</p>
        )}
      </div>
    );
  }

  return (
    <div className="relationships-manager">
      <div className="relationships-header">
        <div className="relationships-stats">
          <div className="stat-item">
            <span className="stat-label">Total Relationships:</span>
            <span className="stat-value">{relationships.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Active:</span>
            <span className="stat-value">
              {relationships.filter(r => r.status === 'active').length}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Critical:</span>
            <span className="stat-value">
              {relationships.filter(r => r.storyImportance === 'critical').length}
            </span>
          </div>
        </div>
        {!readonly && characters.length >= 2 && (
          <div className="relationships-actions">
            <button 
              className="btn btn-primary"
              onClick={() => setIsAdding(true)}
              disabled={isAdding}
            >
              <FaPlus /> Add Relationship
            </button>
            <button 
              className="btn btn-secondary"
              disabled
              title="AI analysis coming soon"
            >
              <FaCog /> Analyze Network
            </button>
          </div>
        )}
      </div>

      <div className="relationships-list">
        {relationships.map(relationship => (
          <div key={relationship.id} className="relationship-card">
            <div className="relationship-header">
              <div className="relationship-title">
                <h3>
                  {getCharacterName(relationship.characterA)} ↔ {getCharacterName(relationship.characterB)}
                </h3>
                <div className="relationship-badges">
                  <span 
                    className="badge status-badge"
                    style={{ backgroundColor: getStatusColor(relationship.status) }}
                  >
                    {relationship.status}
                  </span>
                  <span 
                    className="badge importance-badge"
                    style={{ backgroundColor: getImportanceColor(relationship.storyImportance) }}
                  >
                    {relationship.storyImportance}
                  </span>
                  <span className="badge strength-badge">
                    Strength: {relationship.strength}/10
                  </span>
                </div>
              </div>
              {!readonly && (
                <div className="relationship-actions">
                  <button 
                    className="btn-icon btn-danger"
                    onClick={() => handleDelete(relationship.id)}
                    title="Delete relationship"
                  >
                    <FaTrash />
                  </button>
                </div>
              )}
            </div>

            {relationship.description && (
              <div className="relationship-description">
                <p>{relationship.description}</p>
              </div>
            )}

            <div className="relationship-details">
              {relationship.type && (
                <div className="relationship-detail">
                  <strong>Type:</strong> {relationship.type}
                </div>
              )}

              {relationship.currentState && (
                <div className="relationship-detail">
                  <strong>Current State:</strong> {relationship.currentState}
                </div>
              )}

              {relationship.tensions && relationship.tensions.length > 0 && (
                <div className="relationship-detail">
                  <strong>Tensions:</strong>
                  <div className="related-tags">
                    {relationship.tensions.map((tension, index) => (
                      <span key={index} className="tag tension-tag">{tension}</span>
                    ))}
                  </div>
                </div>
              )}

              {relationship.bonds && relationship.bonds.length > 0 && (
                <div className="relationship-detail">
                  <strong>Bonds:</strong>
                  <div className="related-tags">
                    {relationship.bonds.map((bond, index) => (
                      <span key={index} className="tag bond-tag">{bond}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isAdding && (
          <div className="relationship-card relationship-add-form">
            <h3>Add New Relationship</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>Character A *</label>
                <select
                  value={newRelationship.characterA}
                  onChange={(e) => setNewRelationship(prev => ({ ...prev, characterA: e.target.value }))}
                >
                  <option value="">Select character...</option>
                  {characters.map(character => (
                    <option key={character.id} value={character.id}>
                      {character.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Character B *</label>
                <select
                  value={newRelationship.characterB}
                  onChange={(e) => setNewRelationship(prev => ({ ...prev, characterB: e.target.value }))}
                >
                  <option value="">Select character...</option>
                  {characters
                    .filter(character => character.id !== newRelationship.characterA)
                    .map(character => (
                      <option key={character.id} value={character.id}>
                        {character.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Type</label>
                <input
                  type="text"
                  value={newRelationship.type}
                  onChange={(e) => setNewRelationship(prev => ({ ...prev, type: e.target.value }))}
                  placeholder="e.g., siblings, friends, rivals..."
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={newRelationship.status}
                  onChange={(e) => setNewRelationship(prev => ({ ...prev, status: e.target.value as RelationshipStatus }))}
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Strength (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={newRelationship.strength}
                  onChange={(e) => setNewRelationship(prev => ({ ...prev, strength: parseInt(e.target.value) || 5 }))}
                />
              </div>
              <div className="form-group">
                <label>Story Importance</label>
                <select
                  value={newRelationship.storyImportance}
                  onChange={(e) => setNewRelationship(prev => ({ ...prev, storyImportance: e.target.value as StoryImportance }))}
                >
                  {importanceOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={newRelationship.description}
                onChange={(e) => setNewRelationship(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe this relationship..."
                rows={3}
              />
            </div>

            <div className="form-actions">
              <button 
                className="btn btn-primary"
                onClick={handleAdd}
                disabled={!newRelationship.characterA || !newRelationship.characterB || newRelationship.characterA === newRelationship.characterB}
              >
                <FaCog /> Add Relationship
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setIsAdding(false);
                  setNewRelationship({
                    characterA: '',
                    characterB: '',
                    type: '',
                    status: 'active',
                    strength: 5,
                    description: '',
                    storyImportance: 'supporting'
                  });
                }}
              >
                <FaTimes /> Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RelationshipsManager;
