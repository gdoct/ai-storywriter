import React from 'react';
import { TabProps } from '../../../types';

export const InteractionsManager: React.FC<TabProps> = ({
  scenario,
  onScenarioChange,
  isDirty,
  isLoading,
}) => {
  return (
    <div className="interactions-manager">
      <div className="interactions-manager__header">
        <h3>Object Interactions</h3>
        <p>Define how objects and actions combine and interact within your story.</p>
      </div>

      <div className="interactions-manager__content">
        <div className="coming-soon">
          <h4>Coming Soon</h4>
          <p>Object interaction features will be available in a future update.</p>
          <ul>
            <li>Define object combinations and their effects</li>
            <li>Create character-object interactions</li>
            <li>Design ritual and ceremonial uses</li>
            <li>Map relationship networks between objects</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
