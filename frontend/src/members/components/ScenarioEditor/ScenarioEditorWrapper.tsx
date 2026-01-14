import React, { useEffect } from 'react';
import { Scenario } from '@shared/types/ScenarioTypes';
import { ScenarioEditorProvider } from './context';
import { ScenarioEditor } from './ScenarioEditor';

interface ScenarioEditorWrapperProps {
  initialScenario?: Scenario;
  onScenarioSave?: (scenario: Scenario) => void;
  onClose?: () => void;
}

export const ScenarioEditorWrapper: React.FC<ScenarioEditorWrapperProps> = (props) => {
  // Immediate scroll reset at wrapper level
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  return (
    <ScenarioEditorProvider>
      <ScenarioEditor {...props} />
    </ScenarioEditorProvider>
  );
};
