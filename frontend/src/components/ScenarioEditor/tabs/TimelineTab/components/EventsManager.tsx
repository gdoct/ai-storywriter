import React, { useCallback, useMemo, useState } from 'react';
import { FaDice, FaPlus, FaTimes, FaTrash } from 'react-icons/fa';
import { TimelineEvent } from '../../../../../types/ScenarioTypes';

interface EventsManagerProps {
  events: TimelineEvent[];
  onEventsChange: (events: TimelineEvent[]) => void;
  onAddEvent: () => void;
  scenarioContext?: {
    title?: string;
    genre?: string;
    theme?: string;
    characters?: Array<{ name: string; role: string }>;
  };
}

interface FilterState {
  search: string;
  type: 'all' | TimelineEvent['type'];
  importance: 'all' | TimelineEvent['importance'];
  completed: 'all' | 'completed' | 'planned';
  dateRange: {
    start?: number;
    end?: number;
  };
}

export const EventsManager: React.FC<EventsManagerProps> = ({
  events,
  onEventsChange,
  onAddEvent,
  scenarioContext,
}) => {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'type' | 'importance' | 'title'>('date');
  const [showFilters, setShowFilters] = useState(false);
  const [showGenerationMenu, setShowGenerationMenu] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    type: 'all',
    importance: 'all',
    completed: 'all',
    dateRange: {},
  });

  // Advanced filtering and search
  const filteredAndSortedEvents = useMemo(() => {
    let filtered = events.filter(event => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const searchableText = [
          event.title,
          event.description,
          event.consequences,
          event.causes,
          event.storyRelevance,
          event.location || '',
          ...event.participants,
          ...event.tags,
        ].join(' ').toLowerCase();
        
        if (!searchableText.includes(searchLower)) {
          return false;
        }
      }

      // Type filter
      if (filters.type !== 'all' && event.type !== filters.type) {
        return false;
      }

      // Importance filter
      if (filters.importance !== 'all' && event.importance !== filters.importance) {
        return false;
      }

      // Completion filter
      if (filters.completed !== 'all') {
        if (filters.completed === 'completed' && !event.isCompleted) {
          return false;
        }
        if (filters.completed === 'planned' && event.isCompleted) {
          return false;
        }
      }

      // Date range filter
      if (filters.dateRange.start && event.date.year < filters.dateRange.start) {
        return false;
      }
      if (filters.dateRange.end && event.date.year > filters.dateRange.end) {
        return false;
      }

      return true;
    });

    // Sort filtered results
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return a.date.year - b.date.year;
        case 'type':
          return a.type.localeCompare(b.type);
        case 'title':
          return (a.title || '').localeCompare(b.title || '');
        case 'importance':
          const importanceOrder = { critical: 0, major: 1, minor: 2, background: 3 };
          return importanceOrder[a.importance] - importanceOrder[b.importance];
        default:
          return 0;
      }
    });
  }, [events, filters, sortBy]);

  const handleFilterChange = useCallback((key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      type: 'all',
      importance: 'all',
      completed: 'all',
      dateRange: {},
    });
  }, []);

  const hasActiveFilters = useMemo(() => {
    return filters.search || 
           filters.type !== 'all' || 
           filters.importance !== 'all' || 
           filters.completed !== 'all' ||
           filters.dateRange.start ||
           filters.dateRange.end;
  }, [filters]);

  // AI Generation methods (placeholder implementations)
  const handleGenerateEvent = useCallback(async (
    type: 'historical' | 'plot',
    subType: string
  ) => {
    if (!scenarioContext) return;
    
    setIsGenerating(true);
    try {
      // Placeholder implementation - create a basic event
      const now = new Date().toISOString();
      const year = new Date().getFullYear() + Math.floor(Math.random() * 100);
      
      const titles = {
        historical: {
          background: `The Great ${scenarioContext.title || 'Story'} Foundation`,
          conflict: `The War of ${scenarioContext.title || 'Two Kingdoms'}`,
          cultural: `The ${scenarioContext.title || 'Cultural'} Renaissance`,
        },
        plot: {
          rising: `The Challenge Emerges`,
          character: `Character Revelation`,
          climactic: `The Turning Point`,
        },
      }[type]?.[subType] || 'Generated Event';

      const newEvent: TimelineEvent = {
        id: `generated-${Date.now()}-${Math.random()}`,
        title: titles,
        description: `This is a generated ${type} event. Edit this description to add your own details.`,
        type,
        importance: 'minor' as const,
        date: {
          year,
          displayFormat: `Year ${year}`,
          isApproximate: true,
        },
        location: '',
        participants: [],
        consequences: 'To be determined based on story development.',
        causes: 'Generated as part of timeline development.',
        relatedEvents: [],
        storyRelevance: 'This event contributes to the overall narrative structure.',
        tags: ['generated', type, subType],
        isCompleted: false,
        createdAt: now,
        updatedAt: now,
      };
      
      const updatedEvents = [...events, newEvent];
      onEventsChange(updatedEvents);
      setShowGenerationMenu(false);
    } catch (error) {
      console.error('Failed to generate event:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [events, onEventsChange, scenarioContext]);

  const handleGenerateSequence = useCallback(async (theme?: string) => {
    if (!scenarioContext) return;
    
    setIsGenerating(true);
    try {
      // Generate 3 related events
      const newEvents = Array.from({ length: 3 }, (_, index) => {
        const now = new Date().toISOString();
        const year = new Date().getFullYear() + index * 10;
        
        return {
          id: `generated-sequence-${Date.now()}-${index}`,
          title: `Event ${index + 1}: ${theme || 'Story Development'}`,
          description: `Part ${index + 1} of a generated event sequence. Edit to add specific details.`,
          type: 'plot' as const,
          importance: 'minor' as const,
          date: {
            year,
            displayFormat: `Year ${year}`,
            isApproximate: true,
          },
          location: '',
          participants: [],
          consequences: `Leads to subsequent events in the sequence.`,
          causes: index === 0 ? 'Starting event of the sequence' : `Follows from previous event in sequence`,
          relatedEvents: [],
          storyRelevance: `Part of a ${theme || 'story'} development sequence.`,
          tags: ['generated', 'sequence', theme || 'story'],
          isCompleted: false,
          createdAt: now,
          updatedAt: now,
        };
      });
      
      const updatedEvents = [...events, ...newEvents];
      onEventsChange(updatedEvents);
      setShowGenerationMenu(false);
    } catch (error) {
      console.error('Failed to generate event sequence:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [events, onEventsChange, scenarioContext]);

  const handleEditEvent = useCallback((eventId: string, updates: Partial<TimelineEvent>) => {
    const updatedEvents = events.map(event =>
      event.id === eventId ? { ...event, ...updates, updatedAt: new Date().toISOString() } : event
    );
    onEventsChange(updatedEvents);
  }, [events, onEventsChange]);

  const handleDeleteEvent = useCallback((eventId: string) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      const updatedEvents = events.filter(event => event.id !== eventId);
      onEventsChange(updatedEvents);
    }
  }, [events, onEventsChange]);

  const getEventTypeColor = (type: TimelineEvent['type']) => {
    const colors = {
      historical: '#6c757d',
      plot: '#007bff',
      character: '#28a745',
      world: '#fd7e14',
      planned: '#6f42c1',
      other: '#20c997',
    };
    return colors[type] || '#6c757d';
  };

  const getImportanceIcon = (importance: TimelineEvent['importance']) => {
    switch (importance) {
      case 'critical': return '🔴';
      case 'major': return '🟡';
      case 'minor': return '🟢';
      case 'background': return '⚪';
      default: return '⚫';
    }
  };

  return (
    <div className="events-manager">
      <div className="events-manager__header">
        <div className="events-manager__search-bar">
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="Search events, descriptions, participants, tags..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
          
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`btn btn-outline ${showFilters ? 'active' : ''}`}
          >
            🔧 Filters {hasActiveFilters && <span className="filter-count">●</span>}
          </button>
          
          {hasActiveFilters && (
            <button onClick={clearFilters} className="btn btn-outline">
              <FaTimes /> Clear
            </button>
          )}
        </div>

        <div className="events-manager__controls">
          <button onClick={onAddEvent} className="btn btn-primary">
            <FaPlus /> Add Event
          </button>
          
          {scenarioContext && (
            <div className="ai-generation-controls">
              <button 
                onClick={() => setShowGenerationMenu(!showGenerationMenu)}
                className={`btn btn-outline-primary ${showGenerationMenu ? 'active' : ''}`}
                disabled={isGenerating}
              >
                <FaDice /> {isGenerating ? 'Generating...' : 'AI Generate'}
              </button>
              
              {showGenerationMenu && (
                <div className="generation-menu">
                  <div className="generation-section">
                    <h6>Historical Events</h6>
                    <button 
                      onClick={() => handleGenerateEvent('historical', 'background')}
                      className="btn btn-sm btn-outline-secondary"
                      disabled={isGenerating}
                    >
                      Background Event
                    </button>
                    <button 
                      onClick={() => handleGenerateEvent('historical', 'conflict')}
                      className="btn btn-sm btn-outline-secondary"
                      disabled={isGenerating}
                    >
                      Historical Conflict
                    </button>
                    <button 
                      onClick={() => handleGenerateEvent('historical', 'cultural')}
                      className="btn btn-sm btn-outline-secondary"
                      disabled={isGenerating}
                    >
                      Cultural Milestone
                    </button>
                  </div>
                  
                  <div className="generation-section">
                    <h6>Plot Events</h6>
                    <button 
                      onClick={() => handleGenerateEvent('plot', 'rising')}
                      className="btn btn-sm btn-outline-secondary"
                      disabled={isGenerating}
                    >
                      Rising Action
                    </button>
                    <button 
                      onClick={() => handleGenerateEvent('plot', 'character')}
                      className="btn btn-sm btn-outline-secondary"
                      disabled={isGenerating}
                    >
                      Character Moment
                    </button>
                    <button 
                      onClick={() => handleGenerateEvent('plot', 'climactic')}
                      className="btn btn-sm btn-outline-secondary"
                      disabled={isGenerating}
                    >
                      Climactic Event
                    </button>
                  </div>
                  
                  <div className="generation-section">
                    <h6>Event Sequences</h6>
                    <button 
                      onClick={() => handleGenerateSequence()}
                      className="btn btn-sm btn-outline-primary"
                      disabled={isGenerating}
                    >
                      Generate 3 Related Events
                    </button>
                    <button 
                      onClick={() => handleGenerateSequence(scenarioContext.theme)}
                      className="btn btn-sm btn-outline-primary"
                      disabled={isGenerating}
                    >
                      Themed Event Sequence
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as any)}
            className="form-select"
          >
            <option value="date">Sort by Date</option>
            <option value="title">Sort by Title</option>
            <option value="type">Sort by Type</option>
            <option value="importance">Sort by Importance</option>
          </select>
        </div>
        
        <div className="events-manager__stats">
          <span className="badge badge-info">
            {filteredAndSortedEvents.length} of {events.length} Events
          </span>
        </div>
      </div>

      {showFilters && (
        <div className="advanced-filters">
          <div className="filter-row">
            <div className="filter-group">
              <label>Type:</label>
              <select 
                value={filters.type} 
                onChange={(e) => handleFilterChange('type', e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="historical">Historical</option>
                <option value="plot">Plot</option>
                <option value="character">Character</option>
                <option value="world">World</option>
                <option value="planned">Planned</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label>Importance:</label>
              <select 
                value={filters.importance} 
                onChange={(e) => handleFilterChange('importance', e.target.value)}
              >
                <option value="all">All Levels</option>
                <option value="critical">Critical</option>
                <option value="major">Major</option>
                <option value="minor">Minor</option>
                <option value="background">Background</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label>Status:</label>
              <select 
                value={filters.completed} 
                onChange={(e) => handleFilterChange('completed', e.target.value)}
              >
                <option value="all">All Events</option>
                <option value="completed">Completed</option>
                <option value="planned">Planned</option>
              </select>
            </div>
          </div>
          
          <div className="filter-row">
            <div className="filter-group">
              <label>Year Range:</label>
              <input
                type="number"
                placeholder="Start Year"
                value={filters.dateRange.start || ''}
                onChange={(e) => handleFilterChange('dateRange', { 
                  ...filters.dateRange, 
                  start: e.target.value ? parseInt(e.target.value) : undefined 
                })}
              />
              <span>to</span>
              <input
                type="number"
                placeholder="End Year"
                value={filters.dateRange.end || ''}
                onChange={(e) => handleFilterChange('dateRange', { 
                  ...filters.dateRange, 
                  end: e.target.value ? parseInt(e.target.value) : undefined 
                })}
              />
            </div>
          </div>
        </div>
      )}

      <div className="events-manager__content">
        {filteredAndSortedEvents.length === 0 ? (
          <div className="empty-state">
            {events.length === 0 ? (
              <>
                <p>No events created yet. Start building your timeline!</p>
                <button onClick={onAddEvent} className="btn btn-primary">
                  <FaPlus /> Create First Event
                </button>
              </>
            ) : (
              <>
                <p>No events match your current filters.</p>
                <button onClick={clearFilters} className="btn btn-outline-secondary">
                  Clear Filters
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="events-grid">
            {filteredAndSortedEvents.map(event => (
              <div 
                key={event.id} 
                className={`event-card ${event.tags?.includes('generated') ? 'generated' : ''}`}
                onClick={() => setSelectedEvent(selectedEvent === event.id ? null : event.id)}
              >
                <div className="event-card__header">
                  <div className="event-title-row">
                    <span className="importance-icon">{getImportanceIcon(event.importance)}</span>
                    <h4 className="event-title">{event.title}</h4>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteEvent(event.id);
                      }}
                      className="btn btn-sm btn-outline-danger delete-btn"
                    >
                      <FaTrash />
                    </button>
                  </div>
                  <div className="event-meta">
                    <span 
                      className="event-type-badge"
                      style={{ backgroundColor: getEventTypeColor(event.type) }}
                    >
                      {event.type}
                    </span>
                    <span className="event-date">{event.date.displayFormat}</span>
                    {!event.isCompleted && <span className="planned-badge">Planned</span>}
                    {event.tags?.includes('generated') && (
                      <span className="generated-badge">AI Generated</span>
                    )}
                  </div>
                </div>
                
                {selectedEvent === event.id && (
                  <div className="event-card__details">
                    <div className="event-form">
                      <div className="form-group">
                        <label>Title:</label>
                        <input
                          type="text"
                          value={event.title}
                          onChange={(e) => handleEditEvent(event.id, { title: e.target.value })}
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Description:</label>
                        <textarea
                          value={event.description}
                          onChange={(e) => handleEditEvent(event.id, { description: e.target.value })}
                          rows={3}
                        />
                      </div>
                      
                      <div className="form-row">
                        <div className="form-group">
                          <label>Type:</label>
                          <select
                            value={event.type}
                            onChange={(e) => handleEditEvent(event.id, { type: e.target.value as any })}
                          >
                            <option value="historical">Historical</option>
                            <option value="plot">Plot</option>
                            <option value="character">Character</option>
                            <option value="world">World</option>
                            <option value="planned">Planned</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        
                        <div className="form-group">
                          <label>Importance:</label>
                          <select
                            value={event.importance}
                            onChange={(e) => handleEditEvent(event.id, { importance: e.target.value as any })}
                          >
                            <option value="critical">Critical</option>
                            <option value="major">Major</option>
                            <option value="minor">Minor</option>
                            <option value="background">Background</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="form-group">
                        <label>Year:</label>
                        <input
                          type="number"
                          value={event.date.year}
                          onChange={(e) => handleEditEvent(event.id, { 
                            date: { 
                              ...event.date, 
                              year: parseInt(e.target.value) || 0,
                              displayFormat: `Year ${parseInt(e.target.value) || 0}`
                            } 
                          })}
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Location:</label>
                        <input
                          type="text"
                          value={event.location || ''}
                          onChange={(e) => handleEditEvent(event.id, { location: e.target.value })}
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Consequences:</label>
                        <textarea
                          value={event.consequences}
                          onChange={(e) => handleEditEvent(event.id, { consequences: e.target.value })}
                          rows={2}
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>
                          <input
                            type="checkbox"
                            checked={event.isCompleted}
                            onChange={(e) => handleEditEvent(event.id, { isCompleted: e.target.checked })}
                          />
                          Event completed
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
