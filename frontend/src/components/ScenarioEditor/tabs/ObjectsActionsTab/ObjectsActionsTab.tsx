import React, { useState } from 'react';
import { FaBook, FaCog, FaProjectDiagram, FaStickyNote, FaUsers } from 'react-icons/fa';
import { renderIcon } from '../../common/IconUtils';
import { TabProps } from '../../types';
import './ObjectsActionsTab.css';

// Sub-tab type
export type ObjectsActionsSubTab = 'objects' | 'actions' | 'categories' | 'interactions' | 'sequences';

// Temporary simple components
const ObjectsManager: React.FC<TabProps> = () => {
  return (
    <div className="objects-manager">
      <h3>Objects Manager</h3>
      <p>Catalog and manage story objects (will be fully implemented).</p>
    </div>
  );
};

const ActionsManager: React.FC<TabProps> = () => {
  return (
    <div className="actions-manager">
      <h3>Actions Manager</h3>
      <p>Define and organize story actions (will be fully implemented).</p>
    </div>
  );
};

const CategoriesManager: React.FC<TabProps> = () => {
  return (
    <div className="categories-manager">
      <h3>Categories Manager</h3>
      <p>Create and manage object and action categories (coming soon).</p>
    </div>
  );
};

const InteractionsManager: React.FC<TabProps> = () => {
  return (
    <div className="interactions-manager">
      <h3>Interactions Manager</h3>
      <p>Design object and action interactions (coming soon).</p>
    </div>
  );
};

const SequencesManager: React.FC<TabProps> = () => {
  return (
    <div className="sequences-manager">
      <h3>Sequences Manager</h3>
      <p>Create complex action sequences (coming soon).</p>
    </div>
  );
};

// Sub-tab configuration
const subTabs: Array<{
  id: ObjectsActionsSubTab;
  label: string;
  icon: React.ComponentType;
  component: React.ComponentType<TabProps>;
}> = [
  {
    id: 'objects',
    label: 'Objects',
    icon: FaBook,
    component: ObjectsManager,
  },
  {
    id: 'actions',
    label: 'Actions',
    icon: FaCog,
    component: ActionsManager,
  },
  {
    id: 'categories',
    label: 'Categories',
    icon: FaStickyNote,
    component: CategoriesManager,
  },
  {
    id: 'interactions',
    label: 'Interactions',
    icon: FaUsers,
    component: InteractionsManager,
  },
  {
    id: 'sequences',
    label: 'Sequences',
    icon: FaProjectDiagram,
    component: SequencesManager,
  },
];

export const ObjectsActionsTab: React.FC<TabProps> = ({
  scenario,
  onScenarioChange,
  isDirty,
  isLoading,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<ObjectsActionsSubTab>('objects');

  // Initialize objectsAndActions if it doesn't exist
  const objectsAndActions = scenario.objectsAndActions || {
    objects: [],
    actions: [],
    objectCategories: [],
    actionCategories: [],
    interactions: [],
    sequences: [],
    generalNotes: '',
  };

  // Get the active sub-tab component
  const activeSubTabConfig = subTabs.find(tab => tab.id === activeSubTab);
  const ActiveSubTabComponent = activeSubTabConfig?.component;

  // Count statistics for display
  const stats = {
    objects: objectsAndActions.objects.length,
    actions: objectsAndActions.actions.length,
    interactions: objectsAndActions.interactions.length,
    sequences: objectsAndActions.sequences.length,
    criticalObjects: objectsAndActions.objects.filter(obj => obj.significance === 'critical').length,
    magicalObjects: objectsAndActions.objects.filter(obj => obj.type === 'magical').length,
    weapons: objectsAndActions.objects.filter(obj => obj.type === 'weapon').length,
  };

  return (
    <div className="objects-actions-tab">
      <div className="objects-actions-tab__header">
        <h2>Objects & Actions</h2>
        <p>Catalog and develop the physical elements and behaviors that populate your story world.</p>
      </div>

      {/* Sub-tabs navigation */}
      <div className="objects-actions-tab__sub-tabs">
        {subTabs.map((tab) => {
          return (
            <button
              key={tab.id}
              className={`sub-tab ${activeSubTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveSubTab(tab.id)}
              disabled={isLoading}
            >
              {renderIcon(tab.icon, { className: "sub-tab__icon" })}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Sub-tab content */}
      <div className="objects-actions-tab__content">
        {ActiveSubTabComponent && (
          <ActiveSubTabComponent
            scenario={scenario}
            onScenarioChange={onScenarioChange}
            isDirty={isDirty}
            isLoading={isLoading}
          />
        )}
      </div>

      {/* Quick stats */}
      <div className="objects-actions-tab__stats">
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">Objects:</span>
            <span className="stat-value">{stats.objects}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Actions:</span>
            <span className="stat-value">{stats.actions}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Interactions:</span>
            <span className="stat-value">{stats.interactions}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Sequences:</span>
            <span className="stat-value">{stats.sequences}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Critical Items:</span>
            <span className="stat-value">{stats.criticalObjects}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Magical Objects:</span>
            <span className="stat-value">{stats.magicalObjects}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Weapons:</span>
            <span className="stat-value">{stats.weapons}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
