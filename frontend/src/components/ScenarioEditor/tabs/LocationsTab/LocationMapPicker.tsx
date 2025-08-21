import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { Icon, LatLng } from 'leaflet';
import { FaUser } from 'react-icons/fa';
import { AiTextBox } from '@drdata/ai-styles';
import 'leaflet/dist/leaflet.css';
import './LocationMapPicker.css';

// Fix for default markers in react-leaflet
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = new Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerIconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface LocationMapPickerProps {
  onLocationSelect: (location: { lat: number; lng: number; address?: string }) => void;
  selectedLocation?: { lat: number; lng: number; address?: string };
}

interface LocationClickHandlerProps {
  onLocationSelect: (location: { lat: number; lng: number; address?: string }) => void;
}

const LocationClickHandler: React.FC<LocationClickHandlerProps> = ({ onLocationSelect }) => {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      
      // Try to get address from reverse geocoding
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
        );
        const data = await response.json();
        const address = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        
        onLocationSelect({ lat, lng, address });
      } catch (error) {
        console.warn('Failed to get address for location:', error);
        onLocationSelect({ lat, lng, address: `${lat.toFixed(6)}, ${lng.toFixed(6)}` });
      }
    },
  });
  
  return null;
};

export const LocationMapPicker: React.FC<LocationMapPickerProps> = ({
  onLocationSelect,
  selectedLocation
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([51.505, -0.09]); // Default to London
  const [mapZoom, setMapZoom] = useState(13);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Set default icon for all markers
  useEffect(() => {
    // This is a workaround for the react-leaflet marker icon issue
    Icon.Default.mergeOptions({
      iconUrl: markerIcon,
      iconRetinaUrl: markerIcon2x,
      shadowUrl: markerIconShadow,
    });
  }, []);

  const searchLocation = useCallback(async (query: string) => {
    if (!query.trim()) return;

    setIsSearching(true);
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        
        setMapCenter([lat, lng]);
        setMapZoom(15);
        
        onLocationSelect({
          lat,
          lng,
          address: result.display_name
        });
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  }, [onLocationSelect]);

  const handleSearchInputChange = useCallback((value: string) => {
    setSearchQuery(value);
    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set new timeout for search
    if (value.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        searchLocation(value);
      }, 1000); // Wait 1 second after user stops typing
    }
  }, [searchLocation]);

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchLocation(searchQuery);
  }, [searchLocation, searchQuery]);

  // Get user's current location on component mount
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMapCenter([latitude, longitude]);
          setMapZoom(13);
        },
        (error) => {
          console.warn('Failed to get user location:', error);
          // Keep default location (London)
        }
      );
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="location-map-picker">
      <div className="map-search">
        <form onSubmit={handleSearchSubmit} className="search-form">
          <div className="search-input-wrapper">
            <AiTextBox
              value={searchQuery}
              onChange={handleSearchInputChange}
              placeholder="Search for a location (e.g., Times Square, New York)"
              disabled={isSearching}
            />
            <button
              type="submit"
              className="search-button"
              disabled={isSearching || !searchQuery.trim()}
            >
              <FaUser />
            </button>
          </div>
        </form>
        {isSearching && (
          <div className="search-status">Searching...</div>
        )}
      </div>

      <div className="map-container">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: '400px', width: '100%' }}
          key={`${mapCenter[0]}-${mapCenter[1]}-${mapZoom}`} // Force re-render when center changes
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <LocationClickHandler onLocationSelect={onLocationSelect} />
          
          {selectedLocation && (
            <Marker 
              position={[selectedLocation.lat, selectedLocation.lng]}
              icon={DefaultIcon}
            >
              <Popup>
                <div className="marker-popup">
                  <strong>Selected Location</strong>
                  <br />
                  {selectedLocation.address || `${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}`}
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      <div className="map-instructions">
        <p>
          🗺️ <strong>Click anywhere on the map</strong> to select a location for your story.
        </p>
        <p>
          You can also search for specific places using the search box above.
        </p>
        {selectedLocation && (
          <div className="selected-location-info">
            <strong>Selected:</strong> {selectedLocation.address || `${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}`}
          </div>
        )}
      </div>
    </div>
  );
};