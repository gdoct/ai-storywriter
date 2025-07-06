import type { Meta, StoryObj } from '@storybook/react';
import type { TimeLineEvent } from '../../../ai-styles/src';
import { ThemeProvider, ThemeToggle, TimeLine } from '../../../ai-styles/src';

const meta: Meta<typeof TimeLine> = {
  title: 'Components/TimeLine',
  component: TimeLine,
  tags: ['autodocs'],
    decorators: [
      (Story) => (
        <ThemeProvider defaultTheme="light">
          <div style={{ width: '400px', padding: '2rem' }}>
            <ThemeToggle />
            <Story />
          </div>
        </ThemeProvider>
      ),
    ],
};
export default meta;

type Story = StoryObj<typeof TimeLine>;

const events: TimeLineEvent[] = [
  {
    label: 'Project Kickoff',
    time: '2025-06-01',
    content: 'Initial project meeting and requirements gathering.',
  },
  {
    label: 'Design Phase',
    time: '2025-06-05',
    content: 'UI/UX design and prototyping.',
    icon: <span style={{ background: '#1976d2', color: '#fff', borderRadius: '50%', padding: 4 }}>D</span>,
  },
  {
    label: 'Development',
    time: '2025-06-10',
    content: 'Implementation of core features.',
  },
  {
    label: 'Testing',
    time: '2025-06-20',
    content: 'QA and bug fixing.',
    icon: <span style={{ background: '#388e3c', color: '#fff', borderRadius: '50%', padding: 4 }}>T</span>,
  },
  {
    label: 'Release',
    time: '2025-06-30',
    content: 'Product release and deployment.',
  },
];

export const Default: Story = {
  args: {
    events,
  },
};

export const WithCustomClass: Story = {
  args: {
    events: [
      { label: 'Alpha', className: 'custom-alpha' },
      { label: 'Beta', className: 'custom-beta' },
    ],
    className: 'custom-timeline',
  },
};
