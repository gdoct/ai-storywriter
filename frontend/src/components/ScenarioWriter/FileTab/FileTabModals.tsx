import React from 'react';
import { Scenario } from '../../../types/ScenarioTypes';
import CreateScenarioModal from '../common/CreateScenarioModal';
import DeleteScenarioModal from '../common/DeleteScenarioModal';
import RandomScenarioModal from '../common/RandomScenarioModal';
import RenameScenarioModal from '../common/RenameScenarioModal';
import SaveAsModal from '../common/SaveAsModal';
import SaveChangesModal from '../common/SaveChangesModal';
import UnsavedChangesModal from '../common/UnsavedChangesModal';

interface FileTabModalsProps {
  showConfirm: boolean;
  setShowConfirm: (show: boolean) => void;
  confirmAction: () => void;
  showSaveConfirm: boolean;
  handleCancelSwitch: () => void;
  handleDiscardAndLoad: () => void;
  handleSaveAndLoad: () => void;
  showTitleInput: boolean;
  setShowTitleInput: (show: boolean) => void;
  confirmNewScenario: () => void;
  newTitle: string;
  setNewTitle: (title: string) => void;
  errorMessage: string;
  setErrorMessage: (msg: string) => void;
  showSaveAsInput: boolean;
  setShowSaveAsInput: (show: boolean) => void;
  confirmSaveAs: () => void;
  saveAsTitle: string;
  setSaveAsTitle: (title: string) => void;
  showRenameInput: boolean;
  setShowRenameInput: (show: boolean) => void;
  confirmRenameScenario: () => void;
  renameTitle: string;
  setRenameTitle: (title: string) => void;
  showRandomScenarioModal: boolean;
  setShowRandomScenarioModal: (show: boolean) => void;
  currentScenario: Scenario | null;
  onLoadScenario: (scenario: Scenario, generatedStory?: string | null) => void;
  isGeneratingScenario: boolean;
  generationProgress: string;
  randomScenarioName: string;
  handleGenerateRandomScenario: (extraInstructions: string) => void;
  handleCancelRandomGeneration: () => void;
  randomScenarioOptions: any;
  setRandomScenarioOptions: (opts: any) => void;
  showDeleteConfirm: boolean;
  setShowDeleteConfirm: (show: boolean) => void;
  confirmDeleteScenario: () => void;
}

const FileTabModals: React.FC<FileTabModalsProps> = (props) => (
  <>
    <UnsavedChangesModal
      show={props.showConfirm}
      onClose={() => props.setShowConfirm(false)}
      onContinue={props.confirmAction}
    />
    <SaveChangesModal
      show={props.showSaveConfirm}
      onClose={props.handleCancelSwitch}
      onDiscard={props.handleDiscardAndLoad}
      onSave={props.handleSaveAndLoad}
    />
    <CreateScenarioModal
      show={props.showTitleInput}
      onClose={() => {
        props.setShowTitleInput(false);
        props.setErrorMessage('');
      }}
      onCreate={props.confirmNewScenario}
      newTitle={props.newTitle}
      setNewTitle={props.setNewTitle}
      errorMessage={props.errorMessage}
    />
    <SaveAsModal
      show={props.showSaveAsInput}
      onClose={() => {
        props.setShowSaveAsInput(false);
        props.setErrorMessage('');
      }}
      onSave={props.confirmSaveAs}
      saveAsTitle={props.saveAsTitle}
      setSaveAsTitle={props.setSaveAsTitle}
      errorMessage={props.errorMessage}
    />
    <RenameScenarioModal
      show={props.showRenameInput}
      onClose={() => {
        props.setShowRenameInput(false);
        props.setErrorMessage('');
      }}
      onRename={props.confirmRenameScenario}
      renameTitle={props.renameTitle}
      setRenameTitle={props.setRenameTitle}
      errorMessage={props.errorMessage}
    />
    <RandomScenarioModal
      show={props.showRandomScenarioModal}
      onClose={() => props.setShowRandomScenarioModal(false)}
      currentScenario={props.currentScenario}
      onLoadScenario={props.onLoadScenario}
      isGeneratingScenario={props.isGeneratingScenario}
      generationProgress={props.generationProgress}
      randomScenarioName={props.randomScenarioName}
      onGenerateRandomScenario={props.handleGenerateRandomScenario}
      onCancelGeneration={props.handleCancelRandomGeneration}
      randomScenarioOptions={props.randomScenarioOptions}
      setRandomScenarioOptions={props.setRandomScenarioOptions}
    />
    <DeleteScenarioModal
      show={props.showDeleteConfirm}
      onClose={() => props.setShowDeleteConfirm(false)}
      onDelete={props.confirmDeleteScenario}
    />
  </>
);

export default FileTabModals;
