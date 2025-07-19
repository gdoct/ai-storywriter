import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { RiMagicLine, RiSparklingLine } from 'react-icons/ri';
import { AiTextBox, ThemeProvider, ThemeToggle } from '../../../ai-styles/src/index';

const meta: Meta<typeof AiTextBox> = {
  title: 'Components/AiTextBox',
  component: AiTextBox,
  parameters: {
    layout: 'centered',
  },
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
    onChange: { action: 'changed' },
    onAiClick: { action: 'ai-clicked' },
    onClear: { action: 'cleared' },
    aiIcon: {
      control: false,
    },
    clearIcon: {
      control: false,
    },
    size: {
      description: 'Input size',
      control: 'select',
      options: ['sm', 'm', 'l', 'xl'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const WithLabel: Story = {
  args: {
    label: 'Enter your prompt',
  },
};

export const WithValue: Story = {
  args: {
    value: 'Some example text',
    label: 'Text Input',
  },
};

export const WithPlaceholder: Story = {
  args: {
    placeholder: 'Type something amazing...',
    label: 'Custom Placeholder',
  },
};

export const WithError: Story = {
  args: {
    errorMessage: 'This field is required',
    label: 'Required Field',
  },
};

export const WithSuccess: Story = {
  args: {
    successMessage: 'Looks good!',
    label: 'Valid Input',
    value: 'Valid text',
  },
};

export const WithInfo: Story = {
  args: {
    infoMessage: 'This will be processed by AI',
    label: 'AI Input',
  },
};

export const AiActive: Story = {
  args: {
    aiActive: true,
    value: 'Processing this text...',
    label: 'AI Processing',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    value: 'Cannot edit this',
    label: 'Disabled Input',
  },
};

export const WithCustomIcons: Story = {
  args: {
    aiIcon: <RiSparklingLine />,
    clearIcon: <RiMagicLine />,
    label: 'Custom Icons',
    value: 'Text with custom icons',
  },
};

export const WithValidation: Story = {
  args: {
    label: 'Min 5 Characters',
    validation: (value: string) => value.length >= 5 || 'Must be at least 5 characters',
  },
};

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
      <AiTextBox componentSize="sm" label="Small" placeholder="Small input..." />
      <AiTextBox componentSize="m" label="Medium" placeholder="Medium input..." />
      <AiTextBox componentSize="l" label="Large" placeholder="Large input..." />
      <AiTextBox componentSize="xl" label="Extra Large" placeholder="Extra large input..." />
    </div>
  ),
};

export const SizeComparison: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
      <AiTextBox componentSize="sm" label="Small" value="Small text input" />
      <AiTextBox componentSize="m" label="Medium" value="Medium text input" />
      <AiTextBox componentSize="l" label="Large" value="Large text input" />
      <AiTextBox componentSize="xl" label="Extra Large" value="Extra large text input" />
    </div>
  ),
};

export const AiGenerationDemo: Story = {
  render: () => {
    const [value, setValue] = React.useState('');
    const [isGenerating, setIsGenerating] = React.useState(false);

    const handleAiClick = () => {
      // Clear the textbox and start generation
      setValue('');
      setIsGenerating(true);

      // Simulate typing "hello, world" letter by letter
      const text = 'hello, world';
      let currentIndex = 0;

      const typeNextLetter = () => {
        if (currentIndex < text.length) {
          setValue(text.substring(0, currentIndex + 1));
          currentIndex++;
          setTimeout(typeNextLetter, 100); // 100ms delay between letters
        } else {
          // Generation complete
          setIsGenerating(false);
        }
      };

      // Start typing after a short delay
      setTimeout(typeNextLetter, 500);
    };

    return (
      <AiTextBox
        label="AI Generation Demo"
        placeholder="Click the AI button to see generation..."
        value={value}
        onChange={setValue}
        onAiClick={handleAiClick}
        aiGenerating={isGenerating}
        infoMessage="Press the AI button to see simulated text generation"
      />
    );
  },
};
