import React, { useCallback, useState } from 'react';
import { FaCog, FaPlus, FaTimes, FaTrash, FaUsers } from 'react-icons/fa';
import { Archetype } from '../types/themesSymbols';

interface ArchetypesManagerProps {
  archetypes: Archetype[];
  onArchetypesChange: (archetypes: Archetype[]) => void;
  readonly?: boolean;
}

const ArchetypesManager: React.FC<ArchetypesManagerProps> = ({
  archetypes,
  onArchetypesChange,
  readonly = false
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newArchetype, setNewArchetype] = useState({ name: '', description: '' });

  const handleDelete = useCallback((id: string) => {
    if (window.confirm('Are you sure you want to delete this archetype?')) {
      const updatedArchetypes = archetypes.filter(archetype => archetype.id !== id);
      onArchetypesChange(updatedArchetypes);
    }
  }, [archetypes, onArchetypesChange]);

  const handleAdd = useCallback(() => {
    if (!newArchetype.name.trim()) return;

    const archetype: Archetype = {
      id: `archetype_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: newArchetype.name.trim(),
      description: newArchetype.description.trim(),
      type: 'character',
      category: '',
      characteristics: [],
      manifestation: '',
      subversion: '',
      examples: [],
      characterMappings: [],
      culturalSignificance: '',
      modernAdaptation: '',
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onArchetypesChange([...archetypes, archetype]);
    setNewArchetype({ name: '', description: '' });
    setIsAdding(false);
  }, [newArchetype, archetypes, onArchetypesChange]);

  if (archetypes.length === 0 && !isAdding) {
    return (
      <div className="empty-state">
        <FaUsers className="empty-icon" />
        <h3>No Archetypes Yet</h3>
        <p>Archetypes are universal patterns or character types that recur across literature and human experience.</p>
        {!readonly && (
          <button 
            className="btn btn-primary"
            onClick={() => setIsAdding(true)}
          >
            <FaPlus /> Add First Archetype
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="archetypes-manager">
      <div className="archetypes-header">
        <div className="archetypes-stats">
          <div className="stat-item">
            <span className="stat-label">Total Archetypes:</span>
            <span className="stat-value">{archetypes.length}</span>
          </div>
        </div>
        {!readonly && (
          <div className="archetypes-actions">
            <button 
              className="btn btn-primary"
              onClick={() => setIsAdding(true)}
              disabled={isAdding}
            >
              <FaPlus /> Add Archetype
            </button>
            <button 
              className="btn btn-secondary"
              disabled
              title="AI analysis coming soon"
            >
              <FaCog /> Analyze Archetypes
            </button>
          </div>
        )}
      </div>

      <div className="archetypes-list">
        {archetypes.map(archetype => (
          <div key={archetype.id} className="archetype-card">
            <div className="archetype-header">
              <h3>{archetype.name}</h3>
              {!readonly && (
                <button 
                  className="btn-icon btn-danger"
                  onClick={() => handleDelete(archetype.id)}
                  title="Delete archetype"
                >
                  <FaTrash />
                </button>
              )}
            </div>
            {archetype.description && (
              <p className="archetype-description">{archetype.description}</p>
            )}
            {archetype.manifestation && (
              <div className="archetype-manifestation">
                <strong>Manifestation:</strong> {archetype.manifestation}
              </div>
            )}
          </div>
        ))}

        {isAdding && (
          <div className="archetype-card archetype-add-form">
            <h3>Add New Archetype</h3>
            
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                value={newArchetype.name}
                onChange={(e) => setNewArchetype(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Archetype name..."
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={newArchetype.description}
                onChange={(e) => setNewArchetype(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe this archetype..."
                rows={3}
              />
            </div>

            <div className="form-actions">
              <button 
                className="btn btn-primary"
                onClick={handleAdd}
                disabled={!newArchetype.name.trim()}
              >
                <FaCog /> Add Archetype
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setIsAdding(false);
                  setNewArchetype({ name: '', description: '' });
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

export default ArchetypesManager;
