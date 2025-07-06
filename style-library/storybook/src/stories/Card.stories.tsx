import type { Meta, StoryObj } from '@storybook/react';
import { Card, ThemeProvider, ThemeToggle } from '../../../ai-styles/src/index';

const meta: Meta<typeof Card> = {
  title: 'Components/Card',
  component: Card,
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
  argTypes: {
    size: {
      description: 'Card size',
      control: 'select',
      options: ['sm', 'm', 'l', 'xl'],
    },
  },
};
export default meta;

type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: {
    children: 'This is a simple card.',
  },
};

export const WithIcon: Story = {
  args: {
    children: 'Card with icon on the left.',
    icon: <span style={{ display: 'inline-block', width: 24, height: 24, background: '#1976d2', borderRadius: '50%' }} />,
  },
};

export const WithLeftContent: Story = {
  args: {
    children: 'Card with custom left content.',
    leftContent: <img src="https://placekitten.com/40/40" alt="avatar" style={{ borderRadius: '50%' }} />,
  },
};

export const WithRightContent: Story = {
  args: {
    children: 'Card with right content.',
    rightContent: <button>Action</button>,
  },
};

export const WithHeaderAndFooter: Story = {
  args: {
    header: <div style={{ fontWeight: 'bold' }}>Card Header</div>,
    children: 'Card content goes here.',
    footer: <div style={{ color: '#888' }}>Card Footer</div>,
  },
};

export const WithCustomContent: Story = {
  args: {
    header: <div>Custom Header</div>,
    children: (
      <ul>
        <li>Item 1</li>
        <li>Item 2</li>
        <li>Item 3</li>
      </ul>
    ),
    footer: <button>Action</button>,
    leftContent: <span style={{ color: '#1976d2', fontWeight: 'bold' }}>L</span>,
    rightContent: <span style={{ color: '#d32f2f', fontWeight: 'bold' }}>R</span>,
  },
};

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Card size="sm">
        Small card content
      </Card>
      <Card size="m">
        Medium card content
      </Card>
      <Card size="l">
        Large card content
      </Card>
      <Card size="xl">
        Extra large card content
      </Card>
    </div>
  ),
};

export const SizeComparison: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Card
        size="sm"
        header={<div style={{ fontWeight: 'bold' }}>Small Card</div>}
        icon={<span style={{ display: 'inline-block', width: 16, height: 16, background: '#1976d2', borderRadius: '50%' }} />}
        rightContent={<button style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>Action</button>}
      >
        Small card with header, icon, and action button
      </Card>
      <Card
        size="m"
        header={<div style={{ fontWeight: 'bold' }}>Medium Card</div>}
        icon={<span style={{ display: 'inline-block', width: 20, height: 20, background: '#1976d2', borderRadius: '50%' }} />}
        rightContent={<button style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>Action</button>}
      >
        Medium card with header, icon, and action button
      </Card>
      <Card
        size="l"
        header={<div style={{ fontWeight: 'bold' }}>Large Card</div>}
        icon={<span style={{ display: 'inline-block', width: 24, height: 24, background: '#1976d2', borderRadius: '50%' }} />}
        rightContent={<button style={{ fontSize: '1rem', padding: '0.75rem 1.25rem' }}>Action</button>}
      >
        Large card with header, icon, and action button
      </Card>
      <Card
        size="xl"
        header={<div style={{ fontWeight: 'bold' }}>Extra Large Card</div>}
        icon={<span style={{ display: 'inline-block', width: 28, height: 28, background: '#1976d2', borderRadius: '50%' }} />}
        rightContent={<button style={{ fontSize: '1.125rem', padding: '1rem 1.5rem' }}>Action</button>}
      >
        Extra large card with header, icon, and action button
      </Card>
    </div>
  ),
};
