import React from 'react';
import ActionButton from '../../common/ActionButton';

interface FileTabActionsProps {
  handleRandomizeScenario: () => void;
  handleCreateNewScenario: () => void;
  handleSaveScenario: () => void;
  handleSaveAsScenario: () => void;
  handleRenameScenario: () => void;
  currentScenario: any;
  isDirty: boolean;
}

const FileTabActions: React.FC<FileTabActionsProps> = ({
  handleRandomizeScenario,
  handleCreateNewScenario,
  handleSaveScenario,
  handleSaveAsScenario,
  handleRenameScenario,
  currentScenario,
  isDirty,
}) => (
  <div className="tab-actions-group">
    <ActionButton
      onClick={handleRandomizeScenario}
      label="✨ Randomize current scenario"
      variant="success"
      title="Completely randomize the current scenario with customizable options"
    />
    <ActionButton
      onClick={handleCreateNewScenario}
      label="Create New Scenario"
      variant="primary"
    />
    <ActionButton
      onClick={handleSaveScenario}
      label="Save Scenario"
      variant="primary"
      className={!currentScenario || !isDirty ? 'disabled' : ''}
    />
    <ActionButton
      onClick={handleSaveAsScenario}
      label="Save As..."
      variant="default"
      className={!currentScenario ? 'disabled' : ''}
    />
    <ActionButton
      onClick={handleRenameScenario}
      label="Rename"
      variant="default"
      className={!currentScenario || !currentScenario.id ? 'disabled' : ''}
    />
  </div>
);

export default FileTabActions;
