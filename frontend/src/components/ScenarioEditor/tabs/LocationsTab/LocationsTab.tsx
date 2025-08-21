import { AiTextArea, AiTextBox, Button } from '@drdata/ai-styles';
import React, { useCallback, useMemo, useState } from 'react';
import { FaDownload, FaPlus, FaTrash } from 'react-icons/fa';
import { FaLocationDot } from 'react-icons/fa6';
import { v4 as uuidv4 } from 'uuid';
import { AI_STATUS, useAIStatus } from '../../../../contexts/AIStatusContext';
import { useAuth } from '../../../../contexts/AuthContext';
import { Location } from '../../../../types/ScenarioTypes';
import { showUserFriendlyError } from '../../../../utils/errorHandling';
import ImportModal from '../../../common/ImportModal';
import { TabProps } from '../../types';
import './LocationsTab.css';
import { GenerateLocationModal } from './GenerateLocationModal';

export const LocationsTab: React.FC<TabProps> = ({
  scenario,
  onScenarioChange,
  isDirty: _isDirty,
  isLoading,
}) => {
  // Wrap locations in useMemo to stabilize reference for useCallback deps
  const locations = useMemo(() => scenario.locations || [], [scenario.locations]);
  const [expandedLocation, setExpandedLocation] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [fieldGenerationInProgress, setFieldGenerationInProgress] = useState<{ locationId: string; fieldName: string } | null>(null);
  const [fieldStreamedText, setFieldStreamedText] = useState('');
  const { setAiStatus, setShowAIBusyModal } = useAIStatus();
  const { refreshCredits } = useAuth();

  const handleAddLocation = useCallback(() => {
    const newLocation: Location = {
      id: uuidv4(),
      name: '',
      visualDescription: '',
      background: '',
      extraInfo: '',
    };
    const updatedLocations = [...locations, newLocation];
    onScenarioChange({ locations: updatedLocations });
    setExpandedLocation(newLocation.id);
  }, [locations, onScenarioChange]);

  const handleDeleteLocation = useCallback((locationId: string) => {
    const updatedLocations = locations.filter(loc => loc.id !== locationId);
    onScenarioChange({ locations: updatedLocations });
    if (expandedLocation === locationId) {
      setExpandedLocation(null);
    }
  }, [locations, onScenarioChange, expandedLocation]);

  const handleLocationChange = useCallback((locationId: string, updates: Partial<Location>) => {
    const updatedLocations = locations.map(location =>
      location.id === locationId ? { ...location, ...updates } : location
    );
    onScenarioChange({ locations: updatedLocations });
  }, [locations, onScenarioChange]);

  const handleFieldGeneration = useCallback(async (locationId: string, fieldName: string) => {
    const location = locations.find(loc => loc.id === locationId);
    if (!location || !location.image_data) {
      showUserFriendlyError(new Error('Please upload an image for this location first to generate descriptions.'));
      return;
    }

    try {
      setFieldGenerationInProgress({ locationId, fieldName });
      setFieldStreamedText('');
      setAiStatus(AI_STATUS.BUSY);
      setShowAIBusyModal(true);

      // Convert base64 image data to blob
      const base64Data = location.image_data.split(',')[1] || location.image_data;
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const imageBlob = new Blob([byteArray], { type: location.image_mime_type || 'image/jpeg' });

      const { generateLocationField } = await import('../../../../services/locationFieldGenerator');
      
      let accumulatedText = '';
      const controller = new AbortController();

      await generateLocationField(
        imageBlob,
        fieldName,
        {
          name: location.name,
          visualDescription: location.visualDescription,
          background: location.background,
          extraInfo: location.extraInfo
        },
        (chunk) => {
          accumulatedText += chunk;
          setFieldStreamedText(accumulatedText);
        },
        controller.signal
      );

      // Update the location with the generated field
      handleLocationChange(locationId, { [fieldName]: accumulatedText });
      
      await refreshCredits();
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Location field generation error:', error);
        showUserFriendlyError(error.message || 'Failed to generate location description. Please try again.');
      }
    } finally {
      setFieldGenerationInProgress(null);
      setFieldStreamedText('');
      setAiStatus(AI_STATUS.IDLE);
      setShowAIBusyModal(false);
    }
  }, [locations, handleLocationChange, setAiStatus, setShowAIBusyModal, refreshCredits]);

  const handleLocationGenerated = useCallback((locationData: Partial<Location>) => {
    const updatedLocations = [...locations, { id: uuidv4(), ...locationData }];
    onScenarioChange({ locations: updatedLocations });
    setShowGenerateModal(false);
  }, [locations, onScenarioChange]);

  const handleExportLocations = useCallback(() => {
    const locationsData = locations.map(({ image_data, image_mime_type, imageId, imageUrl, ...locationData }) => locationData);
    const dataStr = JSON.stringify(locationsData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'locations.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }, [locations]);

  const handleImportLocations = useCallback((importedData: any[]) => {
    try {
      const importedLocations: Location[] = importedData.map(data => ({
        id: uuidv4(),
        name: data.name || '',
        visualDescription: data.visualDescription || data.appearance || '',
        background: data.background || data.backstory || '',
        extraInfo: data.extraInfo || '',
      }));
      
      const updatedLocations = [...locations, ...importedLocations];
      onScenarioChange({ locations: updatedLocations });
      setShowImportModal(false);
    } catch (error) {
      showUserFriendlyError(new Error('Invalid location data format. Please check your JSON file.'));
    }
  }, [locations, onScenarioChange]);

  return (
    <div className="locations-tab">
      <div className="locations-header">
        <div className="locations-header-content">
          <div className="locations-title">
            <span className="locations-title-icon">📍</span>
            <span>Locations ({locations.length})</span>
          </div>
          <div className="locations-actions">
            <Button
              variant="secondary"
              onClick={() => setShowGenerateModal(true)}
              disabled={isLoading}
              icon={<FaPlus />}
            >
              Generate
            </Button>
            <Button
              variant="secondary"
              onClick={handleAddLocation}
              disabled={isLoading}
              icon={<FaPlus />}
            >
              Add Location
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowImportModal(true)}
              icon={<FaDownload />}
            >
              Import
            </Button>
          </div>
        </div>
      </div>

      <div className="locations-content">
        {locations.length === 0 ? (
          <div className="locations-empty">
            <span className="locations-empty-icon">📍</span>
            <h3>No locations yet</h3>
            <p>Add locations where your story takes place. You can create them manually or generate them from images, a description or a map location.</p>
          </div>
        ) : (
          <div className="locations-list">
            {locations.map(location => (
              <div key={location.id} className="location-item">
                <div className="location-compact-row" onClick={() => 
                  setExpandedLocation(expandedLocation === location.id ? null : location.id)
                }>
                  <div className="location-icon">
                    <FaLocationDot />
                  </div>
                  <div className="location-content">
                    <div className="location-name">
                      {location.name || 'Unnamed Location'}
                    </div>
                    <div className="location-description">
                      {location.visualDescription?.substring(0, 80) || 'No description'}
                      {location.visualDescription && location.visualDescription.length > 80 && '...'}
                    </div>
                  </div>
                  <div className="location-actions">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteLocation(location.id);
                      }}
                    >
                      <FaTrash />
                    </Button>
                  </div>
                </div>

                {expandedLocation === location.id && (
                  <div className="location-details">
                    <div className="location-fields">
                      <div className="location-field">
                        <AiTextBox
                          label="Location Name"
                          value={location.name || ''}
                          onChange={(value) => handleLocationChange(location.id, { name: value })}
                          placeholder="Enter location name..."
                        />
                      </div>

                      <div className="location-field">
                        <div className="field-with-generate">
                          <AiTextArea
                            label="Visual Description"
                            value={
                              fieldGenerationInProgress?.locationId === location.id && 
                              fieldGenerationInProgress?.fieldName === 'visualDescription' 
                                ? fieldStreamedText 
                                : location.visualDescription || ''
                            }
                            onChange={(value) => handleLocationChange(location.id, { visualDescription: value })}
                            placeholder="Describe the physical appearance and atmosphere..."
                            rows={4}
                            disabled={fieldGenerationInProgress?.locationId === location.id && fieldGenerationInProgress?.fieldName === 'visualDescription'}
                          />
                          {location.image_data && (
                            <Button
                              variant="secondary"
                              onClick={() => handleFieldGeneration(location.id, 'visualDescription')}
                              disabled={!!fieldGenerationInProgress}
                              className="generate-field-btn"
                            >
                              {fieldGenerationInProgress?.locationId === location.id && fieldGenerationInProgress?.fieldName === 'visualDescription' 
                                ? 'Generating...' 
                                : 'Generate from Image'
                              }
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="location-field">
                        <div className="field-with-generate">
                          <AiTextArea
                            label="Background & History"
                            value={
                              fieldGenerationInProgress?.locationId === location.id && 
                              fieldGenerationInProgress?.fieldName === 'background' 
                                ? fieldStreamedText 
                                : location.background || ''
                            }
                            onChange={(value) => handleLocationChange(location.id, { background: value })}
                            placeholder="Describe the history, significance, and context..."
                            rows={4}
                            disabled={fieldGenerationInProgress?.locationId === location.id && fieldGenerationInProgress?.fieldName === 'background'}
                          />
                          {location.image_data && (
                            <Button
                              variant="secondary"
                              onClick={() => handleFieldGeneration(location.id, 'background')}
                              disabled={!!fieldGenerationInProgress}
                              className="generate-field-btn"
                            >
                              {fieldGenerationInProgress?.locationId === location.id && fieldGenerationInProgress?.fieldName === 'background' 
                                ? 'Generating...' 
                                : 'Generate from Image'
                              }
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="location-field">
                        <AiTextArea
                          label="Additional Information"
                          value={location.extraInfo || ''}
                          onChange={(value) => handleLocationChange(location.id, { extraInfo: value })}
                          placeholder="Any other relevant details..."
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showImportModal && (
        <ImportModal
          show={showImportModal}
          onImport={handleImportLocations}
          onClose={() => setShowImportModal(false)}
          title="Import Locations"
          extractContent={(scenario: any) => scenario.locations || []}
          itemType="locations"
        />
      )}

      {showGenerateModal && (
        <GenerateLocationModal
          onLocationGenerated={handleLocationGenerated}
          onClose={() => setShowGenerateModal(false)}
        />
      )}
    </div>
  );
};