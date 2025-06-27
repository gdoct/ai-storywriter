import React, { useCallback, useMemo, useState } from 'react';
import { FaCalendar, FaChartBar, FaGlobe, FaRegClock } from 'react-icons/fa6';
import { Calendar, Era, Timeline, TimelineEvent } from '../../../../types/ScenarioTypes';
import { renderIcon } from '../../common/IconUtils';
import { TabProps } from '../../types';
import { CalendarsManager } from './components/CalendarsManager';
import { ErasManager } from './components/ErasManager';
import { EventsManager } from './components/EventsManager';
import { TimelineView } from './components/TimelineView';
import './TimelineTab.css';

type TimelineSubTab = 'timeline' | 'events' | 'eras' | 'calendars';

export const TimelineTab: React.FC<TabProps> = ({
  scenario,
  onScenarioChange,
  isDirty,
  isLoading,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<TimelineSubTab>('timeline');
  
  // Initialize timeline data if it doesn't exist
  const timeline = useMemo((): Timeline => {
    if (scenario.timeline) {
      return scenario.timeline;
    }
    return {
      events: [],
      eras: [],
      calendars: [],
      generalNotes: '',
    };
  }, [scenario.timeline]);

  const handleTimelineChange = useCallback((updates: Partial<Timeline>) => {
    const updatedTimeline = { ...timeline, ...updates };
    onScenarioChange({ timeline: updatedTimeline });
  }, [timeline, onScenarioChange]);

  const handleAddEvent = useCallback(() => {
    const newEvent: TimelineEvent = {
      id: crypto.randomUUID(),
      title: 'New Event',
      description: '',
      type: 'plot',
      importance: 'minor',
      date: {
        year: new Date().getFullYear(),
        displayFormat: `Year ${new Date().getFullYear()}`,
        isApproximate: false,
      },
      participants: [],
      consequences: '',
      causes: '',
      relatedEvents: [],
      storyRelevance: '',
      tags: [],
      isCompleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const updatedEvents = [...timeline.events, newEvent];
    handleTimelineChange({ events: updatedEvents });
  }, [timeline.events, handleTimelineChange]);

  const handleAddEra = useCallback(() => {
    const newEra: Era = {
      id: crypto.randomUUID(),
      name: 'New Era',
      description: '',
      startDate: {
        year: new Date().getFullYear(),
        displayFormat: `Year ${new Date().getFullYear()}`,
        isApproximate: false,
      },
      characteristics: '',
      keyEvents: [],
      technology: '',
      culture: '',
      politics: '',
      conflicts: '',
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const updatedEras = [...timeline.eras, newEra];
    handleTimelineChange({ eras: updatedEras });
  }, [timeline.eras, handleTimelineChange]);

  const handleAddCalendar = useCallback(() => {
    const newCalendar: Calendar = {
      id: crypto.randomUUID(),
      name: 'New Calendar',
      description: '',
      type: 'standard',
      yearLength: 365,
      monthsPerYear: 12,
      daysPerMonth: [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
      monthNames: [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ],
      specialDays: [],
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const updatedCalendars = [...timeline.calendars, newCalendar];
    handleTimelineChange({ calendars: updatedCalendars });
  }, [timeline.calendars, handleTimelineChange]);

  // Create scenario context for AI generation
  const scenarioContext = useMemo(() => ({
    title: scenario.title,
    genre: scenario.writingStyle?.genre,
    theme: scenario.writingStyle?.theme,
    characters: scenario.characters?.map(char => ({
      name: char.name || 'Unnamed Character',
      role: char.role || 'Character'
    })) || [],
  }), [scenario.title, scenario.writingStyle, scenario.characters]);

  const renderSubTabContent = () => {
    switch (activeSubTab) {
      case 'timeline':
        return (
          <TimelineView
            timeline={timeline}
            onTimelineChange={handleTimelineChange}
            onAddEvent={handleAddEvent}
          />
        );
      case 'events':
        return (
          <EventsManager
            events={timeline.events}
            onEventsChange={(events) => handleTimelineChange({ events })}
            onAddEvent={handleAddEvent}
            scenarioContext={scenarioContext}
          />
        );
      case 'eras':
        return (
          <ErasManager
            eras={timeline.eras}
            onErasChange={(eras) => handleTimelineChange({ eras })}
            onAddEra={handleAddEra}
            scenarioContext={scenarioContext}
          />
        );
      case 'calendars':
        return (
          <CalendarsManager
            calendars={timeline.calendars}
            onCalendarsChange={(calendars) => handleTimelineChange({ calendars })}
            onAddCalendar={handleAddCalendar}
            scenarioContext={scenarioContext}
          />
        );
      default:
        return null;
    }
  };

  const subTabs = [
    { id: 'timeline' as const, label: 'Timeline', icon: FaRegClock },
    { id: 'events' as const, label: 'Events', icon: FaChartBar },
    { id: 'eras' as const, label: 'Eras', icon: FaGlobe },
    { id: 'calendars' as const, label: 'Calendars', icon: FaCalendar },
  ];

  return (
    <div className="timeline-tab">
      <div className="timeline-tab__header">
        <div className="timeline-tab__sub-tabs">
          {subTabs.map(tab => (
            <button
              key={tab.id}
              className={`timeline-tab__sub-tab ${activeSubTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveSubTab(tab.id)}
              disabled={isLoading}
            >
              {renderIcon(tab.icon, { className: "timeline-tab__sub-tab-icon" })}
              {tab.label}
            </button>
          ))}
        </div>
        
        <div className="timeline-tab__stats">
          <span className="timeline-tab__stat">
            Events: {timeline.events.length}
          </span>
          <span className="timeline-tab__stat">
            Eras: {timeline.eras.length}
          </span>
          <span className="timeline-tab__stat">
            Calendars: {timeline.calendars.length}
          </span>
        </div>
      </div>

      <div className="timeline-tab__content">
        {renderSubTabContent()}
      </div>
    </div>
  );
};

export default TimelineTab;
