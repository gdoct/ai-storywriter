import React, { useEffect, useRef, useState } from 'react';

interface DbStory {
  id: number;
  text: string;
  created_at: string;
}

interface SavedStoriesDropdownProps {
  dbStories: DbStory[];
  selectedDbStoryId: number | null;
  loadingVersions: boolean;
  isStoryDropdownDisabled: boolean;
  onStorySelect: (storyId: number | null) => void;
  onDeleteStory: (storyId: number) => void;
  formatDate: (dateString: string) => string;
  openTabs: { dbStoryId: number | null; scenarioId: string }[]; // List of open tabs with their dbStoryId
  currentScenarioId?: string;
}

const SavedStoriesDropdown: React.FC<SavedStoriesDropdownProps> = ({
  dbStories,
  selectedDbStoryId,
  loadingVersions,
  isStoryDropdownDisabled,
  onStorySelect,
  onDeleteStory,
  formatDate,
  openTabs,
  currentScenarioId,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Check if a story has an open tab
  const isStoryTabOpen = (storyId: number): boolean => {
    return openTabs.some(tab => 
      tab.dbStoryId === storyId && 
      (!currentScenarioId || tab.scenarioId === currentScenarioId)
    );
  };

  const getDropdownLabel = () => {
    if (loadingVersions) return 'Loading stories...';
    if (dbStories.length === 0) return 'No saved stories';
    if (selectedDbStoryId) {
      const selected = dbStories.find(s => s.id === selectedDbStoryId);
      return selected ? formatDate(selected.created_at) : 'Select story...';
    }
    return 'Select story...';
  };

  const handleStoryToggle = (storyId: number) => {
    // Always trigger story selection to open/focus the tab
    onStorySelect(storyId);
  };

  return (
    <div className="control-group saved-stories-dropdown">
      <label>Saved Stories:</label>
      <div className="saved-stories-dropdown-container" ref={dropdownRef}>
        <button
          className={`saved-stories-dropdown-toggle ${isOpen ? 'open' : ''}`}
          onClick={() => !isStoryDropdownDisabled && setIsOpen(!isOpen)}
          disabled={isStoryDropdownDisabled}
          type="button"
        >
          <span className="dropdown-label">{getDropdownLabel()}</span>
          <span className={`dropdown-arrow ${isOpen ? 'up' : 'down'}`}>
            {isOpen ? '▲' : '▼'}
          </span>
        </button>
        
        {isOpen && !loadingVersions && dbStories.length > 0 && (
          <div className="saved-stories-dropdown-menu">
            {dbStories.map(story => {
              const isTabOpen = isStoryTabOpen(story.id);
              const isSelected = selectedDbStoryId === story.id;
              
              return (
                <div key={story.id} className={`saved-story-item ${isTabOpen ? 'has-open-tab' : ''}`}>
                  <label className="saved-story-checkbox-label">
                    <input
                      type="checkbox"
                      checked={isTabOpen}
                      onChange={() => handleStoryToggle(story.id)}
                      disabled={isStoryDropdownDisabled}
                      className="saved-story-checkbox"
                    />
                    <span className={`story-date-text ${isSelected ? 'selected' : ''}`}>
                      {formatDate(story.created_at)}
                    </span>
                    {isTabOpen && <span className="tab-open-indicator">📄</span>}
                  </label>
                  <button
                    className="delete-story-btn"
                    title="Delete story"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteStory(story.id);
                    }}
                    disabled={isStoryDropdownDisabled}
                    type="button"
                  >
                    🗑️
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedStoriesDropdown;
