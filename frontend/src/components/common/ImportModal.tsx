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
  const fetchScenarioContent = useCallback(async () => {
    if (!selectedScenarioId || !show) return;
    
    try {
      setLoading(true);
      const scenario = await fetchScenarioById(selectedScenarioId);
      setScenarioContent(scenario);
      
      // Initialize checkboxes for items if needed
      if (renderCheckboxes && getCheckboxItems) {
        const items = getCheckboxItems(scenario);
        const initialSelectedState: {[key: string]: boolean} = {};
        items.forEach(item => {
          initialSelectedState[item.id] = true; // Default all to checked
        });
        setSelectedItems(initialSelectedState);
      }
    } catch (error) {
      console.error('Failed to fetch scenario content:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedScenarioId, renderCheckboxes, getCheckboxItems, show]);

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

  // Only fetch content when a scenario is selected and not already loading
  useEffect(() => {
    let isMounted = true;
    
    const loadScenarioIfNeeded = async () => {
      if (show && selectedScenarioId && !loading && !scenarioContent) {
        await fetchScenarioContent();
      }
    };
    
    loadScenarioIfNeeded();
    
    return () => {
      isMounted = false;
    };
  }, [selectedScenarioId, show, loading, scenarioContent, fetchScenarioContent]);

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

  const handleImport = () => {
    if (!scenarioContent) return;
    
    try {
      let contentToImport;
      if (renderCheckboxes && getCheckboxItems) {
        // Filter items based on checkbox selection
        const allItems = getCheckboxItems(scenarioContent);
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

  const renderItemCheckboxes = () => {
    if (!renderCheckboxes || !scenarioContent || !getCheckboxItems) return null;
    
    const items = getCheckboxItems(scenarioContent);
    
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
  };

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
              {typeof extractContent(scenarioContent) === 'string' ? 
                truncateText(extractContent(scenarioContent), 8) : 
                (title.includes("Style") ? 
                  renderItemLabel(extractContent(scenarioContent)) : 
                  JSON.stringify(extractContent(scenarioContent)).substring(0, 50) + '...')}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ImportModal;
