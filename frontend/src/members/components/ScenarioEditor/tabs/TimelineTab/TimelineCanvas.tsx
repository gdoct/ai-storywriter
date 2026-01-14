import React, { useCallback, useMemo, useRef, useState } from 'react';
import { TimelineEvent } from '@shared/types/ScenarioTypes';

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

interface Connection {
  id: string;
  fromEventId: string;
  toEventId: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

interface DragState {
  type: 'none' | 'event' | 'connection';
  eventId?: string;
  offset?: { x: number; y: number };
  fromEventId?: string;
  currentX?: number;
  currentY?: number;
}

const EVENT_WIDTH = 180;
const EVENT_HEIGHT = 80;
const CONNECTION_POINT_RADIUS = 8;
const GRID_SIZE = 20;

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
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragState, setDragState] = useState<DragState>({ type: 'none' });
  const [hoveredConnectionPoint, setHoveredConnectionPoint] = useState<{ eventId: string; type: 'input' | 'output' } | null>(null);

  // Use events directly (no migration needed)
  const canvasEvents = events;

  // Detect circular dependencies using DFS
  const hasCircularDependency = useCallback((fromId: string, _toId: string): boolean => {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    const dfs = (currentId: string): boolean => {
      if (recursionStack.has(currentId)) return true;
      if (visited.has(currentId)) return false;
      
      visited.add(currentId);
      recursionStack.add(currentId);
      
      const currentEvent = canvasEvents.find(e => e.id === currentId);
      if (currentEvent) {
        for (const outputId of currentEvent.connections.outputs) {
          if (dfs(outputId)) return true;
        }
      }
      
      recursionStack.delete(currentId);
      return false;
    };
    
    // Temporarily add the connection and check for cycles
    return dfs(fromId);
  }, [canvasEvents]);

  // Calculate connections between events
  const connections = useMemo((): Connection[] => {
    const connectionList: Connection[] = [];
    
    canvasEvents.forEach(event => {
      event.connections.outputs.forEach(outputId => {
        const targetEvent = canvasEvents.find(e => e.id === outputId);
        if (targetEvent) {
          connectionList.push({
            id: `${event.id}-${outputId}`,
            fromEventId: event.id,
            toEventId: outputId,
            fromX: event.position.x + EVENT_WIDTH / 2,
            fromY: event.position.y + EVENT_HEIGHT,
            toX: targetEvent.position.x + EVENT_WIDTH / 2,
            toY: targetEvent.position.y
          });
        }
      });
    });
    
    return connectionList;
  }, [canvasEvents]);

  // Convert screen coordinates to SVG coordinates
  const screenToSVG = useCallback((screenX: number, screenY: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    
    return {
      x: (screenX - rect.left) / zoom - panX,
      y: (screenY - rect.top) / zoom - panY
    };
  }, [zoom, panX, panY]);

  // Handle mouse events for panning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Allow panning when clicking on SVG background, grid, or connections
    const target = e.target as SVGElement;
    const isBackground = target === svgRef.current || 
                        target.classList.contains('timeline-grid') ||
                        target.tagName === 'rect' && target.getAttribute('fill') === 'url(#grid)';
    
    if (isBackground) {
      setIsPanning(true);
      setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
    }
  }, [panX, panY]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning && dragState.type === 'none') {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      onPan(deltaX - panX, deltaY - panY);
    } else if (dragState.type === 'event' && dragState.eventId) {
      const svgPos = screenToSVG(e.clientX, e.clientY);
      const newX = Math.round((svgPos.x - (dragState.offset?.x || 0)) / GRID_SIZE) * GRID_SIZE;
      const newY = Math.round((svgPos.y - (dragState.offset?.y || 0)) / GRID_SIZE) * GRID_SIZE;
      
      onEventUpdate(dragState.eventId, {
        position: { x: Math.max(0, newX), y: Math.max(0, newY) }
      });
    } else if (dragState.type === 'connection') {
      const svgPos = screenToSVG(e.clientX, e.clientY);
      setDragState(prev => ({
        ...prev,
        currentX: svgPos.x,
        currentY: svgPos.y
      }));
    }
  }, [isPanning, dragState, dragStart, panX, panY, onPan, screenToSVG, onEventUpdate]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setDragState({ type: 'none' });
    setHoveredConnectionPoint(null);
  }, []);

  // Handle wheel events for zooming
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Calculate mouse position in SVG coordinates
    const mouseX = (e.clientX - rect.left) / zoom - panX;
    const mouseY = (e.clientY - rect.top) / zoom - panY;

    // Zoom delta
    const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(0.1, Math.min(3, zoom + zoomDelta));

    // Calculate new pan to keep mouse position stable
    const zoomRatio = newZoom / zoom;
    const newPanX = mouseX - (mouseX + panX) * zoomRatio;
    const newPanY = mouseY - (mouseY + panY) * zoomRatio;

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
    const svgPos = screenToSVG(e.clientX, e.clientY);
    const event = canvasEvents.find(ev => ev.id === eventId);
    if (!event) return;

    setDragState({
      type: 'event',
      eventId,
      offset: {
        x: svgPos.x - event.position.x,
        y: svgPos.y - event.position.y
      }
    });
  }, [canvasEvents, screenToSVG]);

  // Handle connection point interactions
  const handleConnectionStart = useCallback((fromEventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const svgPos = screenToSVG(e.clientX, e.clientY);
    
    setDragState({
      type: 'connection',
      fromEventId,
      currentX: svgPos.x,
      currentY: svgPos.y
    });
  }, [screenToSVG]);

  const handleConnectionEnd = useCallback((toEventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (dragState.type === 'connection' && dragState.fromEventId && dragState.fromEventId !== toEventId) {
      // Check for circular dependency
      if (!hasCircularDependency(dragState.fromEventId, toEventId)) {
        // Update connections
        const fromEvent = canvasEvents.find(event => event.id === dragState.fromEventId);
        const toEvent = canvasEvents.find(event => event.id === toEventId);
        
        if (fromEvent && toEvent) {
          // Add to outputs of source event
          const newOutputs = [...fromEvent.connections.outputs];
          if (!newOutputs.includes(toEventId)) {
            newOutputs.push(toEventId);
            onEventUpdate(dragState.fromEventId!, {
              connections: { ...fromEvent.connections, outputs: newOutputs }
            });
          }
          
          // Add to inputs of target event
          const newInputs = [...toEvent.connections.inputs];
          if (!newInputs.includes(dragState.fromEventId)) {
            newInputs.push(dragState.fromEventId);
            onEventUpdate(toEventId, {
              connections: { ...toEvent.connections, inputs: newInputs }
            });
          }
        }
      }
    }
    
    setDragState({ type: 'none' });
  }, [dragState, hasCircularDependency, canvasEvents, onEventUpdate]);

  const handleConnectionRemove = useCallback((connection: Connection, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const fromEvent = canvasEvents.find(event => event.id === connection.fromEventId);
    const toEvent = canvasEvents.find(event => event.id === connection.toEventId);
    
    if (fromEvent && toEvent) {
      // Remove from outputs of source event
      const newOutputs = fromEvent.connections.outputs.filter(id => id !== connection.toEventId);
      onEventUpdate(connection.fromEventId, {
        connections: { ...fromEvent.connections, outputs: newOutputs }
      });
      
      // Remove from inputs of target event
      const newInputs = toEvent.connections.inputs.filter(id => id !== connection.fromEventId);
      onEventUpdate(connection.toEventId, {
        connections: { ...toEvent.connections, inputs: newInputs }
      });
    }
  }, [canvasEvents, onEventUpdate]);

  // Calculate viewport dimensions
  const maxX = Math.max(...canvasEvents.map(e => e.position.x + EVENT_WIDTH), 800);
  const maxY = Math.max(...canvasEvents.map(e => e.position.y + EVENT_HEIGHT), 600);
  const viewBoxWidth = maxX + 200;
  const viewBoxHeight = maxY + 200;

  return (
    <div className="timeline-canvas">
      <svg
        ref={svgRef}
        className="timeline-canvas__svg"
        viewBox={`${-panX} ${-panY} ${viewBoxWidth / zoom} ${viewBoxHeight / zoom}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
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
          
          {/* Grid pattern */}
          <pattern
            id="grid"
            width={GRID_SIZE}
            height={GRID_SIZE}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`}
              fill="none"
              stroke="#e0e0e0"
              strokeWidth="0.5"
              opacity="0.3"
            />
          </pattern>
        </defs>

        {/* Background grid */}
        <rect
          x={-panX}
          y={-panY}
          width={viewBoxWidth / zoom}
          height={viewBoxHeight / zoom}
          fill="url(#grid)"
          className="timeline-grid"
        />

        {/* Render connections */}
        {connections.map((connection) => (
          <g key={connection.id}>
            <line
              x1={connection.fromX}
              y1={connection.fromY}
              x2={connection.toX}
              y2={connection.toY}
              className="timeline-connection"
              markerEnd="url(#arrowhead)"
              onClick={(e) => handleConnectionRemove(connection, e)}
            />
          </g>
        ))}

        {/* Render active connection during drag */}
        {dragState.type === 'connection' && dragState.fromEventId && (
          <line
            x1={canvasEvents.find(e => e.id === dragState.fromEventId)?.position.x! + EVENT_WIDTH / 2}
            y1={canvasEvents.find(e => e.id === dragState.fromEventId)?.position.y! + EVENT_HEIGHT}
            x2={dragState.currentX || 0}
            y2={dragState.currentY || 0}
            className="timeline-connection timeline-connection--active"
            strokeDasharray="5,5"
          />
        )}

        {/* Render events */}
        {canvasEvents.map(event => (
          <g
            key={event.id}
            className={`timeline-event ${selectedEventId === event.id ? 'timeline-event--selected' : ''}`}
            transform={`translate(${event.position.x}, ${event.position.y})`}
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
              textAnchor="middle"
            >
              {event.title.length > 20 ? `${event.title.substring(0, 20)}...` : event.title}
            </text>

            {/* Event location */}
            {event.location && (
              <text
                className="timeline-event__location"
                x={EVENT_WIDTH / 2}
                y={EVENT_HEIGHT / 2 - 2}
                textAnchor="middle"
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
                textAnchor="middle"
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

            {/* Input connection point (top) */}
            <circle
              className={`timeline-connection-point timeline-connection-point--input ${
                hoveredConnectionPoint?.eventId === event.id && hoveredConnectionPoint?.type === 'input' 
                  ? 'timeline-connection-point--hovered' : ''
              }`}
              cx={EVENT_WIDTH / 2}
              cy={0}
              r={CONNECTION_POINT_RADIUS}
              onMouseEnter={() => setHoveredConnectionPoint({ eventId: event.id, type: 'input' })}
              onMouseLeave={() => setHoveredConnectionPoint(null)}
              onMouseUp={(e) => handleConnectionEnd(event.id, e)}
            >
              <title>Input connection point</title>
            </circle>

            {/* Output connection point (bottom) */}
            <circle
              className={`timeline-connection-point timeline-connection-point--output ${
                hoveredConnectionPoint?.eventId === event.id && hoveredConnectionPoint?.type === 'output' 
                  ? 'timeline-connection-point--hovered' : ''
              }`}
              cx={EVENT_WIDTH / 2}
              cy={EVENT_HEIGHT}
              r={CONNECTION_POINT_RADIUS}
              onMouseEnter={() => setHoveredConnectionPoint({ eventId: event.id, type: 'output' })}
              onMouseLeave={() => setHoveredConnectionPoint(null)}
              onMouseDown={(e) => handleConnectionStart(event.id, e)}
            >
              <title>Output connection point</title>
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
                  y="14"
                  textAnchor="middle"
                >
                  +
                </text>
              </g>

              {/* Remove event button (not for root without inputs) */}
              {event.connections.inputs.length > 0 && (
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
                    y="14"
                    textAnchor="middle"
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