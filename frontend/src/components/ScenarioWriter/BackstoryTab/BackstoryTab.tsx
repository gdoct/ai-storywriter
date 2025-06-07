import React, { useState } from 'react';
import { generateBackstory, rewriteBackstory } from '../../../services/storyGenerator';
import { Character, Scenario } from '../../../types/ScenarioTypes';
import ActionButton from '../../common/ActionButton';
import ImportButton from '../../common/ImportButton';
import ImportModal from '../../common/ImportModal';
import TabContentArea, { TabProps } from '../common/TabInterface';
import '../common/TabStylesNew.css';

const BackstoryTab: React.FC<TabProps> = ({ content, updateContent, currentScenario }) => {
  const [showImportModal, setShowImportModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [cancelGeneration, setCancelGeneration] = useState<(() => void) | null>(null);
  
  // Helper to create a temporary scenario object
  const createTemporaryScenario = (): Scenario => {
    // Use characters and notes from the current scenario if available
    let characters: Character[] = [];
    let notes = '';
    let writingStyle = { genre: "General Fiction" };
    let title = 'Temporary Scenario';
    
    if (currentScenario) {
      // Use actual characters from current scenario
      characters = currentScenario.characters || [];
      // Use actual notes from current scenario
      notes = currentScenario.notes || '';
      // Use actual writing style from current scenario
      writingStyle = currentScenario.writingStyle || { genre: "General Fiction" };
      // Use actual title from current scenario
      title = currentScenario.title || 'Temporary Scenario';
    }
    
    // Create a complete scenario with existing content and values from current scenario
    return {
      id: 'temp-id',
      userId: 'user',
      createdAt: new Date(),
      backstory: content || '',
      writingStyle: writingStyle,
      characters: characters,
      notes: notes,
      title: title
    };
  };
  
  const handleGenerateRandomBackstory = async () => {
    console.log('Generate random backstory button clicked');
    const temporaryScenario = createTemporaryScenario();

    try {
      setIsGenerating(true);
      
      // Debug: Log the scenario to verify it has all required fields
      console.log('Generating backstory with scenario:', temporaryScenario);
      
      const generationResult = await generateBackstory(temporaryScenario, {
        onProgress: (generatedText) => {
          // Update the backstory text while it's being generated
          updateContent(generatedText);
        }
      });

      // Store the cancel function to enable cancellation
      setCancelGeneration(() => generationResult.cancelGeneration);
      
      try {
        // Wait for the generation to complete
        const generatedBackstory = await generationResult.result;
        
        // Update the content with the generated backstory
        updateContent(generatedBackstory);
      } catch (error) {
        // If we get an error, it might be due to cancellation
        // In that case, we keep the partially generated text that was 
        // already updated through onProgress
        console.log('Backstory generation was interrupted:', error);
      }
    } catch (error) {
      console.error('Error generating backstory:', error);
    } finally {
      setIsGenerating(false);
      setCancelGeneration(null);
    }
  };

  const handleRewriteBackstory = async () => {
    console.log('Rewrite backstory button clicked');
    
    // Only proceed if there's actual content to rewrite
    if (!content || content.trim() === '') {
      console.log('No backstory to rewrite');
      return;
    }
    
    const temporaryScenario = createTemporaryScenario();

    try {
      setIsGenerating(true);
      
      // Debug: Log the scenario to verify it has all required fields
      console.log('Rewriting backstory with scenario:', temporaryScenario);
      
      const generationResult = await rewriteBackstory(temporaryScenario, {
        onProgress: (generatedText) => {
          // Update the backstory text while it's being rewritten
          updateContent(generatedText);
        }
      });

      // Store the cancel function to enable cancellation
      setCancelGeneration(() => generationResult.cancelGeneration);
      
      try {
        // Wait for the generation to complete
        const rewrittenBackstory = await generationResult.result;
        
        // Update the content with the rewritten backstory
        updateContent(rewrittenBackstory);
      } catch (error) {
        // If we get an error, it might be due to cancellation
        // In that case, we keep the partially generated text that was 
        // already updated through onProgress
        console.log('Backstory rewriting was interrupted:', error);
      }
    } catch (error) {
      console.error('Error rewriting backstory:', error);
    } finally {
      setIsGenerating(false);
      setCancelGeneration(null);
    }
  };
  
  const handleCancelGeneration = () => {
    if (cancelGeneration) {
      cancelGeneration();
      // The rest will be handled in the try-catch block of handleGenerateRandomBackstory
    }
  };
  
  const handleImport = (importedContent: string) => {
    updateContent(importedContent);
  };
  
  const cancelIcon = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
  
  return (
    <div className="tab-container scenario-editor-panel">
      <div className="scenario-tab-title">
        Backstory
      </div>
      <div className="tab-actions">
        <div className="tab-actions-primary">
          {!isGenerating ? (
            <>
              <ActionButton 
                onClick={handleGenerateRandomBackstory}
                label="✨ Generate Random Backstory"
                variant="success"
                title="Generate a random backstory using AI"
                disabled={isGenerating}
              />
              <ActionButton 
                onClick={handleRewriteBackstory}
                label="✨ Rewrite Backstory"
                variant="primary"
                title="Rewrite and improve the current backstory"
                disabled={isGenerating || !content || content.trim() === ''}
              />
            </>
          ) : (
            <ActionButton 
              onClick={handleCancelGeneration}
              label="Cancel Generation"
              icon={cancelIcon}
              variant="danger"
              title="Cancel the backstory generation and keep the text generated so far"
            />
          )}
        </div>
        <div className="tab-actions-secondary">
          <ImportButton 
            onClick={() => setShowImportModal(true)} 
            title="Import backstory from another scenario"
            label="Import Backstory"
          />
        </div>
      </div>
      <p className="style-tab-description">Provide context and background information for your story here. When does the story happen? Where does it take place? Is there history to consider?</p>
      <TabContentArea 
        content={content} 
        updateContent={updateContent}
        placeholder="Write your backstory here... (optional)"
      />
      
      <ImportModal
        show={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Import Backstory"
        onImport={handleImport}
        extractContent={(scenario) => scenario.backstory || ''}
      />
    </div>
  );
};

export default BackstoryTab;
