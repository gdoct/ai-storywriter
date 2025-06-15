import React, { useCallback, useEffect, useState } from 'react';
import { fetchAllScenarios, fetchScenarioById } from '../../services/scenario';
import './ImportModal.css';
import Modal from './Modal';

interface ImportModalProps {
  show: boolean;
  onClose: () => void;
  title: string;
  onImport: (content: any) => void;
  extractContent: (scenario: any) => any;
  renderCheckboxes?: boolean;
  getCheckboxItems?: (scenario: any) => Array<any>;
  itemType?: string; // Specify the type of item being imported (e.g., "characters", "scenes")
  renderItemLabel?: (item: any) => React.ReactNode; // Custom renderer for item labels
}

const ImportModal: React.FC<ImportModalProps> = ({ 
  show, 
  onClose, 
  title,
  onImport,
  extractContent,
  renderCheckboxes = false,
  getCheckboxItems = () => [],
  itemType = "items", // Default to generic "items" if not specified
  renderItemLabel = (item) => item.name || `Item ${item.id}` // Default renderer
}) => {
  const [scenarios, setScenarios] = useState<Array<{id: string, title: string}>>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [scenarioContent, setScenarioContent] = useState<any>(null);
  const [selectedItems, setSelectedItems] = useState<{[key: string]: boolean}>({});

  // Fetch scenario content function
  const fetchScenarioContent = useCallback(async (scenarioId: string) => {
    if (!scenarioId) return;
    
    try {
      setLoading(true);
      const scenario = await fetchScenarioById(scenarioId);
      setScenarioContent(scenario);
    } catch (error) {
      console.error('Failed to fetch scenario content:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize selected items when scenario content changes
  useEffect(() => {
    if (scenarioContent && renderCheckboxes) {
      const items = getCheckboxItems(scenarioContent);
      const initialSelectedState: {[key: string]: boolean} = {};
      items.forEach(item => {
        initialSelectedState[item.id] = true; // Default all to checked
      });
      setSelectedItems(initialSelectedState);
    } else if (!renderCheckboxes) {
      // Clear selected items for non-checkbox mode
      setSelectedItems({});
    }
  }, [scenarioContent, renderCheckboxes]); // Added getCheckboxItems back to dependencies since we're using it directly

  // Reset state when modal opens/closes
  useEffect(() => {
    if (show) {
      fetchScenarios();
      // Reset selection when modal opens
      setSelectedScenarioId('');
      setScenarioContent(null);
      setSelectedItems({});
    }
  }, [show]);

  // Fetch content whenever the selected scenario changes
  useEffect(() => {
    if (selectedScenarioId && show) {
      fetchScenarioContent(selectedScenarioId);
    } else {
      // Clear content when no scenario is selected
      setScenarioContent(null);
      setSelectedItems({});
    }
  }, [selectedScenarioId, show, fetchScenarioContent]);

  const fetchScenarios = async () => {
    try {
      const data = await fetchAllScenarios();
      setScenarios(data);
    } catch (error) {
      console.error('Failed to fetch scenarios:', error);
    }
  };

  // Helper function to truncate text for previews
  const truncateText = (text: string, wordCount: number = 8): string => {
    if (!text) return '';
    const words = text.trim().split(/\s+/);
    if (words.length <= wordCount) return text;
    return words.slice(0, wordCount).join(' ') + '...';
  };

  // Memoize the expensive operations with getCheckboxItems function
  const getCheckboxItemsMemoized = useCallback((scenario: any) => {
    if (!getCheckboxItems || !scenario) return [];
    return getCheckboxItems(scenario);
  }, [getCheckboxItems]);

  const handleImport = () => {
    if (!scenarioContent) return;
    
    try {
      let contentToImport;
      if (renderCheckboxes) {
        // Filter items based on checkbox selection
        const allItems = getCheckboxItemsMemoized(scenarioContent);
        const selectedItemsList = allItems.filter(item => selectedItems[item.id]);
        contentToImport = selectedItemsList;
      } else {
        // Extract the content using the provided function
        contentToImport = extractContent(scenarioContent);
      }
      
      onImport(contentToImport);
      onClose();
    } catch (error) {
      console.error('Error during import:', error);
    }
  };

  const handleCheckboxChange = (id: string) => {
    setSelectedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const renderItemCheckboxes = useCallback(() => {
    if (!renderCheckboxes || !scenarioContent) return null;
    
    const items = getCheckboxItemsMemoized(scenarioContent);
    
    return (
      <div className="checkbox-list">
        <h4>Select {itemType} to import:</h4>
        {items.length === 0 ? (
          <p>No {itemType} available to import.</p>
        ) : (
          items.map(item => (
            <div key={item.id} className="checkbox-item">
              <input
                type="checkbox"
                id={`item-${item.id}`}
                checked={!!selectedItems[item.id]}
                onChange={() => handleCheckboxChange(item.id)}
              />
              <label htmlFor={`item-${item.id}`}>{renderItemLabel(item)}</label>
            </div>
          ))
        )}
      </div>
    );
  }, [renderCheckboxes, scenarioContent, getCheckboxItemsMemoized, itemType, selectedItems, renderItemLabel]);

  return (
    <Modal 
      show={show} 
      onClose={onClose} 
      title={title}
      footer={
        <>
          <button onClick={onClose}>Cancel</button>
          <button 
            onClick={handleImport} 
            disabled={!selectedScenarioId || loading}
          >
            Import
          </button>
        </>
      }
    >
      <div className="import-modal-content">
        <div className="scenario-select-container">
          <label>Select a story to import from:</label>
          <select
            value={selectedScenarioId}
            onChange={(e) => setSelectedScenarioId(e.target.value)}
            disabled={loading}
          >
            <option value="">-- Select a story --</option>
            {scenarios.map(scenario => (
              <option key={scenario.id} value={scenario.id}>
                {scenario.title}
              </option>
            ))}
          </select>
        </div>
        
        {loading && <p className="loading-indicator"><span className="spinner"></span> Loading content...</p>}
        
        {selectedScenarioId && scenarioContent && renderCheckboxes && renderItemCheckboxes()}
        
        {/* Content preview for non-checkbox imports */}
        {selectedScenarioId && scenarioContent && !renderCheckboxes && (
          <div className="content-preview">
            <h4>Content Preview:</h4>
            <div className="preview-text">
              {(() => {
                const content = extractContent(scenarioContent);
                if (typeof content === 'string') {
                  return truncateText(content, 8);
                } else if (title.includes("Style") && content && typeof content === 'object') {
                  // Handle StyleSettings object
                  const styleContent = content as any;
                  const parts = [];
                  if (styleContent.style) parts.push(`Style: ${styleContent.style}`);
                  if (styleContent.genre) parts.push(`Genre: ${styleContent.genre}`);
                  if (styleContent.tone) parts.push(`Tone: ${styleContent.tone}`);
                  if (styleContent.language) parts.push(`Language: ${styleContent.language}`);
                  if (styleContent.theme) parts.push(`Theme: ${styleContent.theme}`);
                  return parts.length > 0 ? parts.join(', ') : 'No style settings found';
                } else {
                  return JSON.stringify(content).substring(0, 100) + '...';
                }
              })()}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ImportModal;
