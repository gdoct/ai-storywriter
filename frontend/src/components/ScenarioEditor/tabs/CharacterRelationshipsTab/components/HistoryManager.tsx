import React, { useCallback, useState } from 'react';
import { FaCog, FaEye, FaPlus, FaTrash } from 'react-icons/fa';
import { Character } from '../../../../../types/ScenarioTypes';
import { RelationshipHistory } from '../types/relationships';

interface HistoryManagerProps {
  histories: RelationshipHistory[];
  onHistoriesChange: (histories: RelationshipHistory[]) => void;
  characters: Character[];
  readonly?: boolean;
}

const HistoryManager: React.FC<HistoryManagerProps> = ({
  histories,
  onHistoriesChange,
  characters,
  readonly = false,
}) => {
  const [editingHistory, setEditingHistory] = useState<RelationshipHistory | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [expandedHistories, setExpandedHistories] = useState<Set<string>>(new Set());

  const toggleExpanded = useCallback((historyId: string) => {
    setExpandedHistories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(historyId)) {
        newSet.delete(historyId);
      } else {
        newSet.add(historyId);
      }
      return newSet;
    });
  }, []);

  const handleCreateHistory = useCallback(() => {
    const newHistory: RelationshipHistory = {
      id: `history_${Date.now()}`,
      relationshipId: '',
      title: '',
      timeframe: '',
      description: '',
      type: 'milestone',
      impact: '',
      emotions: [],
      consequences: [],
      witnesses: [],
      secrets: [],
      storyRelevance: '',
      order: histories.length + 1,
    };
    setEditingHistory(newHistory);
    setIsCreating(true);
  }, [histories.length]);

  const handleSaveHistory = useCallback((history: RelationshipHistory) => {
    if (isCreating) {
      onHistoriesChange([...histories, history]);
      setIsCreating(false);
    } else {
      onHistoriesChange(histories.map(h => h.id === history.id ? history : h));
    }
    setEditingHistory(null);
  }, [histories, onHistoriesChange, isCreating]);

  const handleDeleteHistory = useCallback((historyId: string) => {
    onHistoriesChange(histories.filter(h => h.id !== historyId));
  }, [histories, onHistoriesChange]);

  const handleCancelEdit = useCallback(() => {
    setEditingHistory(null);
    setIsCreating(false);
  }, []);

  const getCharacterName = useCallback((characterId: string) => {
    const character = characters.find(c => c.id === characterId);
    return character ? character.name : 'Unknown Character';
  }, [characters]);

  // Sort histories by order
  const sortedHistories = [...histories].sort((a, b) => a.order - b.order);

  return (
    <div className="history-manager">
      <div className="history-manager__header">
        <h3>Relationship History</h3>
        {!readonly && (
          <button
            className="btn btn--primary history-manager__add-btn"
            onClick={handleCreateHistory}
            disabled={isCreating}
          >
            <FaPlus /> Add History Event
          </button>
        )}
      </div>

      <div className="history-manager__list">
        {sortedHistories.map((history) => {
          const isExpanded = expandedHistories.has(history.id);
          const isEditing = editingHistory?.id === history.id;

          return (
            <div key={history.id} className="history-item">
              <div className="history-item__header">
                <button
                  className="history-item__expand-btn"
                  onClick={() => toggleExpanded(history.id)}
                >
                  <FaEye />
                </button>
                <div className="history-item__title">
                  <h4>{history.title || 'Unnamed Event'}</h4>
                  <span className={`history-item__type history-item__type--${history.type}`}>
                    {history.type}
                  </span>
                  {history.timeframe && (
                    <span className="history-item__timeframe">
                      {history.timeframe}
                    </span>
                  )}
                  <span className="history-item__order">
                    #{history.order}
                  </span>
                </div>
                {!readonly && (
                  <div className="history-item__actions">
                    <button
                      className="btn btn--secondary btn--small"
                      onClick={() => setEditingHistory(history)}
                    >
                      <FaCog />
                    </button>
                    <button
                      className="btn btn--danger btn--small"
                      onClick={() => handleDeleteHistory(history.id)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                )}
              </div>

              {isExpanded && (
                <div className="history-item__content">
                  {!isEditing ? (
                    <div className="history-item__view">
                      <div className="history-item__field">
                        <label>Description:</label>
                        <p>{history.description || 'No description provided'}</p>
                      </div>
                      {history.impact && (
                        <div className="history-item__field">
                          <label>Impact:</label>
                          <p>{history.impact}</p>
                        </div>
                      )}
                      {history.emotions && history.emotions.length > 0 && (
                        <div className="history-item__field">
                          <label>Emotions:</label>
                          <div className="emotions-list">
                            {history.emotions.map((emotion, index) => (
                              <span key={index} className="emotion-tag">
                                {emotion}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {history.consequences && history.consequences.length > 0 && (
                        <div className="history-item__field">
                          <label>Consequences:</label>
                          <ul>
                            {history.consequences.map((consequence, index) => (
                              <li key={index}>{consequence}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {history.witnesses && history.witnesses.length > 0 && (
                        <div className="history-item__field">
                          <label>Witnesses:</label>
                          <div className="witnesses-list">
                            {history.witnesses.map((witnessId, index) => (
                              <span key={index} className="character-tag">
                                {getCharacterName(witnessId)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {history.secrets && history.secrets.length > 0 && (
                        <div className="history-item__field">
                          <label>Secrets:</label>
                          <ul>
                            {history.secrets.map((secret, index) => (
                              <li key={index}>{secret}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {history.storyRelevance && (
                        <div className="history-item__field">
                          <label>Story Relevance:</label>
                          <p>{history.storyRelevance}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <HistoryEditor
                      history={history}
                      characters={characters}
                      onSave={handleSaveHistory}
                      onCancel={handleCancelEdit}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}

        {isCreating && editingHistory && (
          <div className="history-item history-item--creating">
            <div className="history-item__header">
              <h4>New History Event</h4>
            </div>
            <div className="history-item__content">
              <HistoryEditor
                history={editingHistory}
                characters={characters}
                onSave={handleSaveHistory}
                onCancel={handleCancelEdit}
              />
            </div>
          </div>
        )}
      </div>

      {histories.length === 0 && !isCreating && (
        <div className="history-manager__empty">
          <p>No relationship history events defined yet.</p>
          {!readonly && (
            <button
              className="btn btn--primary"
              onClick={handleCreateHistory}
            >
              <FaPlus /> Create Your First History Event
            </button>
          )}
        </div>
      )}
    </div>
  );
};

interface HistoryEditorProps {
  history: RelationshipHistory;
  characters: Character[];
  onSave: (history: RelationshipHistory) => void;
  onCancel: () => void;
}

const HistoryEditor: React.FC<HistoryEditorProps> = ({
  history,
  characters,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<RelationshipHistory>({ ...history });

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title.trim()) {
      onSave(formData);
    }
  }, [formData, onSave]);

  const handleEmotionsChange = useCallback((value: string) => {
    setFormData(prev => ({
      ...prev,
      emotions: value.split(',').map(e => e.trim()).filter(e => e.length > 0)
    }));
  }, []);

  const handleConsequencesChange = useCallback((value: string) => {
    setFormData(prev => ({
      ...prev,
      consequences: value.split(',').map(c => c.trim()).filter(c => c.length > 0)
    }));
  }, []);

  const handleSecretsChange = useCallback((value: string) => {
    setFormData(prev => ({
      ...prev,
      secrets: value.split(',').map(s => s.trim()).filter(s => s.length > 0)
    }));
  }, []);

  const handleWitnessToggle = useCallback((characterId: string) => {
    setFormData(prev => ({
      ...prev,
      witnesses: prev.witnesses.includes(characterId)
        ? prev.witnesses.filter(id => id !== characterId)
        : [...prev.witnesses, characterId]
    }));
  }, []);

  return (
    <form onSubmit={handleSubmit} className="history-editor">
      <div className="form-group">
        <label htmlFor="history-title">Title *</label>
        <input
          id="history-title"
          type="text"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Enter event title"
          required
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="history-type">Type</label>
          <select
            id="history-type"
            value={formData.type}
            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
          >
            <option value="origin">Origin</option>
            <option value="milestone">Milestone</option>
            <option value="crisis">Crisis</option>
            <option value="growth">Growth</option>
            <option value="setback">Setback</option>
            <option value="revelation">Revelation</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="history-timeframe">Timeframe</label>
          <input
            id="history-timeframe"
            type="text"
            value={formData.timeframe}
            onChange={(e) => setFormData(prev => ({ ...prev, timeframe: e.target.value }))}
            placeholder="When did this happen?"
          />
        </div>

        <div className="form-group">
          <label htmlFor="history-order">Order</label>
          <input
            id="history-order"
            type="number"
            min="1"
            value={formData.order}
            onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 1 }))}
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="history-description">Description</label>
        <textarea
          id="history-description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe what happened"
          rows={3}
        />
      </div>

      <div className="form-group">
        <label htmlFor="history-impact">Impact</label>
        <textarea
          id="history-impact"
          value={formData.impact}
          onChange={(e) => setFormData(prev => ({ ...prev, impact: e.target.value }))}
          placeholder="What impact did this event have?"
          rows={2}
        />
      </div>

      <div className="form-group">
        <label htmlFor="history-emotions">Emotions (comma-separated)</label>
        <input
          id="history-emotions"
          type="text"
          value={formData.emotions.join(', ')}
          onChange={(e) => handleEmotionsChange(e.target.value)}
          placeholder="What emotions were involved?"
        />
      </div>

      <div className="form-group">
        <label htmlFor="history-consequences">Consequences (comma-separated)</label>
        <input
          id="history-consequences"
          type="text"
          value={formData.consequences.join(', ')}
          onChange={(e) => handleConsequencesChange(e.target.value)}
          placeholder="What were the consequences?"
        />
      </div>

      <div className="form-group">
        <label>Witnesses</label>
        <div className="character-selection">
          {characters.map(character => (
            <label key={character.id} className="character-checkbox">
              <input
                type="checkbox"
                checked={formData.witnesses.includes(character.id)}
                onChange={() => handleWitnessToggle(character.id)}
              />
              {character.name}
            </label>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="history-secrets">Secrets (comma-separated)</label>
        <input
          id="history-secrets"
          type="text"
          value={formData.secrets.join(', ')}
          onChange={(e) => handleSecretsChange(e.target.value)}
          placeholder="Any secrets related to this event?"
        />
      </div>

      <div className="form-group">
        <label htmlFor="history-story-relevance">Story Relevance</label>
        <textarea
          id="history-story-relevance"
          value={formData.storyRelevance}
          onChange={(e) => setFormData(prev => ({ ...prev, storyRelevance: e.target.value }))}
          placeholder="How does this event relate to the main story?"
          rows={2}
        />
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn--primary">
          Save History Event
        </button>
        <button type="button" className="btn btn--secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
};

export default HistoryManager;
