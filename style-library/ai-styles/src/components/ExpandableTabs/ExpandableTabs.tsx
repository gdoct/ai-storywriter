import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FaPlus, FaTimes } from 'react-icons/fa';
import { useTheme } from '../../providers/ThemeProvider';
import './ExpandableTabs.css';

export interface TabConfig {
  id: string;
  label: string;
  icon: any;
  optional?: boolean;
}

export interface ExpandableTabsProps {
  tabs: TabConfig[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
  visibleTabs?: string[];
  onTabAdd?: (tabId: string) => void;
  onTabRemove?: (tabId: string) => void;
}

export const ExpandableTabs: React.FC<ExpandableTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = '',
  visibleTabs,
  onTabAdd,
  onTabRemove,
}) => {
  const { resolvedTheme: theme } = useTheme();
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

  const handleTabRemove = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onTabRemove) {
      onTabRemove(tabId);
    }
  };

  const handleAddDropdownToggle = () => {
    toggleAddDropdown();
  };

  const handleAddTab = (tabId: string) => {
    if (onTabAdd) {
      onTabAdd(tabId);
    }
    closeDropdown();
  };

  const renderIcon = (iconComponent: any) => {
    return React.createElement(iconComponent);
  };

  return (
    <div className={`ai-expandable-tabs ai-expandable-tabs--${theme} ${className}`.trim()}>
      <div className="ai-expandable-tabs__tablist">
        {displayTabs.map((tab) => {
          const canRemove = tab.id !== 'general' && onTabRemove; // General tab cannot be removed
          
          return (
            <div key={tab.id} className="ai-expandable-tabs__tab-container">
              <button
                data-testid={`${tab.id}-tab`}
                className={`ai-expandable-tabs__tab ai-expandable-tabs__${tab.id} ${
                  activeTab === tab.id ? 'ai-expandable-tabs__tab--active' : ''
                }`}
                onClick={() => onTabChange(tab.id)}
                type="button"
              >
                {renderIcon(tab.icon)}
                <span className="ai-expandable-tabs__tab-label">{tab.label}</span>
                {canRemove && (
                  <span
                    className="ai-expandable-tabs__tab-close"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTabRemove(tab.id, e);
                    }}
                    title={`Close ${tab.label} tab`}
                    role="button"
                    style={{ marginLeft: 'var(--spacing-xs)', cursor: 'pointer' }}
                  >
                    <FaTimes />
                  </span>
                )}
              </button>
            </div>
          );
        })}
        
        {/* Add Tab Button */}
        {availableTabs.length > 0 && (
          <div className="ai-expandable-tabs__add-tab">
            <button
              ref={addButtonRef}
              className="ai-expandable-tabs__add-tab-btn"
              onClick={handleAddDropdownToggle}
              title="Add tab"
              type="button"
            >
              <FaPlus />
            </button>
          </div>
        )}
      </div>

      {/* Add Tab Dropdown */}
      {showAddDropdown && availableTabs.length > 0 && createPortal(
        <div
          ref={dropdownRef}
          className="ai-expandable-tabs__dropdown"
          style={{
            position: 'fixed',
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            background: theme === 'dark' ? '#333333' : '#ffffff',
            border: `1px solid ${theme === 'dark' ? '#555555' : '#e0e0e0'}`,
            borderRadius: '0.5rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            minWidth: '200px',
          }}
        >
          {availableTabs.map((tab) => (
            <button
              key={tab.id}
              className="ai-expandable-tabs__dropdown-item"
              onClick={() => handleAddTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                width: '100%',
                padding: '0.5rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: theme === 'dark' ? '#ffffff' : '#000000',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme === 'dark' ? '#444444' : '#f0f0f0';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {renderIcon(tab.icon)}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
};
