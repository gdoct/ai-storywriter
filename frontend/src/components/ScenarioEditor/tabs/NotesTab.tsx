import React, { useCallback, useState } from 'react';
import { FaDownload, FaStickyNote } from 'react-icons/fa';
import ImportModal from '../../common/ImportModal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { TabProps } from '../types';
import './NotesTab.css';

export const NotesTab: React.FC<TabProps> = ({
  scenario,
  onScenarioChange,
  isDirty,
  isLoading,
}) => {
  const [showImportModal, setShowImportModal] = useState(false);
  
  const handleNotesChange = useCallback((value: string) => {
    onScenarioChange({ notes: value });
  }, [onScenarioChange]);

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
          <Button
            variant="ghost"
            onClick={() => setShowImportModal(true)}
            icon={<FaDownload />}
          >
            Import
          </Button>
        </div>
      </div>

      <p className="notes-tab__description">
        Use this space for any additional notes, ideas, reminders, or thoughts about your story. 
        This is a free-form area for brainstorming and keeping track of details that don't fit elsewhere.
      </p>

      <div className="notes-tab__content">
        <Input
          label="Notes"
          value={scenario.notes || ''}
          onChange={handleNotesChange}
          placeholder="Add any notes, ideas, reminders, or thoughts about your story here. This could include dialogue snippets, scene ideas, research notes, inspiration, or anything else that helps with your creative process..."
          multiline
          rows={15}
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
