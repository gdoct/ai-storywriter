import React from 'react';
import { FaBook, FaCog, FaDice, FaPlus, FaUser, FaUsers } from 'react-icons/fa';
import { WorldBuilding } from '../../../../../types/ScenarioTypes';
import { WorldBuildingSubTab } from '../WorldBuildingTab';
import './WorldBuildingSubTabs.css';

interface WorldBuildingSubTabsProps {
  activeTab: WorldBuildingSubTab;
  onTabChange: (tab: WorldBuildingSubTab) => void;
  worldBuilding: WorldBuilding;
}

interface SubTabConfig {
  id: WorldBuildingSubTab;
  label: string;
  icon: React.ReactNode;
  getCount: (wb: WorldBuilding) => number;
}

const subTabConfigs: SubTabConfig[] = [
  {
    id: 'locations',
    label: 'Locations',
    icon: <FaUser />,
    getCount: (wb) => wb.locations?.length || 0,
  },
  {
    id: 'cultures',
    label: 'Cultures',
    icon: <FaUsers />,
    getCount: (wb) => wb.cultures?.length || 0,
  },
  {
    id: 'magic',
    label: 'Magic Systems',
    icon: <FaDice />,
    getCount: (wb) => wb.magicSystems?.length || 0,
  },
  {
    id: 'tech',
    label: 'Technology',
    icon: <FaCog />,
    getCount: (wb) => wb.technologies?.length || 0,
  },
  {
    id: 'religions',
    label: 'Religions',
    icon: <FaBook />,
    getCount: (wb) => wb.religions?.length || 0,
  },
  {
    id: 'organizations',
    label: 'Organizations',
    icon: <FaPlus />,
    getCount: (wb) => wb.organizations?.length || 0,
  },
];

export const WorldBuildingSubTabs: React.FC<WorldBuildingSubTabsProps> = ({
  activeTab,
  onTabChange,
  worldBuilding,
}) => {
  return (
    <div className="world-building-sub-tabs">
      {subTabConfigs.map((config) => {
        const count = config.getCount(worldBuilding);
        const isActive = activeTab === config.id;
        
        return (
          <button
            key={config.id}
            className={`world-building-sub-tab ${isActive ? 'active' : ''}`}
            onClick={() => onTabChange(config.id)}
          >
            <div className="world-building-sub-tab__icon">
              {config.icon}
            </div>
            <div className="world-building-sub-tab__content">
              <span className="world-building-sub-tab__label">
                {config.label}
              </span>
              {count > 0 && (
                <span className="world-building-sub-tab__count">
                  ({count})
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};
