import React, { useState } from 'react';
import AIGenerateTextarea from '../../common/AIGenerateTextarea';
import ImportButton from '../../common/ImportButton';
import ImportModal from '../../common/ImportModal';
import { TabProps } from '../common/TabInterface';
import '../common/TabStylesNew.css';

const NotesTab: React.FC<TabProps> = ({ content, updateContent }) => {
  const [showImportModal, setShowImportModal] = useState(false);

  const handleImport = (importedContent: string) => {
    updateContent(importedContent);
  };

  // Dummy AI handler for notes (replace with real AI logic if needed)
  const handleAIGenerateNotes = async () => {
    // Example: updateContent(content + ' (AI generated)');
  };

  return (
    <div className="tab-container scenario-editor-panel">
      <div className="scenario-tab-title">
        Notes
      </div>
      <div className="tab-actions">
        <div className="tab-actions-primary">
          {/* Primary actions would go here */}
        </div>
        <div className="tab-actions-secondary">
          <ImportButton
            onClick={() => setShowImportModal(true)}
            title="Import notes from another scenario"
            label="Import Notes"
          />
        </div>
      </div>
      <p className="style-tab-description">Provide additional notes for the story writer here. These could be instructions for how to make up facts or names, transition between styles, or other technical settings.</p>
      <AIGenerateTextarea
        value={content}
        onChange={updateContent}
        onAIGenerate={handleAIGenerateNotes}
        placeholder="Add notes about the story here..."
        label={undefined}
        error={undefined}
        minRows={6}
      />
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

export default NotesTab;
