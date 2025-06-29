import React, { useCallback, useState } from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';
import { TabProps } from '../../../types';
import { StoryAction } from '../types/objectsActions';

export const ActionsManager: React.FC<TabProps> = ({
  scenario,
  onScenarioChange,
  isDirty,
  isLoading,
}) => {
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Initialize objectsAndActions if it doesn't exist
  const objectsAndActions = scenario.objectsAndActions || {
    objects: [],
    actions: [],
    objectCategories: [],
    actionCategories: [],
    interactions: [],
    sequences: [],
    generalNotes: '',
  };

  const actions = objectsAndActions.actions || [];
  const selectedAction = selectedActionId ? actions.find(action => action.id === selectedActionId) : null;

  const handleAddAction = useCallback(() => {
    const newAction: StoryAction = {
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: '',
      type: 'physical',
      category: '',
      description: '',
      purpose: {
        immediate: '',
        character: '',
        plot: '',
      },
      complexity: 'simple',
      duration: {
        timeframe: 'minutes',
        variable: false,
      },
      requirements: {
        skills: [],
        tools: [],
        conditions: [],
        knowledge: [],
        physical: [],
        mental: [],
      },
      consequences: {
        immediate: [],
        shortTerm: [],
        longTerm: [],
        unintended: [],
        risks: [],
        benefits: [],
      },
      variations: [],
      context: [],
      frequency: 'occasional',
      significance: 'minor',
      storyFunction: 'character-revealing',
      characterAssociations: [],
      objectInvolvement: [],
      locationRelevance: [],
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onScenarioChange({
      objectsAndActions: {
        ...objectsAndActions,
        actions: [...actions, newAction],
      },
    });

    setSelectedActionId(newAction.id);
    setShowAddForm(false);
  }, [actions, objectsAndActions, onScenarioChange]);

  const handleDeleteAction = useCallback((actionId: string) => {
    if (window.confirm('Are you sure you want to delete this action?')) {
      onScenarioChange({
        objectsAndActions: {
          ...objectsAndActions,
          actions: actions.filter(action => action.id !== actionId),
        },
      });

      if (selectedActionId === actionId) {
        setSelectedActionId(null);
      }
    }
  }, [actions, objectsAndActions, onScenarioChange, selectedActionId]);

  const handleUpdateAction = useCallback((actionId: string, updates: Partial<StoryAction>) => {
    onScenarioChange({
      objectsAndActions: {
        ...objectsAndActions,
        actions: actions.map(action =>
          action.id === actionId
            ? { ...action, ...updates, updatedAt: new Date().toISOString() }
            : action
        ),
      },
    });
  }, [actions, objectsAndActions, onScenarioChange]);

  // Group actions by type for better organization
  const actionsByType = actions.reduce((acc, action) => {
    if (!acc[action.type]) {
      acc[action.type] = [];
    }
    acc[action.type].push(action);
    return acc;
  }, {} as Record<string, StoryAction[]>);

  return (
    <div className="actions-manager">
      <div className="actions-manager__layout">
        {/* Actions List */}
        <div className="actions-list">
          <div className="actions-list__header">
            <button
              className="btn btn--primary btn--sm"
              onClick={() => setShowAddForm(true)}
              disabled={isLoading}
            >
              <FaPlus /> Add Action
            </button>
          </div>

          <div className="actions-list__content">
            {Object.keys(actionsByType).length === 0 ? (
              <div className="empty-state">
                <p>No actions created yet.</p>
                <button
                  className="btn btn--primary"
                  onClick={() => setShowAddForm(true)}
                  disabled={isLoading}
                >
                  <FaPlus /> Create First Action
                </button>
              </div>
            ) : (
              Object.entries(actionsByType).map(([type, typeActions]) => (
                <div key={type} className="action-type-group">
                  <h4 className="action-type-header">{type.charAt(0).toUpperCase() + type.slice(1)} Actions</h4>
                  <div className="action-items">
                    {typeActions.map((action) => (
                      <div
                        key={action.id}
                        className={`action-item ${selectedActionId === action.id ? 'selected' : ''}`}
                        onClick={() => setSelectedActionId(action.id)}
                      >
                        <div className="action-item__info">
                          <div className="action-name">{action.name || 'Unnamed Action'}</div>
                          <div className="action-significance">{action.significance} - {action.complexity}</div>
                        </div>
                        <button
                          className="btn btn--danger btn--sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAction(action.id);
                          }}
                          disabled={isLoading}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Action Details */}
        <div className="action-details">
          {selectedAction ? (
            <div className="action-form">
              <h3>Edit Action</h3>
              
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={selectedAction.name}
                  onChange={(e) => handleUpdateAction(selectedAction.id, { name: e.target.value })}
                  placeholder="Enter action name"
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label>Type</label>
                <select
                  value={selectedAction.type}
                  onChange={(e) => handleUpdateAction(selectedAction.id, { type: e.target.value as StoryAction['type'] })}
                  disabled={isLoading}
                >
                  <option value="physical">Physical</option>
                  <option value="mental">Mental</option>
                  <option value="social">Social</option>
                  <option value="magical">Magical</option>
                  <option value="technological">Technological</option>
                  <option value="emotional">Emotional</option>
                  <option value="narrative">Narrative</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Category</label>
                <input
                  type="text"
                  value={selectedAction.category}
                  onChange={(e) => handleUpdateAction(selectedAction.id, { category: e.target.value })}
                  placeholder="Custom category (e.g., Combat, Communication, Travel)"
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={selectedAction.description}
                  onChange={(e) => handleUpdateAction(selectedAction.id, { description: e.target.value })}
                  placeholder="Describe the action, how it's performed, and its effects..."
                  rows={6}
                  disabled={isLoading}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Complexity</label>
                  <select
                    value={selectedAction.complexity}
                    onChange={(e) => handleUpdateAction(selectedAction.id, { complexity: e.target.value as StoryAction['complexity'] })}
                    disabled={isLoading}
                  >
                    <option value="simple">Simple</option>
                    <option value="moderate">Moderate</option>
                    <option value="complex">Complex</option>
                    <option value="intricate">Intricate</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Significance</label>
                  <select
                    value={selectedAction.significance}
                    onChange={(e) => handleUpdateAction(selectedAction.id, { significance: e.target.value as StoryAction['significance'] })}
                    disabled={isLoading}
                  >
                    <option value="trivial">Trivial</option>
                    <option value="minor">Minor</option>
                    <option value="moderate">Moderate</option>
                    <option value="major">Major</option>
                    <option value="pivotal">Pivotal</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Frequency</label>
                  <select
                    value={selectedAction.frequency}
                    onChange={(e) => handleUpdateAction(selectedAction.id, { frequency: e.target.value as StoryAction['frequency'] })}
                    disabled={isLoading}
                  >
                    <option value="one-time">One-time</option>
                    <option value="rare">Rare</option>
                    <option value="occasional">Occasional</option>
                    <option value="frequent">Frequent</option>
                    <option value="habitual">Habitual</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Story Function</label>
                <select
                  value={selectedAction.storyFunction}
                  onChange={(e) => handleUpdateAction(selectedAction.id, { storyFunction: e.target.value as StoryAction['storyFunction'] })}
                  disabled={isLoading}
                >
                  <option value="plot-advancing">Plot Advancing</option>
                  <option value="character-revealing">Character Revealing</option>
                  <option value="world-building">World Building</option>
                  <option value="tension-building">Tension Building</option>
                  <option value="resolution">Resolution</option>
                  <option value="transition">Transition</option>
                </select>
              </div>

              <div className="form-group">
                <label>Purpose</label>
                <div className="purpose-fields">
                  <div className="form-subgroup">
                    <label>Immediate Purpose</label>
                    <textarea
                      value={selectedAction.purpose.immediate}
                      onChange={(e) => handleUpdateAction(selectedAction.id, {
                        purpose: { ...selectedAction.purpose, immediate: e.target.value }
                      })}
                      placeholder="What does this action accomplish immediately?"
                      rows={2}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="form-subgroup">
                    <label>Character Revelation</label>
                    <textarea
                      value={selectedAction.purpose.character}
                      onChange={(e) => handleUpdateAction(selectedAction.id, {
                        purpose: { ...selectedAction.purpose, character: e.target.value }
                      })}
                      placeholder="What does this action reveal about the character?"
                      rows={2}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="form-subgroup">
                    <label>Plot Advancement</label>
                    <textarea
                      value={selectedAction.purpose.plot}
                      onChange={(e) => handleUpdateAction(selectedAction.id, {
                        purpose: { ...selectedAction.purpose, plot: e.target.value }
                      })}
                      placeholder="How does this action advance the plot?"
                      rows={2}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Required Skills</label>
                <textarea
                  value={selectedAction.requirements.skills.join('\n')}
                  onChange={(e) => handleUpdateAction(selectedAction.id, {
                    requirements: {
                      ...selectedAction.requirements,
                      skills: e.target.value.split('\n').filter(skill => skill.trim())
                    }
                  })}
                  placeholder="Enter each required skill on a new line..."
                  rows={3}
                  disabled={isLoading}
                />
              </div>

              <div className="form-actions">
                <button
                  className="btn btn--secondary"
                  onClick={() => setSelectedActionId(null)}
                  disabled={isLoading}
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div className="no-selection">
              <p>Select an action to view and edit its details.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Action Modal/Form */}
      {showAddForm && (
        <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3>Add New Action</h3>
              <button
                className="modal__close"
                onClick={() => setShowAddForm(false)}
              >
                ×
              </button>
            </div>
            <div className="modal__body">
              <p>This will create a new action that you can then edit in detail.</p>
            </div>
            <div className="modal__footer">
              <button
                className="btn btn--secondary"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn--primary"
                onClick={handleAddAction}
                disabled={isLoading}
              >
                <FaPlus /> Create Action
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
