import React, { useEffect, useState } from 'react';
import { useSceneHover } from '../../../context/SceneHoverContext';
import { generateScenes } from '../../../services/storyGenerator';
import { Scenario } from '../../../types/ScenarioTypes';
import ActionButton from '../../common/ActionButton';
import ImportButton from '../../common/ImportButton';
import ImportModal from '../../common/ImportModal';
import Modal from '../../common/Modal';
import { TabProps } from '../common/TabInterface';
import '../common/TabStylesNew.css'; // For standardized tab styles
import './ScenesTab.css';

interface Scene {
  id: string; // We need this for UI operations, not in the type definition
  title?: string;
  description?: string;
  characters?: string[]; // Array of character names
  location?: string;
  time?: string; // e.g., "Morning", "Evening"
  notes?: string;
  order: number; // To maintain the order of scenes
}

const generateUniqueId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const getDefaultSceneTitle = (index: number): string => {
  return `Scene ${index + 1}`;
};


const ScenesTab: React.FC<TabProps> = ({ content, updateContent, currentScenario }) => {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [sceneToDelete, setSceneToDelete] = useState<string | null>(null);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [showGenerateConfirm, setShowGenerateConfirm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newScene, setNewScene] = useState<Scene>({
    id: '',
    title: '', // Initialize with empty string even though it's optional
    order: 0
  });

  // Parse stored scenes JSON when component mounts or when content changes
  const firstLoadRef = React.useRef(true);
  const prevContentRef = React.useRef(content);
  const initialProcessingComplete = React.useRef(false);

  useEffect(() => {
    // Always process content on first mount
    if (!initialProcessingComplete.current) {
      initialProcessingComplete.current = true;

      // Important: After initial processing, we're no longer on first load
      firstLoadRef.current = false;

      // If we have content, parse it
      if (content) {
        try {
          const parsedScenes = JSON.parse(content);
          if (Array.isArray(parsedScenes)) {
            // Sort scenes by order if available
            const sortedScenes = [...parsedScenes].sort((a, b) =>
              (a.order !== undefined && b.order !== undefined) ? a.order - b.order : 0
            );
            setScenes(sortedScenes);
          }
        } catch (error) {
          console.error('Failed to parse scenes content on initial load:', error);
        }
      }
      return;
    }

    // After initial processing, only update if content changes
    if (content !== prevContentRef.current) {
      prevContentRef.current = content;

      try {
        const parsedScenes = JSON.parse(content);
        if (Array.isArray(parsedScenes)) {
          // Sort scenes by order if available
          const sortedScenes = [...parsedScenes].sort((a, b) =>
            (a.order !== undefined && b.order !== undefined) ? a.order - b.order : 0
          );
          setScenes(sortedScenes);
        }
      } catch (error) {
        console.error('Failed to parse scenes content:', error);
      }
    }
  }, [content]);

  // Handle updating the parent component whenever scenes change
  // This is crucial to ensure scenes persist across tab switches
  const scenesUpdatedByUserRef = React.useRef(false);
  const prevScenesRef = React.useRef<Scene[]>([]);

  useEffect(() => {
    // Only process after we've handled the initial loading
    if (initialProcessingComplete.current) {
      // Either this is a user action, or we need to check if scenes actually changed
      if (scenesUpdatedByUserRef.current ||
        JSON.stringify(scenes) !== JSON.stringify(prevScenesRef.current)) {

        console.log('Updating parent with scenes:', scenes); // Debug logging

        // Update our reference to the current scenes
        prevScenesRef.current = [...scenes];

        // Send the updated JSON to the parent component - CRITICAL for persistence
        const updatedScenesJSON = JSON.stringify(scenes);
        updateContent(updatedScenesJSON);

        // Reset the user action flag
        scenesUpdatedByUserRef.current = false;
      }
    }
  }, [scenes, updateContent]);

  const handleAddScene = () => {
    // Create new scene at the end of the list
    const nextOrder = scenes.length > 0
      ? Math.max(...scenes.map(scene => scene.order)) + 1
      : 0;

    setNewScene({
      id: generateUniqueId(),
      title: getDefaultSceneTitle(nextOrder),
      order: nextOrder
    });
    setShowForm(true);
    setIsEditing(false);
  };

  const handleEditScene = React.useCallback((scene: Scene) => {
    setNewScene({ ...scene });
    setShowForm(true);
    setIsEditing(true);
  }, []);

  const handleDeleteRequest = React.useCallback((sceneId: string) => {
    setSceneToDelete(sceneId);
    setShowDeleteConfirm(true);
  }, []);

  const handleDeleteConfirm = () => {
    if (sceneToDelete) {
      // Mark as user-initiated update
      scenesUpdatedByUserRef.current = true;
      setScenes(prev => prev.filter(scene => scene.id !== sceneToDelete));
      setSceneToDelete(null);
      setShowDeleteConfirm(false);
    }
  };

  const handleDeleteCancel = () => {
    setSceneToDelete(null);
    setShowDeleteConfirm(false);
  };

  const handleDeleteAllRequest = () => {
    setShowDeleteAllConfirm(true);
  };

  const handleDeleteAllConfirm = () => {
    // Mark as user-initiated update
    scenesUpdatedByUserRef.current = true;
    setScenes([]);
    setShowDeleteAllConfirm(false);
  };

  const handleDeleteAllCancel = () => {
    setShowDeleteAllConfirm(false);
  };

  const handleGenerateRequest = () => {
    setShowGenerateConfirm(true);
  };

  const [generatingStatus, setGeneratingStatus] = useState<string>('');

  const handleGenerateConfirm = async () => {
    setShowGenerateConfirm(false);

    if (!currentScenario) {
      alert('Please save your scenario first to generate scenes');
      return;
    }

    // Check if there's a story arc to work with
    if (!currentScenario.storyarc || currentScenario.storyarc.trim() === '') {
      alert('Please add a story arc first to generate meaningful scenes');
      return;
    }

    try {
      setIsGenerating(true);
      setGeneratingStatus('Preparing scenario data...');

      // Create a temporary scenario object with all the necessary information
      const tempScenario: Scenario = {
        ...currentScenario,
        // Make sure we have the latest story arc
        storyarc: currentScenario.storyarc
      };

      console.log('Generating scenes with scenario:', tempScenario);

      setGeneratingStatus('Generating scenes...');
      const generationResult = await generateScenes(tempScenario, {
        onProgress: (text) => {
          // Update user about progress
          if (text.length < 100) {
            setGeneratingStatus(`Generating scenes (${text.length} chars)...`);
          } else {
            setGeneratingStatus(`Generating scenes (${Math.floor(text.length / 100) / 10}K chars)...`);
          }
        }
      });

      // Wait for the generation to complete
      setGeneratingStatus('Finalizing scene generation...');
      const generatedScenesText = await generationResult.result;
      console.log('Received generated scenes text:', generatedScenesText);

      // Parse the JSON response
      try {
        setGeneratingStatus('Processing generated scenes...');

        // First, try to find JSON in the response
        const jsonStart = generatedScenesText.indexOf('{');
        const jsonEnd = generatedScenesText.lastIndexOf('}') + 1;

        if (jsonStart === -1 || jsonEnd === 0) {
          throw new Error('Could not find valid JSON in the response');
        }

        const jsonText = generatedScenesText.substring(jsonStart, jsonEnd);
        let generatedData;

        try {
          generatedData = JSON.parse(jsonText);
        } catch (jsonError) {
          console.error('JSON parsing error:', jsonError);
          console.log('Attempting to fix malformed JSON...');

          // Try to fix common JSON issues
          let fixedJson = jsonText
            .replace(/,\s*}/g, '}')  // Remove trailing commas
            .replace(/,\s*]/g, ']')  // Remove trailing commas in arrays
            .replace(/'/g, '"')      // Replace single quotes with double quotes
            .replace(/\n/g, ' ');    // Remove newlines

          generatedData = JSON.parse(fixedJson);
        }

        if (!generatedData.scenes || !Array.isArray(generatedData.scenes)) {
          throw new Error('Invalid scene data format - missing scenes array');
        }

        // Process the generated scenes
        const maxOrder = scenes.length > 0 ? Math.max(...scenes.map(s => s.order)) : -1;

        if (generatedData.scenes.length === 0) {
          throw new Error('No scenes were generated');
        }

        setGeneratingStatus(`Processing ${generatedData.scenes.length} scenes...`);

        const newScenes = generatedData.scenes.map((sceneData: any, index: number) => {
          // For each scene, extract data with fallbacks
          return {
            id: generateUniqueId(),
            title: sceneData.title || `Scene ${maxOrder + index + 2}`,
            description: sceneData.description || '',
            location: sceneData.location || '',
            time: sceneData.time || '',
            characters: Array.isArray(sceneData.characters)
              ? sceneData.characters
                .filter((char: any) => typeof char === 'string' && char.trim() !== '')
                .map((char: string) => char.trim())
              : [],
            notes: sceneData.notes || '',
            order: maxOrder + index + 1
          };
        });

        // Log what we're about to add
        console.log(`Adding ${newScenes.length} new scenes:`, newScenes);

        // Mark as user-initiated update
        scenesUpdatedByUserRef.current = true;

        // Append the new scenes to the existing scenes
        setScenes(prevScenes => [...prevScenes, ...newScenes]);
        setGeneratingStatus('');
      } catch (parseError: any) {
        console.error('Failed to parse generated scenes:', parseError);
        console.error('Generated text was:', generatedScenesText);
        alert(`Failed to parse the generated scenes: ${parseError.message || 'Unknown error'}. Please try again.`);
        setGeneratingStatus('');
      }
    } catch (error: any) {
      console.error('Error generating scenes:', error);
      alert(`An error occurred while generating scenes: ${error.message || 'Unknown error'}. Please try again.`);
      setGeneratingStatus('');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateCancel = () => {
    setShowGenerateConfirm(false);
  };

  const handleImportScenes = (importedScenes: Scene[]) => {
    // Generate new IDs and adjust order for imported scenes
    const maxOrder = scenes.length > 0 ? Math.max(...scenes.map(s => s.order)) : -1;

    const scenesWithNewIds = importedScenes.map((scene, index) => ({
      ...scene,
      id: generateUniqueId(),
      order: maxOrder + index + 1
    }));

    // Mark as user-initiated update
    scenesUpdatedByUserRef.current = true;

    // Merge with existing scenes and sort by order
    const updatedScenes = [...scenes, ...scenesWithNewIds].sort((a, b) => a.order - b.order);
    setScenes(updatedScenes);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewScene(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveScene = () => {
    const sceneToSave = {
      ...newScene,
      title: (newScene.title?.trim() || getDefaultSceneTitle(newScene.order))
    };

    // Mark that this is a user-initiated update
    scenesUpdatedByUserRef.current = true;

    if (isEditing) {
      // Update existing scene
      setScenes(prev =>
        prev.map(scene => scene.id === sceneToSave.id ? sceneToSave : scene)
      );
    } else {
      // Add new scene
      setScenes(prev => [...prev, sceneToSave]);
    }

    setShowForm(false);
    setNewScene({ id: '', title: '', order: 0 });
    setIsEditing(false);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setNewScene({ id: '', title: '', order: 0 });
    setIsEditing(false);
  };

  const moveSceneUp = React.useCallback((id: string) => {
    // Mark as user-initiated update
    scenesUpdatedByUserRef.current = true;

    setScenes(prevScenes => {
      const index = prevScenes.findIndex(scene => scene.id === id);
      if (index <= 0) return prevScenes;

      const newScenes = [...prevScenes];
      // Ensure all scenes have an order property (defaulting to their index if undefined)
      const safeScenes = newScenes.map((scene, idx) => ({
        ...scene,
        order: scene.order !== undefined ? scene.order : idx
      }));

      // Swap the order values
      const currentOrder = safeScenes[index].order;
      const prevOrder = safeScenes[index - 1].order;

      safeScenes[index] = { ...safeScenes[index], order: prevOrder };
      safeScenes[index - 1] = { ...safeScenes[index - 1], order: currentOrder };

      return safeScenes.sort((a, b) => a.order - b.order);
    });
  }, []);

  const moveSceneDown = React.useCallback((id: string) => {
    // Mark as user-initiated update
    scenesUpdatedByUserRef.current = true;

    setScenes(prevScenes => {
      const index = prevScenes.findIndex(scene => scene.id === id);
      if (index === -1 || index === prevScenes.length - 1) return prevScenes;

      const newScenes = [...prevScenes];
      // Ensure all scenes have an order property (defaulting to their index if undefined)
      const safeScenes = newScenes.map((scene, idx) => ({
        ...scene,
        order: scene.order !== undefined ? scene.order : idx
      }));

      // Swap the order values
      const currentOrder = safeScenes[index].order;
      const nextOrder = safeScenes[index + 1].order;

      safeScenes[index] = { ...safeScenes[index], order: nextOrder };
      safeScenes[index + 1] = { ...safeScenes[index + 1], order: currentOrder };

      return safeScenes.sort((a, b) => a.order - b.order);
    });
  }, []);

  // Function to render the form footer for the scene modal
  const renderFormFooter = () => (
    <div className="form-buttons">
      <ActionButton
        onClick={handleCancelForm}
        label="Cancel"
        variant="default"
      />
      <ActionButton
        onClick={handleSaveScene}
        label={isEditing ? 'Update Scene' : 'Add Scene'}
        variant="primary"
      />
    </div>
  );

  // Icons for buttons
  const addIcon = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 2V14M2 8H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );

  const deleteIcon = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 4h12M5 4v10h6V4M6 2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  return (
    <div className="tab-container scenario-editor-panel">
      <div className="scenario-tab-title">
        Scenes
      </div>
      <div className="tab-description">
        <h3>Scenes are an experimental feature. Add, edit, and organize scenes to create a compelling narrative.</h3>
        <p>Using scenes in combination with a detailed story arc can cause the context to become too large, leading to incomplete stories.</p>
        <p>For best results, generate scenes from a detailed story arc and character information, and then remove the story arc or summarize it.</p>
        <p>Scenes are not saved automatically. Make sure to save your scenario after making changes.</p>
      </div>
      <div className="tab-actions">
        <div className="tab-actions-primary">
          <ActionButton
            onClick={handleGenerateRequest}
            label={isGenerating ? "✨ Generating..." : "✨ Generate Scenes"}
            variant="success"
            title="Generate scenes based on your story"
            disabled={isGenerating}
          />
          <ActionButton
            onClick={handleAddScene}
            label="Add Scene"
            icon={addIcon}
            variant="primary"
            title="Add a new scene"
          />
          {scenes.length > 0 && (
            <ActionButton
              onClick={handleDeleteAllRequest}
              label="Delete All Scenes"
              icon={deleteIcon}
              variant="danger"
              title="Delete all scenes"
            />
          )}
        </div>
        <div className="tab-actions-secondary">
          <ImportButton
            onClick={() => setShowImportModal(true)}
            title="Import scenes from another scenario"
            label="Import Scenes"
          />
        </div>
      </div>

      {/* Scene editing form in a modal */}
      <Modal
        show={showForm}
        onClose={handleCancelForm}
        title={isEditing ? 'Edit Scene' : 'New Scene'}
        footer={renderFormFooter()}
      >
        <div className="form-container">
          <div className="form-field">
            <label htmlFor="title">Scene Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={newScene.title}
              onChange={handleFormChange}
              placeholder="Scene title"
              className="form-input"
            />
          </div>

          <div className="form-field">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={newScene.description || ''}
              onChange={handleFormChange}
              placeholder="Describe what happens in this scene..."
              rows={4}
              className="form-textarea"
            />
          </div>

          <div className="form-field">
            <label htmlFor="location">Location (optional)</label>
            <input
              type="text"
              id="location"
              name="location"
              value={newScene.location || ''}
              onChange={handleFormChange}
              placeholder="Where does this scene take place?"
              className="form-input"
            />
          </div>

          <div className="form-field">
            <label htmlFor="time">Time (optional)</label>
            <input
              type="text"
              id="time"
              name="time"
              value={newScene.time || ''}
              onChange={handleFormChange}
              placeholder="When does this scene occur? (e.g., Morning, Night)"
              className="form-input"
            />
          </div>

          <div className="form-field">
            <label htmlFor="notes">Notes (optional)</label>
            <textarea
              id="notes"
              name="notes"
              value={newScene.notes || ''}
              onChange={handleFormChange}
              placeholder="Additional notes about this scene..."
              rows={3}
              className="form-textarea"
            />
          </div>
        </div>
      </Modal>

      {/* Scene deletion confirmation modal */}
      <Modal
        show={showDeleteConfirm}
        onClose={handleDeleteCancel}
        title="Delete Scene"
      >
        <p>Are you sure you want to delete this scene? This action cannot be undone.</p>
        <div className="form-buttons">
          <ActionButton onClick={handleDeleteCancel} label="Cancel" variant="default" />
          <ActionButton onClick={handleDeleteConfirm} label="Delete" variant="danger" />
        </div>
      </Modal>

      {/* Delete all scenes confirmation modal */}
      <Modal
        show={showDeleteAllConfirm}
        onClose={handleDeleteAllCancel}
        title="Delete All Scenes"
      >
        <p>Are you sure you want to delete all scenes? This action cannot be undone.</p>
        <div className="form-buttons">
          <ActionButton onClick={handleDeleteAllCancel} label="Cancel" variant="default" />
          <ActionButton onClick={handleDeleteAllConfirm} label="Delete All" variant="danger" />
        </div>
      </Modal>

      {/* Generate scenes confirmation modal */}
      <Modal
        show={showGenerateConfirm}
        onClose={handleGenerateCancel}
        title="Generate Scenes"
      >
        <p>This will generate scenes based on your story arc and character information. The AI will create a structured sequence of scenes that follow your story arc.</p>
        <p>For best results, make sure you have added a detailed story arc first.</p>
        <p>Do you want to continue?</p>
        <div className="form-buttons">
          <ActionButton onClick={handleGenerateCancel} label="Cancel" variant="default" />
          <ActionButton onClick={handleGenerateConfirm} label="Generate" variant="success" />
        </div>
      </Modal>

      {/* Import scenes modal */}
      <ImportModal
        show={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Import Scenes"
        onImport={handleImportScenes}
        renderCheckboxes={true}
        getCheckboxItems={(scenario) => scenario.scenes || []}
        extractContent={() => []}
        itemType="scenes"
        renderItemLabel={(scene) => (
          <div className="scene-item-label">
            <span className="scene-item-title">
              {scene.title || `Scene ${scene.order || ''}`}
            </span>
            <span className="scene-item-id">
              ID: {scene.id.substring(0, 8)}...
            </span>
          </div>
        )}
      />

      {isGenerating && (
        <div className="loading-indicator">
          <div className="loading-spinner"></div>
          <p>{generatingStatus || 'Generating scenes...'}</p>
        </div>
      )}

      <div className="content-cards-container">
        {scenes.length === 0 ? (
          <div className="empty-state-message">
            <p>No scenes added yet. Click "Add Scene" to create one.</p>
          </div>
        ) : (
          scenes.map((scene, index) => (
            <SceneCard
              key={scene.id}
              scene={scene}
              index={index}
              isFirst={index === 0}
              isLast={index === scenes.length - 1}
              onEdit={handleEditScene}
              onDelete={handleDeleteRequest}
              onMoveUp={moveSceneUp}
              onMoveDown={moveSceneDown}
            />
          ))
        )}
      </div>
    </div>
  );
};

// Separate SceneCard component to optimize rendering
const SceneCard: React.FC<{
  scene: Scene;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onEdit: (scene: Scene) => void;
  onDelete: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
}> = React.memo(({ scene, index, isFirst, isLast, onEdit, onDelete, onMoveUp, onMoveDown }) => {
  const { setHoveredSceneId } = useSceneHover();
  
  return (
    <div 
      className="content-card"
      onMouseEnter={() => setHoveredSceneId(scene.id)}
      onMouseLeave={() => setHoveredSceneId(null)}
    >
      <div className="scene-header">
        <h3 className="scene-title">{scene.title || `Scene ${index + 1}`}</h3>
        <div className="scene-actions">
          {!isFirst && (
            <button onClick={() => onMoveUp(scene.id)} className="scene-btn move-up-btn">
              <span>↑</span>
            </button>
          )}
          {!isLast && (
            <button onClick={() => onMoveDown(scene.id)} className="scene-btn move-down-btn">
              <span>↓</span>
            </button>
          )}
          <button onClick={() => onEdit(scene)} className="scene-btn edit-btn">
            <span>✏️</span>
          </button>
          <button onClick={() => onDelete(scene.id)} className="scene-btn delete-btn">
            <span>🗑️</span>
          </button>
        </div>
      </div>

      {scene.description && (
        <div className="scene-text scene-description">
          <strong>Description:</strong> {scene.description}
        </div>
      )}

      {scene.location && (
        <div className="scene-text scene-location">
          <strong>Location:</strong> {scene.location}
        </div>
      )}

      {scene.time && (
        <div className="scene-text scene-time">
          <strong>Time:</strong> {scene.time}
        </div>
      )}

      {scene.notes && (
        <div className="scene-text scene-notes">
          <strong>Notes:</strong> {scene.notes}
        </div>
      )}
    </div>
  );
});


export default ScenesTab;
