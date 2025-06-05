import React, { useState } from 'react';
import { generateStoryArc, rewriteStoryArc } from '../../services/storyGenerator';
import { Character, Scenario } from '../../types/ScenarioTypes';
import ActionButton from '../common/ActionButton';
import ImportButton from '../common/ImportButton';
import ImportModal from '../common/ImportModal';
import TabContentArea, { TabProps } from './TabInterface';
import './TabStylesNew.css';

const StoryArcTab: React.FC<TabProps> = ({ content, updateContent, currentScenario }) => {
  const [showImportModal, setShowImportModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [cancelGeneration, setCancelGeneration] = useState<(() => void) | null>(null);

  // Helper to create a temporary scenario object
  const createTemporaryScenario = (): Scenario => {
    // Use characters and notes from the current scenario if available
    let characters: Character[] = [];
    let notes = '';
    let backstory = '';
    let writingStyle = { genre: "General Fiction" };
    let title = 'Temporary Scenario';
    
    if (currentScenario) {
      // Use actual characters from current scenario
      characters = currentScenario.characters || [];
      // Use actual notes from current scenario
      notes = currentScenario.notes || '';
      // Use actual backstory from current scenario
      backstory = currentScenario.backstory || '';
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
      storyarc: content || '',
      backstory: backstory,
      writingStyle: writingStyle,
      characters: characters,
      notes: notes,
      title: title
    };
  };

  const handleGenerateRandomStoryArc = async () => {
    console.log('Generate random story arc button clicked');
    
    const temporaryScenario = createTemporaryScenario();

    try {
      setIsGenerating(true);
      
      // Debug: Log the scenario to verify it has all required fields
      console.log('Generating story arc with scenario:', temporaryScenario);
      
      const generationResult = await generateStoryArc(temporaryScenario, {
        onProgress: (generatedText) => {
          // Update the story arc text while it's being generated
          updateContent(generatedText);
        }
      });

      // Store the cancel function to enable cancellation
      setCancelGeneration(() => generationResult.cancelGeneration);
      
      try {
        // Wait for the generation to complete
        const generatedStoryArc = await generationResult.result;
        
        // Update the content with the generated story arc
        updateContent(generatedStoryArc);
      } catch (error) {
        // If we get an error, it might be due to cancellation
        // In that case, we keep the partially generated text that was 
        // already updated through onProgress
        console.log('Story arc generation was interrupted:', error);
      }
    } catch (error) {
      console.error('Error generating story arc:', error);
    } finally {
      setIsGenerating(false);
      setCancelGeneration(null);
    }
  };
  
  const handleRewriteStoryArc = async () => {
    console.log('Rewrite story arc button clicked');
    
    // Only proceed if there's actual content to rewrite
    if (!content || content.trim() === '') {
      console.log('No story arc to rewrite');
      return;
    }
    
    const temporaryScenario = createTemporaryScenario();

    try {
      setIsGenerating(true);
      
      // Debug: Log the scenario to verify it has all required fields
      console.log('Rewriting story arc with scenario:', temporaryScenario);
      
      const generationResult = await rewriteStoryArc(temporaryScenario, {
        onProgress: (generatedText) => {
          // Update the story arc text while it's being rewritten
          updateContent(generatedText);
        }
      });

      // Store the cancel function to enable cancellation
      setCancelGeneration(() => generationResult.cancelGeneration);
      
      try {
        // Wait for the generation to complete
        const rewrittenStoryArc = await generationResult.result;
        
        // Update the content with the rewritten story arc
        updateContent(rewrittenStoryArc);
      } catch (error) {
        // If we get an error, it might be due to cancellation
        // In that case, we keep the partially generated text that was 
        // already updated through onProgress
        console.log('Story arc rewriting was interrupted:', error);
      }
    } catch (error) {
      console.error('Error rewriting story arc:', error);
    } finally {
      setIsGenerating(false);
      setCancelGeneration(null);
    }
  };
  
  const handleCancelGeneration = () => {
    if (cancelGeneration) {
      cancelGeneration();
      // The rest will be handled in the try-catch block of handleGenerateRandomStoryArc
    }
  };
  
  const handleImport = (importedContent: string) => {
    updateContent(importedContent);
  };

  const generateIcon = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 1V15M1 8H15M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );

  const rewriteIcon = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 4H14M2 8H14M2 12H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  const cancelIcon = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );

  return (
    <div className="tab-container">
      <div className="tab-actions">
        <div className="tab-actions-primary">
          {!isGenerating ? (
            <>
              <ActionButton 
                onClick={handleGenerateRandomStoryArc}
                label="Generate Random Story Arc"
                icon={generateIcon}
                variant="success"
                title="Generate a random story arc using AI"
                disabled={isGenerating}
              />
              <ActionButton 
                onClick={handleRewriteStoryArc}
                label="Rewrite Story Arc"
                icon={rewriteIcon}
                variant="primary"
                title="Rewrite and improve the current story arc"
                disabled={isGenerating || !content || content.trim() === ''}
              />
            </>
          ) : (
            <ActionButton 
              onClick={handleCancelGeneration}
              label="Cancel Generation"
              icon={cancelIcon}
              variant="danger"
              title="Cancel the story arc generation and keep the text generated so far"
            />
          )}
        </div>
        <div className="tab-actions-secondary">
          <ImportButton 
            onClick={() => setShowImportModal(true)}
            title="Import story arc from another scenario"
            label="Import Story Arc"
          />
        </div>
      </div>
      <h3>Story Arc</h3>
      <p className="style-tab-description">Define the path your story will take. What are the main plot points? How will the narrative develop from beginning to end?</p>
      <TabContentArea 
        content={content} 
        updateContent={updateContent}
        placeholder="Outline your story arc here..."
      />
      
      <ImportModal
        show={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Import Story Arc"
        onImport={handleImport}
        extractContent={(scenario) => scenario.storyarc || ''}
      />
    </div>
  );
};
export default StoryArcTab;
