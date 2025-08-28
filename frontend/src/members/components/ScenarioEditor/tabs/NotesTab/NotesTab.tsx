import { AiTextArea, Button } from '@drdata/ai-styles';
import React, { useCallback, useState } from 'react';
import { FaDownload, FaStickyNote, FaTimes } from 'react-icons/fa';
import { useAuth } from '../../../../../shared/contexts/AuthContext';
import { generateNotes } from '../../../../../shared/services/storyGenerator';
import { showUserFriendlyError } from '../../../../../shared/utils/errorHandling';
import ImportModal from '../../../../../shared/components/common/ImportModal';
import { TabProps } from '../../types';
import './NotesTab.css';

export const NotesTab: React.FC<TabProps> = ({
  scenario,
  onScenarioChange,
  isDirty: _isDirty,
  isLoading,
}) => {
  const [showImportModal, setShowImportModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [cancelGeneration, setCancelGeneration] = useState<(() => void) | null>(null);
  const { refreshCredits } = useAuth();
  
  const handleNotesChange = useCallback((value: string) => {
    onScenarioChange({ notes: value });
  }, [onScenarioChange]);

  const handleGenerateNotes = useCallback(async () => {
    try {
      setIsGenerating(true);
      onScenarioChange({ notes: '' }); // Clear existing content
      
      let accumulated = '';
      const generationResult = await generateNotes(
        scenario,
        {
          onProgress: (generatedText) => {
            accumulated += generatedText;
            onScenarioChange({ notes: accumulated });
          }
        }
      );
      
      setCancelGeneration(() => generationResult.cancelGeneration);
      
      try {
        const generatedNotes = await generationResult.result;
        onScenarioChange({ notes: generatedNotes });
        // Refresh credits after successful generation with a small delay
        setTimeout(() => {
          refreshCredits();
        }, 1000);
      } catch (error) {
        console.log('Notes generation was interrupted:', error);
        // Keep the accumulated text
        // Still refresh credits in case of partial consumption with a small delay
        setTimeout(() => {
          refreshCredits();
        }, 1000);
      }
    } catch (error) {
      console.error('Error generating notes:', error);
      // Show user-friendly error with credit purchase option if needed
      if (error instanceof Error) {
        showUserFriendlyError(error, 'Notes Generation');
      }
    } finally {
      setIsGenerating(false);
      setCancelGeneration(null);
    }
  }, [scenario, onScenarioChange, refreshCredits]);

  const handleCancelGeneration = useCallback(() => {
    if (cancelGeneration) {
      cancelGeneration();
    }
  }, [cancelGeneration]);

  const handleImport = useCallback((importedContent: string) => {
    onScenarioChange({ notes: importedContent });
  }, [onScenarioChange]);

  return (
    <div className="notes-tab">
      <div className="notes-tab__header">
        <div className="notes-tab__title-section">
          <div className="notes-tab__icon">
            <FaStickyNote />
          </div>
          <h3 className="notes-tab__title">Notes & Ideas</h3>
        </div>
        
        <div className="notes-tab__actions">
          {!isGenerating ? (
            <>
              <Button
                variant="primary"
                onClick={handleGenerateNotes}
                disabled={isLoading}
              >
                ✨ Generate Ideas
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

      <p className="notes-tab__description">
        Use this space for any additional notes, ideas, reminders, or thoughts about your story. 
        This is a free-form area for brainstorming and keeping track of details that don't fit elsewhere.
      </p>

      <div className="notes-tab__content">
        <AiTextArea
          label="Notes"
          value={scenario.notes || ''}
          onChange={handleNotesChange}
          placeholder="Add any notes, ideas, reminders, or thoughts about your story here. This could include dialogue snippets, scene ideas, research notes, inspiration, or anything else that helps with your creative process..."
          rows={15}
          disabled={isGenerating}
          onAiClick={handleGenerateNotes}
          aiGenerating={isGenerating}
        />
        
        <div className="notes-tab__suggestions">
          <h4 className="notes-tab__suggestions-title">Ideas for Notes:</h4>
          <ul className="notes-tab__suggestions-list">
            <li>Dialogue snippets or memorable quotes</li>
            <li>Scene ideas and visual descriptions</li>
            <li>Research notes and factual details</li>
            <li>Character quirks and personality details</li>
            <li>Plot holes to address or questions to answer</li>
            <li>Inspiration sources and references</li>
            <li>Alternative plot directions or endings</li>
            <li>Themes and symbols to explore</li>
          </ul>
        </div>
      </div>

      <ImportModal
        show={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Import Notes"
        onImport={handleImport}
        extractContent={(scenario) => scenario.notes || ''}
      />
    </div>
  );
};
