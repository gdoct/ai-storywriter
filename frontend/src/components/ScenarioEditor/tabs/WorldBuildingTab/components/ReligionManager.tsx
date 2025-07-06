import { AiTextArea, AiTextBox, Button } from '@drdata/ai-styles';
import React, { useCallback, useState } from 'react';
import { FaBook, FaPlus, FaTrash } from 'react-icons/fa';
import { v4 as uuidv4 } from 'uuid';
import { Religion, Scenario } from '../../../../../types/ScenarioTypes';
import './WorldBuildingManagers.css';

interface ReligionManagerProps {
  religions: Religion[];
  onReligionsChange: (religions: Religion[]) => void;
  scenario: Scenario;
  isLoading: boolean;
}

export const ReligionManager: React.FC<ReligionManagerProps> = ({
  religions,
  onReligionsChange,
  scenario,
  isLoading,
}) => {
  const [selectedReligion, setSelectedReligion] = useState<Religion | null>(null);

  const handleAddReligion = useCallback(() => {
    const newReligion: Religion = {
      id: uuidv4(),
      name: '',
      description: '',
      beliefs: '',
      practices: '',
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updatedReligions = [...religions, newReligion];
    onReligionsChange(updatedReligions);
    setSelectedReligion(newReligion);
  }, [religions, onReligionsChange]);

  const handleReligionChange = useCallback((religionId: string, field: keyof Religion, value: any) => {
    const updatedReligions = religions.map(religion =>
      religion.id === religionId
        ? { ...religion, [field]: value, updatedAt: new Date().toISOString() }
        : religion
    );
    onReligionsChange(updatedReligions);
    
    if (selectedReligion?.id === religionId) {
      setSelectedReligion(prev => prev ? { ...prev, [field]: value } : null);
    }
  }, [religions, onReligionsChange, selectedReligion]);

  const handleDeleteReligion = useCallback((religionId: string) => {
    const updatedReligions = religions.filter(religion => religion.id !== religionId);
    onReligionsChange(updatedReligions);
    if (selectedReligion?.id === religionId) {
      setSelectedReligion(null);
    }
  }, [religions, onReligionsChange, selectedReligion]);

  return (
    <div className="religion-manager">
      <div className="religion-manager__header">
        <Button
          variant="primary"
          size="sm"
          onClick={handleAddReligion}
          icon={<FaPlus />}
          disabled={isLoading}
        >
          Add Religion
        </Button>
      </div>

      <div className="religion-manager__content">
        <div className="religion-manager__list">
          {religions.length === 0 ? (
            <div className="religion-manager__empty">
              <div className="religion-manager__empty-icon">
                <FaBook />
              </div>
              <p>No religions created yet.</p>
              <p>Click "Add Religion" to create your first religion.</p>
            </div>
          ) : (
            <div className="religion-manager__items">
              {religions.map(religion => (
                <div
                  key={religion.id}
                  className={`religion-manager__item ${
                    selectedReligion?.id === religion.id ? 'selected' : ''
                  }`}
                  onClick={() => setSelectedReligion(religion)}
                >
                  <div className="religion-manager__item-content">
                    <h4>{religion.name || 'Unnamed Religion'}</h4>
                    {religion.description && (
                      <p className="religion-description">
                        {religion.description.slice(0, 100)}
                        {religion.description.length > 100 ? '...' : ''}
                      </p>
                    )}
                  </div>
                  <button
                    className="religion-manager__delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteReligion(religion.id);
                    }}
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedReligion && (
          <div className="religion-manager__details">
            <div className="religion-manager__form">
              <AiTextBox
                label="Name"
                value={selectedReligion.name}
                onChange={(value) => handleReligionChange(selectedReligion.id, 'name', value)}
                placeholder="Religion name"
                disabled={isLoading}
              />

              <AiTextArea
                label="Description"
                value={selectedReligion.description}
                onChange={(value) => handleReligionChange(selectedReligion.id, 'description', value)}
                placeholder="Describe this religion..."
                rows={3}
                disabled={isLoading}
              />

              <AiTextArea
                label="Beliefs"
                value={selectedReligion.beliefs}
                onChange={(value) => handleReligionChange(selectedReligion.id, 'beliefs', value)}
                placeholder="Core beliefs and teachings..."
                rows={4}
                disabled={isLoading}
              />

              <AiTextArea
                label="Practices"
                value={selectedReligion.practices}
                onChange={(value) => handleReligionChange(selectedReligion.id, 'practices', value)}
                placeholder="Religious practices and rituals..."
                rows={3}
                disabled={isLoading}
              />

              <AiTextArea
                label="Hierarchy"
                value={selectedReligion.hierarchy || ''}
                onChange={(value) => handleReligionChange(selectedReligion.id, 'hierarchy', value)}
                placeholder="Religious hierarchy and leadership..."
                rows={2}
                disabled={isLoading}
              />

              <AiTextBox
                label="Symbols"
                value={selectedReligion.symbols || ''}
                onChange={(value) => handleReligionChange(selectedReligion.id, 'symbols', value)}
                placeholder="Religious symbols and artifacts..."
                disabled={isLoading}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
