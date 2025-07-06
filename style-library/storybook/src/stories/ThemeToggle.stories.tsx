import type { Meta, StoryObj } from '@storybook/react';
import { ThemeProvider, ThemeToggle } from '../../../ai-styles/src/index';

const meta: Meta<typeof ThemeToggle> = {
  title: 'Components/ThemeToggle',
  component: ThemeToggle,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <ThemeProvider defaultTheme="light">
        <div style={{ padding: '2rem' }}>
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const WithLabels: Story = {
  args: {
    showLabels: true,
  },
};

export const ExtraExtraSmall: Story = {
  args: {
    size: 'xxs',
  },
};

export const ExtraSmall: Story = {
  args: {
    size: 'xs',
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    showLabels: true,
  },
};

export const CustomClass: Story = {
  args: {
    className: 'custom-theme-toggle',
    showLabels: true,
  },
};
