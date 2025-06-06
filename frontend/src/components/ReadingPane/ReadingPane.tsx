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
}

const ReadingPane: React.FC<ReadingPaneProps> = ({
  content,
  onSubmit,
  canSubmit = false,
  isGeneratedStory = false,
  currentScenario = null,
  onStoryGenerated,
}) => {
  const [fontSize, setFontSize] = useState<string>('16px');
  const [fontFamily, setFontFamily] = useState<string>('Georgia');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [displayContent, setDisplayContent] = useState<string>(content || '');
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [cancelGeneration, setCancelGeneration] = useState<(() => void) | null>(null);
  const [displaySource, setDisplaySource] = useState<'generated' | 'database' | 'none'>('none');

  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (content) {
      setDisplayContent(content);
      setDisplaySource('generated');
    }
  }, [content]);

  useEffect(() => {
    if (isGenerating && generatedContent) {
      setDisplayContent(generatedContent);
      setDisplaySource('generated');
    }
  }, [generatedContent, isGenerating]);

  const handleCancelGeneration = () => {
    if (cancelGeneration) {
      cancelGeneration();
      setIsGenerating(false);
      setCancelGeneration(null);
    }
  };

  const handleGenerateStory = async () => {
    if (!currentScenario || isGenerating) return;
    setIsGenerating(true);
    setDisplaySource('generated');
    setCancelGeneration(null);
    try {
      setGeneratedContent('');
      const { result, cancelGeneration: newCancel } = await generateStory(currentScenario, {
        onProgress: (text: string) => {
          setGeneratedContent(text);
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
