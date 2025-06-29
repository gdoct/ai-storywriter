import React, { useCallback, useState } from 'react';
import { FaCog, FaPlus, FaTrash } from 'react-icons/fa';
import { Character } from '../../../../../types/ScenarioTypes';
import { RelationshipDynamic } from '../types/relationships';

interface DynamicsManagerProps {
  dynamics: RelationshipDynamic[];
  onDynamicsChange: (dynamics: RelationshipDynamic[]) => void;
  characters: Character[];
  readonly?: boolean;
}

const DynamicsManager: React.FC<DynamicsManagerProps> = ({
  dynamics,
  onDynamicsChange,
  characters,
  readonly = false,
}) => {
  const [editingDynamic, setEditingDynamic] = useState<RelationshipDynamic | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [expandedDynamics, setExpandedDynamics] = useState<Set<string>>(new Set());

  const handleCreateDynamic = useCallback(() => {
    const newDynamic: RelationshipDynamic = {
      id: `dynamic_${Date.now()}`,
      relationshipId: '',
      type: 'emotional',
      description: '',
      balance: 'balanced',
      factors: [],
      evolution: '',
      triggers: [],
      manifestations: [],
      impact: '',
    };
    setEditingDynamic(newDynamic);
    setIsCreating(true);
  }, []);

  const handleSaveDynamic = useCallback((dynamic: RelationshipDynamic) => {
    if (isCreating) {
      onDynamicsChange([...dynamics, dynamic]);
      setIsCreating(false);
    } else {
      onDynamicsChange(dynamics.map(d => d.id === dynamic.id ? dynamic : d));
    }
    setEditingDynamic(null);
  }, [dynamics, onDynamicsChange, isCreating]);

  const handleDeleteDynamic = useCallback((dynamicId: string) => {
    onDynamicsChange(dynamics.filter(d => d.id !== dynamicId));
  }, [dynamics, onDynamicsChange]);

  const handleCancelEdit = useCallback(() => {
    setEditingDynamic(null);
    setIsCreating(false);
  }, []);

  return (
    <div className="dynamics-manager">
      <div className="dynamics-manager__header">
        <h3>Relationship Dynamics</h3>
        {!readonly && (
          <button
            className="btn btn--primary dynamics-manager__add-btn"
            onClick={handleCreateDynamic}
            disabled={isCreating}
          >
            <FaPlus /> Add Dynamic
          </button>
        )}
      </div>

      <div className="dynamics-manager__list">
        {dynamics.map((dynamic) => {
          const isEditing = editingDynamic?.id === dynamic.id;

          return (
            <div key={dynamic.id} className="dynamic-item">
              <div className="dynamic-item__header">
                <div className="dynamic-item__title">
                  <h4>Dynamic: {dynamic.type}</h4>
                  <span className={`dynamic-item__type dynamic-item__type--${dynamic.type}`}>
                    {dynamic.type}
                  </span>
                  <span className={`dynamic-item__balance dynamic-item__balance--${dynamic.balance}`}>
                    {dynamic.balance}
                  </span>
                </div>
                {!readonly && (
                  <div className="dynamic-item__actions">
                    <button
                      className="btn btn--secondary btn--small"
                      onClick={() => setEditingDynamic(dynamic)}
                    >
                      <FaCog />
                    </button>
                    <button
                      className="btn btn--danger btn--small"
                      onClick={() => handleDeleteDynamic(dynamic.id)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                )}
              </div>

              {!isEditing && (
                <div className="dynamic-item__content">
                  <div className="dynamic-item__view">
                    <div className="dynamic-item__field">
                      <label>Description:</label>
                      <p>{dynamic.description || 'No description provided'}</p>
                    </div>
                    {dynamic.evolution && (
                      <div className="dynamic-item__field">
                        <label>Evolution:</label>
                        <p>{dynamic.evolution}</p>
                      </div>
                    )}
                    {dynamic.impact && (
                      <div className="dynamic-item__field">
                        <label>Impact:</label>
                        <p>{dynamic.impact}</p>
                      </div>
                    )}
                    {dynamic.triggers && dynamic.triggers.length > 0 && (
                      <div className="dynamic-item__field">
                        <label>Triggers:</label>
                        <div className="tags">
                          {dynamic.triggers.map((trigger, index) => (
                            <span key={index} className="tag">{trigger}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {isEditing && (
                <div className="dynamic-item__content">
                  <DynamicEditor
                    dynamic={dynamic}
                    onSave={handleSaveDynamic}
                    onCancel={handleCancelEdit}
                  />
                </div>
              )}
            </div>
          );
        })}

        {isCreating && editingDynamic && (
          <div className="dynamic-item dynamic-item--creating">
            <div className="dynamic-item__header">
              <h4>New Dynamic</h4>
            </div>
            <div className="dynamic-item__content">
              <DynamicEditor
                dynamic={editingDynamic}
                onSave={handleSaveDynamic}
                onCancel={handleCancelEdit}
              />
            </div>
          </div>
        )}
      </div>

      {dynamics.length === 0 && !isCreating && (
        <div className="dynamics-manager__empty">
          <p>No relationship dynamics defined yet.</p>
          {!readonly && (
            <button
              className="btn btn--primary"
              onClick={handleCreateDynamic}
            >
              <FaPlus /> Create Your First Dynamic
            </button>
          )}
        </div>
      )}
    </div>
  );
};

interface DynamicEditorProps {
  dynamic: RelationshipDynamic;
  onSave: (dynamic: RelationshipDynamic) => void;
  onCancel: () => void;
}

const DynamicEditor: React.FC<DynamicEditorProps> = ({
  dynamic,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<RelationshipDynamic>({ ...dynamic });

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (formData.description.trim()) {
      onSave(formData);
    }
  }, [formData, onSave]);

  const handleTriggersChange = useCallback((value: string) => {
    const triggers = value.split(',').map(t => t.trim()).filter(t => t.length > 0);
    setFormData(prev => ({ ...prev, triggers }));
  }, []);

  const handleManifestationsChange = useCallback((value: string) => {
    const manifestations = value.split(',').map(m => m.trim()).filter(m => m.length > 0);
    setFormData(prev => ({ ...prev, manifestations }));
  }, []);

  return (
    <form onSubmit={handleSubmit} className="dynamic-editor">
      <div className="form-group">
        <label htmlFor="dynamic-description">Description *</label>
        <textarea
          id="dynamic-description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe this relationship dynamic"
          rows={3}
          required
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="dynamic-type">Type</label>
          <select
            id="dynamic-type"
            value={formData.type}
            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
          >
            <option value="power">Power</option>
            <option value="emotional">Emotional</option>
            <option value="intellectual">Intellectual</option>
            <option value="physical">Physical</option>
            <option value="spiritual">Spiritual</option>
            <option value="social">Social</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="dynamic-balance">Balance</label>
          <select
            id="dynamic-balance"
            value={formData.balance}
            onChange={(e) => setFormData(prev => ({ ...prev, balance: e.target.value as any }))}
          >
            <option value="balanced">Balanced</option>
            <option value="character_a_dominant">Character A Dominant</option>
            <option value="character_b_dominant">Character B Dominant</option>
            <option value="unstable">Unstable</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="dynamic-evolution">Evolution</label>
        <textarea
          id="dynamic-evolution"
          value={formData.evolution}
          onChange={(e) => setFormData(prev => ({ ...prev, evolution: e.target.value }))}
          placeholder="How does this dynamic change over time?"
          rows={3}
        />
      </div>

      <div className="form-group">
        <label htmlFor="dynamic-impact">Impact</label>
        <textarea
          id="dynamic-impact"
          value={formData.impact}
          onChange={(e) => setFormData(prev => ({ ...prev, impact: e.target.value }))}
          placeholder="What effect does this dynamic have on characters and plot?"
          rows={2}
        />
      </div>

      <div className="form-group">
        <label htmlFor="dynamic-triggers">Triggers (comma-separated)</label>
        <input
          id="dynamic-triggers"
          type="text"
          value={formData.triggers.join(', ')}
          onChange={(e) => handleTriggersChange(e.target.value)}
          placeholder="Events, emotions, or situations that affect this dynamic"
        />
      </div>

      <div className="form-group">
        <label htmlFor="dynamic-manifestations">Manifestations (comma-separated)</label>
        <input
          id="dynamic-manifestations"
          type="text"
          value={formData.manifestations.join(', ')}
          onChange={(e) => handleManifestationsChange(e.target.value)}
          placeholder="How this dynamic shows up in the story"
        />
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn--primary">
          Save Dynamic
        </button>
        <button type="button" className="btn btn--secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
};

export default DynamicsManager;
