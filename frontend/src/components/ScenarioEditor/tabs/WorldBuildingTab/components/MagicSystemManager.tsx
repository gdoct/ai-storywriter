import { AiTextArea, AiTextBox, Button } from '@drdata/docomo';
import React, { useCallback, useState } from 'react';
import { FaDice, FaPlus, FaTrash } from 'react-icons/fa';
import { v4 as uuidv4 } from 'uuid';
import { MagicSystem, Scenario } from '../../../../../types/ScenarioTypes';
import './WorldBuildingManagers.css';

interface MagicSystemManagerProps {
  magicSystems: MagicSystem[];
  onMagicSystemsChange: (magicSystems: MagicSystem[]) => void;
  scenario: Scenario;
  isLoading: boolean;
}

export const MagicSystemManager: React.FC<MagicSystemManagerProps> = ({
  magicSystems,
  onMagicSystemsChange,
  scenario,
  isLoading,
}) => {
  const [selectedMagicSystem, setSelectedMagicSystem] = useState<MagicSystem | null>(null);

  const handleAddMagicSystem = useCallback(() => {
    const newMagicSystem: MagicSystem = {
      id: uuidv4(),
      name: '',
      description: '',
      rules: '',
      costs: '',
      limitations: '',
      source: '',
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updatedMagicSystems = [...magicSystems, newMagicSystem];
    onMagicSystemsChange(updatedMagicSystems);
    setSelectedMagicSystem(newMagicSystem);
  }, [magicSystems, onMagicSystemsChange]);

  const handleMagicSystemChange = useCallback((magicSystemId: string, field: keyof MagicSystem, value: any) => {
    const updatedMagicSystems = magicSystems.map(magicSystem =>
      magicSystem.id === magicSystemId
        ? { ...magicSystem, [field]: value, updatedAt: new Date().toISOString() }
        : magicSystem
    );
    onMagicSystemsChange(updatedMagicSystems);
    
    if (selectedMagicSystem?.id === magicSystemId) {
      setSelectedMagicSystem(prev => prev ? { ...prev, [field]: value } : null);
    }
  }, [magicSystems, onMagicSystemsChange, selectedMagicSystem]);

  const handleDeleteMagicSystem = useCallback((magicSystemId: string) => {
    const updatedMagicSystems = magicSystems.filter(magicSystem => magicSystem.id !== magicSystemId);
    onMagicSystemsChange(updatedMagicSystems);
    if (selectedMagicSystem?.id === magicSystemId) {
      setSelectedMagicSystem(null);
    }
  }, [magicSystems, onMagicSystemsChange, selectedMagicSystem]);

  return (
    <div className="magic-system-manager">
      <div className="magic-system-manager__header">
        <Button
          variant="primary"
          size="sm"
          onClick={handleAddMagicSystem}
          icon={<FaPlus />}
          disabled={isLoading}
        >
          Add Magic System
        </Button>
      </div>

      <div className="magic-system-manager__content">
        <div className="magic-system-manager__list">
          {magicSystems.length === 0 ? (
            <div className="magic-system-manager__empty">
              <div className="magic-system-manager__empty-icon">
                <FaDice />
              </div>
              <p>No magic systems created yet.</p>
              <p>Click "Add Magic System" to create your first magic system.</p>
            </div>
          ) : (
            <div className="magic-system-manager__items">
              {magicSystems.map(magicSystem => (
                <div
                  key={magicSystem.id}
                  className={`magic-system-manager__item ${
                    selectedMagicSystem?.id === magicSystem.id ? 'selected' : ''
                  }`}
                  onClick={() => setSelectedMagicSystem(magicSystem)}
                >
                  <div className="magic-system-manager__item-content">
                    <h4>{magicSystem.name || 'Unnamed Magic System'}</h4>
                    {magicSystem.description && (
                      <p className="magic-system-description">
                        {magicSystem.description.slice(0, 100)}
                        {magicSystem.description.length > 100 ? '...' : ''}
                      </p>
                    )}
                  </div>
                  <button
                    className="magic-system-manager__delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteMagicSystem(magicSystem.id);
                    }}
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedMagicSystem && (
          <div className="magic-system-manager__details">
            <div className="magic-system-manager__form">
              <AiTextBox
                label="Name"
                value={selectedMagicSystem.name}
                onChange={(value) => handleMagicSystemChange(selectedMagicSystem.id, 'name', value)}
                placeholder="Magic system name"
                disabled={isLoading}
              />

              <AiTextArea
                label="Description"
                value={selectedMagicSystem.description}
                onChange={(value) => handleMagicSystemChange(selectedMagicSystem.id, 'description', value)}
                placeholder="Describe this magic system..."
                rows={3}
                disabled={isLoading}
              />

              <AiTextArea
                label="Rules"
                value={selectedMagicSystem.rules}
                onChange={(value) => handleMagicSystemChange(selectedMagicSystem.id, 'rules', value)}
                placeholder="How does the magic work? What are the rules?"
                rows={4}
                disabled={isLoading}
              />

              <AiTextArea
                label="Costs"
                value={selectedMagicSystem.costs}
                onChange={(value) => handleMagicSystemChange(selectedMagicSystem.id, 'costs', value)}
                placeholder="What does it cost to use magic?"
                rows={3}
                disabled={isLoading}
              />

              <AiTextArea
                label="Limitations"
                value={selectedMagicSystem.limitations}
                onChange={(value) => handleMagicSystemChange(selectedMagicSystem.id, 'limitations', value)}
                placeholder="What are the limitations and restrictions?"
                rows={3}
                disabled={isLoading}
              />

              <AiTextArea
                label="Source"
                value={selectedMagicSystem.source}
                onChange={(value) => handleMagicSystemChange(selectedMagicSystem.id, 'source', value)}
                placeholder="Where does the magic come from?"
                rows={2}
                disabled={isLoading}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
