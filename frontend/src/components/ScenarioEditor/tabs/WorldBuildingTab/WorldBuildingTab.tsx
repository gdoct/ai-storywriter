import { AiTextArea, Button } from '@drdata/docomo';
import React, { useCallback, useMemo, useState } from 'react';
import { FaDownload } from 'react-icons/fa';
import { v4 as uuidv4 } from 'uuid';
import { WorldBuilding } from '../../../../types/ScenarioTypes';
import ImportModal from '../../../common/ImportModal';
import { TabProps } from '../../types';
import {
    CultureManager,
    LocationManager,
    MagicSystemManager,
    OrganizationManager,
    ReligionManager,
    TechnologyManager,
    WorldBuildingSubTabs
} from './components';
import './WorldBuildingTab.css';

export type WorldBuildingSubTab = 'locations' | 'cultures' | 'magic' | 'tech' | 'religions' | 'organizations';

export const WorldBuildingTab: React.FC<TabProps> = ({
  scenario,
  onScenarioChange,
  isDirty,
  isLoading,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<WorldBuildingSubTab>('locations');
  const [showImportModal, setShowImportModal] = useState(false);
  
  // Initialize world building data if it doesn't exist
  const worldBuilding = useMemo(() => {
    if (!scenario.worldBuilding) {
      return {
        locations: [],
        cultures: [],
        magicSystems: [],
        technologies: [],
        religions: [],
        organizations: [],
        generalNotes: '',
      };
    }
    return scenario.worldBuilding;
  }, [scenario.worldBuilding]);

  const updateWorldBuilding = useCallback((updates: Partial<WorldBuilding>) => {
    const updatedWorldBuilding = { ...worldBuilding, ...updates };
    onScenarioChange({ worldBuilding: updatedWorldBuilding });
  }, [worldBuilding, onScenarioChange]);

  const handleGeneralNotesChange = useCallback((value: string) => {
    updateWorldBuilding({ generalNotes: value });
  }, [updateWorldBuilding]);

  const handleImport = useCallback((importedWorldBuilding: WorldBuilding) => {
    // Merge with existing world building data, ensuring unique IDs
    const mergeWithUniqueIds = <T extends { id: string }>(existing: T[], imported: T[]): T[] => {
      const existingIds = new Set(existing.map(item => item.id));
      const newItems = imported.map(item => ({
        ...item,
        id: existingIds.has(item.id) ? uuidv4() : item.id
      }));
      return [...existing, ...newItems];
    };

    const mergedWorldBuilding: WorldBuilding = {
      locations: mergeWithUniqueIds(worldBuilding.locations, importedWorldBuilding.locations || []),
      cultures: mergeWithUniqueIds(worldBuilding.cultures, importedWorldBuilding.cultures || []),
      magicSystems: mergeWithUniqueIds(worldBuilding.magicSystems, importedWorldBuilding.magicSystems || []),
      technologies: mergeWithUniqueIds(worldBuilding.technologies, importedWorldBuilding.technologies || []),
      religions: mergeWithUniqueIds(worldBuilding.religions, importedWorldBuilding.religions || []),
      organizations: mergeWithUniqueIds(worldBuilding.organizations, importedWorldBuilding.organizations || []),
      generalNotes: worldBuilding.generalNotes + (importedWorldBuilding.generalNotes ? '\n\n' + importedWorldBuilding.generalNotes : ''),
    };

    onScenarioChange({ worldBuilding: mergedWorldBuilding });
  }, [worldBuilding, onScenarioChange]);

  // Render the appropriate sub-component based on active sub-tab
  const renderSubTabContent = () => {
    switch (activeSubTab) {
      case 'locations':
        return (
          <LocationManager
            locations={worldBuilding.locations}
            onLocationsChange={(locations) => updateWorldBuilding({ locations })}
            scenario={scenario}
            isLoading={isLoading}
          />
        );
      case 'cultures':
        return (
          <CultureManager
            cultures={worldBuilding.cultures}
            onCulturesChange={(cultures) => updateWorldBuilding({ cultures })}
            scenario={scenario}
            isLoading={isLoading}
          />
        );
      case 'magic':
        return (
          <MagicSystemManager
            magicSystems={worldBuilding.magicSystems}
            onMagicSystemsChange={(magicSystems) => updateWorldBuilding({ magicSystems })}
            scenario={scenario}
            isLoading={isLoading}
          />
        );
      case 'tech':
        return (
          <TechnologyManager
            technologies={worldBuilding.technologies}
            onTechnologiesChange={(technologies) => updateWorldBuilding({ technologies })}
            scenario={scenario}
            isLoading={isLoading}
          />
        );
      case 'religions':
        return (
          <ReligionManager
            religions={worldBuilding.religions}
            onReligionsChange={(religions) => updateWorldBuilding({ religions })}
            scenario={scenario}
            isLoading={isLoading}
          />
        );
      case 'organizations':
        return (
          <OrganizationManager
            organizations={worldBuilding.organizations}
            onOrganizationsChange={(organizations) => updateWorldBuilding({ organizations })}
            scenario={scenario}
            isLoading={isLoading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="world-building-tab">
      <div className="world-building-tab__header">
        <h3 className="world-building-tab__title">World Building</h3>
        <div className="world-building-tab__actions">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowImportModal(true)}
            icon={<FaDownload />}
          >
            Import
          </Button>
        </div>
      </div>

      <div className="world-building-tab__content">
        <WorldBuildingSubTabs
          activeTab={activeSubTab}
          onTabChange={setActiveSubTab}
          worldBuilding={worldBuilding}
        />

        <div className="world-building-tab__sub-content">
          {renderSubTabContent()}
        </div>

        <div className="world-building-tab__general-notes">
          <AiTextArea
            label="General World Building Notes"
            value={worldBuilding.generalNotes}
            onChange={handleGeneralNotesChange}
            placeholder="Overall notes about your world, connections between elements, important details..."
            rows={4}
            disabled={isLoading}
          />
        </div>
      </div>

      {showImportModal && (
        <ImportModal
          show={showImportModal}
          onClose={() => setShowImportModal(false)}
          title="Import World Building"
          onImport={handleImport}
          extractContent={(scenario) => scenario.worldBuilding || {
            locations: [],
            cultures: [],
            magicSystems: [],
            technologies: [],
            religions: [],
            organizations: [],
            generalNotes: '',
          }}
          renderCheckboxes={false}
          itemType="worldBuilding"
        />
      )}
    </div>
  );
};
export default WorldBuildingTab;