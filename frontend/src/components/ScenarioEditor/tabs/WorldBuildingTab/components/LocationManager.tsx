import { AiTextArea, AiTextBox, Button } from '@drdata/docomo';
import React, { useCallback, useState } from 'react';
import { FaEye, FaPlus, FaTrash } from 'react-icons/fa';
import { v4 as uuidv4 } from 'uuid';
import { Location, Scenario } from '../../../../../types/ScenarioTypes';
import './LocationManager.css';

interface LocationManagerProps {
  locations: Location[];
  onLocationsChange: (locations: Location[]) => void;
  scenario: Scenario;
  isLoading: boolean;
}

export const LocationManager: React.FC<LocationManagerProps> = ({
  locations,
  onLocationsChange,
  scenario,
  isLoading,
}) => {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const locationTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'city', label: 'City' },
    { value: 'region', label: 'Region' },
    { value: 'building', label: 'Building' },
    { value: 'landmark', label: 'Landmark' },
    { value: 'natural', label: 'Natural' },
    { value: 'other', label: 'Other' },
  ];

  const filteredLocations = locations.filter(location => {
    const matchesSearch = location.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         location.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || location.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleAddLocation = useCallback(() => {
    const newLocation: Location = {
      id: uuidv4(),
      name: '',
      type: 'other',
      description: '',
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updatedLocations = [...locations, newLocation];
    onLocationsChange(updatedLocations);
    setSelectedLocation(newLocation);
  }, [locations, onLocationsChange]);

  const handleLocationChange = useCallback((locationId: string, field: keyof Location, value: any) => {
    const updatedLocations = locations.map(location =>
      location.id === locationId
        ? { ...location, [field]: value, updatedAt: new Date().toISOString() }
        : location
    );
    onLocationsChange(updatedLocations);
    
    // Update selected location if it's the one being edited
    if (selectedLocation?.id === locationId) {
      setSelectedLocation(prev => prev ? { ...prev, [field]: value } : null);
    }
  }, [locations, onLocationsChange, selectedLocation]);

  const handleDeleteLocation = useCallback((locationId: string) => {
    const updatedLocations = locations.filter(location => location.id !== locationId);
    onLocationsChange(updatedLocations);
    if (selectedLocation?.id === locationId) {
      setSelectedLocation(null);
    }
  }, [locations, onLocationsChange, selectedLocation]);

  return (
    <div className="location-manager">
      <div className="location-manager__header">
        <Button
          variant="primary"
          size="sm"
          onClick={handleAddLocation}
          icon={<FaPlus />}
          disabled={isLoading}
        >
          Add Location
        </Button>
      </div>

      <div className="location-manager__content">
        <div className="location-manager__list">
          <div className="location-manager__filters">
            <AiTextBox
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search locations..."
            />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="location-manager__type-filter"
            >
              {locationTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {filteredLocations.length === 0 ? (
            <div className="location-manager__empty">
              <div className="location-manager__empty-icon">
                <FaEye />
              </div>
              <p>No locations found.</p>
              <p>Click "Add Location" to create your first location.</p>
            </div>
          ) : (
            <div className="location-manager__items">
              {filteredLocations.map(location => (
                <div
                  key={location.id}
                  className={`location-manager__item ${
                    selectedLocation?.id === location.id ? 'selected' : ''
                  }`}
                  onClick={() => setSelectedLocation(location)}
                >
                  <div className="location-manager__item-content">
                    <h4>{location.name || 'Unnamed Location'}</h4>
                    <p className="location-type">{location.type}</p>
                    {location.description && (
                      <p className="location-description">
                        {location.description.slice(0, 100)}
                        {location.description.length > 100 ? '...' : ''}
                      </p>
                    )}
                  </div>
                  <button
                    className="location-manager__delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteLocation(location.id);
                    }}
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedLocation && (
          <div className="location-manager__details">
            <div className="location-manager__form">
              <AiTextBox
                label="Name"
                value={selectedLocation.name}
                onChange={(value) => handleLocationChange(selectedLocation.id, 'name', value)}
                placeholder="Location name"
                disabled={isLoading}
              />

              <div className="form-row">
                <label htmlFor="location-type">Type</label>
                <select
                  id="location-type"
                  value={selectedLocation.type}
                  onChange={(e) => handleLocationChange(selectedLocation.id, 'type', e.target.value)}
                  disabled={isLoading}
                >
                  <option value="city">City</option>
                  <option value="region">Region</option>
                  <option value="building">Building</option>
                  <option value="landmark">Landmark</option>
                  <option value="natural">Natural</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <AiTextArea
                label="Description"
                value={selectedLocation.description}
                onChange={(value) => handleLocationChange(selectedLocation.id, 'description', value)}
                placeholder="Describe this location..."
                rows={3}
                disabled={isLoading}
              />

              <AiTextBox
                label="Climate"
                value={selectedLocation.climate || ''}
                onChange={(value) => handleLocationChange(selectedLocation.id, 'climate', value)}
                placeholder="Climate and weather patterns..."
                disabled={isLoading}
              />

              <AiTextBox
                label="Population"
                value={selectedLocation.population || ''}
                onChange={(value) => handleLocationChange(selectedLocation.id, 'population', value)}
                placeholder="Population size and demographics..."
                disabled={isLoading}
              />

              <AiTextBox
                label="Government"
                value={selectedLocation.government || ''}
                onChange={(value) => handleLocationChange(selectedLocation.id, 'government', value)}
                placeholder="Government type and leadership..."
                disabled={isLoading}
              />

              <AiTextArea
                label="Economy"
                value={selectedLocation.economy || ''}
                onChange={(value) => handleLocationChange(selectedLocation.id, 'economy', value)}
                placeholder="Economic activities and trade..."
                rows={2}
                disabled={isLoading}
              />

              <AiTextArea
                label="Culture"
                value={selectedLocation.culture || ''}
                onChange={(value) => handleLocationChange(selectedLocation.id, 'culture', value)}
                placeholder="Cultural practices and traditions..."
                rows={2}
                disabled={isLoading}
              />

              <AiTextArea
                label="History"
                value={selectedLocation.history || ''}
                onChange={(value) => handleLocationChange(selectedLocation.id, 'history', value)}
                placeholder="Historical events and significance..."
                rows={3}
                disabled={isLoading}
              />

              <AiTextArea
                label="Threats"
                value={selectedLocation.threats || ''}
                onChange={(value) => handleLocationChange(selectedLocation.id, 'threats', value)}
                placeholder="Dangers and threats present..."
                rows={2}
                disabled={isLoading}
              />

              <AiTextArea
                label="Resources"
                value={selectedLocation.resources || ''}
                onChange={(value) => handleLocationChange(selectedLocation.id, 'resources', value)}
                placeholder="Available resources and materials..."
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
