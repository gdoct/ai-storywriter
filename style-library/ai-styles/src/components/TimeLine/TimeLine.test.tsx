import { render, screen } from '@testing-library/react';
import { TimeLine, TimeLineEvent } from './TimeLine';

describe('TimeLine', () => {
  const events: TimeLineEvent[] = [
    { label: 'Start', time: '09:00', content: 'Started the process.' },
    { label: 'Checkpoint', time: '10:00', content: 'Reached checkpoint.' },
    { label: 'Finish', time: '11:00', content: 'Process finished.' },
  ];

  it('renders all events', () => {
    render(<TimeLine events={events} />);
    expect(screen.getByText('Start')).toBeInTheDocument();
    expect(screen.getByText('Checkpoint')).toBeInTheDocument();
    expect(screen.getByText('Finish')).toBeInTheDocument();
  });

  it('renders event times and content', () => {
    render(<TimeLine events={events} />);
    expect(screen.getByText('09:00')).toBeInTheDocument();
    expect(screen.getByText('Started the process.')).toBeInTheDocument();
  });

  it('renders custom icon if provided', () => {
    render(
      <TimeLine events={[{ label: 'Event', icon: <span data-testid="icon">I</span> }]} />
    );
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('renders default dot if no icon is provided', () => {
    render(<TimeLine events={[{ label: 'Event' }]} />);
    expect(document.querySelector('.ai-timeline__dot')).toBeInTheDocument();
  });
});
