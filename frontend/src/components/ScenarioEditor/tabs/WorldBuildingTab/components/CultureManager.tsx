import { AiTextArea, AiTextBox, Button } from '@drdata/docomo';
import React, { useCallback, useState } from 'react';
import { FaPlus, FaTrash, FaUsers } from 'react-icons/fa';
import { v4 as uuidv4 } from 'uuid';
import { Culture, Scenario } from '../../../../../types/ScenarioTypes';
import './WorldBuildingManagers.css';

interface CultureManagerProps {
  cultures: Culture[];
  onCulturesChange: (cultures: Culture[]) => void;
  scenario: Scenario;
  isLoading: boolean;
}

export const CultureManager: React.FC<CultureManagerProps> = ({
  cultures,
  onCulturesChange,
  scenario,
  isLoading,
}) => {
  const [selectedCulture, setSelectedCulture] = useState<Culture | null>(null);

  const handleAddCulture = useCallback(() => {
    const newCulture: Culture = {
      id: uuidv4(),
      name: '',
      description: '',
      values: '',
      traditions: '',
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updatedCultures = [...cultures, newCulture];
    onCulturesChange(updatedCultures);
    setSelectedCulture(newCulture);
  }, [cultures, onCulturesChange]);

  const handleCultureChange = useCallback((cultureId: string, field: keyof Culture, value: any) => {
    const updatedCultures = cultures.map(culture =>
      culture.id === cultureId
        ? { ...culture, [field]: value, updatedAt: new Date().toISOString() }
        : culture
    );
    onCulturesChange(updatedCultures);
    
    if (selectedCulture?.id === cultureId) {
      setSelectedCulture(prev => prev ? { ...prev, [field]: value } : null);
    }
  }, [cultures, onCulturesChange, selectedCulture]);

  const handleDeleteCulture = useCallback((cultureId: string) => {
    const updatedCultures = cultures.filter(culture => culture.id !== cultureId);
    onCulturesChange(updatedCultures);
    if (selectedCulture?.id === cultureId) {
      setSelectedCulture(null);
    }
  }, [cultures, onCulturesChange, selectedCulture]);

  return (
    <div className="culture-manager">
      <div className="culture-manager__header">
        <Button
          variant="primary"
          size="sm"
          onClick={handleAddCulture}
          icon={<FaPlus />}
          disabled={isLoading}
        >
          Add Culture
        </Button>
      </div>

      <div className="culture-manager__content">
        <div className="culture-manager__list">
          {cultures.length === 0 ? (
            <div className="culture-manager__empty">
              <div className="culture-manager__empty-icon">
                <FaUsers />
              </div>
              <p>No cultures created yet.</p>
              <p>Click "Add Culture" to create your first culture.</p>
            </div>
          ) : (
            <div className="culture-manager__items">
              {cultures.map(culture => (
                <div
                  key={culture.id}
                  className={`culture-manager__item ${
                    selectedCulture?.id === culture.id ? 'selected' : ''
                  }`}
                  onClick={() => setSelectedCulture(culture)}
                >
                  <div className="culture-manager__item-content">
                    <h4>{culture.name || 'Unnamed Culture'}</h4>
                    {culture.description && (
                      <p className="culture-description">
                        {culture.description.slice(0, 100)}
                        {culture.description.length > 100 ? '...' : ''}
                      </p>
                    )}
                  </div>
                  <button
                    className="culture-manager__delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCulture(culture.id);
                    }}
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedCulture && (
          <div className="culture-manager__details">
            <div className="culture-manager__form">
              <AiTextBox
                label="Name"
                value={selectedCulture.name}
                onChange={(value) => handleCultureChange(selectedCulture.id, 'name', value)}
                placeholder="Culture name"
                disabled={isLoading}
              />

              <AiTextArea
                label="Description"
                value={selectedCulture.description}
                onChange={(value) => handleCultureChange(selectedCulture.id, 'description', value)}
                placeholder="Describe this culture..."
                rows={3}
                disabled={isLoading}
              />

              <AiTextArea
                label="Values"
                value={selectedCulture.values}
                onChange={(value) => handleCultureChange(selectedCulture.id, 'values', value)}
                placeholder="Core values and beliefs..."
                rows={3}
                disabled={isLoading}
              />

              <AiTextArea
                label="Traditions"
                value={selectedCulture.traditions}
                onChange={(value) => handleCultureChange(selectedCulture.id, 'traditions', value)}
                placeholder="Traditional practices and customs..."
                rows={3}
                disabled={isLoading}
              />

              <AiTextBox
                label="Language"
                value={selectedCulture.language || ''}
                onChange={(value) => handleCultureChange(selectedCulture.id, 'language', value)}
                placeholder="Language and linguistic characteristics..."
                disabled={isLoading}
              />

              <AiTextArea
                label="Social Structure"
                value={selectedCulture.socialStructure || ''}
                onChange={(value) => handleCultureChange(selectedCulture.id, 'socialStructure', value)}
                placeholder="Social hierarchy and organization..."
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
