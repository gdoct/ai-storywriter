import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
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

export const WithLabel: Story = {
  args: {
    label: 'Enter your story',
    placeholder: 'Type your story here...',
    rows: 6,
  },
};

export const WithError: Story = {
  args: {
    label: 'Required Field',
    errorMessage: 'This field is required',
    rows: 4,
  },
};

export const WithSuccess: Story = {
  args: {
    label: 'Valid Input',
    successMessage: 'Looks good!',
    value: 'This is valid content',
    rows: 4,
  },
};

export const AiGenerating: Story = {
  args: {
    label: 'AI Processing',
    aiGenerating: true,
    value: 'Processing this content...',
    rows: 4,
  },
};

export const AiGenerationDemo: Story = {
  render: () => {
    const [value, setValue] = React.useState('');
    const [isGenerating, setIsGenerating] = React.useState(false);

    const handleAiClick = () => {
      // Clear the textarea and start generation
      setValue('');
      setIsGenerating(true);

      // Simulate typing "hello, world" letter by letter
      const text = 'hello, world\n\nThis is a longer text to demonstrate AI generation in a textarea. The text appears letter by letter, simulating how an AI might generate content in real-time.';
      let currentIndex = 0;

      const typeNextLetter = () => {
        if (currentIndex < text.length) {
          setValue(text.substring(0, currentIndex + 1));
          currentIndex++;
          setTimeout(typeNextLetter, 50); // 50ms delay between letters for textarea
        } else {
          // Generation complete
          setIsGenerating(false);
        }
      };

      // Start typing after a short delay
      setTimeout(typeNextLetter, 500);
    };

    return (
      <AiTextArea
        label="AI Generation Demo"
        placeholder="Click the AI button to see generation..."
        value={value}
        onChange={setValue}
        onAiClick={handleAiClick}
        aiGenerating={isGenerating}
        infoMessage="Press the AI button to see simulated text generation"
        rows={8}
      />
    );
  },
};

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
      <AiTextArea size="sm" label="Small" placeholder="Small textarea..." rows={3} />
      <AiTextArea size="m" label="Medium" placeholder="Medium textarea..." rows={4} />
      <AiTextArea size="l" label="Large" placeholder="Large textarea..." rows={5} />
      <AiTextArea size="xl" label="Extra Large" placeholder="Extra large textarea..." rows={6} />
    </div>
  ),
};
