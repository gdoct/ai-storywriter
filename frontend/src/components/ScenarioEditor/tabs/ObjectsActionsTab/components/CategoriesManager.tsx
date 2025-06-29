import React from 'react';
import { TabProps } from '../../../types';

export const CategoriesManager: React.FC<TabProps> = ({
  scenario,
  onScenarioChange,
  isDirty,
  isLoading,
}) => {
  return (
    <div className="categories-manager">
      <div className="categories-manager__header">
        <h3>Categories Management</h3>
        <p>Organize objects and actions into meaningful categories.</p>
      </div>

      <div className="categories-manager__content">
        <div className="coming-soon">
          <h4>Coming Soon</h4>
          <p>Category management features will be available in a future update.</p>
          <ul>
            <li>Create custom object categories</li>
            <li>Define action classifications</li>
            <li>Set category attributes and defaults</li>
            <li>Organize with hierarchical structures</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
