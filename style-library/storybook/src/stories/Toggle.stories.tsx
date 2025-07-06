import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ThemeProvider, ThemeToggle, Toggle } from '../../../ai-styles/src';

const meta: Meta<typeof Toggle> = {
  title: 'Components/Toggle',
  component: Toggle,
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
    size: {
      description: 'Toggle size',
      control: 'select',
      options: ['sm', 'm', 'l', 'xl'],
    },
  },
};
export default meta;

type Story = StoryObj<typeof Toggle>;

export const Default: Story = {
  render: (args) => {
    const [checked, setChecked] = useState(args.checked);
    return (
      <Toggle {...args} checked={checked} onChange={setChecked} />
    );
  },
  args: {
    checked: false,
    label: 'Enable feature',
  },
};

export const Checked: Story = {
  render: (args) => {
    const [checked, setChecked] = useState(args.checked);
    return (
      <Toggle {...args} checked={checked} onChange={setChecked} />
    );
  },
  args: {
    checked: true,
    label: 'Enabled',
  },
};

export const AllSizes: Story = {
  render: () => {
    const [states, setStates] = useState({ sm: false, m: true, l: false, xl: true });
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Toggle
          size="sm"
          label="Small Toggle"
          checked={states.sm}
          onChange={(checked) => setStates(prev => ({ ...prev, sm: checked }))}
        />
        <Toggle
          size="m"
          label="Medium Toggle"
          checked={states.m}
          onChange={(checked) => setStates(prev => ({ ...prev, m: checked }))}
        />
        <Toggle
          size="l"
          label="Large Toggle"
          checked={states.l}
          onChange={(checked) => setStates(prev => ({ ...prev, l: checked }))}
        />
        <Toggle
          size="xl"
          label="Extra Large Toggle"
          checked={states.xl}
          onChange={(checked) => setStates(prev => ({ ...prev, xl: checked }))}
        />
      </div>
    );
  },
};

export const SizeComparison: Story = {
  render: () => {
    const [states, setStates] = useState({ sm: true, m: true, l: true, xl: true });
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '0.5rem', fontSize: '0.75rem', color: '#666' }}>Small</div>
          <Toggle
            size="sm"
            checked={states.sm}
            onChange={(checked) => setStates(prev => ({ ...prev, sm: checked }))}
          />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '0.5rem', fontSize: '0.75rem', color: '#666' }}>Medium</div>
          <Toggle
            size="m"
            checked={states.m}
            onChange={(checked) => setStates(prev => ({ ...prev, m: checked }))}
          />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '0.5rem', fontSize: '0.75rem', color: '#666' }}>Large</div>
          <Toggle
            size="l"
            checked={states.l}
            onChange={(checked) => setStates(prev => ({ ...prev, l: checked }))}
          />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '0.5rem', fontSize: '0.75rem', color: '#666' }}>Extra Large</div>
          <Toggle
            size="xl"
            checked={states.xl}
            onChange={(checked) => setStates(prev => ({ ...prev, xl: checked }))}
          />
        </div>
      </div>
    );
  },
};
