import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FaPlus, FaTimes } from 'react-icons/fa';
import { TabConfig, TabId } from '../types';
import { renderIcon } from './IconUtils';
import './Tabs.css';

export interface TabsProps {
  tabs: TabConfig[];
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
  className?: string;
  // Optional tabs functionality
  visibleTabs?: TabId[];
  onTabAdd?: (tabId: TabId) => void;
  onTabRemove?: (tabId: TabId) => void;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = '',
  visibleTabs,
  onTabAdd,
  onTabRemove,
}) => {
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);

  // Toggle dropdown with position calculation
  const toggleAddDropdown = useCallback(() => {
    if (!showAddDropdown && addButtonRef.current) {
      const buttonRect = addButtonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: buttonRect.bottom + 8, // 8px margin
        left: buttonRect.left
      });
    }
    setShowAddDropdown(prev => !prev);
  }, [showAddDropdown]);

  // Close dropdown
  const closeDropdown = useCallback(() => {
    setShowAddDropdown(false);
  }, []);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        closeDropdown();
      }
    };

    if (showAddDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showAddDropdown, closeDropdown]);

  // If visibleTabs is provided, filter tabs to only show visible ones
  const displayTabs = visibleTabs 
    ? tabs.filter(tab => visibleTabs.includes(tab.id))
    : tabs;

  // Get available tabs that can be added (not currently visible)
  const availableTabs = visibleTabs && onTabAdd
    ? tabs.filter(tab => !visibleTabs.includes(tab.id) && tab.optional !== false)
    : [];

  const handleTabRemove = (tabId: TabId, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onTabRemove) {
      onTabRemove(tabId);
    }
  };

  const handleAddDropdownToggle = () => {
    toggleAddDropdown();
  };

  const handleAddTab = (tabId: TabId) => {
    if (onTabAdd) {
      onTabAdd(tabId);
    }
    closeDropdown();
  };

  return (
    <div className={`tabs ${className}`}>
      <div className="tabs__nav">
        {displayTabs.map((tab) => {
          const canRemove = tab.id !== 'general' && onTabRemove; // General tab cannot be removed
          
          return (
            <div key={tab.id} className="tabs__tab-container">
              <button
                data-testid={`${tab.id}-tab`}
                className={`tabs__tab tabs__${tab.id} ${
                  activeTab === tab.id ? 'tabs__tab--active' : ''
                }`}
                onClick={() => onTabChange(tab.id)}
                type="button"
              >
                {renderIcon(tab.icon)}
                <span className="tabs__tab-label">{tab.label}</span>
                {canRemove && (
                  <button
                    className="tabs__tab-close"
                    onClick={(e) => handleTabRemove(tab.id, e)}
                    title={`Close ${tab.label} tab`}
                    type="button"
                  >
                    <FaTimes />
                  </button>
                )}
              </button>
            </div>
          );
        })}
        
        {/* Add Tab Button */}
        {availableTabs.length > 0 && (
          <div className="tabs__add-container">
            <button
              ref={addButtonRef}
              className="tabs__add-button"
              onClick={handleAddDropdownToggle}
              title="Add tab"
              type="button"
            >
              <FaPlus />
            </button>
          </div>
        )}
      </div>
      
      {/* Add Tab Dropdown Portal */}
      {showAddDropdown && availableTabs.length > 0 && createPortal(
        <div 
          className="tabs__add-dropdown"
          style={{
            position: 'fixed',
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            zIndex: 9999
          }}
          ref={dropdownRef}
        >
          <div className="tabs__add-dropdown-content">
            <div className="tabs__add-dropdown-header">Add Tab</div>
            {availableTabs.map((tab) => (
              <button
                key={tab.id}
                className="tabs__add-dropdown-item"
                onClick={() => handleAddTab(tab.id)}
                type="button"
              >
                {renderIcon(tab.icon)}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
