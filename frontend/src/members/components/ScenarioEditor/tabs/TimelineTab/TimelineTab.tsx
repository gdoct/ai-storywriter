/**
 * TimelineTab
 *
 * Purpose:
 * - Displays and edits a scenario's timeline as a node-based event canvas.
 *
 * Key features:
 * - Initializes timeline with a root "Story start" event when none exists.
 * - Renders events via TimelineCanvas and allows selecting and editing events.
 * - Adds child events (max 3 parallel children per parent) and reattaches children
 *   of a removed event to the removed event's parent.
 * - Opens EventModal for editing event details (title, description, date,
 *   characters involved, includeInStory, etc.).
 * - Provides pan/zoom controls (zoom in/out, reset) and exposes pan/zoom state
 *   to the canvas. Zoom is clamped between 0.1 and 3.
 * - Persists timeline changes back to the parent scenario using onScenarioChange.
 *
 * Notes for maintainers:
 * - Timeline layout (positions/rows) is managed by the canvas/layout logic;
 *   TimelineTab provides initial positions/row values for new events.
 * - Removing the root event is prevented.
 * - This file contains only UI wiring; business logic adjustments should be
 *   coordinated with TimelineCanvas and EventModal components.
 */

import React, { useCallback, useMemo, useState } from 'react';
// import { FaPlus, FaTimes } from 'react-icons/fa'; // Unused imports
import { MdSchedule } from 'react-icons/md';
import { TabProps } from '../../types';
import { TimelineEvent } from '../../../../../shared/types/ScenarioTypes';
import { v4 as uuidv4 } from 'uuid';
import './TimelineTab.css';
import { TimelineCanvas } from './TimelineCanvas';
import { EventModal } from './EventModal';

export const TimelineTab: React.FC<TabProps> = ({
  scenario,
  onScenarioChange,
  isDirty: _isDirty,
  isLoading: _isLoading,
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
      position: { x: 300, y: 100 }, // Start in a reasonable position
      connections: {
        inputs: [],
        outputs: []
      }
    };
    
    return [rootEvent];
  }, [scenario.timeline]);

  const updateTimeline = useCallback((newTimeline: TimelineEvent[]) => {
    onScenarioChange({ timeline: newTimeline });
  }, [onScenarioChange]);

  const handleAddChild = useCallback((parentId: string) => {
    const parent = timeline.find(event => event.id === parentId);
    if (!parent) return;

    // Generate a new event positioned below and slightly to the right of the parent
    const newEvent: TimelineEvent = {
      id: uuidv4(),
      title: 'New Event',
      description: '',
      date: '',
      charactersInvolved: [],
      includeInStory: true,
      position: { 
        x: parent.position.x + (parent.connections.outputs.length * 50), // Spread children horizontally
        y: parent.position.y + 150 // Position below parent
      },
      connections: {
        inputs: [parentId], // Connect to parent
        outputs: []
      }
    };

    // Update parent to include this child in outputs
    const updatedParent = {
      ...parent,
      connections: {
        ...parent.connections,
        outputs: [...parent.connections.outputs, newEvent.id]
      }
    };

    const newTimeline = timeline.map(event => 
      event.id === parentId ? updatedParent : event
    ).concat(newEvent);
    
    updateTimeline(newTimeline);
    setEditingEventId(newEvent.id);
  }, [timeline, updateTimeline]);

  const handleRemoveEvent = useCallback((eventId: string) => {
    const eventToRemove = timeline.find(event => event.id === eventId);
    if (!eventToRemove) return;

    // Don't allow removing the root event (one without any inputs)
    if (eventToRemove.connections.inputs.length === 0) {
      alert('Cannot remove the root event');
      return;
    }

    // Remove all connections to and from this event
    const updatedTimeline = timeline
      .filter(event => event.id !== eventId)
      .map(event => ({
        ...event,
        connections: {
          inputs: event.connections.inputs.filter(id => id !== eventId),
          outputs: event.connections.outputs.filter(id => id !== eventId)
        }
      }));

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