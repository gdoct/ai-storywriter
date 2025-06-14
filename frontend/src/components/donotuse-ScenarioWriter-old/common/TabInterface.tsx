import React from 'react';
import { Scenario } from '../../../types/ScenarioTypes';
import './TabStylesNew.css';

export interface TabProps {
  content: string;
  updateContent: (content: string) => void;
  currentScenario?: Scenario | null;
}

const TabContentArea: React.FC<TabProps & { placeholder: string }> = ({
  content,
  updateContent,
  placeholder
}) => {
  return (
    <textarea
      className="story-tab-content"
      placeholder={placeholder}
      value={content}
      onChange={(e) => updateContent(e.target.value)}
    />
  );
};

export default TabContentArea;
