import React, { useEffect, useState } from 'react';
import { createScenarioPrompt } from '../../services/storyGenerator';
import { Scenario } from '../../types/ScenarioTypes';
import './TabStylesNew.css';

interface PromptPreviewTabProps {
  currentScenario: Scenario | null;
}

const PromptPreviewTab: React.FC<PromptPreviewTabProps> = ({ currentScenario }) => {
  const [previewContent, setPreviewContent] = useState<string>('');

  useEffect(() => {
    if (currentScenario) {
      try {
        const prompt = createScenarioPrompt(currentScenario);
        setPreviewContent(prompt);
      } catch (error) {
        console.error('Error creating scenario prompt:', error);
        setPreviewContent('Error generating preview. Please make sure all fields are valid.');
      }
    } else {
      setPreviewContent('No scenario loaded. Please create or load a scenario first.');
    }
  }, [currentScenario]);

  return (
    <div className="tab-container">
      <div className="tab-description">
        <h3>Story Generation Prompt</h3>
        <p>This is the exact prompt that will be sent to the AI model to generate your story.</p>
      </div>
      <div className="preview-content-area">
        <pre className="prompt-preview-text">{previewContent}</pre>
      </div>
    </div>
  );
};

export default PromptPreviewTab;
