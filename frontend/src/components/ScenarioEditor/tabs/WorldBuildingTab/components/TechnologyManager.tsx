import { AiTextArea, AiTextBox, Button } from '@drdata/ai-styles';
import React, { useCallback, useState } from 'react';
import { FaCog, FaPlus, FaTrash } from 'react-icons/fa';
import { v4 as uuidv4 } from 'uuid';
import { Scenario, Technology } from '../../../../../types/ScenarioTypes';
import './WorldBuildingManagers.css';

interface TechnologyManagerProps {
  technologies: Technology[];
  onTechnologiesChange: (technologies: Technology[]) => void;
  scenario: Scenario;
  isLoading: boolean;
}

export const TechnologyManager: React.FC<TechnologyManagerProps> = ({
  technologies,
  onTechnologiesChange,
  scenario,
  isLoading,
}) => {
  const [selectedTechnology, setSelectedTechnology] = useState<Technology | null>(null);

  const handleAddTechnology = useCallback(() => {
    const newTechnology: Technology = {
      id: uuidv4(),
      name: '',
      description: '',
      functionality: '',
      availability: '',
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updatedTechnologies = [...technologies, newTechnology];
    onTechnologiesChange(updatedTechnologies);
    setSelectedTechnology(newTechnology);
  }, [technologies, onTechnologiesChange]);

  const handleTechnologyChange = useCallback((technologyId: string, field: keyof Technology, value: any) => {
    const updatedTechnologies = technologies.map(technology =>
      technology.id === technologyId
        ? { ...technology, [field]: value, updatedAt: new Date().toISOString() }
        : technology
    );
    onTechnologiesChange(updatedTechnologies);
    
    if (selectedTechnology?.id === technologyId) {
      setSelectedTechnology(prev => prev ? { ...prev, [field]: value } : null);
    }
  }, [technologies, onTechnologiesChange, selectedTechnology]);

  const handleDeleteTechnology = useCallback((technologyId: string) => {
    const updatedTechnologies = technologies.filter(technology => technology.id !== technologyId);
    onTechnologiesChange(updatedTechnologies);
    if (selectedTechnology?.id === technologyId) {
      setSelectedTechnology(null);
    }
  }, [technologies, onTechnologiesChange, selectedTechnology]);

  return (
    <div className="technology-manager">
      <div className="technology-manager__header">
        <Button
          variant="primary"
          size="sm"
          onClick={handleAddTechnology}
          icon={<FaPlus />}
          disabled={isLoading}
        >
          Add Technology
        </Button>
      </div>

      <div className="technology-manager__content">
        <div className="technology-manager__list">
          {technologies.length === 0 ? (
            <div className="technology-manager__empty">
              <div className="technology-manager__empty-icon">
                <FaCog />
              </div>
              <p>No technologies created yet.</p>
              <p>Click "Add Technology" to create your first technology.</p>
            </div>
          ) : (
            <div className="technology-manager__items">
              {technologies.map(technology => (
                <div
                  key={technology.id}
                  className={`technology-manager__item ${
                    selectedTechnology?.id === technology.id ? 'selected' : ''
                  }`}
                  onClick={() => setSelectedTechnology(technology)}
                >
                  <div className="technology-manager__item-content">
                    <h4>{technology.name || 'Unnamed Technology'}</h4>
                    {technology.description && (
                      <p className="technology-description">
                        {technology.description.slice(0, 100)}
                        {technology.description.length > 100 ? '...' : ''}
                      </p>
                    )}
                  </div>
                  <button
                    className="technology-manager__delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTechnology(technology.id);
                    }}
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedTechnology && (
          <div className="technology-manager__details">
            <div className="technology-manager__form">
              <AiTextBox
                label="Name"
                value={selectedTechnology.name}
                onChange={(value) => handleTechnologyChange(selectedTechnology.id, 'name', value)}
                placeholder="Technology name"
                disabled={isLoading}
              />

              <AiTextArea
                label="Description"
                value={selectedTechnology.description}
                onChange={(value) => handleTechnologyChange(selectedTechnology.id, 'description', value)}
                placeholder="Describe this technology..."
                rows={3}
                disabled={isLoading}
              />

              <AiTextArea
                label="Functionality"
                value={selectedTechnology.functionality}
                onChange={(value) => handleTechnologyChange(selectedTechnology.id, 'functionality', value)}
                placeholder="How does this technology work?"
                rows={3}
                disabled={isLoading}
              />

              <AiTextArea
                label="Availability"
                value={selectedTechnology.availability}
                onChange={(value) => handleTechnologyChange(selectedTechnology.id, 'availability', value)}
                placeholder="Who has access to this technology?"
                rows={2}
                disabled={isLoading}
              />

              <AiTextBox
                label="Creators"
                value={selectedTechnology.creators || ''}
                onChange={(value) => handleTechnologyChange(selectedTechnology.id, 'creators', value)}
                placeholder="Who created or developed this technology?"
                disabled={isLoading}
              />

              <AiTextArea
                label="Impact"
                value={selectedTechnology.impact || ''}
                onChange={(value) => handleTechnologyChange(selectedTechnology.id, 'impact', value)}
                placeholder="What impact has this technology had on society?"
                rows={3}
                disabled={isLoading}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
