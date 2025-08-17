import React, { useCallback, useMemo, useState } from 'react';
import { FaPlus, FaTimes } from 'react-icons/fa';
import { MdSchedule } from 'react-icons/md';
import { TabProps } from '../../types';
import { TimelineEvent } from '../../../../types/ScenarioTypes';
import { v4 as uuidv4 } from 'uuid';
import './TimelineTab.css';
import { TimelineCanvas } from './TimelineCanvas';
import { EventModal } from './EventModal';

export const TimelineTab: React.FC<TabProps> = ({
  scenario,
  onScenarioChange,
  isDirty,
  isLoading,
}) => {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);

  // Get timeline from scenario or initialize with root event
  const timeline = useMemo(() => {
    if (scenario.timeline && scenario.timeline.length > 0) {
      return scenario.timeline;
    }
    
    // Initialize with root "Story start" event
    const rootEvent: TimelineEvent = {
      id: uuidv4(),
      title: 'Story start',
      description: '',
      date: '',
      charactersInvolved: [],
      includeInStory: true,
      parentId: null,
      position: { x: 0, y: 0 },
      row: 0
    };
    
    return [rootEvent];
  }, [scenario.timeline]);

  const updateTimeline = useCallback((newTimeline: TimelineEvent[]) => {
    onScenarioChange({ timeline: newTimeline });
  }, [onScenarioChange]);

  const handleAddChild = useCallback((parentId: string) => {
    const parent = timeline.find(event => event.id === parentId);
    if (!parent) return;

    // Check if parent already has 3 children (max limit)
    const siblings = timeline.filter(event => event.parentId === parentId);
    if (siblings.length >= 3) {
      alert('Maximum of 3 parallel events allowed');
      return;
    }

    const newEvent: TimelineEvent = {
      id: uuidv4(),
      title: 'New Event',
      description: '',
      date: '',
      charactersInvolved: [],
      includeInStory: true,
      parentId,
      position: { x: 0, y: 0 }, // Will be calculated by layout algorithm
      row: parent.row + 1
    };

    const newTimeline = [...timeline, newEvent];
    updateTimeline(newTimeline);
    setEditingEventId(newEvent.id);
  }, [timeline, updateTimeline]);

  const handleRemoveEvent = useCallback((eventId: string) => {
    const eventToRemove = timeline.find(event => event.id === eventId);
    if (!eventToRemove) return;

    // Don't allow removing the root event
    if (!eventToRemove.parentId) {
      alert('Cannot remove the root event');
      return;
    }

    // Find children of the event being removed
    const children = timeline.filter(event => event.parentId === eventId);
    
    // Update children to connect to the removed event's parent
    const updatedTimeline = timeline
      .filter(event => event.id !== eventId)
      .map(event => {
        if (children.some(child => child.id === event.id)) {
          return { ...event, parentId: eventToRemove.parentId };
        }
        return event;
      });

    updateTimeline(updatedTimeline);
    
    // Clear selection if removed event was selected
    if (selectedEventId === eventId) {
      setSelectedEventId(null);
    }
    if (editingEventId === eventId) {
      setEditingEventId(null);
    }
  }, [timeline, updateTimeline, selectedEventId, editingEventId]);

  const handleEventUpdate = useCallback((eventId: string, updates: Partial<TimelineEvent>) => {
    const updatedTimeline = timeline.map(event =>
      event.id === eventId ? { ...event, ...updates } : event
    );
    updateTimeline(updatedTimeline);
  }, [timeline, updateTimeline]);

  const handleEventSelect = useCallback((eventId: string) => {
    setSelectedEventId(eventId);
  }, []);

  const handleEventEdit = useCallback((eventId: string) => {
    setEditingEventId(eventId);
  }, []);

  const handleCloseModal = useCallback(() => {
    setEditingEventId(null);
  }, []);

  const handleZoomDelta = useCallback((delta: number) => {
    setZoom(prev => Math.max(0.1, Math.min(3, prev + delta)));
  }, []);

  const handlePan = useCallback((deltaX: number, deltaY: number) => {
    setPanX(prev => prev + deltaX);
    setPanY(prev => prev + deltaY);
  }, []);

  const handleZoom = useCallback((newZoom: number) => {
    setZoom(newZoom);
  }, []);

  const resetView = useCallback(() => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
  }, []);

  const editingEvent = editingEventId ? timeline.find(event => event.id === editingEventId) : null;

  return (
    <div className="timeline-tab">
      <div className="timeline-tab__header">
        <div className="timeline-tab__header-content">
          <div className="timeline-tab__title">
            <MdSchedule className="timeline-tab__title-icon" />
            <h3>Timeline & Events</h3>
          </div>
          <div className="timeline-tab__controls">
            <button
              className="timeline-tab__control-btn"
              onClick={() => handleZoomDelta(0.1)}
              title="Zoom In"
            >
              +
            </button>
            <span className="timeline-tab__zoom-level">{Math.round(zoom * 100)}%</span>
            <button
              className="timeline-tab__control-btn"
              onClick={() => handleZoomDelta(-0.1)}
              title="Zoom Out"
            >
              -
            </button>
            <button
              className="timeline-tab__control-btn"
              onClick={resetView}
              title="Reset View"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="timeline-tab__content">
        <TimelineCanvas
          events={timeline}
          selectedEventId={selectedEventId}
          zoom={zoom}
          panX={panX}
          panY={panY}
          onEventSelect={handleEventSelect}
          onEventEdit={handleEventEdit}
          onAddChild={handleAddChild}
          onRemoveEvent={handleRemoveEvent}
          onPan={handlePan}
          onZoom={handleZoom}
          onEventUpdate={handleEventUpdate}
        />
      </div>

      {editingEvent && (
        <EventModal
          event={editingEvent}
          scenario={scenario}
          isOpen={!!editingEventId}
          onClose={handleCloseModal}
          onUpdate={(updates) => handleEventUpdate(editingEventId!, updates)}
        />
      )}
    </div>
  );
};