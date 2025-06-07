import React, { useEffect, useRef, useState } from 'react';
import { generateStory } from '../../services/storyGenerator';
import { Scenario } from '../../types/ScenarioTypes';
import MarkdownViewer from './MarkDownViewer';
import './ReadingPane.css';
import ReadingPaneHeader from './ReadingPaneHeader';

interface ReadingPaneProps {
  content: string;
  onSubmit?: () => void;
  canSubmit?: boolean;
  isGeneratedStory?: boolean;
  currentScenario?: Scenario | null;
  onStoryGenerated?: (story: string | null) => void;
  onStoryVersionSelect?: (timestamp: string) => void;
  currentTimestamp?: string | null;
  scenes?: import('../../types/ScenarioTypes').Scene[];
  onDisableStoryDropdown?: (disabled: boolean) => void; // NEW PROP
  isStoryDropdownDisabled?: boolean; // NEW PROP
}

const ReadingPane: React.FC<ReadingPaneProps> = ({
  content,
  onSubmit,
  canSubmit = false,
  isGeneratedStory = false,
  currentScenario = null,
  onStoryGenerated,
  onStoryVersionSelect,
  currentTimestamp,
  onDisableStoryDropdown, // NEW PROP
  isStoryDropdownDisabled = false, // NEW PROP
}) => {
  const [fontSize, setFontSize] = useState<string>('16px');
  const [fontFamily, setFontFamily] = useState<string>('Georgia');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [cancelGeneration, setCancelGeneration] = useState<(() => void) | null>(null);
  const [displayContent, setDisplayContent] = useState<string>(content || '');
  const [displaySource, setDisplaySource] = useState<'generated' | 'database' | 'none'>('none');

  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // When content changes from outside the component, update the display
    // But only if we're not currently generating a story
    if (!isGenerating && content) {
      setDisplayContent(content);
      // Only set displaySource to 'database' if a saved story is selected
      if (currentTimestamp) {
        setDisplaySource('database');
      } else {
        // If no timestamp but we have content, it's likely a fresh story
        setDisplaySource('none');
      }
    }
  }, [content, currentTimestamp, isGenerating]);

  const handleCancelGeneration = () => {
    if (cancelGeneration) {
      // Cancel the ongoing generation
      cancelGeneration();
      
      // Reset generation state
      setIsGenerating(false);
      setCancelGeneration(null);
      
      // Re-enable the story dropdown
      if (onDisableStoryDropdown) onDisableStoryDropdown(false);
      
      // Keep displaying whatever partial content we have,
      // but mark it as non-generated to avoid confusion
      setDisplaySource('none');
    }
  };

  const handleGenerateStory = async () => {
    if (!currentScenario || isGenerating) return;
    
    // Step 1: First set flags that will trigger state changes in the header component
    setIsGenerating(true);
    
    // Step 2: Clear everything before starting generation
    // Reset dropdown selection in parent
    if (onStoryVersionSelect) onStoryVersionSelect('');
    
    // Clear any existing content to avoid flickering
    setDisplayContent('');
    
    // Clear story content in parent
    if (onStoryGenerated) onStoryGenerated(null);
    
    // Disable the story dropdown while generating
    if (onDisableStoryDropdown) onDisableStoryDropdown(true);
    
    // Update display source to indicate generation
    setDisplaySource('generated');
    setCancelGeneration(null);
    
    try {
      const { result, cancelGeneration: newCancel } = await generateStory(currentScenario, {
        onProgress: (text: string) => {
          setDisplayContent(text);
        }
      });
      
      setCancelGeneration(() => newCancel);
      const fullStory = await result;
      setDisplayContent(fullStory.completeText);
      
      if (onStoryGenerated) {
        onStoryGenerated(fullStory.completeText);
      }
    } catch (error) {
      console.error('Error generating story:', error);
    } finally {
      setIsGenerating(false);
      setCancelGeneration(null);
      if (onDisableStoryDropdown) onDisableStoryDropdown(false); // Re-enable dropdown
    }
    
    if (onSubmit) {
      onSubmit();
    }
  };

  const handleFontChange = (family: string, size: string) => {
    setFontFamily(family);
    setFontSize(size);
  };

  return (
    <div className="reading-pane">
      <ReadingPaneHeader
        currentScenario={currentScenario}
        displayContent={displayContent}
        onStoryGenerated={text => {
          setDisplayContent(text || '');
          if (onStoryGenerated) onStoryGenerated(text);
        }}
        onFontChange={handleFontChange}
        onGenerateStory={handleGenerateStory}
        onCancelGeneration={handleCancelGeneration}
        isGenerating={isGenerating}
        canSubmit={canSubmit}
        onSubmit={onSubmit}
        isGeneratedStory={isGeneratedStory}
        displaySource={displaySource}
        isStoryDropdownDisabled={isStoryDropdownDisabled}
      />
      <div
        ref={contentRef}
        className="reading-content"
        style={{
          fontSize: fontSize,
          fontFamily: fontFamily
        }}
      >
        {displayContent ? (
          <>
            {isGeneratedStory && displaySource === 'generated' &&
              <div className="generated-story-badge">Generated Story</div>}
            {displaySource === 'database' &&
              <div className="saved-story-badge">Saved Story</div>}
            <MarkdownViewer content={displayContent} />
          </>
        ) : (
          <p className="placeholder-text">Your story will appear here...</p>
        )}
      </div>
    </div>
  );
};

export default ReadingPane;
