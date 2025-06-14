import React, { useState } from 'react';
import { streamPromptCompletionWithStatus } from '../../../services/storyGenerator';
import ActionButton from '../../common/ActionButton';
import AIGenerateInput from '../../common/AIGenerateInput';
import '../common/TabStylesNew.css';

interface FileTabProps {
  currentScenario: any;
  isDirty: boolean;
  onSaveScenario: (scenario: any) => void;
  onSaveAsScenario: (scenario: any) => void;
}

const FileTab: React.FC<FileTabProps> = ({ currentScenario, isDirty, onSaveScenario, onSaveAsScenario }) => {
  const [title, setTitle] = useState(currentScenario?.title || '');
  const [synopsis, setSynopsis] = useState(currentScenario?.synopsis || '');
  const [titleLoading, setTitleLoading] = useState(false);
  const [synopsisLoading, setSynopsisLoading] = useState(false);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [synopsisError, setSynopsisError] = useState<string | null>(null);

  // AI generation helpers
  const generateTitleAI = async () => {
    setTitleLoading(true);
    setTitleError(null);
    try {
      const prompt = `Suggest a creative, engaging story title for the following synopsis.\n\nSynopsis: ${synopsis || '(none)'}\n\nTitle:`;
      const result = await streamPromptCompletionWithStatus({ prompt });
      setTitle(result.trim().replace(/^"|"$/g, ''));
    } catch (e) {
      setTitleError('Failed to generate title.');
    } finally {
      setTitleLoading(false);
    }
  };

  const generateSynopsisAI = async () => {
    setSynopsisLoading(true);
    setSynopsisError(null);
    try {
      const prompt = `Write a concise, engaging synopsis for a story titled: \"${title || 'Untitled'}\".\n\nSynopsis:`;
      const result = await streamPromptCompletionWithStatus({ prompt });
      setSynopsis(result.trim());
    } catch (e) {
      setSynopsisError('Failed to generate synopsis.');
    } finally {
      setSynopsisLoading(false);
    }
  };

  const handleSave = () => {
    if (!title) return;
    onSaveScenario({ ...currentScenario, title, synopsis });
  };

  const handleSaveAs = () => {
    if (!title) return;
    onSaveAsScenario({ ...currentScenario, title, synopsis });
  };

  return (
    <div className="tab-container scenario-editor-panel">
      <div className="scenario-tab-title">Story File</div>
      <div className="tab-description" style={{ color: '#bfc7d5', fontWeight: 500, marginBottom: 32 }}>
        Set your story's title and synopsis. Use the AI buttons for suggestions.
      </div>
      <div className="style-options-container" style={{
        background: '#23272f',
        border: '1.5px solid #444',
        borderRadius: '10px',
        color: '#fff',
        boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
        margin: '0 auto 24px auto',
        padding: '32px 32px 22px 32px',
        minWidth: '480px',
        maxWidth: '700px',
        fontSize: '1.08rem',
        fontFamily: 'inherit',
        display: 'flex',
        flexDirection: 'column',
        gap: '22px',
      }}>
        <AIGenerateInput
          value={title}
          onChange={setTitle}
          onAIGenerate={generateTitleAI}
          loading={titleLoading}
          placeholder="Enter story title..."
          label="Story Title"
          error={titleError}
        />
        <AIGenerateInput
          value={synopsis}
          onChange={setSynopsis}
          onAIGenerate={generateSynopsisAI}
          loading={synopsisLoading}
          placeholder="Enter story synopsis..."
          label="Story Synopsis"
          error={synopsisError}
          textarea
        />
      </div>
      <div className="tab-actions file-tab-actions" style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', marginTop: 24 }}>
        <ActionButton
          onClick={handleSave}
          label="Save"
          variant="primary"
          disabled={!isDirty || !title}
        />
        <ActionButton
          onClick={handleSaveAs}
          label="Save As..."
          variant="default"
          disabled={!title}
        />
      </div>
    </div>
  );
};

export default FileTab;
