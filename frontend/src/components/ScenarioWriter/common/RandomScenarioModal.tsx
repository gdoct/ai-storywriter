import React, { useEffect, useState } from 'react';
import { Scenario } from '../../../types/ScenarioTypes';
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
  isGeneratingScenario: boolean;
  generationProgress: string;
  randomScenarioName: string;
  onGenerateRandomScenario: (extraInstructions: string) => void;
  onCancelGeneration: () => void;
  randomScenarioOptions: {
    generateStyle: boolean;
    generateBackstory: boolean;
    generateCharacters: boolean;
    generateStoryArc: boolean;
  };
  setRandomScenarioOptions: React.Dispatch<React.SetStateAction<{
    generateStyle: boolean;
    generateBackstory: boolean;
    generateCharacters: boolean;
    generateStoryArc: boolean;
  }>>;
}

// Define generation stages
type GenerationStage = 'waiting' | 'in-progress' | 'completed';

interface GenerationStatus {
  title: GenerationStage;
  style: GenerationStage;
  characters: GenerationStage;
  backstory: GenerationStage;
  storyArc: GenerationStage;
  isComplete: boolean;
}

const RandomScenarioModal: React.FC<RandomScenarioModalProps> = ({
  show,
  onClose,
  isGeneratingScenario,
  generationProgress,
  randomScenarioName,
  onGenerateRandomScenario,
  onCancelGeneration,
  randomScenarioOptions,
  setRandomScenarioOptions
}) => {
  // Define initial generation status
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>({
    title: 'waiting',
    style: 'waiting',
    characters: 'waiting',
    backstory: 'waiting',
    storyArc: 'waiting',
    isComplete: false
  });

  const [styleValue, setStyleValue] = useState<string>('');
  const [charactersValue, setCharactersValue] = useState<string>('');
  const [backstoryValue, setBackstoryValue] = useState<string>('');
  const [storyArcValue, setStoryArcValue] = useState<string>('');
  const [completionPercent, setCompletionPercent] = useState<number>(0);

  // Reset status when not generating
  useEffect(() => {
    if (!isGeneratingScenario) {
      setGenerationStatus({
        title: 'waiting',
        style: 'waiting',
        characters: 'waiting',
        backstory: 'waiting',
        storyArc: 'waiting',
        isComplete: false
      });
      setCompletionPercent(0);
    }
  }, [isGeneratingScenario]);

  // Update generation status based on progress string (only when generating)
  useEffect(() => {
    if (!isGeneratingScenario) return;
    setGenerationStatus(prevStatus => {
      const newStatus = { ...prevStatus };
      let totalSteps = 2; // Title is always generated
      let completedSteps = 0;
      
      // Count how many steps are enabled in total
      if (randomScenarioOptions.generateStyle) totalSteps++;
      if (randomScenarioOptions.generateCharacters) totalSteps++;
      if (randomScenarioOptions.generateBackstory) totalSteps++;
      if (randomScenarioOptions.generateStoryArc) totalSteps++;

      // Title generation
      if (generationProgress.includes('Generating scenario name')) {
        newStatus.title = 'in-progress';
        completedSteps = 0;
      } else if (randomScenarioName) {
        newStatus.title = 'completed';
        completedSteps = 1;
      }

      // Style generation
      if (randomScenarioOptions.generateStyle) {
        if (generationProgress.includes('Generating writing style')) {
          newStatus.style = 'in-progress';
          // Extract style value if available
          const styleMatch = generationProgress.match(/Generating writing style...\n(.*)/);
          if (styleMatch && styleMatch[1]) {
            setStyleValue(styleMatch[1].trim());
          }
        } else if (newStatus.title === 'completed' && !generationProgress.includes('Generating protagonist character') && 
                  !generationProgress.includes('Generating backstory') && 
                  !generationProgress.includes('Generating story arc')) {
          newStatus.style = 'completed';
          completedSteps = 2;
        }
      } else {
        // Skip if not selected
        newStatus.style = 'waiting';
      }

      // Character generation
      if (randomScenarioOptions.generateCharacters) {
        if (generationProgress.includes('Generating protagonist character') || 
            generationProgress.includes('Generating antagonist character')) {
          newStatus.characters = 'in-progress';
          if (newStatus.style === 'completed' || !randomScenarioOptions.generateStyle) {
            completedSteps = 2;
          }
          
          // Extract character information if available
          if (generationProgress.includes('Generating protagonist character...\n')) {
            const parts = generationProgress.split('Generating protagonist character...\n');
            if (parts.length > 1) {
              const preview = parts[1].trim();
              setCharactersValue(preview.length > 50 ? preview.substring(0, 50) + "..." : preview);
            }
          } else if (generationProgress.includes('Generating antagonist character...\n')) {
            const parts = generationProgress.split('Generating antagonist character...\n');
            if (parts.length > 1) {
              const preview = parts[1].trim();
              setCharactersValue(preview.length > 50 ? preview.substring(0, 50) + "..." : preview);
            }
          }
        } else if ((newStatus.style === 'completed' || !randomScenarioOptions.generateStyle) && 
                  !generationProgress.includes('Generating writing style') &&
                  !generationProgress.includes('Generating backstory') && 
                  !generationProgress.includes('Generating story arc')) {
          newStatus.characters = 'completed';
          completedSteps = randomScenarioOptions.generateStyle ? 3 : 2;
        }
      } else {
        // Skip if not selected
        newStatus.characters = 'waiting';
      }

      // Backstory generation
      if (randomScenarioOptions.generateBackstory) {
        if (generationProgress.includes('Generating backstory')) {
          newStatus.backstory = 'in-progress';
          // Calculate completed steps
          if (randomScenarioOptions.generateCharacters && newStatus.characters === 'completed') {
            completedSteps = randomScenarioOptions.generateStyle ? 3 : 2;
          } else if (!randomScenarioOptions.generateCharacters && newStatus.style === 'completed') {
            completedSteps = 2;
          } else if (!randomScenarioOptions.generateCharacters && !randomScenarioOptions.generateStyle) {
            completedSteps = 1;
          }
          
          // Extract backstory preview if available
          if (generationProgress.includes('Generating backstory...\n')) {
            const parts = generationProgress.split('Generating backstory...\n');
            if (parts.length > 1) {
              const preview = parts[1].trim();
              setBackstoryValue(preview.length > 50 ? preview.substring(0, 50) + "..." : preview);
            }
          }
        } else if ((newStatus.characters === 'completed' || !randomScenarioOptions.generateCharacters) && 
                  (newStatus.style === 'completed' || !randomScenarioOptions.generateStyle) &&
                  !generationProgress.includes('Generating writing style') &&
                  !generationProgress.includes('Generating protagonist character') &&
                  !generationProgress.includes('Generating antagonist character') &&
                  !generationProgress.includes('Generating story arc')) {
          newStatus.backstory = 'completed';
          let baseSteps = 1; // Title
          if (randomScenarioOptions.generateStyle) baseSteps++;
          if (randomScenarioOptions.generateCharacters) baseSteps++;
          completedSteps = baseSteps + 1;
        }
      } else {
        // Skip if not selected
        newStatus.backstory = 'waiting';
      }

      // Story Arc generation
      if (randomScenarioOptions.generateStoryArc) {
        if (generationProgress.includes('Generating story arc')) {
          newStatus.storyArc = 'in-progress';
          // Calculate completed steps based on what else is enabled
          let baseSteps = 1; // Title
          if (randomScenarioOptions.generateStyle && newStatus.style === 'completed') baseSteps++;
          if (randomScenarioOptions.generateCharacters && newStatus.characters === 'completed') baseSteps++;
          if (randomScenarioOptions.generateBackstory && newStatus.backstory === 'completed') baseSteps++;
          completedSteps = baseSteps;
          
          // Extract story arc preview if available
          if (generationProgress.includes('Generating story arc...\n')) {
            const parts = generationProgress.split('Generating story arc...\n');
            if (parts.length > 1) {
              const preview = parts[1].trim();
              setStoryArcValue(preview.length > 50 ? preview.substring(0, 50) + "..." : preview);
            }
          }
        } else if ((newStatus.backstory === 'completed' || !randomScenarioOptions.generateBackstory) && 
                  (newStatus.characters === 'completed' || !randomScenarioOptions.generateCharacters) && 
                  (newStatus.style === 'completed' || !randomScenarioOptions.generateStyle) &&
                  !generationProgress.includes('Generating writing style') &&
                  !generationProgress.includes('Generating protagonist character') &&
                  !generationProgress.includes('Generating antagonist character') &&
                  !generationProgress.includes('Generating backstory')) {
          newStatus.storyArc = 'completed';
          completedSteps = totalSteps;
        }
      } else {
        // Skip if not selected
        newStatus.storyArc = 'waiting';
      }

      // Check if generation is complete - if Updating scenario appears or all selected steps are complete
      if (generationProgress.includes('Updating scenario')) {
        newStatus.isComplete = true;
        completedSteps = totalSteps;
      } else {
        // Check if all selected steps are completed
        const allComplete = 
          newStatus.title === 'completed' &&
          (!randomScenarioOptions.generateStyle || newStatus.style === 'completed') &&
          (!randomScenarioOptions.generateCharacters || newStatus.characters === 'completed') &&
          (!randomScenarioOptions.generateBackstory || newStatus.backstory === 'completed') &&
          (!randomScenarioOptions.generateStoryArc || newStatus.storyArc === 'completed');
        
        if (allComplete && !isGeneratingScenario) {
          newStatus.isComplete = true;
          completedSteps = totalSteps;
        }
      }

      // Calculate percentage based on steps
      const percent = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
      setCompletionPercent(percent);
      return newStatus;
    });
  }, [generationProgress, isGeneratingScenario, randomScenarioName, randomScenarioOptions]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
  }, []);

  // Generate SVG icon based on status
  const renderStatusIcon = (status: GenerationStage) => {
    switch (status) {
      case 'completed':
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13.3333 4.66667L6.66667 11.3333L3.33333 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'in-progress':
        return (
          <div className="spinner-small"></div>
        );
      case 'waiting':
      default:
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2"/>
          </svg>
        );
    }
  };

  return (
    <Modal
      show={show}
      onClose={() => {
        // Only allow closing if not generating or generation is complete
        if (!isGeneratingScenario || generationStatus.isComplete) {
          onClose();
        }
      }}
      title="Randomize Current Scenario"
      footer={
        <div className="form-buttons">
          {!isGeneratingScenario ? (
            <>
              <ActionButton 
                onClick={onClose} 
                label="Cancel" 
                variant="default" 
              />
              <ActionButton 
                onClick={() => {
                  // Get the extra instructions from the input field
                  const extraInstructionsInput = document.getElementById('extra-instructions') as HTMLTextAreaElement;
                  const extraInstructions = extraInstructionsInput?.value || '';
                  onGenerateRandomScenario(extraInstructions);
                }} 
                label="Randomize" 
                variant="primary" 
                className="random-scenario-button"
              />
            </>
          ) : generationStatus.isComplete ? (
            <ActionButton 
              onClick={onClose} 
              label="Close" 
              variant="primary" 
              className="close-generation-button"
            />
          ) : (
            <ActionButton 
              onClick={onCancelGeneration} 
              label="Cancel Generation" 
              variant="danger" 
              className="cancel-generation-button"
              title="Stop the scenario generation process"
            />
          )}
        </div>
      }
    >
      {!isGeneratingScenario && !generationStatus.isComplete ? (
        <div className="random-scenario-options">
          <h4>✨ Select elements to include in your random scenario ✨</h4>
          
          <div className="toggle-container">
            <div className="toggle-option">
              <span className="option-label">Writing Style</span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  id="generate-style"
                  checked={randomScenarioOptions.generateStyle}
                  onChange={(e) => setRandomScenarioOptions({
                    ...randomScenarioOptions,
                    generateStyle: e.target.checked
                  })}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            
            <div className="toggle-option">
              <span className="option-label">Characters</span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  id="generate-characters"
                  checked={randomScenarioOptions.generateCharacters}
                  onChange={(e) => setRandomScenarioOptions({
                    ...randomScenarioOptions,
                    generateCharacters: e.target.checked
                  })}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            
            <div className="toggle-option">
              <span className="option-label">Backstory</span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  id="generate-backstory"
                  checked={randomScenarioOptions.generateBackstory}
                  onChange={(e) => setRandomScenarioOptions({
                    ...randomScenarioOptions,
                    generateBackstory: e.target.checked
                  })}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            
            <div className="toggle-option">
              <span className="option-label">Story Arc</span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  id="generate-storyarc"
                  checked={randomScenarioOptions.generateStoryArc}
                  onChange={(e) => setRandomScenarioOptions({
                    ...randomScenarioOptions,
                    generateStoryArc: e.target.checked
                  })}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
          
          <div className="extra-instructions-wrapper">
            <label htmlFor="extra-instructions" className="extra-instructions-label">Extra instructions (optional):</label>
            <textarea
              id="extra-instructions"
              className="form-textarea"
              placeholder="Add any specific themes, settings, or elements you'd like to include in the scenario..."
              rows={4}
            />
            <p className="instruction-text">
              Example: "Set in a cyberpunk future", "Include magical elements", "Focus on themes of redemption"
            </p>
          </div>
          
          <div className="extra-instructions-wrapper">
            <p className="instruction-text">
              Note: Generation may take some time. The UI will be blocked during generation.
            </p>
          </div>
        </div>
      ) : (
        <div className="generation-progress">
          <div className="generation-header">
            {!generationStatus.isComplete ? (
              <>
                <div className="spinner"></div>
                <h4>Generating Random Scenario</h4>
              </>
            ) : (
              <>
                <div className="completed-icon">
                  <svg width="24" height="24" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13.3333 4.66667L6.66667 11.3333L3.33333 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h4>Random Scenario Generation Complete!</h4>
              </>
            )}
          </div>
          
          {/* Title item */}
          <div className="generation-item">
            <div className={`item-icon ${generationStatus.title}`}>
              {renderStatusIcon(generationStatus.title)}
            </div>
            <div className="item-content">
              <div className="item-title">Title:</div>
              <div className="item-value">{randomScenarioName || ""}</div>
            </div>
          </div>
          
          {/* Style item */}
          <div className="generation-item">
            <div className={`item-icon ${generationStatus.style}`}>
              {renderStatusIcon(generationStatus.style)}
            </div>
            <div className="item-content">
              <div className="item-title">Style:</div>
              {styleValue && <div className="item-value">{styleValue}</div>}
            </div>
          </div>
          
          {/* Characters item */}
          <div className="generation-item">
            <div className={`item-icon ${generationStatus.characters}`}>
              {renderStatusIcon(generationStatus.characters)}
            </div>
            <div className="item-content">
              <div className="item-title">Characters:</div>
              {charactersValue && <div className="item-value">{charactersValue}</div>}
            </div>
          </div>
          
          {/* Backstory item */}
          <div className="generation-item">
            <div className={`item-icon ${generationStatus.backstory}`}>
              {renderStatusIcon(generationStatus.backstory)}
            </div>
            <div className="item-content">
              <div className="item-title">Backstory:</div>
              {backstoryValue && <div className="item-value">{backstoryValue}</div>}
            </div>
          </div>
          
          {/* Story Arc item */}
          <div className="generation-item">
            <div className={`item-icon ${generationStatus.storyArc}`}>
              {renderStatusIcon(generationStatus.storyArc)}
            </div>
            <div className="item-content">
              <div className="item-title">Story Arc</div>
              {storyArcValue && <div className="item-value">{storyArcValue}</div>}
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="progress-container">
            <div className="progress-bar" style={{ width: `${completionPercent}%` }}></div>
          </div>
          
          {!generationStatus.isComplete ? (
            <p className="please-wait">Please wait... this may take some time. You can cancel the generation at any point.</p>
          ) : (
            <p className="please-wait">Your random scenario has been generated successfully!</p>
          )}
        </div>
      )}
    </Modal>
  );
};

export default RandomScenarioModal;
