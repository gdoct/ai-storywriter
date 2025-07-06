import React from 'react';
import './TimeLine.css';

export interface TimeLineEvent {
  /** The label or title of the event */
  label: React.ReactNode;
  /** Optional description or content for the event */
  content?: React.ReactNode;
  /** Optional timestamp or date */
  time?: React.ReactNode;
  /** Optional icon for the event */
  icon?: React.ReactNode;
  /** Optional custom class for the event */
  className?: string;
}

export interface TimeLineProps {
  /** List of events to display in the timeline */
  events: TimeLineEvent[];
  /** Optional class name for the timeline */
  className?: string;
  /** Optional style for the timeline */
  style?: React.CSSProperties;
}

/**
 * TimeLine: Visualizes a vertical timeline of events.
 */
export const TimeLine: React.FC<TimeLineProps> = ({ events, className = '', style }) => (
  <div className={`ai-timeline ${className}`.trim()} style={style}>
    <ul className="ai-timeline__list">
      {events.map((event, idx) => (
        <li key={idx} className={`ai-timeline__event${event.className ? ` ${event.className}` : ''}`.trim()}>
          <div className="ai-timeline__icon">
            {event.icon || <span className="ai-timeline__dot" />}
          </div>
          <div className="ai-timeline__content">
            <div className="ai-timeline__label">{event.label}</div>
            {event.time && <div className="ai-timeline__time">{event.time}</div>}
            {event.content && <div className="ai-timeline__desc">{event.content}</div>}
          </div>
        </li>
      ))}
    </ul>
  </div>
);
