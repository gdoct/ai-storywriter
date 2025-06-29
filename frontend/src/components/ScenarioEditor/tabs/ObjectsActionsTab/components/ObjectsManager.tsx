import React, { useCallback, useState } from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';
import { TabProps } from '../../../types';
import { StoryObject } from '../types/objectsActions';

export const ObjectsManager: React.FC<TabProps> = ({
  scenario,
  onScenarioChange,
  isDirty,
  isLoading,
}) => {
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
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

  const objects = objectsAndActions.objects || [];
  const selectedObject = selectedObjectId ? objects.find(obj => obj.id === selectedObjectId) : null;

  const handleAddObject = useCallback(() => {
    const newObject: StoryObject = {
      id: `object_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: '',
      type: 'other',
      description: '',
      physicalProperties: {
        size: 'medium',
        weight: 'moderate',
        material: [],
        color: [],
        texture: '',
        durability: 'sturdy',
        flexibility: 'rigid',
        transparency: 'opaque',
        special: [],
      },
      significance: 'background',
      rarity: 'common',
      condition: 'good',
      origin: {
        creationMethod: '',
        materials: [],
        purpose: '',
        backstory: '',
      },
      history: [],
      ownership: [],
      location: {
        currentLocation: '',
        locationType: 'unknown',
        accessibility: 'public',
        security: 'none',
        conditions: [],
        history: [],
      },
      capabilities: [],
      limitations: [],
      storyRole: {
        plotRole: 'none',
        characterRole: 'none',
        themeRole: '',
        importance: 'decorative',
      },
      appearances: [],
      interactions: [],
      relatedObjects: [],
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onScenarioChange({
      objectsAndActions: {
        ...objectsAndActions,
        objects: [...objects, newObject],
      },
    });

    setSelectedObjectId(newObject.id);
    setShowAddForm(false);
  }, [objects, objectsAndActions, onScenarioChange]);

  const handleDeleteObject = useCallback((objectId: string) => {
    if (window.confirm('Are you sure you want to delete this object?')) {
      onScenarioChange({
        objectsAndActions: {
          ...objectsAndActions,
          objects: objects.filter(obj => obj.id !== objectId),
        },
      });

      if (selectedObjectId === objectId) {
        setSelectedObjectId(null);
      }
    }
  }, [objects, objectsAndActions, onScenarioChange, selectedObjectId]);

  const handleUpdateObject = useCallback((objectId: string, updates: Partial<StoryObject>) => {
    onScenarioChange({
      objectsAndActions: {
        ...objectsAndActions,
        objects: objects.map(obj =>
          obj.id === objectId
            ? { ...obj, ...updates, updatedAt: new Date().toISOString() }
            : obj
        ),
      },
    });
  }, [objects, objectsAndActions, onScenarioChange]);

  // Group objects by type for better organization
  const objectsByType = objects.reduce((acc, obj) => {
    if (!acc[obj.type]) {
      acc[obj.type] = [];
    }
    acc[obj.type].push(obj);
    return acc;
  }, {} as Record<string, StoryObject[]>);

  return (
    <div className="objects-manager">
      <div className="objects-manager__layout">
        {/* Objects List */}
        <div className="objects-list">
          <div className="objects-list__header">
            <button
              className="btn btn--primary btn--sm"
              onClick={() => setShowAddForm(true)}
              disabled={isLoading}
            >
              <FaPlus /> Add Object
            </button>
          </div>

          <div className="objects-list__content">
            {Object.keys(objectsByType).length === 0 ? (
              <div className="empty-state">
                <p>No objects created yet.</p>
                <button
                  className="btn btn--primary"
                  onClick={() => setShowAddForm(true)}
                  disabled={isLoading}
                >
                  <FaPlus /> Create First Object
                </button>
              </div>
            ) : (
              Object.entries(objectsByType).map(([type, typeObjects]) => (
                <div key={type} className="object-type-group">
                  <h4 className="object-type-header">{type.charAt(0).toUpperCase() + type.slice(1)}s</h4>
                  <div className="object-items">
                    {typeObjects.map((obj) => (
                      <div
                        key={obj.id}
                        className={`object-item ${selectedObjectId === obj.id ? 'selected' : ''}`}
                        onClick={() => setSelectedObjectId(obj.id)}
                      >
                        <div className="object-item__info">
                          <div className="object-name">{obj.name || 'Unnamed Object'}</div>
                          <div className="object-significance">{obj.significance}</div>
                        </div>
                        <button
                          className="btn btn--danger btn--sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteObject(obj.id);
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

        {/* Object Details */}
        <div className="object-details">
          {selectedObject ? (
            <div className="object-form">
              <h3>Edit Object</h3>
              
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={selectedObject.name}
                  onChange={(e) => handleUpdateObject(selectedObject.id, { name: e.target.value })}
                  placeholder="Enter object name"
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label>Type</label>
                <select
                  value={selectedObject.type}
                  onChange={(e) => handleUpdateObject(selectedObject.id, { type: e.target.value as StoryObject['type'] })}
                  disabled={isLoading}
                >
                  <option value="weapon">Weapon</option>
                  <option value="tool">Tool</option>
                  <option value="artifact">Artifact</option>
                  <option value="clothing">Clothing</option>
                  <option value="furniture">Furniture</option>
                  <option value="vehicle">Vehicle</option>
                  <option value="document">Document</option>
                  <option value="jewelry">Jewelry</option>
                  <option value="technology">Technology</option>
                  <option value="natural">Natural</option>
                  <option value="magical">Magical</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Significance</label>
                <select
                  value={selectedObject.significance}
                  onChange={(e) => handleUpdateObject(selectedObject.id, { significance: e.target.value as StoryObject['significance'] })}
                  disabled={isLoading}
                >
                  <option value="critical">Critical</option>
                  <option value="important">Important</option>
                  <option value="useful">Useful</option>
                  <option value="decorative">Decorative</option>
                  <option value="background">Background</option>
                </select>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={selectedObject.description}
                  onChange={(e) => handleUpdateObject(selectedObject.id, { description: e.target.value })}
                  placeholder="Describe the object's appearance, properties, and significance..."
                  rows={6}
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label>Physical Properties</label>
                <div className="property-grid">
                  <div className="property-item">
                    <label>Size</label>
                    <select
                      value={selectedObject.physicalProperties.size}
                      onChange={(e) => handleUpdateObject(selectedObject.id, {
                        physicalProperties: {
                          ...selectedObject.physicalProperties,
                          size: e.target.value as any
                        }
                      })}
                      disabled={isLoading}
                    >
                      <option value="tiny">Tiny</option>
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                      <option value="huge">Huge</option>
                      <option value="massive">Massive</option>
                    </select>
                  </div>

                  <div className="property-item">
                    <label>Weight</label>
                    <select
                      value={selectedObject.physicalProperties.weight}
                      onChange={(e) => handleUpdateObject(selectedObject.id, {
                        physicalProperties: {
                          ...selectedObject.physicalProperties,
                          weight: e.target.value as any
                        }
                      })}
                      disabled={isLoading}
                    >
                      <option value="negligible">Negligible</option>
                      <option value="light">Light</option>
                      <option value="moderate">Moderate</option>
                      <option value="heavy">Heavy</option>
                      <option value="very-heavy">Very Heavy</option>
                    </select>
                  </div>

                  <div className="property-item">
                    <label>Condition</label>
                    <select
                      value={selectedObject.condition}
                      onChange={(e) => handleUpdateObject(selectedObject.id, { condition: e.target.value as any })}
                      disabled={isLoading}
                    >
                      <option value="pristine">Pristine</option>
                      <option value="good">Good</option>
                      <option value="worn">Worn</option>
                      <option value="damaged">Damaged</option>
                      <option value="broken">Broken</option>
                      <option value="destroyed">Destroyed</option>
                    </select>
                  </div>

                  <div className="property-item">
                    <label>Rarity</label>
                    <select
                      value={selectedObject.rarity}
                      onChange={(e) => handleUpdateObject(selectedObject.id, { rarity: e.target.value as any })}
                      disabled={isLoading}
                    >
                      <option value="unique">Unique</option>
                      <option value="rare">Rare</option>
                      <option value="uncommon">Uncommon</option>
                      <option value="common">Common</option>
                      <option value="abundant">Abundant</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Capabilities</label>
                <textarea
                  value={selectedObject.capabilities.join('\n')}
                  onChange={(e) => handleUpdateObject(selectedObject.id, {
                    capabilities: e.target.value.split('\n').filter(cap => cap.trim())
                  })}
                  placeholder="Enter each capability on a new line..."
                  rows={3}
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label>Limitations</label>
                <textarea
                  value={selectedObject.limitations.join('\n')}
                  onChange={(e) => handleUpdateObject(selectedObject.id, {
                    limitations: e.target.value.split('\n').filter(lim => lim.trim())
                  })}
                  placeholder="Enter each limitation on a new line..."
                  rows={3}
                  disabled={isLoading}
                />
              </div>

              <div className="form-actions">
                <button
                  className="btn btn--secondary"
                  onClick={() => setSelectedObjectId(null)}
                  disabled={isLoading}
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div className="no-selection">
              <p>Select an object to view and edit its details.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Object Modal/Form */}
      {showAddForm && (
        <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3>Add New Object</h3>
              <button
                className="modal__close"
                onClick={() => setShowAddForm(false)}
              >
                ×
              </button>
            </div>
            <div className="modal__body">
              <p>This will create a new object that you can then edit in detail.</p>
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
                onClick={handleAddObject}
                disabled={isLoading}
              >
                <FaPlus /> Create Object
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
