import React, { useCallback, useState } from 'react';
import { FaBook, FaDownload, FaTimes } from 'react-icons/fa';
import { useAIStatus } from '../../../contexts/AIStatusContext';
import { generateBackstory, rewriteBackstory } from '../../../services/storyGenerator';
import ImportModal from '../../common/ImportModal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { TabProps } from '../types';
import './BackstoryTab.css';

export const BackstoryTab: React.FC<TabProps> = ({
  scenario,
  onScenarioChange,
  isDirty,
  isLoading,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [cancelGeneration, setCancelGeneration] = useState<(() => void) | null>(null);
  const { setAiStatus, setShowAIBusyModal } = useAIStatus();

  const handleBackstoryChange = useCallback((value: string) => {
    onScenarioChange({ backstory: value });
  }, [onScenarioChange]);

  const handleGenerateBackstory = useCallback(async () => {
    try {
      setIsGenerating(true);
      onScenarioChange({ backstory: '' }); // Clear existing content
      
      let accumulated = '';
      const generationResult = await generateBackstory(
        scenario,
        {
          onProgress: (generatedText) => {
            accumulated += generatedText;
            onScenarioChange({ backstory: accumulated });
          }
        },
        setAiStatus,
        setShowAIBusyModal
      );
      
      setCancelGeneration(() => generationResult.cancelGeneration);
      
      try {
        const generatedBackstory = await generationResult.result;
        onScenarioChange({ backstory: generatedBackstory });
      } catch (error) {
        console.log('Backstory generation was interrupted:', error);
        // Keep the accumulated text
      }
    } catch (error) {
      console.error('Error generating backstory:', error);
    } finally {
      setIsGenerating(false);
      setCancelGeneration(null);
    }
  }, [scenario, onScenarioChange, setAiStatus, setShowAIBusyModal]);

  const handleRewriteBackstory = useCallback(async () => {
    if (!scenario.backstory || scenario.backstory.trim() === '') {
      return;
    }
    
    try {
      setIsGenerating(true);
      onScenarioChange({ backstory: '' }); // Clear existing content
      
      let accumulated = '';
      const generationResult = await rewriteBackstory(
        scenario,
        {
          onProgress: (generatedText) => {
            accumulated += generatedText;
            onScenarioChange({ backstory: accumulated });
          }
        },
        setAiStatus,
        setShowAIBusyModal
      );
      
      setCancelGeneration(() => generationResult.cancelGeneration);
      
      try {
        const rewrittenBackstory = await generationResult.result;
        onScenarioChange({ backstory: rewrittenBackstory });
      } catch (error) {
        console.log('Backstory rewriting was interrupted:', error);
        // Keep the accumulated text
      }
    } catch (error) {
      console.error('Error rewriting backstory:', error);
    } finally {
      setIsGenerating(false);
      setCancelGeneration(null);
    }
  }, [scenario, onScenarioChange, setAiStatus, setShowAIBusyModal]);

  const handleCancelGeneration = useCallback(() => {
    if (cancelGeneration) {
      cancelGeneration();
    }
  }, [cancelGeneration]);

  const handleImport = useCallback((importedContent: string) => {
    onScenarioChange({ backstory: importedContent });
  }, [onScenarioChange]);

  return (
    <div className="backstory-tab">
      <div className="backstory-tab__header">
        <div className="backstory-tab__title-section">
          <div className="backstory-tab__icon">
            <FaBook />
          </div>
          <h3 className="backstory-tab__title">Story Backstory</h3>
        </div>
        
        <div className="backstory-tab__actions">
          {!isGenerating ? (
            <>
              <Button
                variant="primary"
                onClick={handleGenerateBackstory}
                disabled={isLoading}
              >
                ✨ Generate Backstory
              </Button>
              <Button
                variant="secondary"
                onClick={handleRewriteBackstory}
                disabled={isLoading || !scenario.backstory || scenario.backstory.trim() === ''}
              >
                ✨ Rewrite Backstory
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowImportModal(true)}
                icon={<FaDownload />}
              >
                Import
              </Button>
            </>
          ) : (
            <Button
              variant="danger"
              onClick={handleCancelGeneration}
              icon={<FaTimes />}
            >
              Cancel Generation
            </Button>
          )}
        </div>
      </div>

      <p className="backstory-tab__description">
        Define the background events and context that shape your story. This includes key historical events, 
        character motivations, world-building details, and any important context that influences the main narrative.
      </p>

      <div className="backstory-tab__content">
        <Input
          label="Backstory"
          value={scenario.backstory || ''}
          onChange={handleBackstoryChange}
          placeholder="Enter the backstory for your narrative. Include key events, character backgrounds, world-building details, and any context that influences the main story..."
          multiline
          rows={15}
          disabled={isGenerating}
        />
        
        <div className="backstory-tab__hints">
          <h4 className="backstory-tab__hints-title">Writing Tips:</h4>
          <ul className="backstory-tab__hints-list">
            <li>Include key historical events that shaped the world or characters</li>
            <li>Describe character relationships and past interactions</li>
            <li>Explain the current state of the world or setting</li>
            <li>Include relevant cultural, political, or social context</li>
            <li>Mention any significant conflicts or tensions</li>
            <li>Describe character motivations and past experiences</li>
          </ul>
        </div>
      </div>

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
