import React from 'react';
import { Scenario } from '../../types/ScenarioTypes';
import { ScenarioEditorProvider } from './context';
import { ScenarioEditor } from './ScenarioEditor';

interface ScenarioEditorWrapperProps {
  initialScenario?: Scenario;
  onScenarioSave?: (scenario: Scenario) => void;
  onClose?: () => void;
}

export const ScenarioEditorWrapper: React.FC<ScenarioEditorWrapperProps> = (props) => {
  return (
    <ScenarioEditorProvider>
      <ScenarioEditor {...props} />
    </ScenarioEditorProvider>
  );
};
