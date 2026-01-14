import { AiTextArea, Button } from '@drdata/ai-styles';
import React, { useCallback, useMemo, useState } from 'react';
import { FaDownload, FaCog } from 'react-icons/fa';
import { PromptSettings } from '@shared/types/ScenarioTypes';
import ImportModal from '@shared/components/common/ImportModal';
import { TabProps } from '../../types';
import './CustomPromptTab.css';

export const CustomPromptTab: React.FC<TabProps> = ({
  scenario,
  onScenarioChange,
  isDirty: _isDirty,
  isLoading,
}) => {
  const [showImportModal, setShowImportModal] = useState(false);
  
  // Wrap promptSettings in useMemo to stabilize reference for useCallback deps
  const promptSettings: PromptSettings = useMemo(() => scenario.promptSettings || {}, [scenario.promptSettings]);

  const handlePromptSettingChange = useCallback((field: keyof PromptSettings, value: string) => {
    const updatedSettings = { ...promptSettings, [field]: value };
    onScenarioChange({ promptSettings: updatedSettings });
  }, [promptSettings, onScenarioChange]);

  const handleImport = useCallback((importedContent: PromptSettings) => {
    onScenarioChange({ promptSettings: importedContent });
  }, [onScenarioChange]);

  return (
    <div className="custom-prompt-tab">
      <div className="custom-prompt-tab__header">
        <div className="custom-prompt-tab__title-section">
          <div className="custom-prompt-tab__icon">
            <FaCog />
          </div>
          <h3 className="custom-prompt-tab__title">Custom Prompts</h3>
        </div>
        
        <div className="custom-prompt-tab__actions">
          <Button
            variant="ghost"
            onClick={() => setShowImportModal(true)}
            icon={<FaDownload />}
          >
            Import
          </Button>
        </div>
      </div>

      <p className="custom-prompt-tab__description">
        Customize how AI prompts are constructed for this scenario. These settings will be applied 
        consistently across all story generation features.
      </p>

      <div className="custom-prompt-tab__content">
        <div className="custom-prompt-tab__field">
          <AiTextArea
            label="System Prompt Prefix"
            value={promptSettings.systemPromptPrefix || ''}
            onChange={(value) => handlePromptSettingChange('systemPromptPrefix', value)}
            placeholder="Text to insert before the system prompt. Use this to provide additional context or instructions to the AI about how to approach this story..."
            rows={4}
            disabled={isLoading}
          />
          <p className="custom-prompt-tab__field-description">
            This text will be added at the beginning of the system prompt, before any other instructions.
          </p>
        </div>

        <div className="custom-prompt-tab__field">
          <AiTextArea
            label="User Prompt Prefix"
            value={promptSettings.userPromptPrefix || ''}
            onChange={(value) => handlePromptSettingChange('userPromptPrefix', value)}
            placeholder="Text to insert before the user prompt. Use this to provide additional context or specific requests about the story generation..."
            rows={4}
            disabled={isLoading}
          />
          <p className="custom-prompt-tab__field-description">
            This text will be added at the beginning of the user prompt, before the scenario content.
          </p>
        </div>

        <div className="custom-prompt-tab__field">
          <AiTextArea
            label="Keywords"
            value={promptSettings.keywords || ''}
            onChange={(value) => handlePromptSettingChange('keywords', value)}
            placeholder="Enter keywords separated by commas (e.g., mystery, adventure, romance, betrayal, redemption)"
            rows={3}
            disabled={isLoading}
          />
          <p className="custom-prompt-tab__field-description">
            These keywords will be included in the system prompt to guide the AI's story generation. 
            Separate multiple keywords with commas.
          </p>
        </div>

        <div className="custom-prompt-tab__examples">
          <h4 className="custom-prompt-tab__examples-title">Usage Examples:</h4>
          <div className="custom-prompt-tab__example">
            <strong>System Prompt Prefix:</strong>
            <p>"Focus on psychological depth and internal monologue. Write in a literary style with rich metaphors."</p>
          </div>
          <div className="custom-prompt-tab__example">
            <strong>User Prompt Prefix:</strong>
            <p>"Please write this story from a first-person perspective and include detailed descriptions of settings."</p>
          </div>
          <div className="custom-prompt-tab__example">
            <strong>Keywords:</strong>
            <p>"suspense, family secrets, small town, redemption, coming of age"</p>
          </div>
        </div>
      </div>

      <ImportModal
        show={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Import Prompt Settings"
        onImport={handleImport}
        extractContent={(scenario) => scenario.promptSettings || {}}
      />
    </div>
  );
};