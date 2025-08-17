import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { TimelineCanvas } from '../src/components/ScenarioEditor/tabs/TimelineTab/TimelineCanvas';

describe('TimelineCanvas', () => {
  it('should allow drag-and-drop to create connections', () => {
    // Mock props
    const mockEvents = [
      {
        id: '1',
        title: 'Event 1',
        description: '',
        date: '',
        charactersInvolved: [],
        includeInStory: true,
        position: { x: 100, y: 100 },
        connections: {
          inputs: [],
          outputs: []
        }
      },
      {
        id: '2',
        title: 'Event 2',
        description: '',
        date: '',
        charactersInvolved: [],
        includeInStory: true,
        position: { x: 300, y: 300 },
        connections: {
          inputs: [],
          outputs: []
        }
      }
    ];

    const mockOnEventUpdate = jest.fn();

    const { getByText } = render(
      <TimelineCanvas
        events={mockEvents}
        selectedEventId={null}
        zoom={1}
        panX={0}
        panY={0}
        onEventSelect={() => {}}
        onEventEdit={() => {}}
        onAddChild={() => {}}
        onRemoveEvent={() => {}}
        onPan={() => {}}
        onZoom={() => {}}
        onEventUpdate={mockOnEventUpdate}
      />
    );

    // Simulate drag-and-drop
    const event1 = getByText('Event 1');
    const event2 = getByText('Event 2');

    // Adjusting drag-and-drop simulation
    fireEvent.mouseDown(event1, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(event2, { clientX: 300, clientY: 300 });
    fireEvent.mouseUp(event2, { clientX: 300, clientY: 300 });

    // Assert connection was created
    expect(mockOnEventUpdate).toHaveBeenCalledWith('1', { 
      connections: { inputs: [], outputs: ['2'] }
    });
    expect(mockOnEventUpdate).toHaveBeenCalledWith('2', { 
      connections: { inputs: ['1'], outputs: [] }
    });

    // Add debug logs to verify mockOnEventUpdate calls
    console.log('mockOnEventUpdate calls:', mockOnEventUpdate.mock.calls);
  });

  it('should allow click-to-remove connections', () => {
    // Mock props
    const mockEvents = [
      {
        id: '1',
        title: 'Event 1',
        description: '',
        date: '',
        charactersInvolved: [],
        includeInStory: true,
        position: { x: 100, y: 100 },
        connections: {
          inputs: [],
          outputs: ['2']
        }
      },
      {
        id: '2',
        title: 'Event 2',
        description: '',
        date: '',
        charactersInvolved: [],
        includeInStory: true,
        position: { x: 300, y: 300 },
        connections: {
          inputs: ['1'],
          outputs: []
        }
      }
    ];

    const mockOnEventUpdate = jest.fn();

    const { getByText } = render(
      <TimelineCanvas
        events={mockEvents}
        selectedEventId={null}
        zoom={1}
        panX={0}
        panY={0}
        onEventSelect={() => {}}
        onEventEdit={() => {}}
        onAddChild={() => {}}
        onRemoveEvent={() => {}}
        onPan={() => {}}
        onZoom={() => {}}
        onEventUpdate={mockOnEventUpdate}
      />
    );

    // Simulate click-to-remove
    const connection = getByText('Event 1'); // Assuming connection is rendered as text
    fireEvent.click(connection);

    // Assert connection was removed
    expect(mockOnEventUpdate).toHaveBeenCalledWith('1', { 
      connections: { inputs: [], outputs: [] }
    });
    expect(mockOnEventUpdate).toHaveBeenCalledWith('2', { 
      connections: { inputs: [], outputs: [] }
    });

    // Add debug logs to verify mockOnEventUpdate calls
    console.log('mockOnEventUpdate calls:', mockOnEventUpdate.mock.calls);
  });
});
