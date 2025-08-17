import React, { useCallback, useEffect, useState } from 'react';
import { AiTextBox, AiTextArea, Button } from '@drdata/ai-styles';
import { TimelineEvent, Scenario } from '../../../../types/ScenarioTypes';
import './EventModal.css';

interface EventModalProps {
  event: TimelineEvent;
  scenario: Scenario;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updates: Partial<TimelineEvent>) => void;
}

export const EventModal: React.FC<EventModalProps> = ({
  event,
  scenario,
  isOpen,
  onClose,
  onUpdate,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    charactersInvolved: new Set<string>(),
    includeInStory: true,
  });

  // Initialize form data when event changes
  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || '',
        description: event.description || '',
        date: event.date || '',
        location: event.location || '',
        charactersInvolved: new Set(event.charactersInvolved || []),
        includeInStory: event.includeInStory ?? true,
      });
    }
  }, [event]);

  const handleFieldChange = useCallback((field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleCharacterToggle = useCallback((characterName: string) => {
    setFormData(prev => {
      const newCharacters = new Set(prev.charactersInvolved);
      if (newCharacters.has(characterName)) {
        newCharacters.delete(characterName);
      } else {
        newCharacters.add(characterName);
      }
      return {
        ...prev,
        charactersInvolved: newCharacters
      };
    });
  }, []);

  const handleSave = useCallback(() => {
    const updates: Partial<TimelineEvent> = {
      title: formData.title.trim() || 'Untitled Event',
      description: formData.description.trim(),
      date: formData.date.trim(),
      location: formData.location.trim(),
      charactersInvolved: Array.from(formData.charactersInvolved),
      includeInStory: formData.includeInStory,
    };

    onUpdate(updates);
    onClose();
  }, [formData, onUpdate, onClose]);

  const handleCancel = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="event-modal-overlay" onClick={onClose}>
      <div className="event-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="event-modal-header">
          <h2>Edit Timeline Event</h2>
          <button className="event-modal-close" onClick={onClose}>&times;</button>
        </div>
        
        <div className="event-modal">
          <div className="event-modal__content">
            <div className="event-modal__field">
              <AiTextBox
                label="Event Title"
                value={formData.title}
                onChange={(value) => handleFieldChange('title', value)}
                placeholder="Enter event title..."
                required
              />
            </div>

            <div className="event-modal__field">
              <AiTextArea
                label="Description"
                value={formData.description}
                onChange={(value) => handleFieldChange('description', value)}
                placeholder="Describe what happens in this event..."
                rows={4}
              />
            </div>

            <div className="event-modal__field">
              <AiTextBox
                label="Date/Time"
                value={formData.date}
                onChange={(value) => handleFieldChange('date', value)}
                placeholder="e.g., Day 1, Spring 1423, Morning..."
              />
            </div>

            <div className="event-modal__field">
              <label className="event-modal__field-label">Location</label>
              <select
                value={formData.location}
                onChange={(e) => handleFieldChange('location', e.target.value)}
                className="event-modal__location-select"
              >
                <option value="">Select a location...</option>
                {scenario.locations && scenario.locations.length > 0 ? (
                  scenario.locations.map((location) => (
                    <option key={location.id} value={location.name || ''}>
                      {location.name || 'Unnamed Location'}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>No locations defined in this scenario</option>
                )}
              </select>
              {(!scenario.locations || scenario.locations.length === 0) && (
                <div className="event-modal__no-locations">
                  No locations defined in this scenario. Add locations in the Locations tab first.
                </div>
              )}
            </div>

            <div className="event-modal__field">
              <label className="event-modal__field-label">Characters Involved</label>
              <div className="event-modal__characters-list">
                {scenario.characters && scenario.characters.length > 0 ? (
                  scenario.characters.map((character) => (
                    <div key={character.id} className="event-modal__character-item">
                      <input
                        type="checkbox"
                        id={`character-${character.id}`}
                        checked={formData.charactersInvolved.has(character.name || '')}
                        onChange={() => handleCharacterToggle(character.name || '')}
                        className="event-modal__character-checkbox"
                      />
                      <label 
                        htmlFor={`character-${character.id}`} 
                        className="event-modal__character-label"
                      >
                        {character.name || 'Unnamed Character'}
                        {character.role && (
                          <span className="event-modal__character-role"> ({character.role})</span>
                        )}
                      </label>
                    </div>
                  ))
                ) : (
                  <div className="event-modal__no-characters">
                    No characters defined in this scenario. Add characters in the Characters tab first.
                  </div>
                )}
              </div>
            </div>

            <div className="event-modal__field">
              <div className="event-modal__checkbox-container">
                <input
                  type="checkbox"
                  id="includeInStory"
                  checked={formData.includeInStory}
                  onChange={(e) => handleFieldChange('includeInStory', e.target.checked)}
                  className="event-modal__checkbox"
                />
                <label htmlFor="includeInStory" className="event-modal__checkbox-label">
                  Include in story
                </label>
                <div className="event-modal__checkbox-help">
                  {formData.includeInStory 
                    ? 'This event will be rendered in the generated story'
                    : 'This event will be used as backstory context only'
                  }
                </div>
              </div>
            </div>
          </div>

          <div className="event-modal__actions">
            <Button
              variant="ghost"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
            >
              Save Event
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};