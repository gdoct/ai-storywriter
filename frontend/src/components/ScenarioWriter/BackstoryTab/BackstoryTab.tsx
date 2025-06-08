import React, { useState } from 'react';
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
  const [draft, setDraft] = useState(content);

  // Keep draft in sync with content when not generating
  React.useEffect(() => {
    if (!isGenerating) setDraft(content);
  }, [content, isGenerating]);
  
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
      setDraft(''); // Clear the draft immediately
      
      // Create a direct function call to the backend that mimics ChatTab's approach
      const prompt = `Generate a backstory for the following scenario, providing all necessary details to understand the characters and plot. Do not include any meta-commentary or formatting.\n\nScenario:\n${JSON.stringify(temporaryScenario, null, 2)}`;
      
      // Prepare payload like in ChatTab
      const payload = {
        model: undefined, // let backend use default
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000
      };
      
      // Direct fetch like in ChatTab
      const response = await fetch('/proxy/llm/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.body) throw new Error('No response body');
      
      // Get a reference to the cancel function
      let isCancelled = false;
      setCancelGeneration(() => () => { isCancelled = true; });
      
      // Read the stream directly like in ChatTab
      const reader = response.body.getReader();
      let generatedText = '';
      let done = false;
      
      while (!done && !isCancelled) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        
        if (value) {
          const chunk = new TextDecoder().decode(value);
          
          // Process in the same way as ChatTab
          chunk.split('\n').forEach(line => {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') return;
              
              try {
                const json = JSON.parse(data);
                const choices = json.choices || [];
                
                for (const choice of choices) {
                  const delta = choice.delta || {};
                  const content = delta.content;
                  
                  if (content) {
                    // Key difference: Update generatedText AND set draft state immediately
                    generatedText += content;
                    setDraft(generatedText);
                  }
                }
              } catch (e) {
                // Not JSON, ignore
              }
            }
          });
        }
      }
      
      if (!isCancelled) {
        // When done and not cancelled, update the content with the final text
        updateContent(generatedText);
      } else {
        // If cancelled, update with what was generated so far
        updateContent(generatedText);
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
    if (!content || content.trim() === '') {
      console.log('No backstory to rewrite');
      return;
    }
    const temporaryScenario = createTemporaryScenario();
    try {
      setIsGenerating(true);
      setDraft('');
      
      // Create a direct function call to the backend that mimics ChatTab's approach
      const prompt = `You are a masterful storyteller specializing in improving existing content in the genre ${temporaryScenario.writingStyle?.genre || "General Fiction"}. Rewrite the following backstory:\n\n` +
                   `"${temporaryScenario.backstory || ""}"\n\n` +
                   `Keep the core elements of the backstory but make it short and high-level. improve it by:\n` +
                   `- Making it clear and structured\n` +
                   `- Keeping it short and high-level (only add details that are needed for clarity)\n` +
                   `- Preserving all key plot points and character relationships\n` +
                   `- Write in a neutral tone, as if it's the back cover of a book. \n\n` +
                   `Do not include any markdown, formatting, or meta-commentary - only the rewritten backstory itself.`;
      
      // Prepare payload like in ChatTab
      const payload = {
        model: undefined, // let backend use default
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000
      };
      
      // Direct fetch like in ChatTab
      const response = await fetch('/proxy/llm/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.body) throw new Error('No response body');
      
      // Get a reference to the cancel function
      let isCancelled = false;
      setCancelGeneration(() => () => { isCancelled = true; });
      
      // Read the stream directly like in ChatTab
      const reader = response.body.getReader();
      let rewrittenText = '';
      let done = false;
      
      while (!done && !isCancelled) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        
        if (value) {
          const chunk = new TextDecoder().decode(value);
          
          // Process in the same way as ChatTab
          chunk.split('\n').forEach(line => {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') return;
              
              try {
                const json = JSON.parse(data);
                const choices = json.choices || [];
                
                for (const choice of choices) {
                  const delta = choice.delta || {};
                  const content = delta.content;
                  
                  if (content) {
                    // Key difference: Update rewrittenText AND set draft state immediately
                    rewrittenText += content;
                    setDraft(rewrittenText);
                  }
                }
              } catch (e) {
                // Not JSON, ignore
              }
            }
          });
        }
      }
      
      if (!isCancelled) {
        // When done and not cancelled, update the content with the final text
        updateContent(rewrittenText);
      } else {
        // If cancelled, update with what was generated so far
        updateContent(rewrittenText);
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
        content={isGenerating ? draft : content} 
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
