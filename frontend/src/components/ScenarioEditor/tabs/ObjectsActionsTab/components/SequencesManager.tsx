import React from 'react';
import { TabProps } from '../../../types';

export const SequencesManager: React.FC<TabProps> = ({
  scenario,
  onScenarioChange,
  isDirty,
  isLoading,
}) => {
  return (
    <div className="sequences-manager">
      <div className="sequences-manager__header">
        <h3>Action Sequences</h3>
        <p>Create complex multi-step action chains and choreographed sequences.</p>
      </div>

      <div className="sequences-manager__content">
        <div className="coming-soon">
          <h4>Coming Soon</h4>
          <p>Action sequence features will be available in a future update.</p>
          <ul>
            <li>Design combat choreography</li>
            <li>Create ritual and ceremonial sequences</li>
            <li>Build crafting and creation processes</li>
            <li>Plan investigation and discovery flows</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
