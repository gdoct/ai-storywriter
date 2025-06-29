import React, { useCallback, useState } from 'react';
import { FaCog, FaEye, FaPlus, FaTimes, FaTrash } from 'react-icons/fa';
import { Character } from '../../../../../types/ScenarioTypes';
import { ConflictEscalation, ConflictPosition, RelationshipConflict } from '../types/relationships';

interface ConflictsManagerProps {
  conflicts: RelationshipConflict[];
  onConflictsChange: (conflicts: RelationshipConflict[]) => void;
  characters: Character[];
  readonly?: boolean;
}

const ConflictsManager: React.FC<ConflictsManagerProps> = ({
  conflicts,
  onConflictsChange,
  characters,
  readonly = false,
}) => {
  const [editingConflict, setEditingConflict] = useState<RelationshipConflict | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [expandedConflicts, setExpandedConflicts] = useState<Set<string>>(new Set());

  const toggleExpanded = useCallback((conflictId: string) => {
    setExpandedConflicts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(conflictId)) {
        newSet.delete(conflictId);
      } else {
        newSet.add(conflictId);
      }
      return newSet;
    });
  }, []);

  const handleCreateConflict = useCallback(() => {
    const newConflict: RelationshipConflict = {
      id: `conflict_${Date.now()}`,
      relationshipId: '',
      title: '',
      type: 'values',
      description: '',
      rootCause: '',
      manifestation: '',
      stakes: '',
      positions: [],
      escalation: [],
      resolution: {
        type: 'unresolved',
        description: '',
        outcome: '',
        growth: [],
        costs: [],
        newEquilibrium: '',
      },
      impact: '',
      lessons: [],
      recurringElement: false,
      status: 'brewing',
      storyRelevance: '',
    };
    setEditingConflict(newConflict);
    setIsCreating(true);
  }, []);

  const handleSaveConflict = useCallback((conflict: RelationshipConflict) => {
    if (isCreating) {
      onConflictsChange([...conflicts, conflict]);
      setIsCreating(false);
    } else {
      onConflictsChange(conflicts.map(c => c.id === conflict.id ? conflict : c));
    }
    setEditingConflict(null);
  }, [conflicts, onConflictsChange, isCreating]);

  const handleDeleteConflict = useCallback((conflictId: string) => {
    onConflictsChange(conflicts.filter(c => c.id !== conflictId));
  }, [conflicts, onConflictsChange]);

  const handleCancelEdit = useCallback(() => {
    setEditingConflict(null);
    setIsCreating(false);
  }, []);

  const getCharacterName = useCallback((characterId: string) => {
    const character = characters.find(c => c.id === characterId);
    return character ? character.name : 'Unknown Character';
  }, [characters]);

  return (
    <div className="conflicts-manager">
      <div className="conflicts-manager__header">
        <h3>Relationship Conflicts</h3>
        {!readonly && (
          <button
            className="btn btn--primary conflicts-manager__add-btn"
            onClick={handleCreateConflict}
            disabled={isCreating}
          >
            <FaPlus /> Add Conflict
          </button>
        )}
      </div>

      <div className="conflicts-manager__list">
        {conflicts.map((conflict) => {
          const isExpanded = expandedConflicts.has(conflict.id);
          const isEditing = editingConflict?.id === conflict.id;

          return (
            <div key={conflict.id} className="conflict-item">
              <div className="conflict-item__header">
                <button
                  className="conflict-item__expand-btn"
                  onClick={() => toggleExpanded(conflict.id)}
                >
                  <FaEye />
                </button>
                <div className="conflict-item__title">
                  <h4>{conflict.title || 'Unnamed Conflict'}</h4>
                  <span className={`conflict-item__type conflict-item__type--${conflict.type}`}>
                    {conflict.type}
                  </span>
                  <span className={`conflict-item__status conflict-item__status--${conflict.status}`}>
                    {conflict.status}
                  </span>
                </div>
                {!readonly && (
                  <div className="conflict-item__actions">
                    <button
                      className="btn btn--secondary btn--small"
                      onClick={() => setEditingConflict(conflict)}
                    >
                      <FaCog />
                    </button>
                    <button
                      className="btn btn--danger btn--small"
                      onClick={() => handleDeleteConflict(conflict.id)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                )}
              </div>

              {isExpanded && (
                <div className="conflict-item__content">
                  {!isEditing ? (
                    <div className="conflict-item__view">
                      <div className="conflict-item__field">
                        <label>Description:</label>
                        <p>{conflict.description || 'No description provided'}</p>
                      </div>
                      <div className="conflict-item__field">
                        <label>Root Cause:</label>
                        <p>{conflict.rootCause || 'No root cause specified'}</p>
                      </div>
                      <div className="conflict-item__field">
                        <label>Stakes:</label>
                        <p>{conflict.stakes || 'No stakes specified'}</p>
                      </div>
                      {conflict.manifestation && (
                        <div className="conflict-item__field">
                          <label>How it Manifests:</label>
                          <p>{conflict.manifestation}</p>
                        </div>
                      )}
                      {conflict.positions && conflict.positions.length > 0 && (
                        <div className="conflict-item__field">
                          <label>Character Positions:</label>
                          <div className="positions-list">
                            {conflict.positions.map((position, index) => (
                              <div key={index} className="position-item">
                                <strong>{getCharacterName(position.characterId)}:</strong> {position.position}
                                {position.reasoning && <p className="position-reasoning">{position.reasoning}</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {conflict.escalation && conflict.escalation.length > 0 && (
                        <div className="conflict-item__field">
                          <label>Escalation Stages:</label>
                          <ol className="escalation-list">
                            {conflict.escalation.map((stage, index) => (
                              <li key={index}>
                                <strong>{stage.stage}:</strong> {stage.description}
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                      {conflict.resolution && conflict.resolution.type !== 'unresolved' && (
                        <div className="conflict-item__field">
                          <label>Resolution:</label>
                          <div className="resolution-info">
                            <p><strong>Type:</strong> {conflict.resolution.type}</p>
                            <p><strong>Description:</strong> {conflict.resolution.description}</p>
                            {conflict.resolution.outcome && (
                              <p><strong>Outcome:</strong> {conflict.resolution.outcome}</p>
                            )}
                          </div>
                        </div>
                      )}
                      {conflict.impact && (
                        <div className="conflict-item__field">
                          <label>Impact:</label>
                          <p>{conflict.impact}</p>
                        </div>
                      )}
                      {conflict.lessons && conflict.lessons.length > 0 && (
                        <div className="conflict-item__field">
                          <label>Lessons:</label>
                          <ul>
                            {conflict.lessons.map((lesson, index) => (
                              <li key={index}>{lesson}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {conflict.storyRelevance && (
                        <div className="conflict-item__field">
                          <label>Story Relevance:</label>
                          <p>{conflict.storyRelevance}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <ConflictEditor
                      conflict={conflict}
                      characters={characters}
                      onSave={handleSaveConflict}
                      onCancel={handleCancelEdit}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}

        {isCreating && editingConflict && (
          <div className="conflict-item conflict-item--creating">
            <div className="conflict-item__header">
              <h4>New Conflict</h4>
            </div>
            <div className="conflict-item__content">
              <ConflictEditor
                conflict={editingConflict}
                characters={characters}
                onSave={handleSaveConflict}
                onCancel={handleCancelEdit}
              />
            </div>
          </div>
        )}
      </div>

      {conflicts.length === 0 && !isCreating && (
        <div className="conflicts-manager__empty">
          <p>No relationship conflicts defined yet.</p>
          {!readonly && (
            <button
              className="btn btn--primary"
              onClick={handleCreateConflict}
            >
              <FaPlus /> Create Your First Conflict
            </button>
          )}
        </div>
      )}
    </div>
  );
};

interface ConflictEditorProps {
  conflict: RelationshipConflict;
  characters: Character[];
  onSave: (conflict: RelationshipConflict) => void;
  onCancel: () => void;
}

const ConflictEditor: React.FC<ConflictEditorProps> = ({
  conflict,
  characters,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<RelationshipConflict>({ ...conflict });

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title.trim()) {
      onSave(formData);
    }
  }, [formData, onSave]);

  const handleLessonsChange = useCallback((value: string) => {
    setFormData(prev => ({
      ...prev,
      lessons: value.split(',').map(l => l.trim()).filter(l => l.length > 0)
    }));
  }, []);

  const handlePositionAdd = useCallback(() => {
    const newPosition: ConflictPosition = {
      characterId: '',
      position: '',
      reasoning: '',
      emotions: [],
      stakes: '',
      flexibility: 5,
    };
    setFormData(prev => ({
      ...prev,
      positions: [...prev.positions, newPosition]
    }));
  }, []);

  const handlePositionChange = useCallback((index: number, field: keyof ConflictPosition, value: any) => {
    setFormData(prev => ({
      ...prev,
      positions: prev.positions.map((position, i) => 
        i === index ? { ...position, [field]: value } : position
      )
    }));
  }, []);

  const handlePositionRemove = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      positions: prev.positions.filter((_, i) => i !== index)
    }));
  }, []);

  const handleEscalationAdd = useCallback(() => {
    const newEscalation: ConflictEscalation = {
      stage: '',
      description: '',
      triggers: [],
      actions: [],
      consequences: [],
    };
    setFormData(prev => ({
      ...prev,
      escalation: [...prev.escalation, newEscalation]
    }));
  }, []);

  const handleEscalationChange = useCallback((index: number, field: keyof ConflictEscalation, value: any) => {
    setFormData(prev => ({
      ...prev,
      escalation: prev.escalation.map((escalation, i) => 
        i === index ? { ...escalation, [field]: value } : escalation
      )
    }));
  }, []);

  const handleEscalationRemove = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      escalation: prev.escalation.filter((_, i) => i !== index)
    }));
  }, []);

  return (
    <form onSubmit={handleSubmit} className="conflict-editor">
      <div className="form-group">
        <label htmlFor="conflict-title">Title *</label>
        <input
          id="conflict-title"
          type="text"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Enter conflict title"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="conflict-description">Description</label>
        <textarea
          id="conflict-description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe this conflict"
          rows={3}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="conflict-type">Type</label>
          <select
            id="conflict-type"
            value={formData.type}
            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
          >
            <option value="values">Values</option>
            <option value="goals">Goals</option>
            <option value="methods">Methods</option>
            <option value="misunderstanding">Misunderstanding</option>
            <option value="external">External</option>
            <option value="internal">Internal</option>
            <option value="historical">Historical</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="conflict-status">Status</label>
          <select
            id="conflict-status"
            value={formData.status}
            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
          >
            <option value="brewing">Brewing</option>
            <option value="active">Active</option>
            <option value="escalating">Escalating</option>
            <option value="resolving">Resolving</option>
            <option value="resolved">Resolved</option>
            <option value="dormant">Dormant</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="conflict-root-cause">Root Cause</label>
        <textarea
          id="conflict-root-cause"
          value={formData.rootCause}
          onChange={(e) => setFormData(prev => ({ ...prev, rootCause: e.target.value }))}
          placeholder="What is the underlying cause of this conflict?"
          rows={2}
        />
      </div>

      <div className="form-group">
        <label htmlFor="conflict-stakes">Stakes</label>
        <textarea
          id="conflict-stakes"
          value={formData.stakes}
          onChange={(e) => setFormData(prev => ({ ...prev, stakes: e.target.value }))}
          placeholder="What's at risk in this conflict?"
          rows={2}
        />
      </div>

      <div className="form-group">
        <label htmlFor="conflict-manifestation">How it Manifests</label>
        <textarea
          id="conflict-manifestation"
          value={formData.manifestation}
          onChange={(e) => setFormData(prev => ({ ...prev, manifestation: e.target.value }))}
          placeholder="How does this conflict show up in the story?"
          rows={2}
        />
      </div>

      <div className="form-group">
        <label>Character Positions</label>
        <div className="positions-editor">
          {formData.positions.map((position, index) => (
            <div key={index} className="position-editor-item">
              <div className="position-editor-row">
                <select
                  value={position.characterId}
                  onChange={(e) => handlePositionChange(index, 'characterId', e.target.value)}
                >
                  <option value="">Select Character</option>
                  {characters.map(character => (
                    <option key={character.id} value={character.id}>
                      {character.name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={position.position}
                  onChange={(e) => handlePositionChange(index, 'position', e.target.value)}
                  placeholder="Character's position"
                />
                <button
                  type="button"
                  className="btn btn--danger btn--small"
                  onClick={() => handlePositionRemove(index)}
                >
                  <FaTimes />
                </button>
              </div>
              <textarea
                value={position.reasoning}
                onChange={(e) => handlePositionChange(index, 'reasoning', e.target.value)}
                placeholder="Why does this character hold this position?"
                rows={2}
              />
            </div>
          ))}
          <button
            type="button"
            className="btn btn--secondary btn--small"
            onClick={handlePositionAdd}
          >
            <FaPlus /> Add Position
          </button>
        </div>
      </div>

      <div className="form-group">
        <label>Escalation Stages</label>
        <div className="escalation-editor">
          {formData.escalation.map((escalation, index) => (
            <div key={index} className="escalation-editor-item">
              <div className="escalation-editor-row">
                <input
                  type="text"
                  value={escalation.stage}
                  onChange={(e) => handleEscalationChange(index, 'stage', e.target.value)}
                  placeholder="Stage name"
                />
                <button
                  type="button"
                  className="btn btn--danger btn--small"
                  onClick={() => handleEscalationRemove(index)}
                >
                  <FaTimes />
                </button>
              </div>
              <textarea
                value={escalation.description}
                onChange={(e) => handleEscalationChange(index, 'description', e.target.value)}
                placeholder="What happens in this escalation stage?"
                rows={2}
              />
            </div>
          ))}
          <button
            type="button"
            className="btn btn--secondary btn--small"
            onClick={handleEscalationAdd}
          >
            <FaPlus /> Add Escalation Stage
          </button>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="conflict-impact">Impact</label>
        <textarea
          id="conflict-impact"
          value={formData.impact}
          onChange={(e) => setFormData(prev => ({ ...prev, impact: e.target.value }))}
          placeholder="What impact does this conflict have?"
          rows={2}
        />
      </div>

      <div className="form-group">
        <label htmlFor="conflict-lessons">Lessons (comma-separated)</label>
        <input
          id="conflict-lessons"
          type="text"
          value={formData.lessons.join(', ')}
          onChange={(e) => handleLessonsChange(e.target.value)}
          placeholder="What lessons can be learned?"
        />
      </div>

      <div className="form-group">
        <label htmlFor="conflict-story-relevance">Story Relevance</label>
        <textarea
          id="conflict-story-relevance"
          value={formData.storyRelevance}
          onChange={(e) => setFormData(prev => ({ ...prev, storyRelevance: e.target.value }))}
          placeholder="How does this conflict relate to the main story?"
          rows={2}
        />
      </div>

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={formData.recurringElement}
            onChange={(e) => setFormData(prev => ({ ...prev, recurringElement: e.target.checked }))}
          />
          Recurring Element
        </label>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn--primary">
          Save Conflict
        </button>
        <button type="button" className="btn btn--secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
};

export default ConflictsManager;
