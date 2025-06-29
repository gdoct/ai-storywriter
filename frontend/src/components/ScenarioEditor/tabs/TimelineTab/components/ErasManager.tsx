import React, { useCallback, useState } from 'react';
import { FaDice, FaPlus } from 'react-icons/fa';
import { Era } from '../../../../../types/ScenarioTypes';

interface ErasManagerProps {
  eras: Era[];
  onErasChange: (eras: Era[]) => void;
  onAddEra: () => void;
  scenarioContext?: {
    title?: string;
    genre?: string;
    theme?: string;
  };
}

export const ErasManager: React.FC<ErasManagerProps> = ({
  eras,
  onErasChange,
  onAddEra,
  scenarioContext,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGenerationMenu, setShowGenerationMenu] = useState(false);

  const handleGenerateEra = useCallback(async (type: 'transition' | 'golden' | 'dark') => {
    if (!scenarioContext) return;
    
    setIsGenerating(true);
    try {
      // Placeholder implementation - create a basic era
      const now = new Date().toISOString();
      const eraNames = {
        golden: 'The Golden Age',
        dark: 'The Dark Times', 
        transition: 'The Age of Change'
      };
      
      const newEra: Era = {
        id: `generated-era-${Date.now()}`,
        name: eraNames[type],
        description: `A ${type} era in the history of ${scenarioContext.title || 'the world'}. Edit this description to add specific details.`,
        startDate: { year: 0, displayFormat: 'Year 0', isApproximate: true },
        endDate: { year: 100, displayFormat: 'Year 100', isApproximate: true },
        characteristics: `This era was marked by significant ${type === 'golden' ? 'prosperity and advancement' : type === 'dark' ? 'conflict and upheaval' : 'change and transformation'}.`,
        keyEvents: [],
        technology: 'Technology level and innovations of this period.',
        culture: 'Cultural developments and characteristics.',
        politics: 'Political structure and changes.',
        conflicts: 'Major conflicts and resolutions.',
        tags: ['generated', type],
        createdAt: now,
        updatedAt: now,
      };
      
      const updatedEras = [...eras, newEra];
      onErasChange(updatedEras);
      setShowGenerationMenu(false);
    } catch (error) {
      console.error('Failed to generate era:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [eras, onErasChange, scenarioContext]);

  return (
    <div className="eras-manager">
      <div className="eras-manager__header">
        <h3>Historical Eras</h3>
        <div className="eras-controls">
          <button onClick={onAddEra} className="btn btn-primary">
            <FaPlus /> Add Era
          </button>
          
          {scenarioContext && (
            <div className="ai-generation-controls">
              <button 
                onClick={() => setShowGenerationMenu(!showGenerationMenu)}
                className={`btn btn-outline-primary ${showGenerationMenu ? 'active' : ''}`}
                disabled={isGenerating}
              >
                <FaDice /> {isGenerating ? 'Generating...' : 'AI Generate Era'}
              </button>
              
              {showGenerationMenu && (
                <div className="generation-menu">
                  <h6>Generate Era</h6>
                  <button 
                    onClick={() => handleGenerateEra('golden')}
                    className="btn btn-sm btn-outline-secondary"
                    disabled={isGenerating}
                  >
                    Golden Age
                  </button>
                  <button 
                    onClick={() => handleGenerateEra('dark')}
                    className="btn btn-sm btn-outline-secondary"
                    disabled={isGenerating}
                  >
                    Dark Period
                  </button>
                  <button 
                    onClick={() => handleGenerateEra('transition')}
                    className="btn btn-sm btn-outline-secondary"
                    disabled={isGenerating}
                  >
                    Transitional Era
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="eras-manager__content">
        {eras.length === 0 ? (
          <div className="empty-state">
            <p>No eras defined yet. Create your first historical era!</p>
            <button onClick={onAddEra} className="btn btn-primary">
              <FaPlus /> Add First Era
            </button>
          </div>
        ) : (
          <div className="eras-list">
            {eras.map(era => (
              <div key={era.id} className="era-card">
                <h4>{era.name}</h4>
                <p>Start: {era.startDate.displayFormat}</p>
                {era.endDate && <p>End: {era.endDate.displayFormat}</p>}
                <p>{era.description}</p>
                {era.tags?.includes('generated') && (
                  <span className="generated-badge">AI Generated</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
