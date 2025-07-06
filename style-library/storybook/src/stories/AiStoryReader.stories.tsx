import type { Meta, StoryObj } from '@storybook/react';
import { AiStoryReader, ThemeProvider, ThemeToggle } from '../../../ai-styles/src';

const meta: Meta<typeof AiStoryReader> = {
  title: 'Components/AiStoryReader',
  component: AiStoryReader,
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

type Story = StoryObj<typeof AiStoryReader>;

export const Default: Story = {
  args: {
    text: 'Once upon a time, there was a StoryReader component.',
  },
};

export const WithCustomFont: Story = {
  args: {
    text: 'This story uses a custom font and size.',
    font: 'monospace',
    fontSize: '24px',
  },
};
