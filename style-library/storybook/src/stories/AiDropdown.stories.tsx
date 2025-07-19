import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { RiUser3Line } from 'react-icons/ri';
import { AiDropdown, ThemeProvider, ThemeToggle } from '../../../ai-styles/src/index';

const options = [
  { label: 'Option 1', value: '1' },
  { label: 'Option 2', value: '2' },
  { label: 'Option 3', value: '3' },
];

const userOptions = [
  { label: 'John Doe', value: 'john', email: 'john@example.com', role: 'Admin' },
  { label: 'Jane Smith', value: 'jane', email: 'jane@example.com', role: 'User' },
  { label: 'Bob Johnson', value: 'bob', email: 'bob@example.com', role: 'Moderator' },
];

const countryOptions = [
  { label: 'United States', value: 'us', code: 'US', flag: '🇺🇸' },
  { label: 'United Kingdom', value: 'uk', code: 'GB', flag: '🇬🇧' },
  { label: 'Germany', value: 'de', code: 'DE', flag: '🇩🇪' },
  { label: 'France', value: 'fr', code: 'FR', flag: '🇫🇷' },
];

const meta: Meta<typeof AiDropdown> = {
  title: 'Components/AiDropdown',
  component: AiDropdown,
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
    onSelect: { action: 'selected' },
    onOpenChange: { action: 'open-changed' },
    renderOption: {
      description: 'Custom render function for dropdown options',
      control: false,
    },
    renderValue: {
      description: 'Custom render function for the selected value display',
      control: false,
    },
    componentSize: {
      description: 'Dropdown size',
      control: 'select',
      options: ['sm', 'm', 'l', 'xl'],
    },
  },
};
export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <AiDropdown
        options={options}
        value={value}
        onChange={setValue}
        placeholder="Select an option"
      />
    );
  },
};

export const WithDefaultValue: Story = {
  render: () => {
    const [value, setValue] = useState('2');
    return (
      <AiDropdown
        options={options}
        value={value}
        onChange={setValue}
        placeholder="Select an option"
      />
    );
  },
};

export const Disabled: Story = {
  render: () => (
    <AiDropdown options={options} value="" onChange={() => {}} disabled placeholder="Disabled dropdown" />
  ),
};

export const AllSizes: Story = {
  render: () => {
    const [values, setValues] = useState({ sm: '', m: '', l: '', xl: '' });
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
        <AiDropdown
          componentSize="sm"
          label="Small"
          options={options}
          value={values.sm}
          onChange={(v) => setValues(prev => ({ ...prev, sm: v }))}
          placeholder="Small dropdown..."
        />
        <AiDropdown
          componentSize="m"
          label="Medium"
          options={options}
          value={values.m}
          onChange={(v) => setValues(prev => ({ ...prev, m: v }))}
          placeholder="Medium dropdown..."
        />
        <AiDropdown
          componentSize="l"
          label="Large"
          options={options}
          value={values.l}
          onChange={(v) => setValues(prev => ({ ...prev, l: v }))}
          placeholder="Large dropdown..."
        />
        <AiDropdown
          componentSize="xl"
          label="Extra Large"
          options={options}
          value={values.xl}
          onChange={(v) => setValues(prev => ({ ...prev, xl: v }))}
          placeholder="Extra large dropdown..."
        />
      </div>
    );
  },
};

export const SizeComparison: Story = {
  render: () => {
    const [values, setValues] = useState({ sm: '1', m: '2', l: '3', xl: '1' });
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
        <AiDropdown componentSize="sm" label="Small" options={options} value={values.sm} onChange={(v) => setValues(prev => ({ ...prev, sm: v }))} />
        <AiDropdown componentSize="m" label="Medium" options={options} value={values.m} onChange={(v) => setValues(prev => ({ ...prev, m: v }))} />
        <AiDropdown componentSize="l" label="Large" options={options} value={values.l} onChange={(v) => setValues(prev => ({ ...prev, l: v }))} />
        <AiDropdown componentSize="xl" label="Extra Large" options={options} value={values.xl} onChange={(v) => setValues(prev => ({ ...prev, xl: v }))} />
      </div>
    );
  },
};

export const CustomRendering: Story = {
  render: () => {
    const [userValue, setUserValue] = useState('');
    const [countryValue, setCountryValue] = useState('');
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%' }}>
        <AiDropdown
          label="Select User"
          options={userOptions}
          value={userValue}
          onChange={setUserValue}
          placeholder="Choose a user..."
          renderOption={(option) => (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.25rem 0' }}>
              <RiUser3Line style={{ fontSize: '1.25rem', color: '#6b7280' }} />
              <div>
                <div style={{ fontWeight: '500' }}>{option.label}</div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  {option.label} • {option.value}
                </div>
              </div>
            </div>
          )}
          renderValue={(value) => {
            const option = userOptions.find(opt => opt.value === value);
            if (option) {
              return `${option.label} (${option.role})`;
            }
            return value;
          }}
        />
        
        <AiDropdown
          label="Select Country"
          options={countryOptions}
          value={countryValue}
          onChange={setCountryValue}
          placeholder="Choose a country..."
          renderOption={(option) => (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.25rem 0' }}>
              <span style={{ fontSize: '1.5rem' }}>{option.value}</span>
              <div>
                <div style={{ fontWeight: '500' }}>{option.label}</div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{option.value}</div>
              </div>
            </div>
          )}
          renderValue={(value) => {
            const option = countryOptions.find(opt => opt.value === value);
            if (option) {
              return `${option.flag} ${option.label}`;
            }
            return value;
          }}
        />
      </div>
    );
  },
};

export const SimpleCustomValue: Story = {
  render: () => {
    const [value, setValue] = useState('');
    
    return (
      <AiDropdown
        label="Custom Value Display"
        options={options}
        value={value}
        onChange={setValue}
        placeholder="Select an option..."
        renderValue={(value) => {
          const option = options.find(opt => opt.value === value);
          if (option) {
            return `✓ Selected: ${option.label}`;
          }
          return value || 'No selection';
        }}
      />
    );
  },
};

export const ReadOnly: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <AiDropdown
        options={options}
        value={value}
        onChange={setValue}
        isReadOnly
        placeholder="Select an option (read-only)"
      />
    );
  },
};

export const WithLabel: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <AiDropdown
        label="Choose Category"
        options={options}
        value={value}
        onChange={setValue}
        placeholder="Select category..."
      />
    );
  },
};

export const WithError: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <AiDropdown
        label="Required Field"
        options={options}
        value={value}
        onChange={setValue}
        errorMessage="This field is required"
        placeholder="Select option..."
      />
    );
  },
};

export const WithSuccess: Story = {
  render: () => {
    const [value, setValue] = useState('2');
    return (
      <AiDropdown
        label="Valid Selection"
        options={options}
        value={value}
        onChange={setValue}
        successMessage="Great choice!"
        placeholder="Select option..."
      />
    );
  },
};

export const AiGenerating: Story = {
  render: () => {
    const [value, setValue] = useState('Generating suggestion...');
    return (
      <AiDropdown
        label="AI Processing"
        options={options}
        value={value}
        onChange={setValue}
        aiGenerating={true}
        placeholder="AI is generating suggestions..."
      />
    );
  },
};

export const AiGenerationDemo: Story = {
  render: () => {
    const [value, setValue] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [currentOptions, setCurrentOptions] = useState(options);

    const handleAiClick = () => {
      // Clear the dropdown and start generation
      setValue('');
      setIsGenerating(true);
      setCurrentOptions([]);

      // Simulate AI generating options and then selecting one
      const aiSuggestions = [
        { label: 'AI Suggested: Creative Writing', value: 'creative-writing' },
        { label: 'AI Suggested: Technical Documentation', value: 'tech-docs' },
        { label: 'AI Suggested: Marketing Copy', value: 'marketing' },
        { label: 'AI Suggested: Blog Post', value: 'blog-post' },
      ];

      // First, show generating message
      setValue('Analyzing your needs...');
      
      // Simulate typing the suggestion letter by letter
      setTimeout(() => {
        const finalSuggestion = 'AI Suggested: Creative Writing';
        let currentIndex = 0;

        const typeNextLetter = () => {
          if (currentIndex < finalSuggestion.length) {
            setValue(finalSuggestion.substring(0, currentIndex + 1));
            currentIndex++;
            setTimeout(typeNextLetter, 80); // 80ms delay between letters for dropdown
          } else {
            // Generation complete - add the AI suggestions to options and select the first one
            setTimeout(() => {
              setCurrentOptions([...options, ...aiSuggestions]);
              setValue('creative-writing');
              setIsGenerating(false);
            }, 500);
          }
        };

        // Start typing after a short delay
        setTimeout(typeNextLetter, 800);
      }, 500);
    };

    return (
      <AiDropdown
        label="AI Content Type Generator"
        options={currentOptions}
        value={value}
        onChange={setValue}
        onAiClick={handleAiClick}
        aiGenerating={isGenerating}
        infoMessage="Press the AI button to get intelligent content type suggestions"
        placeholder="Choose content type or let AI suggest..."
      />
    );
  },
};
