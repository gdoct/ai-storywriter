import React, { useState } from 'react';
import { AI_STATUS, useAIStatus } from '../../../contexts/AIStatusContext';
import * as llmPromptService from '../../../services/llmPromptService';
import { streamChatCompletionWithStatus } from '../../../services/llmService';
import { getSelectedModel } from '../../../services/modelSelection';
import { Character, Scenario } from '../../../types/ScenarioTypes';
import ActionButton from '../../common/ActionButton';
import Modal from '../../common/Modal';
import './TabStylesRandom.css';
import './TabStylesSpinner.css';
import './ToggleSwitch.css';

interface RandomScenarioModalProps {
  show: boolean;
  onClose: () => void;
  currentScenario: Scenario | null;
  onLoadScenario: (scenario: Scenario, generatedStory?: string | null) => void;
}

// Task tracking for bullet list
interface GenerationTask {
  id: string;
  label: string;
  status: 'pending' | 'generating' | 'completed' | 'error';
  enabled: boolean;
}

// Generation options
interface GenerationOptions {
  generateStyle: boolean;
  generateBackstory: boolean;
  generateCharacters: boolean;
  generateStoryArc: boolean;
}

const RandomScenarioModal: React.FC<RandomScenarioModalProps> = ({
  show,
  onClose,
  currentScenario,
  onLoadScenario
}) => {
  // State for generation options
  const [options, setOptions] = useState<GenerationOptions>({
    generateStyle: true,
    generateBackstory: true,
    generateCharacters: true,
    generateStoryArc: true
  });

  // State for extra instructions
  const [extraInstructions, setExtraInstructions] = useState('');

  // State for generation process
  const [isGenerating, setIsGenerating] = useState(false);
  const [tasks, setTasks] = useState<GenerationTask[]>([]);
  const [cancelGeneration, setCancelGeneration] = useState<(() => void) | null>(null);
  const [currentTask, setCurrentTask] = useState<string>('');

  const { aiStatus, setAiStatus, setShowAIBusyModal } = useAIStatus();
  const isAIUnavailable = [AI_STATUS.BUSY, AI_STATUS.UNAVAILABLE, AI_STATUS.ERROR, AI_STATUS.LOADING].includes(aiStatus);

  // Helper to generate unique character ID
  const generateUniqueId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

  // Helper to parse JSON safely
  const parseJSON = (text: string): any => {
    try {
      // Clean up common JSON formatting issues
      let cleaned = text.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json\s*/, '');
      }
      if (cleaned.endsWith('```')) {
        cleaned = cleaned.replace(/\s*```$/, '');
      }
      return JSON.parse(cleaned);
    } catch (e) {
      console.warn('Failed to parse JSON:', text);
      return null;
    }
  };

  // Helper to update task status
  const updateTaskStatus = (taskId: string, status: GenerationTask['status']) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, status } : task
    ));
  };

  // Helper to create updated scenario
  const createUpdatedScenario = (): Scenario => {
    if (!currentScenario) {
      return {
        id: generateUniqueId(),
        userId: 'user',
        title: 'New Random Scenario',
        createdAt: new Date(),
        writingStyle: { genre: 'General Fiction' },
        characters: [],
        backstory: '',
        storyarc: '',
        notes: extraInstructions ? `Generated with instructions: ${extraInstructions}` : ''
      };
    }
    
    return {
      ...currentScenario,
      notes: extraInstructions ? 
        (currentScenario.notes ? `${currentScenario.notes}\n\nGenerated with instructions: ${extraInstructions}` : `Generated with instructions: ${extraInstructions}`) :
        currentScenario.notes || ''
    };
  };

  // Generate writing style
  const generateWritingStyle = async (scenario: Scenario): Promise<any> => {
    const promptObj = llmPromptService.createWritingStylePrompt();
    let cancelled = false;
    setCancelGeneration(() => () => { cancelled = true; });

    let fullText = '';
    await streamChatCompletionWithStatus(
      promptObj,
      (text) => {
        if (!cancelled) {
          fullText = text;
        }
      },
      { 
        model: getSelectedModel() || undefined,
        temperature: 0.8,
        max_tokens: 1000 
      },
      setAiStatus,
      setShowAIBusyModal
    );

    if (cancelled) throw new Error('Generation cancelled');
    return parseJSON(fullText);
  };

  // Generate backstory
  const generateBackstory = async (scenario: Scenario): Promise<string> => {
    const promptObj = llmPromptService.createBackstoryPrompt(scenario);
    let cancelled = false;
    setCancelGeneration(() => () => { cancelled = true; });

    let fullText = '';
    await streamChatCompletionWithStatus(
      promptObj,
      (text) => {
        if (!cancelled) {
          fullText = text;
        }
      },
      { 
        model: getSelectedModel() || undefined,
        temperature: 0.8,
        max_tokens: 1000 
      },
      setAiStatus,
      setShowAIBusyModal
    );

    if (cancelled) throw new Error('Generation cancelled');
    return fullText.trim();
  };

  // Generate story arc
  const generateStoryArc = async (scenario: Scenario): Promise<string> => {
    const promptObj = llmPromptService.createStoryArcPrompt(scenario);
    let cancelled = false;
    setCancelGeneration(() => () => { cancelled = true; });

    let fullText = '';
    await streamChatCompletionWithStatus(
      promptObj,
      (text) => {
        if (!cancelled) {
          fullText = text;
        }
      },
      { 
        model: getSelectedModel() || undefined,
        temperature: 0.8,
        max_tokens: 1000 
      },
      setAiStatus,
      setShowAIBusyModal
    );

    if (cancelled) throw new Error('Generation cancelled');
    return fullText.trim();
  };

  // Generate characters
  const generateCharacters = async (scenario: Scenario): Promise<Character[]> => {
    const characters: Character[] = [];
    
    // Generate protagonist
    const protagonistPrompt = llmPromptService.createCharacterPrompt(scenario, 'protagonist');
    let cancelled = false;
    setCancelGeneration(() => () => { cancelled = true; });

    let fullText = '';
    await streamChatCompletionWithStatus(
      protagonistPrompt,
      (text) => {
        if (!cancelled) {
          fullText = text;
        }
      },
      { 
        model: getSelectedModel() || undefined,
        temperature: 0.8,
        max_tokens: 1000 
      },
      setAiStatus,
      setShowAIBusyModal
    );

    if (cancelled) throw new Error('Generation cancelled');
    
    const protagonistData = parseJSON(fullText);
    if (protagonistData) {
      characters.push({
        ...protagonistData,
        id: generateUniqueId(),
        role: 'Protagonist'
      });
    }

    // Generate antagonist with updated scenario
    const updatedScenario = { ...scenario, characters };
    const antagonistPrompt = llmPromptService.createCharacterPrompt(updatedScenario, 'antagonist');
    
    fullText = '';
    await streamChatCompletionWithStatus(
      antagonistPrompt,
      (text) => {
        if (!cancelled) {
          fullText = text;
        }
      },
      { 
        model: getSelectedModel() || undefined,
        temperature: 0.8,
        max_tokens: 1000 
      },
      setAiStatus,
      setShowAIBusyModal
    );

    if (cancelled) throw new Error('Generation cancelled');
    
    const antagonistData = parseJSON(fullText);
    if (antagonistData) {
      characters.push({
        ...antagonistData,
        id: generateUniqueId(),
        role: 'Antagonist'
      });
    }

    return characters;
  };

  // Main generation function
  const handleGenerate = async () => {
    if (!currentScenario) {
      alert('No active scenario to randomize.');
      return;
    }

    setIsGenerating(true);
    setCancelGeneration(null);
    setCurrentTask('');

    // Initialize task list
    const taskList: GenerationTask[] = [
      { id: 'style', label: 'Writing Style', status: 'pending', enabled: options.generateStyle },
      { id: 'backstory', label: 'Backstory', status: 'pending', enabled: options.generateBackstory },
      { id: 'characters', label: 'Characters', status: 'pending', enabled: options.generateCharacters },
      { id: 'storyarc', label: 'Story Arc', status: 'pending', enabled: options.generateStoryArc }
    ];
    setTasks(taskList);

    let updatedScenario = createUpdatedScenario();

    try {
      // Generate writing style
      if (options.generateStyle) {
        setCurrentTask('Generating writing style...');
        updateTaskStatus('style', 'generating');
        try {
          const style = await generateWritingStyle(updatedScenario);
          if (style) {
            updatedScenario.writingStyle = style;
          }
          updateTaskStatus('style', 'completed');
        } catch (error) {
          console.error('Error generating style:', error);
          updateTaskStatus('style', 'error');
          if (error instanceof Error && error.message === 'Generation cancelled') {
            return;
          }
        }
      }

      // Generate backstory
      if (options.generateBackstory) {
        setCurrentTask('Generating backstory...');
        updateTaskStatus('backstory', 'generating');
        try {
          const backstory = await generateBackstory(updatedScenario);
          updatedScenario.backstory = backstory;
          updateTaskStatus('backstory', 'completed');
        } catch (error) {
          console.error('Error generating backstory:', error);
          updateTaskStatus('backstory', 'error');
          if (error instanceof Error && error.message === 'Generation cancelled') {
            return;
          }
        }
      }

      // Generate characters
      if (options.generateCharacters) {
        setCurrentTask('Generating characters...');
        updateTaskStatus('characters', 'generating');
        try {
          const characters = await generateCharacters(updatedScenario);
          updatedScenario.characters = characters;
          updateTaskStatus('characters', 'completed');
        } catch (error) {
          console.error('Error generating characters:', error);
          updateTaskStatus('characters', 'error');
          if (error instanceof Error && error.message === 'Generation cancelled') {
            return;
          }
        }
      }

      // Generate story arc
      if (options.generateStoryArc) {
        setCurrentTask('Generating story arc...');
        updateTaskStatus('storyarc', 'generating');
        try {
          const storyArc = await generateStoryArc(updatedScenario);
          updatedScenario.storyarc = storyArc;
          updateTaskStatus('storyarc', 'completed');
        } catch (error) {
          console.error('Error generating story arc:', error);
          updateTaskStatus('storyarc', 'error');
          if (error instanceof Error && error.message === 'Generation cancelled') {
            return;
          }
        }
      }

      // Apply the generated scenario
      setCurrentTask('Applying changes...');
      onLoadScenario(updatedScenario);
      setCurrentTask('Generation complete!');
      
      // Auto-close after a brief delay
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (error) {
      console.error('Generation error:', error);
      setCurrentTask('Generation failed');
    } finally {
      setIsGenerating(false);
      setCancelGeneration(null);
    }
  };

  // Handle cancellation
  const handleCancel = () => {
    if (cancelGeneration) {
      cancelGeneration();
    }
    setIsGenerating(false);
    setCancelGeneration(null);
    setCurrentTask('Generation cancelled');
  };

  // Handle close
  const handleClose = () => {
    if (isGenerating) {
      handleCancel();
    }
    onClose();
  };

  // Render task status icon
  const renderTaskIcon = (status: GenerationTask['status']) => {
    switch (status) {
      case 'pending':
        return <span style={{ color: '#666' }}>○</span>;
      case 'generating':
        return <span style={{ color: '#007acc' }}>●</span>;
      case 'completed':
        return <span style={{ color: '#28a745' }}>✓</span>;
      case 'error':
        return <span style={{ color: '#dc3545' }}>✗</span>;
      default:
        return <span style={{ color: '#666' }}>○</span>;
    }
  };

  // Get enabled tasks count
  const enabledTasks = tasks.filter(task => task.enabled);
  const completedTasks = enabledTasks.filter(task => task.status === 'completed');
  const progressPercent = enabledTasks.length > 0 ? (completedTasks.length / enabledTasks.length) * 100 : 0;

  return (
    <Modal
      show={show}
      onClose={handleClose}
      title="✨ Generate Random Scenario"
      footer={
        <div className="modal-footer-buttons">
          {!isGenerating ? (
            <>
              <ActionButton 
                onClick={handleGenerate}
                label="Generate" 
                variant="primary" 
                className="random-scenario-button"
                disabled={!currentScenario || !enabledTasks.length || isAIUnavailable}
              />
              <ActionButton 
                onClick={handleClose} 
                label="Cancel" 
                variant="default" 
              />
            </>
          ) : (
            <ActionButton 
              onClick={handleCancel} 
              label="Cancel Generation" 
              variant="danger" 
              className="cancel-generation-button"
            />
          )}
        </div>
      }
    >
      {!isGenerating ? (
        <div className="random-scenario-options">
          <h4>Select elements to generate:</h4>
          
          <div className="toggle-container">
            <div className="toggle-option">
              <span className="option-label">Writing Style</span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={options.generateStyle}
                  onChange={(e) => setOptions(prev => ({ ...prev, generateStyle: e.target.checked }))}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            
            <div className="toggle-option">
              <span className="option-label">Backstory</span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={options.generateBackstory}
                  onChange={(e) => setOptions(prev => ({ ...prev, generateBackstory: e.target.checked }))}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            
            <div className="toggle-option">
              <span className="option-label">Characters</span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={options.generateCharacters}
                  onChange={(e) => setOptions(prev => ({ ...prev, generateCharacters: e.target.checked }))}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            
            <div className="toggle-option">
              <span className="option-label">Story Arc</span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={options.generateStoryArc}
                  onChange={(e) => setOptions(prev => ({ ...prev, generateStoryArc: e.target.checked }))}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
          
          <div className="extra-instructions-wrapper">
            <label htmlFor="extra-instructions" className="extra-instructions-label">
              Extra instructions (optional):
            </label>
            <textarea
              id="extra-instructions"
              value={extraInstructions}
              onChange={(e) => setExtraInstructions(e.target.value)}
              className="form-textarea"
              placeholder="Add any specific themes, settings, or elements you'd like to include..."
              rows={3}
            />
            <p className="instruction-text">
              Example: "Set in a cyberpunk future", "Include magical elements", "Focus on themes of redemption"
            </p>
          </div>
        </div>
      ) : (
        <div className="generation-progress">
          <div className="generation-header">
            <div className="spinner"></div>
            <h4>Generating Random Scenario</h4>
          </div>
          
          <div className="generation-status">
            <p className="current-task">{currentTask}</p>
            
            <div className="task-list">
              {tasks.filter(task => task.enabled).map(task => (
                <div key={task.id} className="task-item">
                  <span className="task-icon">{renderTaskIcon(task.status)}</span>
                  <span className="task-label">{task.label}</span>
                </div>
              ))}
            </div>
            
            <div className="progress-container">
              <div 
                className="progress-bar" 
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            
            <p className="progress-text">
              {completedTasks.length} of {enabledTasks.length} tasks completed
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default RandomScenarioModal;
