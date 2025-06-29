import React, { useCallback, useMemo, useState } from 'react';
import { FaCog, FaDice, FaProjectDiagram, FaTrash, FaUsers } from 'react-icons/fa';
import { renderIcon } from '../../common/IconUtils';
import { TabProps } from '../../types';
import './CharacterRelationshipsTab.css';
import ConflictsManager from './components/ConflictsManager';
import DynamicsManager from './components/DynamicsManager';
import GroupsManager from './components/GroupsManager';
import HistoryManager from './components/HistoryManager';
import RelationshipsManager from './components/RelationshipsManager';

// Sub-tab type
export type RelationshipsSubTab = 'relationships' | 'dynamics' | 'conflicts' | 'history' | 'groups';

// Relationships manager wrapper component
const RelationshipsManagerWrapper: React.FC<TabProps> = ({
  scenario,
  onScenarioChange,
  isDirty,
  isLoading,
}) => {
  const characterRelationships = useMemo(() => scenario.characterRelationships || {
    relationships: [],
    relationshipTypes: [],
    dynamics: [],
    conflicts: [],
    histories: [],
    groups: [],
    generalNotes: '',
  }, [scenario.characterRelationships]);

  const handleRelationshipsChange = useCallback((relationships: any[]) => {
    const updatedScenario = {
      ...scenario,
      characterRelationships: {
        ...characterRelationships,
        relationships,
      },
    };
    onScenarioChange(updatedScenario);
  }, [scenario, onScenarioChange, characterRelationships]);

  return (
    <RelationshipsManager
      relationships={characterRelationships.relationships}
      onRelationshipsChange={handleRelationshipsChange}
      characters={scenario.characters || []}
      readonly={isLoading}
    />
  );
};

// Dynamics manager wrapper component
const DynamicsManagerWrapper: React.FC<TabProps> = ({
  scenario,
  onScenarioChange,
  isDirty,
  isLoading,
}) => {
  const characterRelationships = useMemo(() => scenario.characterRelationships || {
    relationships: [],
    relationshipTypes: [],
    dynamics: [],
    conflicts: [],
    histories: [],
    groups: [],
    generalNotes: '',
  }, [scenario.characterRelationships]);

  const handleDynamicsChange = useCallback((dynamics: any[]) => {
    const updatedScenario = {
      ...scenario,
      characterRelationships: {
        ...characterRelationships,
        dynamics,
      },
    };
    onScenarioChange(updatedScenario);
  }, [scenario, onScenarioChange, characterRelationships]);

  return (
    <DynamicsManager
      dynamics={characterRelationships.dynamics}
      onDynamicsChange={handleDynamicsChange}
      characters={scenario.characters || []}
      readonly={isLoading}
    />
  );
};

// Conflicts manager wrapper component
const ConflictsManagerWrapper: React.FC<TabProps> = ({
  scenario,
  onScenarioChange,
  isDirty,
  isLoading,
}) => {
  const characterRelationships = useMemo(() => scenario.characterRelationships || {
    relationships: [],
    relationshipTypes: [],
    dynamics: [],
    conflicts: [],
    histories: [],
    groups: [],
    generalNotes: '',
  }, [scenario.characterRelationships]);

  const handleConflictsChange = useCallback((conflicts: any[]) => {
    const updatedScenario = {
      ...scenario,
      characterRelationships: {
        ...characterRelationships,
        conflicts,
      },
    };
    onScenarioChange(updatedScenario);
  }, [scenario, onScenarioChange, characterRelationships]);

  return (
    <ConflictsManager
      conflicts={characterRelationships.conflicts}
      onConflictsChange={handleConflictsChange}
      characters={scenario.characters || []}
      readonly={isLoading}
    />
  );
};

// History manager wrapper component
const HistoryManagerWrapper: React.FC<TabProps> = ({
  scenario,
  onScenarioChange,
  isDirty,
  isLoading,
}) => {
  const characterRelationships = useMemo(() => scenario.characterRelationships || {
    relationships: [],
    relationshipTypes: [],
    dynamics: [],
    conflicts: [],
    histories: [],
    groups: [],
    generalNotes: '',
  }, [scenario.characterRelationships]);

  const handleHistoriesChange = useCallback((histories: any[]) => {
    const updatedScenario = {
      ...scenario,
      characterRelationships: {
        ...characterRelationships,
        histories,
      },
    };
    onScenarioChange(updatedScenario);
  }, [scenario, onScenarioChange, characterRelationships]);

  return (
    <HistoryManager
      histories={characterRelationships.histories}
      onHistoriesChange={handleHistoriesChange}
      characters={scenario.characters || []}
      readonly={isLoading}
    />
  );
};

// Groups manager wrapper component
const GroupsManagerWrapper: React.FC<TabProps> = ({
  scenario,
  onScenarioChange,
  isDirty,
  isLoading,
}) => {
  const characterRelationships = useMemo(() => scenario.characterRelationships || {
    relationships: [],
    relationshipTypes: [],
    dynamics: [],
    conflicts: [],
    histories: [],
    groups: [],
    generalNotes: '',
  }, [scenario.characterRelationships]);

  const handleGroupsChange = useCallback((groups: any[]) => {
    const updatedScenario = {
      ...scenario,
      characterRelationships: {
        ...characterRelationships,
        groups,
      },
    };
    onScenarioChange(updatedScenario);
  }, [scenario, onScenarioChange, characterRelationships]);

  return (
    <GroupsManager
      groups={characterRelationships.groups}
      onGroupsChange={handleGroupsChange}
      characters={scenario.characters || []}
      readonly={isLoading}
    />
  );
};

// Sub-tab configuration
const subTabs: Array<{
  id: RelationshipsSubTab;
  label: string;
  icon: React.ComponentType;
  component: React.ComponentType<TabProps>;
}> = [
  {
    id: 'relationships',
    label: 'Relationships',
    icon: FaUsers,
    component: RelationshipsManagerWrapper,
  },
  {
    id: 'dynamics',
    label: 'Dynamics',
    icon: FaProjectDiagram,
    component: DynamicsManagerWrapper,
  },
  {
    id: 'conflicts',
    label: 'Conflicts',
    icon: FaTrash,
    component: ConflictsManagerWrapper,
  },
  {
    id: 'history',
    label: 'History',
    icon: FaDice,
    component: HistoryManagerWrapper,
  },
  {
    id: 'groups',
    label: 'Groups',
    icon: FaCog,
    component: GroupsManagerWrapper,
  },
];

export const CharacterRelationshipsTab: React.FC<TabProps> = ({
  scenario,
  onScenarioChange,
  isDirty,
  isLoading,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<RelationshipsSubTab>('relationships');

  // Initialize characterRelationships if it doesn't exist
  const characterRelationships = useMemo(() => scenario.characterRelationships || {
    relationships: [],
    relationshipTypes: [],
    dynamics: [],
    conflicts: [],
    histories: [],
    groups: [],
    generalNotes: '',
  }, [scenario.characterRelationships]);

  // Get the active sub-tab component
  const activeSubTabConfig = subTabs.find(tab => tab.id === activeSubTab);
  const ActiveSubTabComponent = activeSubTabConfig?.component;

  // Count statistics for display
  const stats = {
    relationships: characterRelationships.relationships.length,
    dynamics: characterRelationships.dynamics.length,
    conflicts: characterRelationships.conflicts.length,
    histories: characterRelationships.histories.length,
    groups: characterRelationships.groups.length,
    activeRelationships: characterRelationships.relationships.filter((rel: any) => rel.status === 'active').length,
    conflictedRelationships: characterRelationships.relationships.filter((rel: any) => rel.status === 'strained').length,
  };

  return (
    <div className="character-relationships-tab">
      <div className="character-relationships-tab__header">
        <h2>Character Relationships</h2>
        <p>Map and develop the complex web of relationships that drive your story's interpersonal dynamics and conflicts.</p>
      </div>

      {/* Sub-tabs navigation */}
      <div className="character-relationships-tab__sub-tabs">
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
      <div className="character-relationships-tab__content">
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
      <div className="character-relationships-tab__stats">
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">Relationships:</span>
            <span className="stat-value">{stats.relationships}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Dynamics:</span>
            <span className="stat-value">{stats.dynamics}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Conflicts:</span>
            <span className="stat-value">{stats.conflicts}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">History:</span>
            <span className="stat-value">{stats.histories}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Groups:</span>
            <span className="stat-value">{stats.groups}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Active:</span>
            <span className="stat-value">{stats.activeRelationships}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Strained:</span>
            <span className="stat-value">{stats.conflictedRelationships}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
