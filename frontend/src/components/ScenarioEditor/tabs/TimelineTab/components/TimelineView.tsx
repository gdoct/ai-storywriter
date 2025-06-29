import React, { useCallback, useMemo, useRef, useState } from 'react';
import { FaCog, FaDice, FaEye, FaPlus, FaTimes } from 'react-icons/fa';
import { Timeline, TimelineEvent } from '../../../../../types/ScenarioTypes';

interface TimelineViewProps {
  timeline: Timeline;
  onTimelineChange: (updates: Partial<Timeline>) => void;
  onAddEvent: () => void;
}

interface ViewState {
  zoom: number;
  panX: number;
  scale: 'years' | 'decades' | 'centuries';
  filterEra: string;
  filterType: 'all' | TimelineEvent['type'];
  showRelationships: boolean;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  timeline,
  onTimelineChange,
  onAddEvent,
}) => {
  const [viewState, setViewState] = useState<ViewState>({
    zoom: 1,
    panX: 0,
    scale: 'years',
    filterEra: 'all',
    filterType: 'all',
    showRelationships: false,
  });
  
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, panX: 0 });
  const [showStats, setShowStats] = useState(false);
  
  const timelineRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Calculate timeline bounds
  const timelineBounds = useMemo(() => {
    if (timeline.events.length === 0) return { start: 0, end: 100, span: 100 };
    
    const years = timeline.events.map(e => e.date.year);
    const start = Math.min(...years);
    const end = Math.max(...years);
    const span = end - start || 100;
    
    return { start: start - span * 0.1, end: end + span * 0.1, span: span * 1.2 };
  }, [timeline.events]);

  // Filter events based on current filters
  const filteredEvents = useMemo(() => {
    return timeline.events.filter(event => {
      if (viewState.filterType !== 'all' && event.type !== viewState.filterType) {
        return false;
      }
      if (viewState.filterEra !== 'all') {
        const era = timeline.eras.find(e => e.id === viewState.filterEra);
        if (era && (event.date.year < era.startDate.year || (era.endDate && event.date.year > era.endDate.year))) {
          return false;
        }
      }
      return true;
    });
  }, [timeline.events, timeline.eras, viewState.filterType, viewState.filterEra]);

  // Calculate timeline statistics
  const stats = useMemo(() => {
    const eventsByType = filteredEvents.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const eventsByImportance = filteredEvents.reduce((acc, event) => {
      acc[event.importance] = (acc[event.importance] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const completedEvents = filteredEvents.filter(e => e.isCompleted).length;
    const plannedEvents = filteredEvents.length - completedEvents;

    return {
      total: filteredEvents.length,
      byType: eventsByType,
      byImportance: eventsByImportance,
      completed: completedEvents,
      planned: plannedEvents,
      span: timelineBounds.span,
    };
  }, [filteredEvents, timelineBounds]);

  // Convert year to pixel position
  const yearToX = useCallback((year: number) => {
    const normalizedPos = (year - timelineBounds.start) / timelineBounds.span;
    return (normalizedPos * 800 * viewState.zoom) + viewState.panX;
  }, [timelineBounds, viewState.zoom, viewState.panX]);

  // Handle zoom
  const handleZoom = useCallback((delta: number) => {
    setViewState(prev => ({
      ...prev,
      zoom: Math.max(0.1, Math.min(10, prev.zoom + delta))
    }));
  }, []);

  // Handle pan
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      panX: viewState.panX
    });
  }, [viewState.panX]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStart.x;
    setViewState(prev => ({
      ...prev,
      panX: dragStart.panX + deltaX
    }));
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Fit timeline to screen
  const fitToScreen = useCallback(() => {
    setViewState(prev => ({
      ...prev,
      zoom: 1,
      panX: 0
    }));
  }, []);

  // Get event color based on type and importance
  const getEventColor = useCallback((event: TimelineEvent) => {
    const typeColors = {
      historical: '#6c757d',
      plot: '#007bff',
      character: '#28a745',
      worldbuilding: '#17a2b8',
      conflict: '#dc3545',
      cultural: '#fd7e14',
      technological: '#6f42c1',
    };
    
    const baseColor = typeColors[event.type] || '#6c757d';
    const opacity = event.importance === 'critical' ? 1 : 
                   event.importance === 'major' ? 0.8 : 
                   event.importance === 'minor' ? 0.6 : 0.4;
    
    return { color: baseColor, opacity };
  }, []);

  // Render event relationships
  const renderRelationships = useCallback(() => {
    if (!viewState.showRelationships) return null;
    
    const connections: React.ReactElement[] = [];
    filteredEvents.forEach(event => {
      event.relatedEvents?.forEach(relatedId => {
        const relatedEvent = filteredEvents.find(e => e.id === relatedId);
        if (relatedEvent) {
          const x1 = yearToX(event.date.year);
          const x2 = yearToX(relatedEvent.date.year);
          const y1 = 100;
          const y2 = 100;
          
          connections.push(
            <line
              key={`${event.id}-${relatedId}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#ccc"
              strokeWidth="1"
              strokeDasharray="5,5"
              opacity="0.5"
            />
          );
        }
      });
    });
    
    return connections;
  }, [filteredEvents, viewState.showRelationships, yearToX]);

  return (
    <div className="timeline-view">
      <div className="timeline-view__header">
        <h3>Timeline Visualization</h3>
        
        <div className="timeline-controls">
          <div className="control-group">
            <label>Era:</label>
            <select 
              value={viewState.filterEra} 
              onChange={(e) => setViewState(prev => ({ ...prev, filterEra: e.target.value }))}
            >
              <option value="all">All Eras</option>
              {timeline.eras.map(era => (
                <option key={era.id} value={era.id}>{era.name}</option>
              ))}
            </select>
          </div>
          
          <div className="control-group">
            <label>Type:</label>
            <select 
              value={viewState.filterType} 
              onChange={(e) => setViewState(prev => ({ ...prev, filterType: e.target.value as any }))}
            >
              <option value="all">All Types</option>
              <option value="historical">Historical</option>
              <option value="plot">Plot</option>
              <option value="character">Character</option>
              <option value="worldbuilding">World Building</option>
              <option value="conflict">Conflict</option>
              <option value="cultural">Cultural</option>
              <option value="technological">Technological</option>
            </select>
          </div>
          
          <div className="control-group">
            <button 
              className={`btn btn-sm ${viewState.showRelationships ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setViewState(prev => ({ ...prev, showRelationships: !prev.showRelationships }))}
              title="Show Event Relationships"
            >
              <FaEye />
            </button>
          </div>
          
          <div className="control-group">
            <button 
              className={`btn btn-sm ${showStats ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setShowStats(!showStats)}
              title="Show Statistics"
            >
              <FaDice />
            </button>
          </div>
        </div>
      </div>
      
      <div className="timeline-view__content">
        {timeline.events.length === 0 ? (
          <div className="empty-timeline">
            <FaCog size={48} color="#ccc" />
            <h4>No Events Yet</h4>
            <p>Create your first event to begin building your timeline</p>
            <button onClick={onAddEvent} className="btn btn-primary">
              Add First Event
            </button>
          </div>
        ) : (
          <>
            <div className="timeline-viewport">
              <div className="zoom-controls">
                <button 
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => handleZoom(0.2)}
                  title="Zoom In"
                >
                  <FaPlus />
                </button>
                <button 
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => handleZoom(-0.2)}
                  title="Zoom Out"
                >
                  <FaTimes />
                </button>
                <button 
                  className="btn btn-sm btn-outline-secondary"
                  onClick={fitToScreen}
                  title="Fit to Screen"
                >
                  <FaEye />
                </button>
                <span className="zoom-level">
                  {Math.round(viewState.zoom * 100)}%
                </span>
              </div>
              
              <div 
                ref={timelineRef}
                className="timeline-canvas"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
              >
                <svg ref={svgRef} width="100%" height="200">
                  {/* Era backgrounds */}
                  {timeline.eras.map((era, index) => {
                    const x1 = yearToX(era.startDate.year);
                    const x2 = yearToX(era.endDate?.year || era.startDate.year + 50);
                    const width = x2 - x1;
                    
                    if (width < 1 || x2 < 0 || x1 > 800) return null;
                    
                    return (
                      <rect
                        key={era.id}
                        x={Math.max(0, x1)}
                        y={20}
                        width={Math.min(800, width)}
                        height={160}
                        fill={`hsl(${index * 60}, 20%, 95%)`}
                        stroke={`hsl(${index * 60}, 40%, 80%)`}
                        strokeWidth="1"
                        opacity="0.3"
                      />
                    );
                  })}
                  
                  {/* Timeline axis */}
                  <line x1="0" y1="100" x2="800" y2="100" stroke="#ddd" strokeWidth="2" />
                  
                  {/* Event relationships */}
                  {renderRelationships()}
                  
                  {/* Events */}
                  {filteredEvents.map(event => {
                    const x = yearToX(event.date.year);
                    if (x < -20 || x > 820) return null;
                    
                    const { color, opacity } = getEventColor(event);
                    const isSelected = selectedEvent === event.id;
                    const radius = event.importance === 'critical' ? 8 : 
                                  event.importance === 'major' ? 6 : 
                                  event.importance === 'minor' ? 4 : 3;
                    
                    return (
                      <g key={event.id}>
                        <circle
                          cx={x}
                          cy="100"
                          r={radius + (isSelected ? 2 : 0)}
                          fill={color}
                          stroke={isSelected ? "#333" : "#fff"}
                          strokeWidth={isSelected ? 3 : 2}
                          opacity={opacity}
                          style={{ cursor: 'pointer' }}
                          onClick={() => setSelectedEvent(isSelected ? null : event.id)}
                        />
                        {(isSelected || viewState.zoom > 1.5) && (
                          <>
                            <text
                              x={x}
                              y="85"
                              textAnchor="middle"
                              fontSize="10"
                              fill="#333"
                              fontWeight="bold"
                            >
                              {event.title}
                            </text>
                            <text
                              x={x}
                              y="125"
                              textAnchor="middle"
                              fontSize="8"
                              fill="#666"
                            >
                              {event.date.displayFormat}
                            </text>
                          </>
                        )}
                        {!event.isCompleted && (
                          <circle
                            cx={x}
                            cy="100"
                            r={radius}
                            fill="none"
                            stroke={color}
                            strokeWidth="2"
                            strokeDasharray="3,3"
                            opacity={opacity}
                          />
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
            
            {showStats && (
              <div className="timeline-stats">
                <h4>Timeline Statistics</h4>
                <div className="stats-grid">
                  <div className="stat-card">
                    <h5>Total Events</h5>
                    <div className="stat-value">{stats.total}</div>
                  </div>
                  <div className="stat-card">
                    <h5>Completed</h5>
                    <div className="stat-value">{stats.completed}</div>
                  </div>
                  <div className="stat-card">
                    <h5>Planned</h5>
                    <div className="stat-value">{stats.planned}</div>
                  </div>
                  <div className="stat-card">
                    <h5>Time Span</h5>
                    <div className="stat-value">{Math.round(stats.span)} years</div>
                  </div>
                </div>
                
                <div className="stats-breakdown">
                  <div className="breakdown-section">
                    <h6>By Type</h6>
                    {Object.entries(stats.byType).map(([type, count]) => (
                      <div key={type} className="breakdown-item">
                        <span className="breakdown-label">{type}</span>
                        <span className="breakdown-value">{count}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="breakdown-section">
                    <h6>By Importance</h6>
                    {Object.entries(stats.byImportance).map(([importance, count]) => (
                      <div key={importance} className="breakdown-item">
                        <span className="breakdown-label">{importance}</span>
                        <span className="breakdown-value">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {selectedEvent && (
              <div className="event-details-panel">
                {(() => {
                  const event = filteredEvents.find(e => e.id === selectedEvent);
                  if (!event) return null;
                  
                  return (
                    <div className="event-details">
                      <h5>{event.title}</h5>
                      <p><strong>Date:</strong> {event.date.displayFormat}</p>
                      <p><strong>Type:</strong> {event.type}</p>
                      <p><strong>Importance:</strong> {event.importance}</p>
                      {event.description && <p><strong>Description:</strong> {event.description}</p>}
                      {event.consequences && <p><strong>Consequences:</strong> {event.consequences}</p>}
                      <button 
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => setSelectedEvent(null)}
                      >
                        Close
                      </button>
                    </div>
                  );
                })()}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
