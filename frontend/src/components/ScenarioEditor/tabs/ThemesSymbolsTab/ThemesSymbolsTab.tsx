import React, { useCallback, useMemo, useState } from 'react';
import { FaBook, FaDice, FaEye, FaStickyNote, FaUser, FaUsers } from 'react-icons/fa';
import { renderIcon } from '../../common/IconUtils';
import { TabProps } from '../../types';
import ArchetypesManager from './components/ArchetypesManager';
import LiteraryDevicesManager from './components/LiteraryDevicesManager';
import MetaphorsManager from './components/MetaphorsManager';
import MotifsManager from './components/MotifsManager';
import SymbolsManager from './components/SymbolsManager';
import ThemesManager from './components/ThemesManager';
import './ThemesSymbolsTab.css';

// Sub-tab type
export type ThemesSymbolsSubTab = 'themes' | 'symbols' | 'motifs' | 'metaphors' | 'archetypes' | 'devices';

// Theme manager wrapper component
const ThemesManagerWrapper: React.FC<TabProps> = ({
  scenario,
  onScenarioChange,
  isDirty,
  isLoading,
}) => {
  const themesAndSymbols = useMemo(() => scenario.themesAndSymbols || {
    themes: [],
    symbols: [],
    motifs: [],
    metaphors: [],
    archetypes: [],
    literaryDevices: [],
    generalNotes: '',
  }, [scenario.themesAndSymbols]);

  const handleThemesChange = useCallback((themes: any[]) => {
    const updatedScenario = {
      ...scenario,
      themesAndSymbols: {
        ...themesAndSymbols,
        themes,
      },
    };
    onScenarioChange(updatedScenario);
  }, [scenario, onScenarioChange, themesAndSymbols]);

  return (
    <ThemesManager
      themes={themesAndSymbols.themes}
      onThemesChange={handleThemesChange}
      readonly={isLoading}
    />
  );
};

// Symbol manager wrapper component
const SymbolsManagerWrapper: React.FC<TabProps> = ({
  scenario,
  onScenarioChange,
  isDirty,
  isLoading,
}) => {
  const themesAndSymbols = useMemo(() => scenario.themesAndSymbols || {
    themes: [],
    symbols: [],
    motifs: [],
    metaphors: [],
    archetypes: [],
    literaryDevices: [],
    generalNotes: '',
  }, [scenario.themesAndSymbols]);

  const handleSymbolsChange = useCallback((symbols: any[]) => {
    const updatedScenario = {
      ...scenario,
      themesAndSymbols: {
        ...themesAndSymbols,
        symbols,
      },
    };
    onScenarioChange(updatedScenario);
  }, [scenario, onScenarioChange, themesAndSymbols]);

  return (
    <SymbolsManager
      symbols={themesAndSymbols.symbols}
      onSymbolsChange={handleSymbolsChange}
      readonly={isLoading}
    />
  );
};

// Motifs manager wrapper component
const MotifsManagerWrapper: React.FC<TabProps> = ({
  scenario,
  onScenarioChange,
  isDirty,
  isLoading,
}) => {
  const themesAndSymbols = useMemo(() => scenario.themesAndSymbols || {
    themes: [],
    symbols: [],
    motifs: [],
    metaphors: [],
    archetypes: [],
    literaryDevices: [],
    generalNotes: '',
  }, [scenario.themesAndSymbols]);

  const handleMotifsChange = useCallback((motifs: any[]) => {
    const updatedScenario = {
      ...scenario,
      themesAndSymbols: {
        ...themesAndSymbols,
        motifs,
      },
    };
    onScenarioChange(updatedScenario);
  }, [scenario, onScenarioChange, themesAndSymbols]);

  return (
    <MotifsManager
      motifs={themesAndSymbols.motifs}
      onMotifsChange={handleMotifsChange}
      readonly={isLoading}
    />
  );
};

// Metaphors manager wrapper component
const MetaphorsManagerWrapper: React.FC<TabProps> = ({
  scenario,
  onScenarioChange,
  isDirty,
  isLoading,
}) => {
  const themesAndSymbols = useMemo(() => scenario.themesAndSymbols || {
    themes: [],
    symbols: [],
    motifs: [],
    metaphors: [],
    archetypes: [],
    literaryDevices: [],
    generalNotes: '',
  }, [scenario.themesAndSymbols]);

  const handleMetaphorsChange = useCallback((metaphors: any[]) => {
    const updatedScenario = {
      ...scenario,
      themesAndSymbols: {
        ...themesAndSymbols,
        metaphors,
      },
    };
    onScenarioChange(updatedScenario);
  }, [scenario, onScenarioChange, themesAndSymbols]);

  return (
    <MetaphorsManager
      metaphors={themesAndSymbols.metaphors}
      onMetaphorsChange={handleMetaphorsChange}
      readonly={isLoading}
    />
  );
};

// Archetypes manager wrapper component
const ArchetypesManagerWrapper: React.FC<TabProps> = ({
  scenario,
  onScenarioChange,
  isDirty,
  isLoading,
}) => {
  const themesAndSymbols = useMemo(() => scenario.themesAndSymbols || {
    themes: [],
    symbols: [],
    motifs: [],
    metaphors: [],
    archetypes: [],
    literaryDevices: [],
    generalNotes: '',
  }, [scenario.themesAndSymbols]);

  const handleArchetypesChange = useCallback((archetypes: any[]) => {
    const updatedScenario = {
      ...scenario,
      themesAndSymbols: {
        ...themesAndSymbols,
        archetypes,
      },
    };
    onScenarioChange(updatedScenario);
  }, [scenario, onScenarioChange, themesAndSymbols]);

  return (
    <ArchetypesManager
      archetypes={themesAndSymbols.archetypes}
      onArchetypesChange={handleArchetypesChange}
      readonly={isLoading}
    />
  );
};

// Literary devices manager wrapper component
const LiteraryDevicesManagerWrapper: React.FC<TabProps> = ({
  scenario,
  onScenarioChange,
  isDirty,
  isLoading,
}) => {
  const themesAndSymbols = useMemo(() => scenario.themesAndSymbols || {
    themes: [],
    symbols: [],
    motifs: [],
    metaphors: [],
    archetypes: [],
    literaryDevices: [],
    generalNotes: '',
  }, [scenario.themesAndSymbols]);

  const handleDevicesChange = useCallback((devices: any[]) => {
    const updatedScenario = {
      ...scenario,
      themesAndSymbols: {
        ...themesAndSymbols,
        literaryDevices: devices,
      },
    };
    onScenarioChange(updatedScenario);
  }, [scenario, onScenarioChange, themesAndSymbols]);

  return (
    <LiteraryDevicesManager
      devices={themesAndSymbols.literaryDevices}
      onDevicesChange={handleDevicesChange}
      readonly={isLoading}
    />
  );
};

// Sub-tab configuration
const subTabs: Array<{
  id: ThemesSymbolsSubTab;
  label: string;
  icon: React.ComponentType;
  component: React.ComponentType<TabProps>;
}> = [
  {
    id: 'themes',
    label: 'Themes',
    icon: FaBook,
    component: ThemesManagerWrapper,
  },
  {
    id: 'symbols',
    label: 'Symbols',
    icon: FaDice,
    component: SymbolsManagerWrapper,
  },
  {
    id: 'motifs',
    label: 'Motifs',
    icon: FaEye,
    component: MotifsManagerWrapper,
  },
  {
    id: 'metaphors',
    label: 'Metaphors',
    icon: FaStickyNote,
    component: MetaphorsManagerWrapper,
  },
  {
    id: 'archetypes',
    label: 'Archetypes',
    icon: FaUser,
    component: ArchetypesManagerWrapper,
  },
  {
    id: 'devices',
    label: 'Devices',
    icon: FaUsers,
    component: LiteraryDevicesManagerWrapper,
  },
];

export const ThemesSymbolsTab: React.FC<TabProps> = ({
  scenario,
  onScenarioChange,
  isDirty,
  isLoading,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<ThemesSymbolsSubTab>('themes');

  // Initialize themesAndSymbols if it doesn't exist
  const themesAndSymbols = useMemo(() => scenario.themesAndSymbols || {
    themes: [],
    symbols: [],
    motifs: [],
    metaphors: [],
    archetypes: [],
    literaryDevices: [],
    generalNotes: '',
  }, [scenario.themesAndSymbols]);

  // Get the active sub-tab component
  const activeSubTabConfig = subTabs.find(tab => tab.id === activeSubTab);
  const ActiveSubTabComponent = activeSubTabConfig?.component;

  // Count statistics for display
  const stats = {
    themes: themesAndSymbols.themes.length,
    symbols: themesAndSymbols.symbols.length,
    motifs: themesAndSymbols.motifs.length,
    metaphors: themesAndSymbols.metaphors.length,
    archetypes: themesAndSymbols.archetypes.length,
    devices: themesAndSymbols.literaryDevices.length,
    centralThemes: themesAndSymbols.themes.filter((theme: any) => theme.type === 'central').length,
    recurringSymbols: themesAndSymbols.symbols.filter((symbol: any) => symbol.frequency === 'recurring').length,
  };

  return (
    <div className="themes-symbols-tab">
      <div className="themes-symbols-tab__header">
        <h2>Themes & Symbols</h2>
        <p>Develop and track the deeper meaning that enriches your narrative with symbolic depth and thematic resonance.</p>
      </div>

      {/* Sub-tabs navigation */}
      <div className="themes-symbols-tab__sub-tabs">
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
      <div className="themes-symbols-tab__content">
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
      <div className="themes-symbols-tab__stats">
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">Themes:</span>
            <span className="stat-value">{stats.themes}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Symbols:</span>
            <span className="stat-value">{stats.symbols}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Motifs:</span>
            <span className="stat-value">{stats.motifs}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Metaphors:</span>
            <span className="stat-value">{stats.metaphors}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Archetypes:</span>
            <span className="stat-value">{stats.archetypes}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Devices:</span>
            <span className="stat-value">{stats.devices}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Central Themes:</span>
            <span className="stat-value">{stats.centralThemes}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Recurring Symbols:</span>
            <span className="stat-value">{stats.recurringSymbols}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
