import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TimelineEvent } from '../../../../types/ScenarioTypes';

interface TimelineCanvasProps {
  events: TimelineEvent[];
  selectedEventId: string | null;
  zoom: number;
  panX: number;
  panY: number;
  onEventSelect: (eventId: string) => void;
  onEventEdit: (eventId: string) => void;
  onAddChild: (parentId: string) => void;
  onRemoveEvent: (eventId: string) => void;
  onPan: (deltaX: number, deltaY: number) => void;
  onZoom: (newZoom: number) => void;
  onEventUpdate: (eventId: string, updates: Partial<TimelineEvent>) => void;
}

interface LayoutEvent extends TimelineEvent {
  layoutX: number;
  layoutY: number;
  children: LayoutEvent[];
}

const EVENT_WIDTH = 180;
const EVENT_HEIGHT = 80;
const ROW_HEIGHT = 120;
const COLUMN_WIDTH = 220;

export const TimelineCanvas: React.FC<TimelineCanvasProps> = ({
  events,
  selectedEventId,
  zoom,
  panX,
  panY,
  onEventSelect,
  onEventEdit,
  onAddChild,
  onRemoveEvent,
  onPan,
  onZoom,
  onEventUpdate,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggedEventId, setDraggedEventId] = useState<string | null>(null);
  const [draggedEventOffset, setDraggedEventOffset] = useState({ x: 0, y: 0 });

  // Calculate layout for events
  const layoutEvents = useMemo(() => {
    const eventMap = new Map<string, LayoutEvent>();
    
    // Convert events to layout events and build map
    events.forEach(event => {
      eventMap.set(event.id, {
        ...event,
        layoutX: 0,
        layoutY: 0,
        children: []
      });
    });

    // Build parent-child relationships
    events.forEach(event => {
      if (event.parentId) {
        const parent = eventMap.get(event.parentId);
        const child = eventMap.get(event.id);
        if (parent && child) {
          parent.children.push(child);
        }
      }
    });

    // Find root event (no parent)
    const rootEvent = Array.from(eventMap.values()).find(event => !event.parentId);
    if (!rootEvent) return [];

    // Calculate positions using layout algorithm
    const positioned = new Set<string>();
    const rows: LayoutEvent[][] = [];

    const positionEvent = (event: LayoutEvent, row: number, column: number) => {
      if (positioned.has(event.id)) return;
      
      // Ensure row exists
      while (rows.length <= row) {
        rows.push([]);
      }

      // Position event
      event.layoutX = column * COLUMN_WIDTH + 100; // 100px offset from left
      event.layoutY = row * ROW_HEIGHT + 50; // 50px offset from top
      event.row = row;
      
      rows[row].push(event);
      positioned.add(event.id);

      // Position children in next row
      if (event.children.length > 0) {
        // Limit to max 3 children
        const children = event.children.slice(0, 3);
        const childStartColumn = Math.max(0, column - Math.floor(children.length / 2));
        
        children.forEach((child, index) => {
          positionEvent(child, row + 1, childStartColumn + index);
        });
      }
    };

    // Start positioning from root
    positionEvent(rootEvent, 0, 0);

    // Center the layout
    if (rows.length > 0) {
      const maxWidth = Math.max(...rows.map(row => row.length));
      const centerOffset = (maxWidth * COLUMN_WIDTH) / 2;
      
      Array.from(eventMap.values()).forEach(event => {
        event.layoutX += centerOffset;
      });
    }

    return Array.from(eventMap.values());
  }, [events]);

  // Calculate connections between events
  const connections = useMemo(() => {
    const lines: Array<{
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      isParentChild: boolean;
    }> = [];

    layoutEvents.forEach(event => {
      event.children.forEach(child => {
        const startX = event.layoutX + EVENT_WIDTH / 2;
        const startY = event.layoutY + EVENT_HEIGHT;
        const endX = child.layoutX + EVENT_WIDTH / 2;
        const endY = child.layoutY;

        lines.push({
          x1: startX,
          y1: startY,
          x2: endX,
          y2: endY,
          isParentChild: true
        });
      });

      // Add connections to orphaned events (connect to first event in next row)
      if (event.children.length === 0) {
        const nextRowEvents = layoutEvents.filter(e => e.row === event.row + 1);
        if (nextRowEvents.length > 0) {
          const firstInNextRow = nextRowEvents.reduce((prev, curr) => 
            prev.layoutX < curr.layoutX ? prev : curr
          );
          
          const startX = event.layoutX + EVENT_WIDTH / 2;
          const startY = event.layoutY + EVENT_HEIGHT;
          const endX = firstInNextRow.layoutX + EVENT_WIDTH / 2;
          const endY = firstInNextRow.layoutY;

          lines.push({
            x1: startX,
            y1: startY,
            x2: endX,
            y2: endY,
            isParentChild: false
          });
        }
      }
    });

    return lines;
  }, [layoutEvents]);

  // Handle mouse events for panning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === svgRef.current) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
    }
  }, [panX, panY]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && !draggedEventId) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      onPan(deltaX - panX, deltaY - panY);
    }
  }, [isDragging, draggedEventId, dragStart, panX, panY, onPan]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDraggedEventId(null);
    setDraggedEventOffset({ x: 0, y: 0 });
  }, []);

  // Handle wheel events for zooming
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Calculate mouse position in SVG coordinates
    const mouseX = (e.clientX - rect.left) / zoom + panX;
    const mouseY = (e.clientY - rect.top) / zoom + panY;

    // Zoom delta
    const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(0.1, Math.min(3, zoom + zoomDelta));

    // Calculate new pan to keep mouse position stable
    const zoomRatio = newZoom / zoom;
    const newPanX = mouseX - (mouseX - panX) * zoomRatio;
    const newPanY = mouseY - (mouseY - panY) * zoomRatio;

    // Update zoom and pan through parent
    onZoom(newZoom);
    onPan(newPanX - panX, newPanY - panY);
  }, [zoom, panX, panY, onPan, onZoom]);

  // Event handlers
  const handleEventClick = useCallback((eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onEventSelect(eventId);
  }, [onEventSelect]);

  const handleEventDoubleClick = useCallback((eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onEventEdit(eventId);
  }, [onEventEdit]);

  const handleAddChildClick = useCallback((eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onAddChild(eventId);
  }, [onAddChild]);

  const handleRemoveEventClick = useCallback((eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onRemoveEvent(eventId);
  }, [onRemoveEvent]);

  // Handle event drag start
  const handleEventMouseDown = useCallback((eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const event = layoutEvents.find(ev => ev.id === eventId);
    if (!event) return;

    setDraggedEventId(eventId);
    setDraggedEventOffset({
      x: (e.clientX - rect.left) / zoom + panX - event.layoutX,
      y: (e.clientY - rect.top) / zoom + panY - event.layoutY
    });
  }, [layoutEvents, zoom, panX, panY]);

  // Handle event drag
  const handleEventMouseMove = useCallback((e: React.MouseEvent) => {
    if (!draggedEventId || !svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const newX = (e.clientX - rect.left) / zoom + panX - draggedEventOffset.x;
    const newY = (e.clientY - rect.top) / zoom + panY - draggedEventOffset.y;

    // Snap to grid (optional)
    const gridSize = 20;
    const snappedX = Math.round(newX / gridSize) * gridSize;
    const snappedY = Math.round(newY / gridSize) * gridSize;

    onEventUpdate(draggedEventId, {
      position: { x: snappedX, y: snappedY }
    });
  }, [draggedEventId, zoom, panX, panY, draggedEventOffset, onEventUpdate]);

  // Calculate viewport dimensions
  const maxX = Math.max(...layoutEvents.map(e => e.layoutX + EVENT_WIDTH), 800);
  const maxY = Math.max(...layoutEvents.map(e => e.layoutY + EVENT_HEIGHT), 600);
  const viewBoxWidth = maxX + 200;
  const viewBoxHeight = maxY + 200;

  return (
    <div className="timeline-canvas">
      <svg
        ref={svgRef}
        className="timeline-canvas__svg"
        viewBox={`${-panX} ${-panY} ${viewBoxWidth / zoom} ${viewBoxHeight / zoom}`}
        onMouseDown={handleMouseDown}
        onMouseMove={(e) => {
          handleMouseMove(e);
          handleEventMouseMove(e);
        }}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* Define arrow marker */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
            className="timeline-arrow-marker"
          >
            <polygon points="0 0, 10 3.5, 0 7" />
          </marker>
        </defs>

        {/* Render connections */}
        {connections.map((connection, index) => (
          <line
            key={index}
            x1={connection.x1}
            y1={connection.y1}
            x2={connection.x2}
            y2={connection.y2}
            className={`timeline-connection ${!connection.isParentChild ? 'timeline-connection--merge' : ''}`}
          />
        ))}

        {/* Render events */}
        {layoutEvents.map(event => (
          <g
            key={event.id}
            className={`timeline-event ${selectedEventId === event.id ? 'timeline-event--selected' : ''}`}
            transform={`translate(${event.layoutX}, ${event.layoutY})`}
            onClick={(e) => handleEventClick(event.id, e)}
            onDoubleClick={(e) => handleEventDoubleClick(event.id, e)}
            onMouseDown={(e) => handleEventMouseDown(event.id, e)}
          >
            {/* Event box */}
            <rect
              className="timeline-event__box"
              width={EVENT_WIDTH}
              height={EVENT_HEIGHT}
              x="0"
              y="0"
            />

            {/* Event title */}
            <text
              className="timeline-event__title"
              x={EVENT_WIDTH / 2}
              y={EVENT_HEIGHT / 2 - 18}
            >
              {event.title.length > 20 ? `${event.title.substring(0, 20)}...` : event.title}
            </text>

            {/* Event location */}
            {event.location && (
              <text
                className="timeline-event__location"
                x={EVENT_WIDTH / 2}
                y={EVENT_HEIGHT / 2 - 2}
              >
                📍 {event.location.length > 15 ? `${event.location.substring(0, 15)}...` : event.location}
              </text>
            )}

            {/* Event date */}
            {event.date && (
              <text
                className="timeline-event__subtitle"
                x={EVENT_WIDTH / 2}
                y={EVENT_HEIGHT / 2 + 14}
              >
                {event.date}
              </text>
            )}

            {/* Include in story badge */}
            <circle
              className={`timeline-event__badge ${!event.includeInStory ? 'timeline-event__badge--backstory' : ''}`}
              cx={EVENT_WIDTH - 15}
              cy={15}
              r="6"
            >
              <title>{event.includeInStory ? 'Include in story' : 'Backstory only'}</title>
            </circle>

            {/* Control buttons (visible on hover) */}
            <g className="timeline-event__controls">
              {/* Add child button */}
              <g
                className="timeline-event__control-btn timeline-event__control-btn--add"
                transform={`translate(${EVENT_WIDTH - 35}, ${EVENT_HEIGHT - 25})`}
                onClick={(e) => handleAddChildClick(event.id, e)}
              >
                <circle
                  className="timeline-event__control-bg"
                  cx="10"
                  cy="10"
                  r="10"
                />
                <text
                  className="timeline-event__control-icon"
                  x="10"
                  y="10"
                >
                  +
                </text>
              </g>

              {/* Remove event button (not for root) */}
              {event.parentId && (
                <g
                  className="timeline-event__control-btn timeline-event__control-btn--remove"
                  transform={`translate(${EVENT_WIDTH - 60}, ${EVENT_HEIGHT - 25})`}
                  onClick={(e) => handleRemoveEventClick(event.id, e)}
                >
                  <circle
                    className="timeline-event__control-bg"
                    cx="10"
                    cy="10"
                    r="10"
                  />
                  <text
                    className="timeline-event__control-icon"
                    x="10"
                    y="10"
                  >
                    ×
                  </text>
                </g>
              )}
            </g>
          </g>
        ))}
      </svg>
    </div>
  );
};