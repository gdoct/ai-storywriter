import type { Meta, StoryObj } from '@storybook/react';
import { AiTextArea, ThemeProvider, ThemeToggle } from '../../../ai-styles/src';

const meta: Meta<typeof AiTextArea> = {
  title: 'Components/AiTextArea',
  component: AiTextArea,
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

type Story = StoryObj<typeof AiTextArea>;

export const Default: Story = {
  args: {
    value: 'This is a sample text area.',
    placeholder: 'Type here...',
    rows: 4,
    disabled: false,
  },
};

export const Disabled: Story = {
  args: {
    value: '',
    placeholder: 'Disabled textarea',
    rows: 4,
    disabled: true,
  },
};
