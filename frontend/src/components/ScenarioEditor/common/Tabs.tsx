import React from 'react';
import { TabConfig, TabId } from '../types';
import { renderIcon } from './IconUtils';
import './Tabs.css';

export interface TabsProps {
  tabs: TabConfig[];
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = '',
}) => {
  return (
    <div className={`tabs ${className}`}>
      <div className="tabs__nav">
        {tabs.map((tab) => {
          return (
            <button
              key={tab.id}
              className={`tabs__tab ${
                activeTab === tab.id ? 'tabs__tab--active' : ''
              }`}
              onClick={() => onTabChange(tab.id)}
              type="button"
            >
              {renderIcon(tab.icon)}
              <span className="tabs__tab-label">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
