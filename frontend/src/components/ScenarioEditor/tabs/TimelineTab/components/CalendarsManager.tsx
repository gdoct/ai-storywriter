import React, { useCallback, useState } from 'react';
import { FaDice, FaPlus } from 'react-icons/fa';
import { Calendar } from '../../../../../types/ScenarioTypes';

interface CalendarsManagerProps {
  calendars: Calendar[];
  onCalendarsChange: (calendars: Calendar[]) => void;
  onAddCalendar: () => void;
  scenarioContext?: {
    title?: string;
    genre?: string;
    theme?: string;
  };
}

export const CalendarsManager: React.FC<CalendarsManagerProps> = ({
  calendars,
  onCalendarsChange,
  onAddCalendar,
  scenarioContext,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGenerationMenu, setShowGenerationMenu] = useState(false);

  const handleGenerateCalendar = useCallback(async (type: 'fantasy' | 'scifi' | 'cultural') => {
    if (!scenarioContext) return;
    
    setIsGenerating(true);
    try {
      // Placeholder implementation - create a basic calendar
      const now = new Date().toISOString();
      const calendarNames = {
        fantasy: 'The Mystical Calendar',
        scifi: 'The Galactic Standard Calendar',
        cultural: 'The Cultural Calendar'
      };

      const newCalendar: Calendar = {
        id: `generated-calendar-${Date.now()}`,
        name: calendarNames[type],
        description: `A ${type} calendar system for ${scenarioContext.title || 'the story world'}.`,
        type: 'custom' as const,
        yearLength: type === 'scifi' ? 400 : type === 'fantasy' ? 360 : 365,
        monthsPerYear: type === 'fantasy' ? 13 : 12,
        daysPerMonth: type === 'fantasy' ? 
          Array(13).fill(28) :
          [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
        monthNames: type === 'fantasy' ? 
          ['Frostmoon', 'Awakening', 'Bloomtide', 'Sunhigh', 'Harvestmoon', 'Goldfall', 'Fading', 'Darkmoon', 'Iceheart', 'Starfall', 'Deepwinter', 'Renewal', 'Twilight'] :
          type === 'scifi' ?
          ['Alphanis', 'Betanis', 'Gammanis', 'Deltanis', 'Epsionis', 'Zetanis', 'Etanis', 'Thetanis', 'Iotanis', 'Kappanis', 'Lambdanis', 'Muonis'] :
          ['First Moon', 'Second Moon', 'Third Moon', 'Fourth Moon', 'Fifth Moon', 'Sixth Moon', 'Seventh Moon', 'Eighth Moon', 'Ninth Moon', 'Tenth Moon', 'Eleventh Moon', 'Twelfth Moon'],
        specialDays: [
          {
            name: type === 'fantasy' ? 'Midsummer Festival' : type === 'scifi' ? 'Galactic Unity Day' : 'New Year Celebration',
            month: 1,
            day: 1,
            description: `A major celebration in the ${type} calendar`,
            significance: 'Cultural renewal and community gathering'
          }
        ],
        notes: `This is a generated ${type} calendar. Edit to customize for your world.`,
        createdAt: now,
        updatedAt: now,
      };
      
      const updatedCalendars = [...calendars, newCalendar];
      onCalendarsChange(updatedCalendars);
      setShowGenerationMenu(false);
    } catch (error) {
      console.error('Failed to generate calendar:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [calendars, onCalendarsChange, scenarioContext]);

  return (
    <div className="calendars-manager">
      <div className="calendars-manager__header">
        <h3>Calendar Systems</h3>
        <div className="calendars-controls">
          <button onClick={onAddCalendar} className="btn btn-primary">
            <FaPlus /> Add Calendar
          </button>
          
          {scenarioContext && (
            <div className="ai-generation-controls">
              <button 
                onClick={() => setShowGenerationMenu(!showGenerationMenu)}
                className={`btn btn-outline-primary ${showGenerationMenu ? 'active' : ''}`}
                disabled={isGenerating}
              >
                <FaDice /> {isGenerating ? 'Generating...' : 'AI Generate Calendar'}
              </button>
              
              {showGenerationMenu && (
                <div className="generation-menu">
                  <h6>Generate Calendar</h6>
                  <button 
                    onClick={() => handleGenerateCalendar('fantasy')}
                    className="btn btn-sm btn-outline-secondary"
                    disabled={isGenerating}
                  >
                    Fantasy Calendar
                  </button>
                  <button 
                    onClick={() => handleGenerateCalendar('scifi')}
                    className="btn btn-sm btn-outline-secondary"
                    disabled={isGenerating}
                  >
                    Sci-Fi Calendar
                  </button>
                  <button 
                    onClick={() => handleGenerateCalendar('cultural')}
                    className="btn btn-sm btn-outline-secondary"
                    disabled={isGenerating}
                  >
                    Cultural Calendar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="calendars-manager__content">
        {calendars.length === 0 ? (
          <div className="empty-state">
            <p>No calendar systems defined yet. Create your first calendar!</p>
            <button onClick={onAddCalendar} className="btn btn-primary">
              <FaPlus /> Add First Calendar
            </button>
          </div>
        ) : (
          <div className="calendars-list">
            {calendars.map(calendar => (
              <div key={calendar.id} className="calendar-card">
                <h4>{calendar.name}</h4>
                <p>Type: {calendar.type}</p>
                <p>Year Length: {calendar.yearLength} days</p>
                <p>Months: {calendar.monthsPerYear}</p>
                <p>{calendar.description}</p>
                {calendar.notes?.includes('generated') && (
                  <span className="generated-badge">AI Generated</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
